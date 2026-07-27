# Outcomes Regulatory and Compliance Flags

**Status:** Internal risk memo. Not legal advice. Consult qualified counsel before scaling real-money outcome products.

## Summary

Syra's "completed work" layer (LP Autopilot, Treasury Autopilot, Yield Autopilot) moves the product from selling pay-per-call intelligence (software dollar) to managing capital and charging performance or AUM fees (services dollar). This shift increases regulatory, custody, and consumer-protection exposure.

## Flags for Counsel

### 1. Investment advisory / asset management

- Autonomous treasury management, yield routing, and LP management with performance fees may constitute investment advisory or asset management in multiple jurisdictions.
- **Mitigation in code:** EV gate before real capital, tiny pilot caps (`ROBINHOOD_LP_REAL_MAX_*`), kill switches, dry-run default, explicit mandate revocation API.

### 2. Custody and fund-loss liability

- Standing mandates authorize recurring wallet operations. Errors or exploits can cause direct user losses.
- **Mitigations:** `policyEngine` caps, `walletBroker` single signing surface, mandate `killSwitch`, `SignAudit` trail, per-mandate spend limits.

### 3. Performance fee disclosure

- Outcome billing charges performance/AUM fees on proven results (`outcomeBillingService.js`).
- **Action:** Publish fee schedule, past performance disclaimers, and risk disclosures on docs and mandate creation flows before GA.

### 4. Marketing claims

- Do not guarantee returns. Paper-sim EV leaders are research gates, not promises of future performance.
- UI copy must distinguish dry-run / pilot from production managed accounts.

### 5. KYC / AML (if scaling to human-facing treasury)

- Agent-to-agent B2B may have lower exposure initially; human treasury management at scale may trigger AML obligations depending on jurisdiction.

## Operator Checklist Before Real-Money Scale

- [ ] Counsel review of performance fee model and mandate terms
- [ ] Published risk disclosures and fee schedule in docs
- [ ] EV gate passed and documented (`GET /outcomes/ev-gate`)
- [ ] Kill switch tested (`POST /outcomes/mandates/:id/kill`)
- [ ] Insurance or reserve policy for pilot capital (if applicable)
- [ ] Incident response runbook for fund-loss events

## Technical Safeguards (implemented)

| Control | Location |
| --- | --- |
| EV gate before real execution | `api/libs/outcomeEvGateService.js` |
| Mandate caps and revocation | `api/libs/outcomeMandateService.js` |
| Policy engine outcome tools | `api/services/policyEngine.js` (`OUTCOME_AUTO_TOOLS`) |
| Wallet broker mandate overlay | `api/services/walletBroker.js` |
| Pilot caps (Robinhood LP) | `api/config/robinhoodLpRealAccess.js` |
| Verifiable outcome reports | `api/libs/outcomeProofService.js` |
| Outcome billing audit trail | `api/models/OutcomeBillingEvent.js` |

## Contact

Escalate regulatory questions to counsel before enabling `ROBINHOOD_LP_REAL_PILOT_ENABLED=true` in production or marketing outcome products to non-crypto-native users.
