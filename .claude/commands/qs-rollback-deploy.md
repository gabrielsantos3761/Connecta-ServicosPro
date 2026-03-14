# Rollback Deploy Command

Rollback deployment to previous version

## Instructions

Follow this systematic rollback procedure: **$ARGUMENTS**

1. **Incident Assessment and Decision**
   - Assess the severity and impact of the current deployment issues
   - Determine if rollback is necessary or if forward fix is better
   - Identify affected systems, users, and business functions
   - Consider data integrity and consistency implications
   - Document the decision rationale and timeline

2. **Emergency Response Setup**
   ```bash
   # Activate incident response team
   # Set up communication channels
   # Notify stakeholders immediately

   # Example emergency notification
   echo "ROLLBACK INITIATED
   Issue: Critical performance degradation after v1.3.0 deployment
   Action: Rolling back to v1.2.9
   ETA: 15 minutes
   Impact: Temporary service interruption possible
   Status channel: #incident-rollback-202401"
   ```

3. **Pre-Rollback Safety Checks**
   ```bash
   # Verify current production version
   curl -s https://api.example.com/version
   kubectl get deployments -o wide

   # Check system status
   curl -s https://api.example.com/health | jq .

   # Identify target rollback version
   git tag --sort=-version:refname | head -5

   # Verify rollback target exists and is deployable
   git show v1.2.9 --stat
   ```

4. **Database Considerations**
   ```bash
   # Check for database migrations since last version
   ./check-migrations.sh v1.2.9 v1.3.0

   # If migrations exist, plan database rollback
   # WARNING: Database rollbacks can cause data loss
   # Consider forward fix instead if migrations are present

   # Create database backup before rollback
   ./backup-database.sh "pre-rollback-$(date +%Y%m%d-%H%M%S)"
   ```

5. **Traffic Management Preparation**
   ```bash
   # Prepare to redirect traffic
   # Option 1: Maintenance page
   ./enable-maintenance-mode.sh

   # Option 2: Load balancer management
   ./drain-traffic.sh --gradual

   # Option 3: Circuit breaker activation
   ./activate-circuit-breaker.sh
   ```

6. **Container/Kubernetes Rollback**
   ```bash
   # Kubernetes rollback
   kubectl rollout history deployment/app-deployment
   kubectl rollout undo deployment/app-deployment

   # Or rollback to specific revision
   kubectl rollout undo deployment/app-deployment --to-revision=3

   # Monitor rollback progress
   kubectl rollout status deployment/app-deployment --timeout=300s

   # Verify pods are running
   kubectl get pods -l app=your-app
   ```

7. **Docker Swarm Rollback**
   ```bash
   # List service history
   docker service ps app-service --no-trunc

   # Rollback to previous version
   docker service update --rollback app-service

   # Or update to specific image
   docker service update --image app:v1.2.9 app-service

   # Monitor rollback
   docker service ps app-service
   ```

8. **Traditional Deployment Rollback**
   ```bash
   # Blue-Green deployment rollback
   ./switch-to-blue.sh  # or green, depending on current

   # Rolling deployment rollback
   ./deploy-version.sh v1.2.9 --rolling

   # Symlink-based rollback
   ln -sfn /releases/v1.2.9 /current
   sudo systemctl restart app-service
   ```

9. **Load Balancer and CDN Updates**
   ```bash
   # Update load balancer to point to old version
   aws elbv2 modify-target-group --target-group-arn $TG_ARN --targets Id=old-instance

   # Clear CDN cache if needed
   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

   # Update DNS if necessary (last resort, has propagation delay)
   # aws route53 change-resource-record-sets ...
   ```

10. **Configuration Rollback**
    ```bash
    # Rollback configuration files
    git checkout v1.2.9 -- config/

    # Restart services with old configuration
    sudo systemctl restart nginx
    sudo systemctl restart app-service

    # Rollback environment variables
    ./restore-env-vars.sh v1.2.9

    # Update feature flags
    ./update-feature-flags.sh --disable-new-features
    ```

11. **Database Rollback (if necessary)**
    ```sql
    -- EXTREME CAUTION: Can cause data loss

    -- Check migration status
    SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;

    -- Rollback specific migrations (framework dependent)
    -- Rails: rake db:migrate:down VERSION=20240115120000
    -- Django: python manage.py migrate app_name 0001
    -- Node.js: npm run migrate:down

    -- Verify database state
    SHOW TABLES;
    DESCRIBE critical_table;
    ```

12. **Service Health Validation**
    ```bash
    # Health check script
    #!/bin/bash

    echo "Validating rollback..."

    # Check application health
    if curl -f -s https://api.example.com/health > /dev/null; then
        echo "Health check passed"
    else
        echo "Health check failed"
        exit 1
    fi

    # Check critical endpoints
    endpoints=(
        "/api/users/me"
        "/api/auth/status"
        "/api/data/latest"
    )

    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "https://api.example.com$endpoint" > /dev/null; then
            echo "$endpoint working"
        else
            echo "$endpoint failed"
        fi
    done
    ```

