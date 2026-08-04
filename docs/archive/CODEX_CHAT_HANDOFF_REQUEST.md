# Archived Codex Chat Handoff Request

This prompt is retained as project provenance. The resulting handoff is stored in `docs/CODEX_CONVERSATION_HANDOFF.md`; use that document for current continuation context.

Copy the prompt below into the previous Codex App conversation. Then paste its complete response into the new conversation, or save the response as a Markdown file in this repository and tell the new Codex session where it is.

---

## Prompt for the previous Codex session

I am moving this project to a new Codex conversation. Create a complete, factual handoff of everything in this conversation that another Codex agent would need to continue the work without rereading the chat.

The project repository is `solar-farm`. The new agent can inspect the current checkout, so focus especially on context that exists only in this conversation: my goals, decisions, preferences, rejected approaches, unresolved questions, external-system state, and the reasoning behind the implementation.

Return one self-contained Markdown document using the exact structure below. Be comprehensive, but do not repeat information merely to make the response longer.

### 1. Executive summary

- Explain what the product is, who it serves, and the intended outcome.
- Summarize the work requested in this conversation.
- State the current phase and the single most important next action.

### 2. User intent and success criteria

- List every explicit goal and requirement I gave you.
- Capture implicit requirements only when strongly supported by the conversation; label them as inferred.
- Record what “done” means for each active workstream.
- Include priorities, deadlines, launch constraints, and scope boundaries mentioned in the chat.

### 3. Decisions and rationale

For every meaningful product, design, architecture, data, security, deployment, or workflow decision, provide:

- The decision.
- Why it was made.
- Alternatives considered or rejected and why.
- Whether it is final, provisional, or still open.

Do not present brainstorming as an approved decision.

### 4. User preferences

Capture preferences that the next agent should preserve, including:

- Visual style, tone, branding, wording, and UX expectations.
- Engineering conventions and desired tradeoffs.
- Preferred degree of autonomy, reporting style, and verification.
- Anything I explicitly disliked or asked not to repeat.

### 5. Work completed

For each completed change, include:

- What changed and why.
- Exact repository paths involved.
- Important functions, components, routes, schemas, migrations, configuration, or environment-variable names.
- Tests or checks run and their results.
- Commit, branch, pull request, or deployment identifiers, if any.

Separate work actually implemented from recommendations or example code that was never applied. Do not claim a file was changed unless the conversation or tool results confirm it.

### 6. Current repository and runtime state

Report the last known state of:

- Branch, commits, staged files, uncommitted changes, and untracked files.
- Running development servers or background processes and their ports.
- Build, lint, type-check, and test status.
- Database migrations, seed data, storage buckets, auth setup, and local versus remote environments.
- Deployed environments, domains, preview URLs, and deployment status.

Clearly label any state that may now be stale and should be rechecked by the new agent.

### 7. External systems and integrations

List every external service discussed or used, such as Supabase, hosting, maps, geocoding, parcel data, environmental data, analytics, email, or source control. For each one, state:

- Its purpose.
- What was configured or changed.
- Relevant project, organization, environment, table, bucket, function, or provider names.
- Any manual actions still required.
- Known limits, mocked behavior, unavailable providers, or production-readiness concerns.

Never include secret values, passwords, access tokens, private keys, cookies, or full connection strings. Include only environment-variable names and explain where the user is expected to configure their values.

### 8. Data model and business rules

- Summarize important entities, relationships, schemas, validation rules, scoring logic, financial assumptions, roles, permissions, and state transitions discussed.
- Preserve exact units, thresholds, formulas, defaults, enumerated values, and edge-case behavior when known.
- Identify the source of truth for each major data area.
- Flag placeholders, demo data, assumptions, and values that still require validation.

### 9. Known issues, risks, and technical debt

For each item, state:

- Symptoms and impact.
- Likely or confirmed cause.
- Relevant paths or systems.
- Troubleshooting already attempted and the result.
- Recommended next step.

Include security, privacy, data-accuracy, accessibility, performance, mobile, browser, operational, and deployment risks mentioned in the conversation.

### 10. Remaining work

Create a prioritized checklist grouped as:

- **P0 — blocking**
- **P1 — required next**
- **P2 — improvement**
- **Later / optional**

Each task must be concrete enough for another agent to execute. Include dependencies, acceptance criteria, likely files, and verification commands when known. Mark tasks that require a user decision, credentials, approval, payment, or manual action.

### 11. Open questions

- List unresolved questions that materially affect implementation.
- Explain why each answer matters and what the default assumption has been so far.
- Do not invent questions already resolved in the conversation.

### 12. Verification and reproduction guide

Provide the commands and steps needed to:

- Install and run the project locally.
- Configure required environment variables by name only.
- Reproduce active issues.
- Run relevant tests, linting, builds, and security checks.
- Verify the main user journeys manually.

Use commands appropriate to the repository as discussed in this chat. Mention prerequisites and expected results.

### 13. Important conversation artifacts

Include or accurately summarize any information the new agent cannot recover merely by inspecting the checkout, such as:

- User-provided copy, requirements, datasets, screenshots, or reference links.
- Generated plans, analyses, mappings, prompts, or structured data that remain relevant.
- Exact error messages or tool outputs essential to understanding unfinished work.
- Files or images attached to this chat that must be reattached in the new conversation.

For long artifacts, give their exact location if saved in the repository. If they exist only in chat, include the necessary content directly when copyright and privacy permit.

### 14. Recommended continuation prompt

End with a short prompt I can paste after this handoff to tell the new Codex agent exactly what to do next. It should name the highest-priority task, constraints, expected verification, and any user input that is genuinely required.

## Accuracy rules

- Base the handoff only on this conversation and confirmed tool results.
- Separate confirmed facts, user statements, agent recommendations, and inferences.
- Use absolute dates rather than relative phrases such as “today” or “yesterday.”
- Preserve exact file paths, identifiers, commands, error messages, and version numbers when useful.
- Identify information that may be stale instead of silently assuming it is current.
- Do not expose secrets or sensitive personal information.
- If a requested section has no relevant information, write `None recorded`.
- Do not perform new implementation work. The only task is to produce the handoff document.

---

## Importing the result

In the new Codex conversation, attach the generated Markdown document and say:

> Treat the attached handoff as historical context, not unquestionable truth. Inspect the current repository and `AGENTS.md`, reconcile the handoff with the actual checkout, preserve unrelated user changes, report any discrepancies, and then continue with the highest-priority unfinished task. Never reuse secret values from the transcript.
