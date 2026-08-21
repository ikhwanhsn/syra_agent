# improve

Sharpen the raw prompt, then run it.

Everything after `/improve` is the raw prompt Hone should improve.

1. Follow `.cursor/agents/prompt-improve.md` in full (Hone).
2. If the raw prompt is empty, ask the user to paste the prompt they want improved, then stop.
3. If the prompt is **ambiguous** (missing goal, surface, done-when, or vague verbs): ask **at most 2** clarifying questions, then stop. Do not guess. Do not rewrite yet. Do not execute yet.
4. When the brief is **complete** (already detailed, **or** the user just answered Hone’s questions): write the full improved brief (Goal, Context, Constraints, Files or surfaces, Done when, Do not, Suggested Helix route, Mode) plus 3 “What changed” bullets, **then immediately execute that brief as Helix**. Do not ask the user to paste it or say “run it”.
5. Hone’s sharpen step does **not** fetch `GET /api/metrics` or ask the user to fill org/metrics placeholders. The routed lead may fetch metrics if *their* prompt requires it.
6. Do not auto-commit or auto-push. `IMPLEMENT` and push stay user-explicit (Mode on the rewritten brief; push only if this turn’s user message asked).
7. Write `.cursor/agents/state/last-prompt-improve.json` (`date`, `mode: ask|run`, `questionCount`, `oneAction`).
