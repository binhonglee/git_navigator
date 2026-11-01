# Changelog

## [0.5.1] - 2026-10-31

### Desktop
- Record freeze diagnostics in a persistent log: main-thread stalls, webview stalls and slow message handlers, slow git operations, webview reloads, and mirrored warnings are written as NDJSON to `<config dir>/logs/diagnostics.log` (rotated, never containing file contents or credentials), with a new "Open logs folder" button in Settings → About for attaching it to a bug report
- Keep terminal sessions and view state across a webview reload: when macOS kills the page (WebKit memory pressure or a crash), the app reloads itself and reattaches to every running shell and agent pane, replaying its recent output instead of spawning a new shell over a live process; the attach-or-spawn decision is now atomic in the backend, so a slow or busy page can never kill a live pane
- Run a new worktree's post-create command in an in-app terminal pane inside the new worktree (the pane stays interactive after the command ends), falling back to the OS terminal only when the pane cannot start; the command runs once and is never re-run after a restart or a retry
- Browse and open gitignored directories in the Files explorer — collapsed ignored folders now expand, and their files open like any other file
- Add an "Include ignored files" toggle to Files search (on by default, persisted in app settings), so content and name searches cover gitignored paths too; both searches are bounded so a huge build-output directory cannot hang them
- Add "Search in this folder" to every folder row's context menu in the Files explorer: a removable chip scopes both the name filter and the content search to that folder, and it composes with the ignored-files toggle
- Keep the rest of the app usable while a git operation runs in the desktop shell: the loading overlay now covers only the Git activity, the activity rail and app bar stay clickable, and activity-switching shortcuts keep working
- Show the loading overlay while the saved repository restores at launch, instead of a frozen welcome state followed by a second overlay flash after the graph lands
- Hide links to the website in Microsoft Store builds to satisfy Store certification; direct-download, Mac App Store, and VS Code builds keep them

