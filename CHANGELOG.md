# Changelog

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