13. **Performance and Metrics Validation**
    ```bash
    # Check response times
    curl -w "Response time: %{time_total}s\n" -s -o /dev/null https://api.example.com/

    # Monitor error rates
    tail -f /var/log/app/error.log | head -20

    # Check system resources
    top -bn1 | head -10
    free -h
    df -h

    # Validate database connectivity
    mysql -u app -p -e "SELECT 1;"
    ```

14. **Traffic Restoration**
    ```bash
    # Gradually restore traffic
    ./restore-traffic.sh --gradual

    # Disable maintenance mode
    ./disable-maintenance-mode.sh

    # Re-enable circuit breakers
    ./deactivate-circuit-breaker.sh

    # Monitor traffic patterns
    ./monitor-traffic.sh --duration 300
    ```

15. **Monitoring and Alerting**
    ```bash
    # Enable enhanced monitoring during rollback
    ./enable-enhanced-monitoring.sh

    # Watch key metrics
    watch -n 10 'curl -s https://api.example.com/metrics | jq .'

    # Monitor logs in real-time
    tail -f /var/log/app/*.log | grep -E "ERROR|WARN|EXCEPTION"

    # Check application metrics
    # - Response times
    # - Error rates
    # - User sessions
    # - Database performance
    ```

16. **User Communication**
    ```markdown
    ## Service Update - Rollback Completed

    **Status:** Service Restored
    **Time:** 2024-01-15 15:45 UTC
    **Duration:** 12 minutes of degraded performance

    **What Happened:**
    We identified performance issues with our latest release and
    performed a rollback to ensure optimal service quality.

    **Current Status:**
    - All services operating normally
    - Performance metrics back to baseline
    - No data loss occurred

    **Next Steps:**
    We're investigating the root cause and will provide updates
    on our status page.
    ```

17. **Post-Rollback Validation**
    ```bash
    # Extended monitoring period
    ./monitor-extended.sh --duration 3600  # 1 hour

    # Run integration tests
    npm run test:integration:production

    # Check user-reported issues
    ./check-support-tickets.sh --since "1 hour ago"

    # Validate business metrics
    ./check-business-metrics.sh
    ```

18. **Documentation and Reporting**
    ```markdown
    # Rollback Incident Report

    **Incident ID:** INC-2024-0115-001
    **Rollback Version:** v1.2.9 (from v1.3.0)
    **Start Time:** 2024-01-15 15:30 UTC
    **End Time:** 2024-01-15 15:42 UTC
    **Total Duration:** 12 minutes

    **Timeline:**
    - 15:25 - Performance degradation detected
    - 15:30 - Rollback decision made
    - 15:32 - Traffic drained
    - 15:35 - Rollback initiated
    - 15:38 - Rollback completed
    - 15:42 - Traffic fully restored

    **Impact:**
    - 12 minutes of degraded performance
    - ~5% of users experienced slow responses
    - No data loss or corruption
    - No security implications

    **Root Cause:**
    Memory leak in new feature causing performance degradation

    **Lessons Learned:**
    - Need better performance testing in staging
    - Improve monitoring for memory usage
    - Consider canary deployments for major releases
    ```

19. **Cleanup and Follow-up**
    ```bash
    # Clean up failed deployment artifacts
    docker image rm app:v1.3.0

    # Update deployment status
    ./update-deployment-status.sh "rollback-completed"

    # Reset feature flags if needed
    ./reset-feature-flags.sh

    # Schedule post-incident review
    ./schedule-postmortem.sh --date "2024-01-16 10:00"
    ```

20. **Prevention and Improvement**
    - Analyze what went wrong with the deployment
    - Improve testing and validation procedures
    - Enhance monitoring and alerting
    - Update rollback procedures based on learnings
    - Consider implementing canary deployments

**Rollback Decision Matrix:**

| Issue Severity | Data Impact | Time to Fix | Decision |
|---------------|-------------|-------------|----------|
| Critical | None | > 30 min | Rollback |
| High | Minor | > 60 min | Rollback |
| Medium | None | > 2 hours | Consider rollback |
| Low | None | Any | Forward fix |

**Emergency Rollback Script Template:**
```bash
#!/bin/bash
set -e

# Emergency rollback script
PREVIOUS_VERSION="${1:-v1.2.9}"
CURRENT_VERSION=$(curl -s https://api.example.com/version)

echo "EMERGENCY ROLLBACK"
echo "From: $CURRENT_VERSION"
echo "To: $PREVIOUS_VERSION"
echo ""

# Confirm rollback
read -p "Proceed with rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 1
fi

# Execute rollback
echo "Starting rollback..."
kubectl set image deployment/app-deployment app=app:$PREVIOUS_VERSION
kubectl rollout status deployment/app-deployment --timeout=300s

# Validate
echo "Validating rollback..."
sleep 30
curl -f https://api.example.com/health

echo "Rollback completed successfully"
```

Remember: Rollbacks should be a last resort. Always consider forward fixes first, especially when database migrations are involved.
