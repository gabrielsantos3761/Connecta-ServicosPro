# Deploy Checklist

Generate and verify a comprehensive deployment checklist for production releases.

## Usage
```
/deploy-checklist $ARGUMENTS
```

## Overview

A structured deployment framework covering seven key domains to ensure safe, reliable production releases.

## Pre-Launch Requirements

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security assessment completed
- [ ] Performance validation passed
- [ ] Rollback strategy documented and tested
- [ ] Change management approval obtained

## Infrastructure

- [ ] Containerization verified
- [ ] Orchestration manifests validated
- [ ] Infrastructure-as-code reviewed
- [ ] Environment configuration confirmed
- [ ] Secrets and credentials handled securely
- [ ] Network isolation configured
- [ ] Auto-scaling settings verified

## CI/CD Pipeline

- [ ] Build process verified
- [ ] Test suite distributed and passing
- [ ] Security checks completed
- [ ] Container images built and tagged
- [ ] Staged rollout plan in place
- [ ] Automated recovery procedures tested

## Database

- [ ] Schema migrations prepared and tested
- [ ] Data backup completed
- [ ] Connection pool optimized
- [ ] Replication architecture confirmed
- [ ] High-availability setup verified
- [ ] Database version compatibility confirmed

## Monitoring & Observability

- [ ] Application performance indicators configured
- [ ] System-level metrics active
- [ ] Centralized logging operational
- [ ] Failure detection alerts set up
- [ ] Availability checks running
- [ ] Custom analytics dashboards ready
- [ ] Notification channels tested

## Security

- [ ] Encryption protocols verified
- [ ] Credential management reviewed
- [ ] CORS policies configured
- [ ] Rate limiting active
- [ ] WAF rules updated
- [ ] Security headers configured
- [ ] Code vulnerability assessment completed

## Post-Deployment Validation

- [ ] Functional smoke tests passed
- [ ] Performance metrics at baseline
- [ ] Monitoring health checks green
- [ ] Knowledge base updated
- [ ] Stakeholders notified
- [ ] User notifications sent (if applicable)
- [ ] Baseline metrics recorded

## Environment-Specific Notes

Adapt this checklist for:
- **Development**: Minimal infrastructure checks, fast iteration
- **Staging**: Full checklist minus production notifications
- **Production**: Complete checklist with all approvals required

## Rollback Procedure

Document rollback steps before deploying:
1. Previous stable version tag/image
2. Database rollback scripts (if applicable)
3. Infrastructure rollback commands
4. Verification steps after rollback
5. Communication plan
