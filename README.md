# Tactiron Outbound Sales Automation Backend

A headless, auditable AI outbound sales automation backend and operational console built in Node.js and TypeScript for a push-to-talk (PTT) over cellular platform operating across the GCC, Africa, and select European markets.

---

## 1. System Overview

The system automates the outbound pipeline across six distinct stages with deterministic compliance controls and automated dispatch scheduling:

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. Lead Source  │───>│  2. Enrichment   │───>│  3. Compliance   │
│  • Apollo Search │    │  • Email Verify  │    │  • Jurisdictions │
│  • CSV Imports   │    │  • Firmographics │    │  • Kill Switch   │
└──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                         │
┌──────────────────┐    ┌──────────────────┐    ┌────────▼─────────┐
│ 6. Odoo Handover │<───│  5. Reply Class  │<───│  4. Outreach     │
│ • 6-Item Pack    │    │  • 9 Excel Types │    │  • Queue Runner  │
│ • SLA Deadlines  │    │  • 7 Guardrails  │    │  • Email Window  │
│ • WhatsApp Chats │    │  • Email & WA    │    │  • Follow-ups    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

1. **Find Target Companies and Contacts**: Real-time Apollo.io API discovery with select-or-type criteria (markets, industries, roles) and batch Apollo CSV imports.
2. **Enrich and Verify**: Domain deduplication, team size verification, and email deliverability checks (`deliverable`, `risky`, `undeliverable`).
3. **Compliance Router (Control Point)**: Deterministic policy enforcement by jurisdiction (GCC email/LinkedIn, Germany UWG §7 email block, UK legitimate interest, strict WhatsApp opt-in), suppression lists, and emergency kill switch.
4. **Scheduled Worker & Dispatch Queue**: Automated background `node-cron` queue runner evaluating approved time windows, daily sending caps, sequence cadence delays, and exponential retry backoffs.
5. **Receive and Classify Inbound Replies (Email & WhatsApp)**: Deterministic 7-keyword guardrail scan (`price`, `quote`, `contract`, `legal`, `gdpr`, `complaint`, `lawyer`) + Claude 3.5 Sonnet LLM classification across 9 Excel reply types. Supports both Smartlead email webhooks and Odoo native WhatsApp Discuss channel webhooks.
6. **Handover to Odoo CRM**: Assembles the required 6-item Handover Pack, assigns SLA deadlines (<1h, <4h, <24h), pauses automated email sequence touches on the account, and syncs directly to Odoo CRM (`crm.lead`).
7. **Odoo Native WhatsApp Channel Integration**: Handles prospect-initiated WhatsApp chats via Odoo's native Discuss module (`discuss.channel`), enforces Meta's 24-hour conversation window, sends holding replies, and auto-suppresses outbound email sequences while chatting.

---

## 2. Core Business Rules (`AI - to human Handover_Rules.xlsx`)

### A. Qualification Formula
* **Warm Qualified**: $\text{SegmentFit} = \text{Yes} \land \text{CountryPermitted} = \text{Yes} \land \text{TeamSize} \ge 20 \land \text{RoleTarget} = \text{Yes} \land \text{IntentSignal} = \text{Yes}$.
* **Nurture**: Positive intent signal, but fails fleet team size ($<20$), segment, or target role.
* **Suppressed / Blocked**: If country is prohibited (e.g. cold email to Germany) or contact is on suppression list, the lead is blocked and **never** routed into nurture.

### B. The 9 Reply Types & SLA Response Targets
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
Matches immediately trigger human escalation and bypass AI response discretion.

### D. The 6-Point Handover Pack for Odoo CRM
1. **Full Thread**: Every outbound and inbound message.
2. **Company & Role Details**: Company name, domain, country, team size, contact name, email, job title.
3. **Channel Permissions & Consent**: Channel, lawful basis, evidence reference, timestamp.
4. **Qualification Score & Why**: Rationale, fit flags, intent criteria evaluation.
5. **Suggested Next Step**: Contextual action recommendation for the sales representative.
6. **Risk Flags**: Guardrail hits, pricing notices, jurisdictional caveats (e.g. Germany UWG §7).

