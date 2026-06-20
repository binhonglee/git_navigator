#!/usr/bin/env node

// Single source of truth for the docs sidebar. The guides live under docs/,
// so every link here is relative to that folder: same-dir guides are bare
// filenames, "Overview" is the docs landing (docs/index.html), and links back
// out to the marketing site use ../. Edit `groups`, then run
// `node scripts/build-nav.js` to inject the identical sidebar into every docs
// page (between <!-- NAV_START --> / <!-- NAV_END --> markers; first run
// inserts after <body>, later runs replace in place). Root utility pages in
// `stripPages` get any stale sidebar removed.

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsDir = "docs";

const groups = [
  {
    title: "Getting started",
    items: [
      { href: "index.html", label: "Overview" },
      { href: "../desktop.html", label: "Desktop App" },
    ],
  },
  {
    title: "Remotes & sync",
    items: [
      { href: "fetch.html", label: "Fetch" },
      { href: "pull.html", label: "Pull" },
      { href: "push.html", label: "Push" },
    ],
  },
  {
    title: "History & branches",
    items: [
      { href: "commit-graph.html", label: "Visual Commit Graph" },
      { href: "branches-and-tags.html", label: "Branches & Tags" },
      { href: "drag-and-drop-rebase.html", label: "Drag-and-drop Rebase" },
      { href: "worktrees.html", label: "Linked Worktrees" },
      { href: "reflog.html", label: "Reflog" },
    ],
  },
  {
    title: "Stacked workflow",
    items: [
      { href: "stack.html", label: "Branch vs Stack mode" },
      { href: "stack_reviewer.html", label: "Stack Reviewer" },
    ],
  },
  {
    title: "Changes & files",
    items: [
      { href: "uncommitted-changes.html", label: "Commit Management" },
      { href: "stash.html", label: "Stash" },
      { href: "file-explorer.html", label: "File Explorer" },
      { href: "conflict-resolution.html", label: "Conflict Resolution" },
    ],
  },
];

// docs/ pages that receive the sidebar: every same-dir item (the landing plus
// the guides). Items pointing outside docs/ (../) are links only.
const injectPages = [
  ...new Set(
    groups
      .flatMap(group => group.items.map(item => item.href))
      .filter(href => !href.startsWith("../")),
  ),
];

// Root pages that must NOT carry the (docs-relative) sidebar; strip any block
// left over from a previous run.
const stripPages = ["post_install.html", "privacy.html"];

const escapeHtml = value => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

const renderSidebar = currentHref => {
  const groupsHtml = groups.map(group => {
    const items = group.items.map(item => {
      const current = item.href === currentHref ? ' aria-current="page"' : "";
      return `          <li><a href="${item.href}"${current}>${escapeHtml(item.label)}</a></li>`;
    }).join("\n");

    return [
      '      <div class="sidebar-group">',
      `        <p class="sidebar-group-title">${escapeHtml(group.title)}</p>`,
      '        <ul>',
      items,
      '        </ul>',
      '      </div>',
    ].join("\n");
  }).join("\n");

  return [
    '    <button class="sidebar-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>',
    '    <div class="sidebar-backdrop"></div>',
    '    <aside class="docs-sidebar" aria-label="Documentation navigation">',
    '      <a class="sidebar-head" href="index.html">Documentation</a>',
    groupsHtml,
    '    </aside>',
  ].join("\n");
};

const START = "<!-- NAV_START -->";
const END = "<!-- NAV_END -->";
const replaceRegex = new RegExp(`${START}[\\s\\S]*?${END}`);
const stripRegex = new RegExp(`\\n\\s*${START}[\\s\\S]*?${END}`);

let updated = 0;

for (const name of injectPages) {
  const filePath = path.join(repoRoot, docsDir, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Docs page not found: ${docsDir}/${name}`);
  }

  const html = fs.readFileSync(filePath, "utf8");
  const block = `${START}\n${renderSidebar(name)}\n    ${END}`;

  let nextHtml;
  if (replaceRegex.test(html)) {
    nextHtml = html.replace(replaceRegex, block);
  } else {
    const bodyRegex = /(<body[^>]*>)/;
    if (!bodyRegex.test(html)) {
      throw new Error(`No <body> tag found in ${docsDir}/${name}.`);
    }
    nextHtml = html.replace(bodyRegex, `$1\n    ${block}`);
  }

  if (nextHtml !== html) {
    fs.writeFileSync(filePath, nextHtml);
    updated += 1;
  }
  console.log(`nav -> ${docsDir}/${name}`);
}

for (const file of stripPages) {
  const filePath = path.join(repoRoot, file);
  if (!fs.existsSync(filePath)) continue;
  const html = fs.readFileSync(filePath, "utf8");
  if (stripRegex.test(html)) {
    fs.writeFileSync(filePath, html.replace(stripRegex, ""));
    updated += 1;
    console.log(`nav -> ${file} (removed)`);
  }
}

console.log(`Sidebar written to ${injectPages.length} docs pages (${updated} changed).`);
