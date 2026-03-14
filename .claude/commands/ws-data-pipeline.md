# Data Pipeline

Design and implement production-grade data pipelines

## Usage
```
/data-pipeline $ARGUMENTS
```

## Overview

Comprehensive data pipeline architecture covering ingestion from multiple sources, transformation, orchestration, storage, streaming, and quality assurance.

---

## Instructions

1. **Requirements Analysis**
   - Identify data sources (APIs, databases, files, streams, webhooks)
   - Define transformation requirements and business logic
   - Determine output destinations and consumers
   - Assess data volume, velocity, and variety requirements
   - Define latency requirements (batch vs. real-time vs. micro-batch)
   - Establish data quality and SLA requirements

2. **Pipeline Architecture Design**

   **ETL vs. ELT Decision**:
   - **ETL**: Transform before loading — better for data warehouses with limited compute
   - **ELT**: Load then transform — better when destination has strong compute (Snowflake, BigQuery)

   **Batch vs. Stream**:
   - Batch: scheduled jobs (daily, hourly) — lower complexity, higher latency
   - Stream: event-driven (Kafka, Kinesis) — real-time, higher complexity
   - Micro-batch: near-real-time with Spark Structured Streaming

3. **Source Connectors**
   ```python
   # Generic source connector interface
   class SourceConnector:
       def __init__(self, config):
           self.config = config

       def read(self, start_date=None, end_date=None):
           raise NotImplementedError

       def get_schema(self):
           raise NotImplementedError

   # REST API connector example
   class ApiSourceConnector(SourceConnector):
       def read(self, start_date=None, end_date=None):
           params = {'from': start_date, 'to': end_date, 'limit': 1000}
           while True:
               response = requests.get(self.config['url'], params=params,
                                       headers={'Authorization': f'Bearer {self.config["token"]}'})
               response.raise_for_status()
               data = response.json()
               yield from data['items']
               if not data.get('next_page'): break
               params['cursor'] = data['next_page']

   # Database connector with CDC (change data capture)
   class DatabaseCDCConnector(SourceConnector):
       def read(self, last_watermark=None):
           query = """
               SELECT * FROM orders
               WHERE updated_at > %s
               ORDER BY updated_at ASC
           """
           return self.db.execute(query, [last_watermark or '1970-01-01'])
   ```

4. **Transformation Layer**
   ```python
   import pandas as pd
   from typing import Iterator

   class DataTransformer:
       def __init__(self, schema_config):
           self.schema = schema_config

       def transform(self, records: Iterator) -> Iterator:
           for batch in self._batched(records, size=1000):
               df = pd.DataFrame(batch)
               df = self._clean(df)
               df = self._enrich(df)
               df = self._validate(df)
               yield from df.to_dict('records')

       def _clean(self, df):
           # Remove duplicates
           df = df.drop_duplicates(subset=['id'])
           # Standardize timestamps
           df['created_at'] = pd.to_datetime(df['created_at'], utc=True)
           # Trim strings
           string_cols = df.select_dtypes(include='object').columns
           df[string_cols] = df[string_cols].apply(lambda x: x.str.strip())
           return df

       def _enrich(self, df):
           # Compute derived fields
           df['full_name'] = df['first_name'] + ' ' + df['last_name']
           df['order_month'] = df['created_at'].dt.to_period('M').astype(str)
           return df

       def _validate(self, df):
           # Drop records failing validation
           valid = (
               df['email'].str.contains('@') &
               df['amount'].gt(0) &
               df['status'].isin(['pending', 'completed', 'cancelled'])
           )
           invalid_count = (~valid).sum()
           if invalid_count > 0:
               logger.warning(f'Dropping {invalid_count} invalid records')
           return df[valid]

       @staticmethod
       def _batched(iterable, size):
           batch = []
           for item in iterable:
               batch.append(item)
               if len(batch) >= size:
                   yield batch
                   batch = []
           if batch: yield batch
   ```

5. **Orchestration with Airflow**
   ```python
   from airflow import DAG
   from airflow.operators.python import PythonOperator
   from datetime import datetime, timedelta

   default_args = {
       'owner': 'data-team',
       'retries': 3,
       'retry_delay': timedelta(minutes=5),
       'email_on_failure': True,
       'email': ['data-alerts@company.com'],
   }

   with DAG(
       'orders_etl',
       default_args=default_args,
       schedule_interval='0 2 * * *',  # Daily at 2am
       start_date=datetime(2024, 1, 1),
       catchup=False,
       tags=['etl', 'orders'],
   ) as dag:

       extract = PythonOperator(
           task_id='extract_orders',
           python_callable=extract_orders,
           op_kwargs={'watermark': '{{ prev_ds }}'}
       )

       transform = PythonOperator(
           task_id='transform_orders',
           python_callable=transform_orders,
       )

       load = PythonOperator(
           task_id='load_to_warehouse',
           python_callable=load_to_warehouse,
       )

       validate = PythonOperator(
           task_id='validate_load',
           python_callable=validate_row_counts,
       )

       extract >> transform >> load >> validate
   ```

