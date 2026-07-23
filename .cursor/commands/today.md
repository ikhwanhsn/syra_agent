# today

Run today’s Syra growth tasks automatically (no placeholders).

1. Read `.cursor/task/README.md` cadence.
2. Resolve weekday from system/user_info.
3. Run `.cursor/task/daily-growth-standup.md` fully (fetch metrics, update state).
4. Then run the focused task for that weekday:
   - Mon → activation-doctor
   - Tue → token-marketcap-operator
   - Wed → product-prioritization
   - Thu → payments-security-audit on even ISO week numbers, else codebase-health-sweep
   - Fri → weekly-ceo-brutal-review
   - Sat/Sun → daily-growth-standup only (optional light: ship-log if git shows recent ships)
5. Do not ask the user to fill metrics, dates, or baselines — use tools + `.cursor/task/state/`.
6. End with a single combined “do this next” action for the founder.
