# Changelog

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