6. **Real-Time Streaming with Kafka**
   ```javascript
   const { Kafka } = require('kafkajs');

   const kafka = new Kafka({ brokers: process.env.KAFKA_BROKERS.split(',') });
   const consumer = kafka.consumer({ groupId: 'order-processor' });

   const processOrderStream = async () => {
     await consumer.connect();
     await consumer.subscribe({ topic: 'orders', fromBeginning: false });

     await consumer.run({
       eachBatch: async ({ batch, heartbeat }) => {
         const records = batch.messages.map(m => JSON.parse(m.value.toString()));

         // Process in micro-batches for efficiency
         for (const chunk of chunks(records, 100)) {
           await processOrderBatch(chunk);
           await heartbeat(); // Prevent consumer timeout
         }

         // Commit offsets after successful processing
       }
     });
   };

   // Dead letter queue for failed messages
   const dlqProducer = kafka.producer();
   const sendToDLQ = async (message, error) => {
     await dlqProducer.send({
       topic: 'orders-dlq',
       messages: [{
         value: JSON.stringify({ original: message, error: error.message, timestamp: Date.now() })
       }]
     });
   };
   ```

7. **Data Quality Framework**
   ```python
   from great_expectations import DataContext

   class DataQualityChecker:
       def __init__(self):
           self.context = DataContext()

       def validate_orders(self, df):
           suite = self.context.get_expectation_suite('orders_suite')
           batch = self.context.get_batch({'dataset': df}, suite)
           results = self.context.run_validation_operator(
               'action_list_operator', assets_to_validate=[batch]
           )

           if not results.success:
               raise DataQualityError(
                   f"Data quality check failed: {results.statistics}"
               )

   # Manual quality checks
   def quality_checks(df):
       checks = {
           'no_null_ids': df['id'].notna().all(),
           'positive_amounts': (df['amount'] > 0).all(),
           'valid_status': df['status'].isin(['pending','completed','cancelled']).all(),
           'reasonable_row_count': 100 < len(df) < 1_000_000,
       }
       failures = [name for name, passed in checks.items() if not passed]
       if failures:
           raise ValueError(f'Quality checks failed: {failures}')
   ```

8. **Storage Strategy**
   ```python
   # Data lake partitioned by date
   def write_to_lake(df, dataset_name, partition_date):
       path = f"s3://data-lake/{dataset_name}/year={partition_date.year}/month={partition_date.month:02d}/day={partition_date.day:02d}/"
       df.to_parquet(path, compression='snappy', index=False)

   # Upsert to data warehouse (Snowflake/BigQuery pattern)
   def upsert_to_warehouse(records, table, key_column):
       staging_table = f'{table}_staging_{uuid.uuid4().hex[:8]}'
       try:
           # Load to staging
           warehouse.load(records, staging_table)
           # Merge into target
           warehouse.execute(f"""
               MERGE INTO {table} AS target
               USING {staging_table} AS source
               ON target.{key_column} = source.{key_column}
               WHEN MATCHED THEN UPDATE SET *
               WHEN NOT MATCHED THEN INSERT *
           """)
       finally:
           warehouse.execute(f'DROP TABLE IF EXISTS {staging_table}')
   ```

9. **Monitoring and Alerting**
   ```python
   class PipelineMonitor:
       def record_run(self, pipeline_name, stats):
           # Record metrics
           metrics.gauge('pipeline.rows_processed', stats['rows_processed'],
                        tags=[f'pipeline:{pipeline_name}'])
           metrics.timing('pipeline.duration_ms', stats['duration_ms'],
                         tags=[f'pipeline:{pipeline_name}'])

           # Alert on anomalies
           if stats['rows_processed'] < stats['expected_min_rows']:
               alert(f'{pipeline_name}: Low row count {stats["rows_processed"]}')

           if stats['error_rate'] > 0.01:  # > 1% error rate
               alert(f'{pipeline_name}: High error rate {stats["error_rate"]:.1%}')

           # Track data freshness
           lag = (datetime.now() - stats['max_source_timestamp']).total_seconds()
           if lag > 3600:  # > 1 hour lag
               alert(f'{pipeline_name}: Data lag {lag/3600:.1f} hours')
   ```

10. **Data Lineage and Governance**
    - Track data flow from source to destination using OpenLineage
    - Document data ownership and stewardship
    - Implement column-level lineage for sensitive fields
    - Set up data catalog (Apache Atlas, DataHub, Amundsen)
    - Define and enforce data retention policies
    - Implement GDPR/LGPD data subject request handling (right to deletion)
