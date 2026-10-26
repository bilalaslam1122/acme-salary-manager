# AI Workflow Rules

## Approach

Build this project incrementally with a spec-driven workflow. The six files in
`context/` are the single source of truth: `project-overview.md` says what to build,
`architecture.md` and `code-standards.md` say how to build it, `ui-context.md` says how
it looks, this file says how to work, and `progress-tracker.md` records where things
stand. Read all six at the start of every session. Always implement against these
specs. Do not infer or invent behaviour from scratch. AI-generated output is reviewed
like a pull request from a colleague: read every line, run the tests, and record notable
prompts and corrections in the AI Prompts Log in `progress-tracker.md`.

## Scoping Rules

- Work on one feature unit at a time. A unit is one bullet in the phased plan in
  `progress-tracker.md`.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- Write tests in the same unit as the feature they cover.

## When to Split Work

Split an implementation step if it combines any of these:

- Schema or migration changes with UI changes.
- More than one API resource. Each of employees, insights, history and auth is its
  own unit.
- Service and business logic changes with visual and styling changes.
- Behaviour not clearly defined in the context files. Define it first, in its own
  docs commit.
- A refactor with a behaviour change. Refactor first, then change behaviour.

If a change cannot be verified end to end quickly, the scope is too broad, so split it.

## Handling Missing Requirements

- Do not invent product behaviour that is not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before
  implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md`,
  state the working assumption, and get confirmation before building anything that
  depends on it.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn-generated primitives. Add with the CLI and compose in
  feature components.
- `prisma/migrations/*` that have already been committed. Create a new migration
  instead.
- `node_modules/`, generated Prisma client output, and `package-lock.json` except
  through `npm install`.
- `.code-review-graph/` — tooling state.
- The six `context/*.md` files may change only to keep them in sync with an agreed
  decision. They are never edited silently to match code that drifted.

## Keeping Docs in Sync

Update the relevant context file in the same commit whenever the implementation
changes any of these:

- System architecture or boundaries (`architecture.md`).
- Storage model decisions, the schema or indexes (`architecture.md` and the ERD).
- Code conventions or standards (`code-standards.md`).
- Feature scope (`project-overview.md`).
- UI tokens or patterns (`ui-context.md`).

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work, decisions and AI prompts.
4. `npm run build` passes.
5. `npm run test` passes, with no skipped or `.only` tests.
6. `npm run lint` passes with zero warnings.
7. The unit is committed as a single commit with a conventional message (`feat:`,
   `fix:`, `test:`, `docs:`, `refactor:` or `chore:`), for example
   `feat: add paginated employee list API`.
