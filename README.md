# Engineering Ladders

A React application for managing team competency assessments, evaluation history, and professional growth tracks.

## Local Access/API migration branch

This draft branch replaces the runtime entry point with authenticated, hash-free
`/ladders/` workspace and team directories. It does not initialize Supabase auth,
password dialogs or anonymous evaluation/invitation routes. Legacy source remains
for reuse during migration; the historical setup below is not the current runtime.

The scoped API lists team/member profiles only (no tokens, evaluations, comments,
legacy owner IDs or account links). Owners create teams; owners/editors rename;
viewers inspect. The existing shared `AppShell`, language selector, footer and
`CreateTeamDialog` are reused, with six translated languages. New Access identities
have no grants. Storage owner foreign keys are not identity associations.

Member links open `/ladders/workspaces/:workspace/members/:member`. Owners/editors
save names, job roles, planning roles and seniority templates through the API;
viewers inspect read-only. The profile fields are extracted from the existing
assessment form, which still uses that same component, alongside the existing
planning-role field and template panel. Saving is explicit and errors remain
visible. Scope rejects foreign/missing members; all legacy tokens, ownership,
account links, creation dates and evaluation history remain unchanged. Planning
role changes are visible in Planner capacity only with a separate Planner grant.

From the backend API directory, start the `web` profile of `compose.local.yml`.
The local gateway serves `http://127.0.0.1:5320/ladders/` (direct port 5314).
Docker installs GitHub Packages with a BuildKit secret. Do not merge or deploy yet.

All migrated apps link to one six-language workspace management screen at
`/ladders/workspace-access`. Signed-in users can create an empty workspace or wait
for an invitation, share their exact account ID, accept/decline app-specific
invitations, and refresh. Creation grants owner access in all five apps and uses
native platform ownership, without creating legacy accounts or changing imported
owner IDs. App owners invite verified account IDs, change editor/viewer roles
(external also in Planner/Shiplog) and remove grants or pending invites.
The existing UI package name dialog, labels, fields, selectors and confirmation
are reused. One screen avoids duplicating this cross-app workflow.
Workspace deletion is available only to owners of all five apps, requires
confirmation and succeeds only when all apps are empty, including protected
history/snapshots. Cancellation never writes; failures remain visible. Successful
deletion removes empty containers, grants and invitations, not user accounts.

Only owners delete members or empty non-default teams, using the existing shared
confirmation dialog. Cancel performs no write; failed deletion stays visible.
Deleting a member retains the existing database cascades for their evaluations,
SMART goals, invitations and vacations, without deleting accounts or other members.
Team deletion retains Shiplog applications and clears only their team association,
matching the existing FK behavior. Nonempty/default teams are rejected with 409.
Container deletion does not implicitly delete a platform-granted workspace: the
legacy `created_for_team` cleanup flag is cleared in the same transaction so the
workspace and all its app grants remain until explicit shared workspace deletion.

Owners/editors add members from a team's directory link. The creation route reuses
the profile form and validators, saves explicitly and replaces its URL with the
created member's permanent profile path. New members are unlinked (`user_id` null),
view sharing is disabled and generated legacy tokens are never returned. Creation
returns only the new ID. Invalid profiles roll back the insertion; foreign teams,
viewers and revoked grants cannot create members. No legacy account is impersonated.

Owners/editors move existing members with the shared `FormField`/`SelectField`
team selector and an explicit Move member button on the profile page. Selecting
a destination alone performs no write. Moves stay within the workspace and
legacy team owner; viewers and revoked grants cannot move members. A duplicate
linked account in the destination returns a visible conflict without unlinking
either member. Profile/account IDs, tokens and all evaluation/goal/invitation/
vacation records survive; reselecting the current team is an idempotent no-op.
The profile URL stays stable and the directory reloads the new team association.

SMART goals reuse the existing member profile panel and route through scoped API
functions. Owners/editors can create, edit, track progress and append manager
comments; viewers are read-only and only owners can delete. Legacy comment history
is preserved, comments remain append-only, and goal records are restricted to the
requested workspace/member. Direct runtime table access remains denied.

