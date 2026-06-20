#!/usr/bin/env node

// Conform root-authored guide pages to the docs/ layout. Run this when folding
// in a new guide from upstream (where pages are authored at the repo root):
// after `git mv`-ing it into docs/, this rewrites every path the move
// invalidated and normalizes the top nav. Safe to re-run over the whole tree —
// every rewrite and the nav normalization are idempotent.
//   - relative static/ asset refs on docs pages -> ../static/
//   - absolute https://gitnav.xyz/<guide>.html self-URLs -> /docs/<guide>.html
//   - links from docs pages to root pages (index/desktop/...) -> ../<page>
//   - links from root pages to the moved guides -> docs/<guide>
//   - normalizes the top nav: drops the legacy deep links and ensures a single
//     "Documentation" link to the docs hub

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const movedGuides = [
  "fetch", "pull", "push", "commit-graph", "branches-and-tags",
  "drag-and-drop-rebase", "worktrees", "stack", "stack_reviewer",
  "uncommitted-changes", "file-explorer", "conflict-resolution",
  "stash", "reflog",
].map(name => `${name}.html`);

const rootPages = ["index.html", "download.html", "desktop.html", "post_install.html", "privacy.html"];

const read = file => fs.readFileSync(path.join(repoRoot, file), "utf8");
const write = (file, html) => fs.writeFileSync(path.join(repoRoot, file), html);

// Absolute self-URLs for the moved guides become /docs/ URLs in a single pass.
// Applied to every page (root pages don't reference these absolutely, but it's
// a safe no-op).
const absoluteUrlRegex = new RegExp(
  `https://gitnav\\.xyz/(${movedGuides.map(g => g.replace(/\./g, "\\.")).join("|")})`,
  "g",
);
const rewriteAbsolute = html =>
  html.replace(absoluteUrlRegex, "https://gitnav.xyz/docs/$1");

// Regenerate the top nav's link set deterministically: two top-level peers,
// Documentation and Download. Replacing the whole .nav-links block drops the
// legacy deep links and any stale hrefs in one pass, so this is idempotent and
// order-independent. The sidebar (.docs-sidebar) and landing cards (.card) use
// different containers and are untouched.
const normalizeNav = (html, { docsHref, downloadHref }) => {
  const links = [
    `          <a href="${docsHref}">Documentation</a>`,
    `          <a href="${downloadHref}">Download</a>`,
  ].join("\n");
  return html.replace(
    /<div class="nav-links">[\s\S]*?<\/div>/,
    `<div class="nav-links">\n${links}\n        </div>`,
  );
};

const NAV_START = "<!-- NAV_START -->";
const NAV_END = "<!-- NAV_END -->";

// Apply `transform` to the page everywhere except the build-nav-owned sidebar
// region (between the NAV markers). build-nav.js regenerates that block from
// its groups data, so path rewrites must leave it untouched — otherwise the
// two scripts fight over the same markup and the result depends on run order.
const outsideNav = (html, transform) => {
  const start = html.indexOf(NAV_START);
  const end = html.indexOf(NAV_END);
  if (start === -1 || end === -1) return transform(html);
  const block = html.slice(start, end + NAV_END.length);
  return transform(html.slice(0, start)) + block + transform(html.slice(end + NAV_END.length));
};

// ---- docs pages: the 12 moved guides ----
for (const guide of movedGuides) {
  const file = `docs/${guide}`;
  const html = outsideNav(read(file), part => {
    // static/ assets sit one level up now.
    part = part.replace(/(href|src|srcset)="static\//g, '$1="../static/');
    // Links to pages that stayed at root.
    for (const rootPage of rootPages) {
      const esc = rootPage.replace(/\./g, "\\.");
      part = part.replace(new RegExp(`href="${esc}`, "g"), `href="../${rootPage}`);
    }
    return rewriteAbsolute(part);
  });

  // The top nav lives outside the markers; from inside docs/ both targets are
  // one level up (the hub is a sibling, download is at the root).
  write(file, normalizeNav(html, { docsHref: "index.html", downloadHref: "../download.html" }));
  console.log(`docs page  -> ${file}`);
}

// ---- root pages ----
for (const file of rootPages) {
  let html = read(file);

  // Links to the moved guides now live under docs/.
  for (const guide of movedGuides) {
    const esc = guide.replace(/\./g, "\\.");
    html = html.replace(new RegExp(`href="${esc}`, "g"), `href="docs/${guide}`);
  }

  html = rewriteAbsolute(html);
  html = normalizeNav(html, { docsHref: "docs/index.html", downloadHref: "download.html" });

  write(file, html);
  console.log(`root page  -> ${file}`);
}

console.log("Path migration complete.");