### Shared
- Show each branch's remote state as a badge in the Branches overlay — "pushed", "N to push", "N to pull", both counts when diverged, "not pushed", or "remote gone" — plus the branch's PR badge styled exactly like the graph's, and correct provider labels for self-hosted forges
- Recognize branches pushed without `-u` (for example by a CLI agent) as on their remote instead of "not pushed", add a "Set upstream to <ref>" action to the branch menus, and hide "Open on <provider>" when the upstream is gone; PR badges now match by the PR's head branch, so a fresh branch riding another branch's PR no longer inherits that PR's number
- Delete branches in the background: the Delete action hides the branch immediately and runs without a confirm dialog or loading overlay (git's safe delete still refuses unmerged branches), and a failed delete restores the branch and queues a failure dialog that offers force only when git refused a non-force delete; deleting a merged branch uses the same background path
- Make parsed git output immune to the user's git config: colors (`color.ui=always` and friends), diff prefixes, external-diff and textconv filters, path quoting, and `diff3`/`zdiff3` conflict styles can no longer corrupt what the app reads — this also stops raw ANSI escape codes from appearing in diffs

### Fixed
- Keep file diffs in step with stage and unstage: a staged file shows its staged diff (Staged and Unstaged sections apart when partly staged), "No changes" appears only when the file truly matches HEAD, each side reports its own errors, and an edit that keeps the same changed-line counts now refreshes the diff instead of showing the old text
- Switch to the main worktree in the same refresh when the active worktree is removed outside the app (`git worktree remove` in a terminal, `rm -rf`, or a prune), instead of freezing the graph on a deleted directory; an info toast names the removed worktree, and terminal panes of the removed worktree stay open
- Fix a stack overflow that crashed the app on linear histories of about 2,000 commits by walking commit ancestors iteratively
- Stop the branch range diff in the commit sidebar from re-requesting itself in a loop after each response
- Keep ref badges and their open menus stable across graph refreshes, and keep a deleted branch hidden until an update that no longer lists it lands (no flash back between the delete and the refresh)
- Fit the terminal grid to the real pane content box so the last row and column are no longer clipped at some window sizes, and remove a thin dark strip below the last row
- Show the real backend error on the agent recovery overlay ("Retry / Start fresh") as one muted, selectable detail line instead of only the generic copy
- Fix Files search follow-ups: a cleared content query no longer replays a late grep reply, the ignored-file index rebuilds after a tree invalidation, the name filter no longer shows phantom loading rows, folders under a collapsed ignored directory now render dimmed like their leaves, and simultaneous searches from two windows no longer cancel each other

### Performance
- Run every user-started git operation without a time limit — commits with slow pre-commit hooks, large checkouts, and LFS checkouts run to completion instead of being killed mid-write — while every background read keeps a bounded timeout, so a hung git process (fsmonitor handshake, credential prompt) can no longer stall the refresh poll or the UI
- Read a worktree's status in one git process instead of chaining rev-parse, config, and rev-list calls around every status read, and serve remote tag hashes from a TTL cache so graph updates never touch the network
- Drop filesystem events for gitignored paths (a build in `target/` or `node_modules/` no longer repaints the status every poll tick) and rate-limit background worktree status emits, so a burst of edits costs one status read
- Reload a worktree's Files tree only when its set of index and untracked entries actually moves, so a stream of agent edits to tracked files no longer re-walks the repository on every status push
- Mount the Branches and Tags overlay only while it is open and apply pending branch-deletion hides per row instead of rebuilding the graph, keeping branch deletes fast on large repositories

## [0.5.0] - 2026-10-12
### Desktop
- Add an embedded, worktree-aware terminal activity backed by real PTY shells, with terminal tabs, split panes, and per-worktree tab sets that stay live in the background and hand off cleanly between worktrees
- Persist the terminal layout across restarts — worktree sets, tabs, and the split-pane tree are restored on relaunch, and agent sessions resume their full transcript at zero token cost
- Launch and resume AI agent sessions directly from the new-tab picker, covering Claude, Codex, opencode, cursor-agent, and kiro-cli, with live session capture and per-session leases so multiple sessions can share one worktree
- Add keyboard shortcuts for terminal tabs, worktrees, splits, and tab close, plus a keyboard-only new-tab picker that lists only the agent CLIs found on your PATH
- Copy and paste in the terminal with Ctrl+Shift+C/V on Windows and Linux while keeping plain Ctrl+C as an interrupt; macOS uses the native Cmd-based Edit menu
- Report per-pane working/idle activity in the tab strip and worktree strip so you can see at a glance which shells are busy
- Keep terminal output responsive under a flood via backpressure, and restyle terminal panes live when the color scheme or fonts change
- Support macOS screenshots and screen recordings of the desktop app for capture tooling
- Restore the last 200 lines of each shell pane's scrollback after a restart, above a dated divider; agent panes are never stored, and the Terminal setting "Restore shell scrollback on restart" (on by default) turns it off and deletes the stored history
- Pin each opencode tab to its own session, so restoring several opencode tabs in one worktree no longer collapses them all onto the directory's latest session
- Show real titles in the Codex resume picker instead of bare session ids, and hide the app's own commit-message and split-commit Codex runs from the picker and from session restore
- Ask before closing a tab that runs a live agent session, and confirm or cancel the close dialog with y and n
- Close the new-tab menu and tab context menus with Escape without sending an Escape key to the shell
- Keep the active terminal tab and worktree tab fully in view, and scroll the tab strips sideways with the mouse wheel
- Open OSC 8 hyperlinks from terminal output in the browser (http and https links only)
- Restyle the terminal and worktree tab strips as square tabs with worktree and terminal icons
- Refresh the graph within a second when branches, tags, remote-tracking refs, or stashes change outside the app (for example a `git fetch` or `git branch -f` in another terminal), and check for staleness when you return to the Git activity or the window

### Shared
- Make Settings searchable in both the Tauri app and the VS Code extension, and add a read-only keyboard-shortcuts reference card
- Search the active tab with Cmd/Ctrl+K
- Add a "copy branch name" action and activity-switching shortcuts, and converge the tab search bars and surfaces on shared design-system primitives
- Show the loading overlay for every action that changes the repository, starting at the click instead of when the backend answers; quick actions such as staging files, resolving conflicts, and Files writes show it only if they take longer than 300 ms, and overlapping runs no longer clear each other's overlay
- Open a submodule in an overlay with its own status, files, diff, and stage/commit flow (or in a new window) instead of switching the whole app into it, and list only the initialized submodules of the active worktree

### Fixed
- Keep header dropdowns above the graph content so they are no longer clipped by commit rows
- Remove clean worktrees that contain initialized submodules; Git Navigator verifies that the worktree and every nested submodule are clean before it forces the removal
- Show the loading overlay above an open confirm dialog, so actions such as deleting a branch no longer look frozen while Git runs
- Stop a click on a dialog button from opening a hover menu (such as a ref-badge menu) that re-renders under the pointer
- Write the desktop app's `settings.json` atomically, so two running instances can no longer leave a torn settings file

## [0.4.0] - 2026-08-06
### Performance
- Make commit-graph rebuilds roughly 42× faster on a 1,500-commit, 40-branch history by batching branch-ancestry computation instead of rebuilding and walking the commit map for every branch pair
- Avoid full graph-model rebuilds when staging or unstaging files, receiving PR/CI metadata during scrolling, or processing duplicate refresh payloads; metadata now updates only the affected commit badges
- Scale repositories with many branches by replacing the remaining pairwise branch-matrix work with an inverted ancestry walk and memoizing Tauri upstream-relatedness checks instead of spawning `git merge-base` for every branch on every refresh
- Suppress the duplicate filesystem-watcher refresh that followed VS Code extension operations, avoiding a second round of Git subprocesses and graph recomputation

### Shared
- Open directories that are not yet Git repositories in folder mode, with Git-backed surfaces offering to initialize the repository while the desktop Files activity continues to support ignored files, search, external-change refreshes, and relaunch restoration
- Model stacked-PR layers as branches that can contain multiple commits, so pushing a branch or stack no longer requires one branch per commit and respects each branch's configured remote
- Diff a commit against any branch it is stacked on, widening the commit and file range one dependency layer at a time instead of jumping directly to the default branch
- Pull the current branch onto any strict-ancestor branch it is stacked on; dependencies with upstreams are fetched and fast-forwarded first, and stack mode carries descendant branches along with the rebase

### Desktop
- Highlight all 143 CodeMirror editor grammars and all 192 highlight.js diff and Markdown languages on demand, including whole-filename formats such as `Dockerfile` and `CMakeLists.txt`, without requiring network access
- Filter Entire sessions by the branches that contain their checkpoint commits, including merge targets and squash merges, with branch counts, merge-path indicators, and linked branch chips
- Discover developer CLIs from GUI-launched builds by augmenting the inherited `PATH` with the user's login-shell path and well-known install directories, so tools such as Entire, Claude, Codex, and user-installed Git remain available outside a terminal launch
- Fix stack-mode drag-and-drop rebase so dropping a commit onto an ancestor reparents the dragged commit instead of silently performing a no-op
- Cherry-pick commits onto the selected target branch rather than the currently checked-out branch, applying multi-commit selections parent-first and returning to the original branch after success

### Fixed
- Stop the main worktree's uncommitted changes panel from showing the active worktree's changes by carrying the exact status-owning worktree path through both backends and the shared webview
- Keep an in-progress rebase or cherry-pick preview open when asynchronously loaded PR or CI metadata arrives
- Detect all seven Git unmerged states before continuing a rebase or cherry-pick, including modify/delete and add-variant conflicts
- Reconstruct brace-compressed rename paths from `git stash show --numstat`, preserving the renamed file's status and old/new paths
- Keep header dropdowns correctly positioned and ref-badge actions hover-only after the design-system migration, including correct inside-click handling for SVG icon targets

## [0.3.9] - 2026-07-20
### Desktop
- Fix the "Open" button in the uncommitted changes panel doing nothing on the desktop app: it now reveals the file in the in-app file explorer (Files activity), matching the ⌘/Ctrl-click on the file row, instead of a no-op
- Open a newly created file directly in edit mode: creating a file from the explorer now reveals, selects, and opens it in the editor overlay so you can start typing right away
- Add right-click Rename for files and folders in the file explorer: an inline input replaces the row's name (pre-selecting the basename stem for files), and a new backend `renameRepoEntry` moves the entry — creating any missing destination folders, refusing to clobber an existing path, tolerating case-only renames, and following the moved entry with the selection
- Add inline video playback to the Files explorer with an OS-player fallback for unsupported formats
- Preview and extract selected ZIP files in the Files explorer
- Render app update notes as Markdown in the update notification
- Add an Entire integration: agent-session viewer, graph checkpoint overlay, cross-links, expandable tool-call rows in the conversation timeline, and full-text transcript search

### Fixed
- Prioritize the branch's own worktree when fast-forwarding a local tracking branch
- Fix reactivity regressions from the SolidJS migration (stale renders, missing updates)
- Unify overlay close controls for consistent dismiss behavior
- Unify file toggle chevrons across tree views

## [0.3.8] - 2026-07-14
### Desktop
- Add right-click New file, New folder, and Edit actions to the file explorer context menu, with an inline create/rename input that shows the matching file/folder icon; a new backend `createRepoEntry` creates files (with any missing parent dirs) or directories, refuses to clobber existing paths, and reveals/selects new files on creation
- Add right-click delete for files and folders in the file explorer
- Finish image rendering support in the file explorer
- Refresh some UI icons
- Let an open overlay consume the Escape key before the sidebar closes, so pressing Escape closes only the overlay when both an overlay and the sidebar are open

## Extension
- Fix `git rebase --continue` in the VS Code extension throwing before it ran when the host environment defines sensitive git env vars (e.g. VS Code's `GIT_ASKPASS`), by opting into simple-git's ambient-environment passthrough for the vars git already inherits

### Fixed
- Fix overly aggressive underscore-italic matching in Markdown rendering

### Internal
- Migrate the entire webview UI to SolidJS — reactive state and pure reducer, fine-grained rendering, and co-located CSS modules across the commit graph, sidebar, uncommitted panel, overlays, confirm dialogs, push bar, and Tauri shell chrome — retiring the previous imperative DOM/`events.ts` layer

## [0.3.7] - 2026-06-27
### Desktop
- Overhaul appearance: swappable color schemes (a default warm "navigator" palette and a GitHub Primer scheme) plus additional popular schemes, selectable independently from light/dark mode
- Add user-configurable application and monospace fonts
- Show only the relevant color-scheme selector for the current appearance and sort schemes alphabetically
- Add third-party license disclosures in settings, including the full license text for bundled themes
- Auto-fill `user.signingKey` from available SSH keys (preferring ed25519 > ecdsa > rsa) when enabling commit signing, and refuse to enable with an inline hint when no SSH key exists, instead of persisting a broken signing config
- Add a shared worktree dropdown to the graph header and the stash/reflog overlay
- Hide the title bar in macOS fullscreen
- Drop the redundant settings title in the desktop shell

### Shared
- Add a commit search overlay with a two-step history search
- Replace the fetch action's "Fetch only" mode with "Fetch + Track": fetching a named remote branch creates or fast-forwards the matching local branch without checking it out, and stops with a force-update prompt when the local branch has diverged
- Add a branch range diff view in the commit sidebar
- Always offer a delete option for local branches in the graph dropdown (except the default branch and non-main worktree branches); merged branches keep instant safe-delete while unmerged branches route through a confirmation dialog with a force fallback

### Fixed
- Scale repos with many linked worktrees (~50): load only the active worktree's reflog on refresh, resolve linked git dirs without subprocesses, reconcile non-active worktrees in batches, and cap per-worktree file watchers
- Show an open-repository failure dialog and prevent the desktop app from freezing on a bad open (non-Git folder or failed load)
- Fix a load freeze caused by large uncommitted changes (e.g. a multi-hundred-MB dirty tree) by bounding untracked-file stat work
- Refresh the Files explorer tree on git-status changes and reload content on a stale-hash save, fixing stale file lists and edit sessions
- Stop the primary worktree from corrupting other worktrees' uncommitted panels in the desktop app
- Make new desktop windows respect custom navbar settings
- Normalize fetch ref input for origin-prefixed refs so `origin/main` is no longer double-prefixed during fetch, rebase, and checkout
- Use a thread-safe Core Text API for macOS font enumeration
- Fix a spurious "branch not found" error after deleting a branch from the graph overlay, caused by stacked duplicate click handlers
- Point the desktop "Install GitHub App" button at the correct app slug (`vscode-git-navigator`). It previously opened `github.com/apps/git-navigator`, an unrelated third-party app that happens to share the name, so the legitimate app was never installed.

### Security
- If you previously used the desktop "Install GitHub App" button and authorized an app, review your installed GitHub Apps at https://github.com/settings/installations and remove any "Git Navigator" app that is **not** `vscode-git-navigator`. The old link could lead to an unrelated app; this does not indicate your GitHub account was compromised.

## [0.3.6] - 2026-06-16
### Desktop
- Add a rendered Preview view to the Files explorer for Markdown and HTML files, defaulting documents to Preview
- Render HTML previews in a sandboxed iframe with scripts disabled by default and an opt-in, isolated "Enable scripts" toggle
- Resolve repo-relative assets in the preview: Markdown images and HTML stylesheets/images/scripts are inlined as data URIs from the worktree
- Turn the Files explorer branch label into a real worktree selector that drives the tree and stays in sync with the backend's active worktree
- Add an "Open in terminal" action to worktree rows
- Prompt to restart after an app update finishes installing, with a "Restart now" action in the settings panel and app bar, and short-circuit further update checks while a restart is pending
- Sign the bundled `git` Mach-O binaries during macOS bundling so Developer ID builds pass Gatekeeper
- Add a Mac App Store build pipeline (entitlements, Info.plist, provisioning profile, Tauri overrides, `tauri:build-appstore:mac` script) gated behind the `mac-app-store` Cargo feature, which omits the in-app auto-updater
- Add a Microsoft Store MSIX build pipeline behind a `store-distribution` Cargo feature; both store flavors share a `store-managed-updates` path that hides the in-app updater and shows a store-managed message in its place
- Add a Linux Tauri bundle configuration

### Shared
- Render images, GFM tables, and task lists in Markdown (commit bodies and the file Preview), with syntax-highlighted fenced code blocks in the desktop app
- Show a push/sync indicator on local branch badges in the graph (ahead/behind counts, an in-sync check, or an "unpublished" glyph) so a branch sharing a commit with its remote still reveals whether it has been pushed
- Cmd/Ctrl-click a commit's file row to open the file in the Files explorer instead of the diff view

### Fixed
- Make file-content search results clickable and jump to the matched line in the desktop app
- Sync the local default branch after a pull-rebase onto origin in the desktop app
- Eliminate git-status "lock shock" and stale background-worktree UI when concurrent git operations briefly hold the index lock
- Allow `GIT_EDITOR` to flow through to `continueRebase` in the VS Code extension so rebase continuations no longer break the editor environment
- Make the desktop discard action delete staged/new files instead of returning an error

## [0.3.5] - 2026-06-04
### Desktop
- Add a Files explorer activity with worktree groups, file status badges, and file, diff, conflict, and blame views
- Add file search with automatic folder expansion for matching paths and git-grep content search
- Add CodeMirror-powered file viewing and editing with optimistic concurrency checks
- Replace inline file editing with a focused modal edit overlay
- Reveal files in the Files activity with Cmd/Ctrl-click from uncommitted changes
- Add multi-window support for working across multiple repositories
- Add an empty-state clone flow for opening a repository from a fresh desktop window
- Surface backend command failures through in-app toasts and show loading overlays during long-running Git operations

### Shared
- Add Git identity settings for viewing and editing `user.name`, `user.email`, and `remote.origin.url`
- Add SSH key management in Settings
- Add in-app SSH commit signing setup for both the desktop app and editor extension
- Render commit bodies as Markdown in the info sidebar
- Show force-delete confirmation when branch deletion fails
- Set upstream automatically when pushing a branch without tracking
- Forward file explorer responses correctly for secondary worktrees

### Fixed
- Make rebase and cherry-pick continue work in the desktop app
- Repair desktop commit split and stacked-branch rebase flows
- Make drag-and-drop rebase work more reliably with a wider drop zone
- Cascade stack-mode amend onto descendant branches in the desktop app
- Silence background forge metadata refresh failures in the desktop app
- Fix file explorer scroll, resize, submodule, syntax highlighting, and preview handling issues

## [0.3.4] - 2026-04-29
### Added
- Tag management UI with remote state tracking
- Open on Remote action for local branches
- Fast-forward local main to origin/main after fetchAndRebase

### Fixed
- Show push failure dialog for `commitAndPush`
- Follow git semantics for branch safety check
- Mark worktree branches with identical tips as safe to delete
- Show push bar for new branches even when commits exist on remote
- Use origin/main as stack base when ahead of local main

## [0.3.3] - 2026-04-15
### Shared
- Make stash and reflog rows fully clickable in the history overlays
- Keep branch and tag dropdown menus accessible when commit details are expanded

### Desktop
- Bundle Git with app builds and switch the desktop app to use the bundled Git backend instead of libgit2
- Add a repository picker button in the app bar title area
- Split bundled Git config into per-platform files for macOS and Windows releases

### Extension
- Prevent structured slogx logging from starting in production builds

### Fixed
- Skip duplicate desktop poll refreshes after command-triggered refreshes

## [0.3.2] - 2026-04-08
### Extension
- Restore bundled webview assets in published VS Code packages

## [0.3.1] - 2026-04-08
### Shared
- Split the shared webview/runtime so the VS Code extension and desktop app can ship side by side
- Normalize filesystem and worktree path handling more reliably across hosts

### Desktop
- Initial release of Git Navigator Desktop for macOS and Windows

### Extension
- Expandable stash entries with per-file diff viewing in the stash overlay
- Expandable reflog entries with commit metadata and diff viewing
- Worktree-scoped history view in the stash overlay
- Forge auth cards and GitHub device flow status in Settings
- Better worktree status refresh behavior and path matching in VS Code

### Fixed
- Overlay scrolling and keyboard handling in the shared webview shell
- Split-commit routing and worktree panel scrolling in shared overlay layouts
- Release cleanup and test hardening around the shared webview/runtime split

## [0.3.0] - 2026-03-18
### Added
- AI commit message generation UI and settings
- AI-powered split commit planning
- VS Code language model integration for commit message workflows

### Changed
- Batched git commit fetching for faster commit parsing
- Smarter hunk-level patch truncation with file prioritization for AI workflows
- Split commit overlay status placement polish
- Codex integration now uses JSONL output without temporary file handling

### Fixed
- Correct line number offsets in remaining patches
- Show files correctly for initial commits
- Dedupe partial files when calculating uncommitted graph height
- Refresh stash overlay after updates
- Close stash overlay after pop
- Restore stash overlay actions after reopen

## [0.2.2] - 2026-02-28
### Added
- Favorite branches support with persistence and active-branch computation
- Favorite toggle controls in refs overlay and graph badges (star icon + menu action)
- Pull action dropdown with multiple pull modes
- Sidebar update-message editing flow with rewrite engine
- Support for initial commits in empty repositories
- New stash-history and worktrees overlays in the header menu
- Performance settings for `maxActiveBranches` and `maxTags`, plus a Settings shortcut in overflow

### Changed
- Reworked header actions into a compact overflow-first layout with combined overlays
- Split refs menu into Branches, Tags, and Worktrees entries
- Switched webview branch resolution to worktree-based lookup and removed `currentBranch` state plumbing
- Optimized branch/tag fetching for large repositories

### Fixed
- Simplified pull UI behavior when on the default branch
- Improved git repository detection for nested workspace folders

## [0.2.1] - 2026-02-13
### Added
- Worktree defaults settings management
- Support for ignored-path defaults and optional symlink setup in worktree creation
- Worktree dialog options for ignored entries and command-based flows
- Worktree label menu with workspace-aware actions

### Changed
- Refined ignored-entry list styling in the worktree dialog
- Updated test mocks to match navigator lifecycle behavior

### Fixed
- Prevent duplicate navigator auto-open across multiple windows

## [0.2.0] - 2026-02-10
### Added
- End-to-end linked worktree support across Git service, panel actions, and webview state
- Worktrees section in refs overlay with create and delete actions
- Worktree creation dialog with defaults and branch requirement checks
- Active worktree indicator in header and commit rows, with worktree heads shown in the graph
- Conflict actions in worktree panels, including mark-resolved handling for conflicted worktrees

### Changed
- Made checkout targeting, refs overlay behavior, and branch operations worktree-aware
- Scoped stash handling, squash routing, commit diff file views, and conflict UI to the active worktree
- Added confirmation flow for deleting linked worktrees from the UI
- Moved worktree dialog rendering to a static template skeleton
- Unified commit target display and picker flow across worktree actions
- Expanded worktree test coverage and stabilized integration test timeouts

### Fixed
- Blocked unsafe worktree actions on dirty/conflicted states and path-collision scenarios
- Scoped uncommitted stats and stash auto-drop checks to the correct worktree
- Revalidated branch safety before branch deletion from worktree panels
- Reduced redundant worktree status rerenders
- Silenced stale worktree refresh errors
- Stabilized worktree refresh state comparisons

## [0.1.1] - 2026-02-04
### Added
- Open remote branch links directly from badges
- Allow local-only rewrites on the default branch
- Mark resolved action in conflict UI
- Stack push now shows a Done state

### Fixed
- Skip metadata fetch for local-only HEAD
- Exclude patch selection base from stage/unstage picks
- Indeterminate checkbox background styling
- Rename handling in commit files list and uncommitted changes
- Unstage both sides of renames
- Suppress push dialog when up-to-date and show push bar for diverged branches
- Surface push failures in the dialog
- Enter now creates and checks out a branch
- Include all stages for partial files

## [0.1.0] - 2026-01-23
### Added
- Stack mode with stack-aware rebase/amend and stack/base labels
- Branch mode with branch-only rebase/amend and detached HEAD banner
- Stack push overlay for stacked workflows
- New hover actions for checkout, fast-forward, and delete merged branches
- Cherry-pick commits in branch mode
- Gitea metadata support

### Changed
- Refine changes overlay polish (hunk breakdown, hover highlights, spacing)

## [0.0.4] - 2026-01-13
### Added
- GitHub App device login for optional metadata sign-in
- GitLab merge request and pipeline metadata support (PAT-based)
- Bitbucket Cloud pull request and pipeline metadata support (API token)

### Changed
- Improved Git lock handling overlay
- Switched to remote-safe file access
- Show commits directly when the graph contains a single commit

### Fixed
- Detached HEAD display and uncommit handling
- Checkout now prefers local branches over tags, with tag checkout fixes
- Commit ordering when history is ahead of the default branch tip
- Commit view now handles deleted files correctly

## [0.0.3] - 2026-01-09
### Added
- Character-level diff highlights
- Clickable placeholders in the commit graph
- New icon
- Simple sidebar

### Changed
- Consolidated diff view with context lines

## [0.0.2] - 2026-01-07
### Added
- Auto-open the extension on install
- Split commits on non-tip HEAD
- Conflict resolution graph overlay
- Stash drop conflict handling

### Changed
- Ignore extra files in `.vscodeignore` for smaller extension bundles
- Refine changes screen UI updates

### Fixed
- Line alignment when picking commit for ref
- Stale refine changes screen refresh
- Inaccurate filtering in tree graph