Owners/editors use **Member invitations** on a member profile to target an exact
verified account ID. The recipient signs in first, finds their ID at
`/ladders/me/invitations` and explicitly accepts or declines. New Access users
link directly to platform members without legacy accounts, email matching or
workspace grants. Personal evaluation history, self editing, goals and peer
assignments work for these links as well as existing mapped legacy links.
Invitations expire after 30 days; replacement, revocation and consumption invalidate
the previous ID. The server rejects another recipient, a linked member and a
duplicate account within a team. Unlink uses the existing confirmation dialog,
removes personal access and revokes assigned reviews, but preserves evaluation/
goal records and independent workspace permissions. No other-app shares are added.

The local administrator can explicitly map a verified Access account to a legacy
account UUID. Mapping never matches by email or grants workspace access. Already-linked
employees use `/ladders/me` to find only their own member profiles, then open
`/ladders/me/members/:member/evaluations`. This route reuses the shared layout and
evaluation viewer, includes own self drafts and published reviewer versions only,
and receives only server-redacted comments with no internal visibility metadata.
Workspace grants do not imply employee ownership; unmapping removes legacy-linked employee access.
Employees open `/ladders/me/members/:member/self-evaluation` from their history
to edit self evaluations with the same extracted editor and autosave hook used
by managers. Own self drafts survive refresh and publish explicitly; published
answers remain immutable, with subsequent edits saved as a new draft. The
self-only editor receives own comments even when hidden from the mixed history,
but never receives reviewer comments or moderation metadata. Manager-only goal
controls, comment visibility, profile editing and deletion are unavailable.
Direct platform links or explicit legacy mappings/member links are checked server-side on
every read/write; workspace grants never imply employee ownership.
Employees use `/ladders/me/members/:member/goals` to update progress and append
comments through the existing goals panel's member mode. Goal definitions remain
manager-owned and existing comments remain append-only. Every write checks the
account/member link and rejects foreign goals; no create/delete/definition controls
are enabled. Failed saves remain visible without granting workspace-wide access.
Managers assign/revoke peer reviews from the member evaluation page. The shared
selector lists only verified, linked colleagues in that workspace.
Reviewers use `/ladders/me/peer-reviews` and an assignment-specific URL to submit
through the same assessment editor, without name entry or evaluation history.
Authorship comes from their linked profile; submissions are peer drafts pending
manager moderation, with comments hidden by default. Each assignment accepts one
submission. Revocation/unmapping denies access and never deletes saved feedback.
No anonymous links, email inference or workspace-wide reviewer grants are used.
The existing token peer editor retains its original name requirement.
Pending: real corporate Access acceptance and linking the same workspace screen
from Pulse/Agents as those adapters migrate.
No production data is written. E2Es use only `platform-local.config.ts` and the
isolated signed test fixture, never historical remote-backed configs.

Member profiles link to authenticated
`/ladders/workspaces/:workspace/members/:member/evaluations`. The read-only
history reuses `EvaluationViewer`, version filtering, comparison radar, competency
details, comments and templates. Owner/editor/viewer grants inspect manager/peer
versions and published self versions; self drafts remain private, matching
legacy team access. The internal history includes hidden manager/peer comments
for reviewers, not an employee-safe projection. No account/token metadata is
returned. Viewers retain the read-only history. Owners/editors
use the same extracted `CommentVisibilityPanel` as the legacy assessment page
to share or hide each saved manager, published self or peer comment independently.
Peer comments default hidden; changing draft peer metadata does not publish it.
Only visibility metadata changes, never content/status/identity/timestamps.
Missing/private-self-draft/foreign evaluations cannot be targeted, and viewer
or revoked grants cannot save. Errors stay localized and visible; successful
updates preserve history selection and comparisons. The authenticated employee
API applies the same default-hidden peer/default-visible manager comment rules
server-side, excludes private reviewer drafts and never returns tokens/account IDs.
Member and
workspace boundaries, foreign/missing members and revoked access are enforced
server-side. Shared language selection/footer and hash-free refresh/navigation
remain available; no legacy Supabase client is initialized by this route.

