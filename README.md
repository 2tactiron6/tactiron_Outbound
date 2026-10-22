# Tactiron Outbound Sales Automation Backend

A headless, auditable outbound sales automation backend built in Node.js and TypeScript for a push-to-talk (PTT) over cellular platform operating in the GCC, Africa, and select European markets.

---

## 1. System Overview

The system automates the outbound pipeline across six distinct stages:
1. **Find target companies and contacts** (Regional data, Apollo, Sales Navigator, CSV imports)
2. **Enrich and verify** (Clay, Apollo, email deliverability)
3. **Compliance router (control point)** (Jurisdiction policy, lawful basis, suppression check, emergency kill switch)
4. **Outreach on permitted channels** (Smartlead email API, manual LinkedIn, conditional post-reply WhatsApp)
5. **Receive and classify replies** (Deterministic keyword guardrails + Claude LLM classification)
6. **Handover to Odoo CRM** (Assembles 6-item Handover Pack, calculates SLAs, pauses account sequences)

---

## 2. Core Business Rules & Reconciliations

### A. Qualification Formula (`AI - to human Handover_Rules.xlsx`)
- **Warm Qualified**: $\text{SegmentFit} = \text{Yes} \land \text{CountryPermitted} = \text{Yes} \land \text{TeamSize} \ge 20 \land \text{RoleTarget} = \text{Yes} \land \text{IntentSignal} = \text{Yes}$.
- **Nurture**: Positive intent signal, but fails segment, team size, or role.
- **Suppressed / Blocked**: If country is prohibited or contact is suppressed, the lead is blocked and **never** routed into nurture.

### B. Reply Types & SLA Response Targets
| # | Reply Category | Action | Owner | SLA Target |
|---|---|---|---|---|
| 1 | Unsubscribe / Opt-out | Auto-suppress across tools | AI (Auto) | Immediate |
| 2 | Out of Office / Referral | Log event, ask referral once | AI (Auto) | Automatic |
| 3 | Simple Factual Question | Answer from approved KB only | AI (Auto) | Automatic |
| 4 | Demo / Meeting Request | One holding reply, Sales handover | Sales (Human) | **Within 1 hour** |
| 5 | Price / Contract / SLA / Security | One holding reply, Sales handover | Sales (Human) | **Within 4 hours** |
| 6 | Partner / Reseller Questions | One holding reply, Sales handover | Sales (Human) | **Within 4 hours** |
| 7 | Complaint / Legal / GDPR | Route directly to Compliance | Compliance | **Within 1 business day** |
| 8 | C-Level / Buying Committee | One holding reply, Sales handover | Sales (Human) | **Within 4 hours** |
| 9 | Low Confidence / Uncertain | Fallback to Sales takeover | Sales (Human) | **Within 4 hours** |

### C. Guardrail Keyword Triggers
The system executes a deterministic substring scan for:
`price`, `pricing`, `quote`, `contract`, `legal`, `gdpr`, `complaint`, `lawyer`.
Matches immediately trigger human escalation and bypass LLM discretion.

### D. The 6-Point Handover Pack for Odoo CRM
1. **Full Thread**: Every outbound and inbound message.
2. **Company & Role Details**: Name, domain, country, team size, title.
3. **Channel Permissions & Consent**: Lawful basis, evidence reference, timestamp.
4. **Qualification Score & Why**: Fit, role, intent criteria evaluation.
5. **Suggested Next Step**: Action recommendation for the sales representative.
6. **Risk Flags**: Guardrail hits, pricing notices, jurisdictional caveats (e.g. Germany UWG §7).

---

## 3. Operational Endpoints

- `GET /health` — Service health status
- `GET /ready` — Dependency readiness & kill switch status
- `POST /leads/import` — Ingest and deduplicate prospective lead batches
- `POST /webhooks/smartlead` — Ingest Smartlead email replies, bounces, and opt-outs
- `POST /internal/campaigns/pause` — Activate emergency kill switch
- `POST /internal/campaigns/resume` — Resume campaigns with bearer authorization
- `GET /internal/kpis` — Handover counts, SLA targets, and missed escalation metric

---

## 4. Getting Started

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 16+

### Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run test suites (38 tests)
npm test

# Build TypeScript to /dist
npm run build

# Start server
npm start
```