---

## 3. Operational REST API

### Health & Emergency Controls
* `GET /health` — Service health and uptime.
* `GET /ready` — Dependency readiness & emergency kill switch status.
* `POST /internal/campaigns/pause` — Activate emergency kill switch (freezes all outbound sending).
* `POST /internal/campaigns/resume` — Resume campaigns with bearer authorization.
* `GET /internal/kpis` — Handover counts, SLA targets, and missed escalation metric.

### Lead Ingestion & Apollo Discovery
* `POST /leads/import` — Ingest and deduplicate raw lead batches.
* `POST /leads/discover/apollo` — Search Apollo by market, industry, role, and team size. Returns company, position, contact name, email, contact phone, company phone, country, industry, compliance, and qualification.
* `POST /leads/import/apollo-csv` — Parse and pipeline raw Apollo CSV exports.
* `POST /campaigns/queue-leads` — Validate compliance and queue approved leads into the automated dispatch queue.

### Scheduled Worker & Automation Queue
* `GET /internal/automation/settings` — Get active dispatch schedule, daily caps, cadence, and live worker stats.
* `POST /internal/automation/settings` — Update automation settings and reschedule the `node-cron` runner in real-time.
* `GET /internal/automation/queue` — Inspect queue backlog, pending sequence steps, and retry status.
* `POST /internal/automation/trigger-batch` — Trigger an immediate batch dispatch cycle (`{ forceWindow: boolean }`).

### Webhooks & WhatsApp AI
* `POST /webhooks/smartlead` — Process incoming email replies, bounces, and unsubscriptions.
* `POST /webhooks/odoo/whatsapp` — Inbound webhook for prospect-initiated WhatsApp messages forwarded from Odoo Discuss. Evaluates guardrails, generates holding reply, pauses email sequence, and creates Odoo CRM lead.
* `GET /internal/whatsapp/conversations` — Live log of WhatsApp conversations, AI classifications, and active phone sessions.
* `POST /internal/whatsapp/simulate` — Interactive testing endpoint to simulate an inbound WhatsApp message.
* `POST /internal/simulate-reply` — Test classification, guardrail scans, holding replies, and Odoo pack generation for emails.
* `GET /internal/handovers` — List all warm leads synced to Odoo CRM.
* `GET /console` — Web-based Operations & Technical Console UI.

---

## 4. Web Console UI (`/console`)

A clean, enterprise white interface accessible at `http://localhost:3000/console`:
* **Overview & KPIs**: Real-time throughput, missed escalations counter (target: 0), SLA summary.
* **Apollo Lead Discovery**: Flexible select-or-type search for Target Market, Industry, and Job Roles. Actions: **"Select All & Push to Campaign"** and **"Export to CSV"**.
* **Apollo CSV Import**: Direct paste area for Apollo export CSVs.
* **Reply & Guardrail Lab**: Interactive simulator testing incoming replies against the 7 keywords and 9 reply types.
* **Automation Settings**: Scheduled queue worker monitor (`node-cron`), window open/closed status, daily sent caps, and on-demand batch trigger.
* **Odoo CRM Handovers**: Table of leads handed over with the 6-item pack and SLA timestamps.
* **WhatsApp AI Live**: Dedicated real-time monitoring and simulation tab for Odoo native WhatsApp conversations, 24h Meta conversation window tracking, and email follow-up auto-suppression.
* **Compliance & Policy**: Interactive policy matrix and keyword rules reference.

---

## 5. Getting Started

### Prerequisites
* Node.js 20+ LTS
* PostgreSQL 16+ (optional for in-memory testing)

### Installation & Run
```bash
# Install dependencies
npm install

# Run all 10 test suites (71 tests)
npm test

# Build TypeScript to /dist
npm run build

# Start server
npm start
```

### Accessing the Web Console
Open [http://localhost:3000/console](http://localhost:3000/console) in your browser.
*(Note: Use `localhost` or `127.0.0.1` rather than `0.0.0.0` in desktop browsers).*
