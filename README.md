# Engineering Ladders

A React application for managing team competency assessments, evaluation history, and professional growth tracks.

## Requirements

- Node.js 24+
- A Supabase project
- Docker Desktop only when running Supabase locally

## Application setup

The shared UI library is installed from GitHub Packages as
`@jordiorriols/ui`. Export a token with `read:packages` scope before installing;
`.npmrc` reads it from `GITHUB_TOKEN`:

```bash
export GITHUB_TOKEN=<token with read:packages>
npm install
cp .env.example .env
npm start
```

New UI versions are published automatically on every push to UI `main`. Update
with `npm install @jordiorriols/ui@latest` and restart Vite.

Shared views, official Radix primitives, icons, auth/form hooks and Umami live in
`@jordiorriols/ui`. Application translations, competency definitions, sharing routes,
repositories, access rules and database tables stay here. `index.css` imports
the library's Tailwind tokens instead of redeclaring them. App adapters preserve
the existing imports, callbacks and test IDs while supplying translated props.

Umami is loaded from `src/index.jsx` with the UI's `loadUmami`, not a `<script>`
tag, so automated browsers (Playwright e2e runs) never load it or send events.

`WelcomeScreen` shares Planner's welcome layout with app-specific copy and
features. `AppHeader` standardizes branding sizes and language/account actions
across both apps; authentication and translations remain in their adapters.

The header icon opens UI's shared `ProjectSwitcher`. Names, icons and canonical
URLs live in the UI `PROJECTS` registry: add a project there once, release UI,
then update/deploy both apps. The welcome and assessment icon adapter also reads
its icon from that registry. Auth and shared assessment loading reuse UI's
accessible `AppSkeleton` and reduced-motion-aware pulsing `Skeleton` blocks.

All Ladders routes render UI's `AppFooter`. Manager, self, peer and shared-view
assessment headers reuse the same app icon and language selector (English,
Spanish, Catalan, French, German and Italian), including shared-link
loading/error/thank-you screens.
Clipboard success/failure and publish validation use UI's accessible `AlertModal`,
not native JavaScript `alert()`.

### Localization

All application-owned copy, accessible labels, placeholders, validation and
error messages come from i18next and the six `src/locales/*.json` bundles.
Both header adapters supply `AppHeader.projectSwitcherLabel`; `AppFooter`
receives translated attribution instead of its English default. Locale changes
update the document's `lang`, and regional preferences resolve to a supported
base language. Displayed dates, comment timestamps and averages use that locale.

Competency identifiers such as `Technology`, saved evaluation keys and template
IDs remain stable. Adapters translate their display labels without changing
chart values or moderation callbacks. Names, roles, goals and comments entered
by users are never translated. Backend diagnostics remain internal;
`localizeError` maps recognized failures to translated messages and uses a safe
translated fallback for unknown failures.

Check locale key/interpolation parity, source copy and six-language UI/error
regressions with:

```bash
npm test -- src/__tests__/locales.test.ts src/__tests__/untranslated-ui.test.ts \
  src/__tests__/localization.test.tsx src/utils/__tests__/localizeError.test.ts
```

Keep all six bundles in sync when adding copy.

### Employee comment privacy

Managers and team editors can share/hide each saved competency comment in the
assessment's **Comments shared with the employee** section. Controls cover all
versions, including peers, without requiring chart comparison. Peer comments
start hidden; manager and self comments keep their previous visible default.
Draft manager/peer versions are still private until published. Hiding never
deletes the original comment or its ratings, and self links retain access to the
employee's own answers.

`20261010190000_comment_visibility.sql` adds per-comment visibility and a
team-edit-authorized RPC, and redacts hidden text in `public_view` on the server.
Anonymous users never receive hidden text from that API. The approved migration
is recorded in the shared Supabase project and mirrored in Planner's migration
history; apply it only once. No historical comment text is rewritten.

Set these values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The publishable key is safe to use in the browser. Database access is protected by the Row Level Security policies in the migrations. Never put the service-role key in this application.

### CI and deployment

Pushes to `main` or `master` and manual dispatch run the same compile, lint,
format, coverage, build and GitHub Pages deployment checks as Planner, using
Node.js 24.21.0. `npm ci` installs `@jordiorriols/ui` from GitHub Packages with
the workflow token (`packages: read`). Grant this repository read access in the
package's **Manage Actions access** settings, or set the `UI_READ_TOKEN` secret
to a token with `read:packages`.

