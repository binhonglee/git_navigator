# Changelog

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
