---
name: request-breakdown
description: Breaks down user requests into a goal, ordered steps, and agent assignments. Use when the user asks to break down a request, plan execution, decompose tasks, assign work to agents, or get a structured execution plan.
---

# Request Breakdown

Takes a user request and produces a structured execution plan: one goal, ordered steps, and which agents (if any) should handle each part.

## Workflow

1. **Understand the goal**  
   State the user’s intent in one clear sentence. No implementation detail—just the outcome they want.

2. **Decompose into steps**  
   Split the work into small, ordered, actionable steps. Each step should be one concrete action (e.g. “Add validation for email field” not “Handle form”). Order by dependency (what must happen first).

3. **Assign agents if needed**  
   For each step, decide if a specialized agent is better than the main agent (e.g. explore, generalPurpose, code review, tests). Leave `agents_needed` empty if the main agent can do everything.

## Output format

Always respond with valid JSON in this shape (and nothing else in the JSON block):

```json
{
  "goal": "string",
  "steps": ["string", "..."],
  "agents_needed": ["string", "..."]
}
```

- **goal**: Single sentence describing the user’s desired outcome.
- **steps**: Array of ordered step descriptions. One action per step; dependency order.
- **agents_needed**: Array of agent identifiers only for steps that should be delegated (e.g. `"explore"`, `"generalPurpose"`). Same length and order as steps that need an agent; use empty string `""` for steps the main agent handles.  
  **Alternative**: One list of unique agents that will be used across the plan (e.g. `["explore", "generalPurpose"]`) if the tooling expects a single list. Prefer matching step order when the executor maps agents to steps.

Use this **strict** schema when the user or executor expects step-to-agent mapping:

```json
{
  "goal": "string",
  "steps": ["step1", "step2", "..."],
  "agents_needed": ["agent_for_step1", "agent_for_step2", "..."]
}
```

- `steps` and `agents_needed` must have the same length.
- For a step done by the main agent, use `""` or `"main"` in `agents_needed`.

## Examples

**Example 1: Codebase exploration**

User: “Find where we validate JWT and add a unit test.”

```json
{
  "goal": "Locate JWT validation logic and add a unit test for it.",
  "steps": [
    "Search codebase for JWT validation (middleware or auth module)",
    "Identify the exact function/unit to test",
    "Add a unit test covering valid token, invalid token, and missing token"
  ],
  "agents_needed": ["explore", "", ""]
}
```

**Example 2: No delegation**

User: “Refactor the login form to use our design system.”

```json
{
  "goal": "Refactor the login form to use the project design system.",
  "steps": [
    "Locate login form component and current styles",
    "Map design system tokens/components to form elements",
    "Replace inline/custom styles with design system usage",
    "Verify layout and accessibility"
  ],
  "agents_needed": ["", "", "", ""]
}
```

**Example 3: Multiple agents**

User: “Research best practices for rate limiting, then implement it in our API.”

```json
{
  "goal": "Research rate-limiting best practices and implement them in the API.",
  "steps": [
    "Research rate-limiting approaches and libraries for our stack",
    "Choose strategy and add dependency",
    "Implement rate-limiting middleware and wire into API",
    "Add tests and document limits"
  ],
  "agents_needed": ["generalPurpose", "", "", ""]
}
```

## Rules

- **One action per step**—no compound steps like “Find X and implement Y.”
- **Order by dependency**—steps that others depend on come first.
- **Goal is outcome-only**—no “by doing X” or implementation in the goal sentence.
- **agents_needed** only for steps that should be delegated; use `""` or `"main"` for the rest and keep array length equal to `steps` when mapping is required.