### Shared Planner vacations

Vacation links use `getProjectUrl("planner")` from the shared UI project registry,
the same source as the header project switcher. No separate Planner URL setting
is needed. Updating a project URL requires a UI release and updated app dependencies.

Member creation/editing includes an optional planning role (`backend`, `frontend`,
`design`, or `qa`), separate from the existing free-text job role. The Share menu
includes **Vacations**, copying the member's independent permanent vacation UUID.
Self, peer, and view links retain their existing routes and tokens.
Read-only team viewers do not see sharing actions or the planning-role editor.

This requires the additive shared-vacations migration maintained in `../planner`
to provide `public.members.planning_role` (nullable) and
`public.members.vacation_token` (database-generated UUID), plus Planner's
permissions/RPCs. Ladders reads the token but never sets or rotates it. Planner
workspaces can link multiple Ladders teams. Deploy the shared schema only after
approval and local RLS validation; Ladders does not apply it automatically.

### Workspaces and access

Teams live inside a workspace and never move to another one. The home page uses
UI's `WorkspaceBar` next to the navigation tabs (same as Planner and Pulse) to pick
the workspace, create a new one, and, for owners, share it per app through
`workspace_collaborators`. Only the selected workspace's teams, members and
evaluations are shown. Team access comes from the workspace share; there is no
per-team share button. Only workspace owners can create teams
(`create_team(p_name, p_workspace)`).

## Initialize Supabase

Creating a Supabase project does not create this application's tables. Apply both migrations before trying to save members or evaluations.

Authenticate the CLI and link this repository to the existing project:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Enter access tokens and database passwords directly in the terminal when prompted. Do not place them in `.env` or commit them.

For the currently configured URL, the project ref is the subdomain before `.supabase.co`.

The migrations run in filename order:

1. `supabase/migrations/0001_init.sql` creates tables, Row Level Security policies, permanent UUID share tokens, and public token RPCs.
2. `supabase/migrations/0002_editable_drafts.sql` enables draft autosave while keeping published evaluations immutable.

Alternatively, for a new empty project, paste and run those files in order in the Supabase Dashboard SQL Editor. Prefer `supabase db push` because it records migration history.

## Auth configuration

Both apps share Supabase accounts but explicitly tag signup, OAuth and recovery
callbacks with `auth_app=ladders` or `auth_app=planner`. Before creating a Supabase
client, a callback addressed to the other registered app is forwarded there,
preserving its code/hash so the intended origin can exchange the PKCE code.

In Supabase Dashboard under **Authentication → URL Configuration**, keep one
Site URL as the default and add all these Redirect URLs:

- `https://ladders.jordiorriols.cat/`
- `https://ladders.jordiorriols.cat/?auth_app=ladders`
- `https://planner.jordiorriols.cat/`
- `https://planner.jordiorriols.cat/?auth_app=planner`
- Approved local origins with the same query, for example
  `http://localhost:5173/?auth_app=ladders`,
  `http://127.0.0.1:5173/?auth_app=ladders` and
  `http://127.0.0.1:5176/?auth_app=planner`.

For subpath deployments, allow the complete deployment pathname and query.
Keep email verification/recovery templates using `{{ .ConfirmationURL }}`;
custom templates must preserve the supplied `{{ .RedirectTo }}`, not force
`{{ .SiteURL }}`. Old emails without an app marker cannot reliably identify their
origin and should be requested again. The allow-list must accept these URLs;
otherwise Supabase can fall back to Site URL before an app marker reaches us.

Email/password authentication must be enabled. Password-reset emails redirect to the application base URL, where Supabase restores the PKCE recovery session.

To enable GitHub login:

1. Create a GitHub OAuth App.
2. Set its callback URL to `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase Dashboard under **Authentication → Providers → GitHub**, enable GitHub and enter the OAuth App client ID and secret.
4. Keep the application base URL in Supabase's redirect allow-list.

## Local Supabase

To run the complete stack locally:

```bash
npx supabase start
npx supabase db reset
```

Then replace the `.env` values with the local API URL and publishable key printed by `npx supabase status`.

## Checks

```bash
npm run compile
npm run lint
npm run format:check
npm run test:coverage
npm run build
```
