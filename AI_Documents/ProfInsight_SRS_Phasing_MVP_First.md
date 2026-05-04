# Software Requirements Specification (SRS)

**Project: ProfInsight Chrome Extension**

Development Strategy: Phased Development with MVP First Release

Project Duration Constraint: 9 Weeks Total

## 1. Introduction

This document defines the software requirements for the ProfInsight Chrome Extension.
The system will be delivered using a phased development approach. An MVP (Minimum
Viable Product) will be released first within the 9-week constraint. Additional features will
be delivered in subsequent phases.

## 2. Phased Development Plan

**2.1 Phase 1 – MVP (Weeks 1–9)**
The MVP focuses on core decision-support functionality directly integrated into university
registration workflows.

- FR-01: Detect supported university registration pages.
- FR-02: Extract university, term, course code, section ID, and professor names.
- FR-04: Retrieve professor insights from backend.
- FR-05: Display inline rating badges next to professor names.
- FR-06: Provide professor insight overlay.
- FR-07: Overlay includes aggregated rating, review count, workload estimate, and grade
    distribution.
- FR-08: Allow users to view professor reviews.
- FR-16: Provide side-by-side section comparison.
- NFR-01: Insight overlay renders within ≤1000ms (p95).
- NFR-02: Extraction accuracy ≥98%.
- NFR-03: Backend uptime ≥99.9%.
- NFR-05: All communication secured with TLS 1.3.
- NFR-07: Data refreshed at least every 24 hours.

**2.2 Phase 2 – Personalization & Interaction**

- FR-09: Submit ratings and reviews.
- FR-10: Upvote/downvote reviews.
- FR-11: Advanced review filtering (semester, year, course level, major).
- FR-13: Capture learning preferences.
- FR-14: Compute personalized match score.
- FR-15: Rank sections based on match score.


- FR-20: Follow professors.
- FR-21: Send notifications for updates.
- NFR-06: Analytics data anonymization compliance.

**2.3 Phase 3 – Advanced Optimization & Integrity**

- FR-17: Semester plan builder.
- FR-18: Compute aggregate semester metrics (GPA potential, workload).
- FR-19: Section swap simulation.
- FR-22: Fraud detection integration.
- FR-23: Moderation workflow support.
- NFR-04: Maintain ≤1000ms latency under peak load.
- NFR-10: Fraud detection ≥90% recall, ≤5% false positives.

## 3. Functional Requirements (Complete Set)

FR-01: System shall detect supported university registration pages.

FR-02: System shall extract academic entities (University → Term → Course → Section →
Professor).

FR-04: System shall retrieve professor insights from backend.

FR-05: System shall display inline rating badges.

FR-06: System shall provide professor insight overlay.

FR-07: Overlay shall include rating, reviews, workload, grade distribution.

FR-08: Users shall view professor reviews.

FR-09: Users shall submit ratings and reviews.

FR-10: Users shall vote on reviews.

FR-11: Users shall filter reviews.

FR-13: System shall capture learning preferences.

FR-14: System shall compute personalized match scores.

FR-15: System shall rank sections based on match score.

FR-16: System shall provide side-by-side comparison.

FR-17: System shall provide semester plan builder.

FR-18: System shall compute semester-level metrics.

FR-19: System shall simulate section swaps.


FR-20: Users shall follow professors.

FR-21: System shall notify users of updates.

FR-22: System shall detect suspicious review activity.

FR-23: Backend shall support moderation workflow.

## 4. Non-Functional Requirements (with Verification Criteria)

NFR-01: Insight overlay renders ≤1000ms (p95). Verification: ≥200 performance trials.

NFR-02: Extraction accuracy ≥98%. Verification: ≥500 labeled page tests.

NFR-03: Backend uptime ≥99.9% monthly. Verification: Monitoring logs.

NFR-04: Peak-load latency ≤1000ms (p95). Verification: Load testing.

NFR-05: TLS 1.3 encryption required. Verification: Security audit.

NFR-06: No direct identifiers in analytics logs. Verification: Data audit of ≥100 records.

NFR-07: Data refreshed every 24 hours. Verification: ETL monitoring logs.

NFR-10: Fraud detection ≥90% recall, ≤5% false positive rate. Verification: Labeled fraud
dataset evaluation.

## 5. Domain-Specific Requirements

DSR-01: Support academic entity hierarchy (University → Term → Course → Section →
Professor).

DSR-02: Compute composite professor score from ratings and grade distributions.

DSR-03: Estimate GPA potential from historical grade distributions.

DSR-04: Estimate workload in hours/week per course.

DSR-05: Classify professors using standardized teaching style taxonomy.


