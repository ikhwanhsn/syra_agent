# Agent Rules (General / Portable)

Reusable Cursor agent rules for any project. These are **generic** versions with no Syra-specific references. Copy any file into another repo's `.cursor/rules/` folder to activate that agent persona.

## How to use

1. Copy one or more `.mdc` files from this folder to your target project's `.cursor/rules/` directory.
2. Cursor loads rules automatically based on the `description` field (agent-requestable) and optional `globs` (file-scoped).
3. Invoke explicitly in chat: e.g. "Apply the security-engineering rule and review this PR."

Optional: set `alwaysApply: true` in frontmatter if you want a rule active on every session (not recommended for most roles).

## Full company agent team (24 roles)

Use together as a virtual org for solo founders or small teams.

### Already in Syra `.cursor/rules/` (project-specific or shared)

| Rule | Role | Scope |
| --- | --- | --- |
| `ui-ux-design.mdc` | UI/UX Designer | Interfaces, components, accessibility |
| `qa-testing.mdc` | QA Engineer | Testing, validation, defect reports |
| `article-authoring.mdc` | Content (Syra only) | Marketing articles, X copy |

### Engineering org (this folder + Syra tailored copies)

| Rule | Role | When to use |
| --- | --- | --- |
| `product-strategy.mdc` | CPO | PRDs, prioritization, scope, metrics |
| `product-manager.mdc` | PM | App critique: gaps, UX, flows, complexity, wants |
| `roadmap-strategy.mdc` | Roadmap Strategist | Repo-grounded 30/90/365 plans under funding |
| `backend-engineering.mdc` | Staff Backend | APIs, services, data, reliability |
| `smart-contracts.mdc` | Protocol Engineer | Solidity, audits, deployment |
| `security-engineering.mdc` | CISO / AppSec | Threat model, secrets, auth, incidents |
| `hacker-security.mdc` | Ethical Hacker | Adversarial hunt, attack paths, then patch |
| `test-case-generation.mdc` | Test Engineer | Generate unit/integration/e2e/stress/security tests |
| `performance-engineering.mdc` | Performance Engineer | Render, memory, rerenders, bundle, expensive comps |
| `devops-sre.mdc` | SRE / DevOps | CI/CD, deploys, observability |
| `code-review.mdc` | Staff Engineer | PR review, maintainability |
| `cto-architecture.mdc` | CTO | System architecture, scale, debt, tech strategy |
| `dead-code.mdc` | Dead Code Hunter | Unused components/APIs, duplication, deps |
| `data-analytics.mdc` | Head of Data | Metrics, events, funnels, experiments |

### Business org (this folder + Syra tailored copies)

| Rule | Role | When to use |
| --- | --- | --- |
| `ceo-review.mdc` | CEO (multi-hat) | Brutal repo/business challenge; what to change |
| `cofounder.mdc` | Cofounder | Business, customer, pricing, GTM, launch, fundraising |
| `growth-marketing.mdc` | CMO | Launches, positioning, funnels, content |
| `developer-relations.mdc` | DevRel | Docs, SDK, DX, quickstarts |
| `customer-support.mdc` | Head of Support | Triage, responses, incidents, refunds |
| `finance-pricing.mdc` | CFO | Pricing, unit economics, runway |
| `legal-compliance.mdc` | General Counsel | Privacy, ToS, regulatory risk flags |

## Suggested workflows

**Ship a feature:** product-strategy → backend-engineering / smart-contracts → test-case-generation → code-review → qa-testing → devops-sre → developer-relations → growth-marketing

**Product audit:** product-manager (critique) → ui-ux-design (craft fixes) → product-strategy (PRD for must-builds)

**Performance pass:** performance-engineering (measure + fix) → qa-testing (no regressions) → dead-code (unused heavy deps)

**Company roadmap:** roadmap-strategy (timed plan) ← cto-architecture + finance-pricing + product-strategy inputs

**Board / founder reality check:** ceo-review (all hats, brutal) → roadmap-strategy (sequence survivors) → product-manager / cto-architecture (depth)

**GTM from repo:** cofounder (business + pricing + launch) → growth-marketing (execute) → developer-relations (docs) → finance-pricing (margins)

**Architecture review:** cto-architecture (system view) → security-engineering (deep threats) → devops-sre (ops readiness)

**Adversarial security:** hacker-security (find + attack path + patch) → test-case-generation (security regression tests) → security-engineering (process/secrets) → qa-testing (regression)

**Codebase cleanup:** dead-code → code-review (merge plan) → qa-testing (verify nothing broke)

**Launch prep:** security-engineering + legal-compliance + customer-support macros + data-analytics events

**Pricing change:** finance-pricing → legal-compliance → growth-marketing (messaging) → customer-support (macros)

## Customizing for your project

After copying a rule:

- Add project-specific `globs` in frontmatter (e.g. your API or contracts paths)
- Add a "Project-specific" section at the bottom with stack, folders, and domain terms
- Keep generic rules in this folder unchanged so you can sync improvements across repos

## File format

Each rule follows the same structure:

```yaml
---
description: One-line trigger for the agent
globs: optional/path/**/*
alwaysApply: false
---
```

Body: role statement, When to Apply, Precedence, numbered practice sections, Anti-Patterns, Definition of Done.

## Syra monorepo

Tailored variants (with Syra/x402/API paths) live in [.cursor/rules/](../.cursor/rules/). Prefer those when working inside this repo; use this folder when bootstrapping a new project.
