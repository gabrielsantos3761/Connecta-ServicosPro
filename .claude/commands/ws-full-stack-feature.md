# Full-Stack Feature Implementation Workflow

Implement a complete full-stack feature using coordinated agent orchestration across backend, frontend, mobile, testing, and deployment layers.

## Usage
```
/full-stack-feature $ARGUMENTS
```

## Workflow Structure

The implementation follows four distinct phases with explicit handoff points between specialized teams.

---

## Phase 1 — Foundation Design

**Backend Architect**
- Establish service boundaries and data models
- Define technology recommendations
- Design API contracts

**GraphQL/API Specialist**
- Create schemas and resolver structures aligned with backend foundations
- Define type definitions and mutation signatures

**Output**: API contracts, data models, service boundary documentation

---

## Phase 2 — Parallel Implementation

**Frontend Developer**
- Build responsive interfaces with state management
- Consume API contracts from Phase 1
- Implement accessibility and UX requirements

**Mobile Developer**
- Ensure consistency with web platform
- Incorporate offline support and native integrations
- Honor API contracts established in Phase 1

**Key Principle**: Each agent receives outputs from previous agents. API contracts must be honored by all clients.

---

## Phase 3 — Quality & Security

**QA Engineer**
- Backend API tests
- Frontend component tests
- Mobile app feature tests
- Integration tests across all platforms

**Security Auditor**
- Authentication and authorization review
- Input validation and sanitization
- Dependency vulnerability scan
- OWASP top-10 assessment

---

## Phase 4 — Optimization & Deployment

**Performance Engineer**
- Identify and resolve bottlenecks
- Optimize database queries
- Bundle size and load time improvements
- Caching strategy implementation

**DevOps/Deployment Specialist**
- CI/CD pipeline configuration
- Containerization and orchestration
- Monitoring and alerting setup
- Feature flag configuration for gradual rollout

---

## Coordination Principle

This workflow treats feature implementation as an orchestrated, multi-stage process rather than isolated parallel work. Downstream teams build upon upstream decisions, creating a cascading dependency model that ensures consistency throughout the implementation.

**Handoff Checklist**
- [ ] Phase 1 → Phase 2: API contracts documented and reviewed
- [ ] Phase 2 → Phase 3: Feature branches merged, environments deployed
- [ ] Phase 3 → Phase 4: All tests passing, security sign-off obtained
- [ ] Phase 4 → Done: Monitoring active, rollback plan ready