Owners/editors reuse the existing `useEvaluationEditor`, assessment competency
form, version panel and comment-sharing panel through a typed API store adapter.
Member profile fields remain read-only here and are edited on the profile page.
Changes autosave after the existing 500ms delay into one manager draft, updating
it in place; changing published content creates a new version rather than
mutating history. Publishing changes that draft's status without replacing its
ID/date/content. New drafts inherit the latest manager comment-visibility map
server-side, not from caller-supplied identity/status/visibility fields.
The existing peer publish/return-to-draft controls change status independently
of comment sharing. Managers cannot edit peer/self content or change self status.
Draft conflicts return 409; viewer, foreign and revoked writes are denied.
Workspace owners reuse the existing version-panel delete confirmation to remove
manager, peer and published self evaluations. Editors/viewers cannot delete, and
private self drafts stay absent from both history and deletion. Failed deletes
remain visible; autosave is flushed before deletion to avoid stale draft writes.
Legacy anonymous routes remain disabled.

## Historical legacy application

## Requirements

- Node.js 26 LTS with npm 11.20.0 (`nvm install && nvm use`)
- A Supabase project
- Docker Desktop only when running Supabase locally

## Application setup

The shared UI library is installed from GitHub Packages as
`@jordiorriols/ui`. Export a token with `read:packages` scope before installing;
`.npmrc` reads it from `GITHUB_TOKEN`:

UI `^0.3.33` includes Agents in the shared project switcher and supplies the shared blue Ladders branding for header, project-menu
and login/welcome icons. `projectId` and `ProjectIcon` reuse the UI registry,
including employee evaluation pages, without a local palette.

Accounts with no accessible workspace see UI's shared `WorkspaceSetup`: create
one explicitly or wait for an invitation, checked automatically. The workspace
menu lets owners delete only empty workspaces, after confirmation. Backend
`delete_workspace` checks content across all five apps and discards empty
teams/projects; failures remain visible. The backend lifecycle migration must
be deployed before enabling these controls.

Planning-role and grouped seniority-template dropdowns use UI's shared
`SelectField` listbox instead of browser-native select popups. Workspace sharing
uses the same component, with consistent keyboard and mobile behavior.
Assessment profile, planning-role and SMART-goal fields reuse UI's `FormField`
and `Textarea` from the registry package. Labels and hints remain translated;
read-only states, autosaving, progress controls and goal comments stay app-owned.
The localized error-boundary adapter delegates catching and diagnostics to UI,
keeping generic employee-safe fallback messages rather than exposing raw errors.

Manager and signed-in employee pages use the same `AppShell`, shared account
controls and footer; their permissions and actions remain different. Home views
use `?view=team`, and evaluation/goals navigation uses `?tab=goals`, so refresh
and browser Back preserve selection. Anonymous self, peer and view links use
`PublicAppShell` without account controls or a project menu, retaining language
selection on mobile and the existing token access/privacy rules.
Account controls use UI's `AppAccountControls`. The welcome login adapter retains
UI's `useLoginForm` and `LoginDialog` primitives so visible success confirmations
can retranslate when the language changes; UI 0.3.31's `AuthDialog` stores these
messages as already-translated strings.

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
The specialized manager header supplies the shared header's language
configuration, using the same localized adapter as employee/public selectors.
Login dialog ownership, auth errors and evaluation layouts stay in Ladders.

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
is applied to the shared Supabase project and kept in the
[backend](https://github.com/JordiOrriols/backend) repository. No historical comment text is rewritten.

Set these values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The publishable key is safe to use in the browser. Database access is protected by the Row Level Security policies in the migrations. Never put the service-role key in this application.

### CI and deployment

Build and deployment run in separate jobs. Builds have only read permissions;
`UI_READ_TOKEN` is available only to dependency installation. Only the deployment
job receives Pages/OIDC permissions, on `main` or `master` and subject to the
`github-pages` environment's branch policy. Checkout credentials are not persisted.
Actions are pinned to commit SHAs and receive weekly Dependabot update PRs.

Pushes to `main` or `master` and manual dispatch run the same compile, lint,
format, coverage, build and GitHub Pages deployment checks as Planner, using
Node.js 26 selected from `.nvmrc`. `npm ci` installs `@jordiorriols/ui` from GitHub Packages with
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

This requires the additive shared-vacations migration (in the backend repository)
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

## Database

The Supabase project is shared with Agents, Planner, Pulse and Shiplog. Its
migrations, configuration, email templates and database tests live in the
[backend](https://github.com/JordiOrriols/backend) repository, which documents
how to add a migration, back up, and apply it to the hosted project. Ladders has
no schema of its own to apply. Never put access tokens or database passwords in
`.env` or a commit.

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

To run the complete stack locally, start it from the backend repository:

```bash
cd ../backend
npm run db:start
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
