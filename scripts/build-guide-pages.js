#!/usr/bin/env node

// Generate the newer feature guide pages so they match the live docs layout
// exactly (docs-header, docs-layout, .sidebar-section sidebar, docs-main with
// breadcrumb/hero/sections/prev-next, and the "On this page" docs-rail), and
// keep every guide page's sidebar in sync.
//
// This exists because the upstream generator in binhonglee/git_isl
// (scripts/docs/render-page.mjs) predates the site's "docs-layout" redesign and
// emits the older flat structure. Until that generator is realigned, this
// script is the source of truth for the pages it lists in PAGES and for the
// shared sidebar block. It is idempotent: re-running rewrites the same output.
//
//   node scripts/build-guide-pages.js
//
// Media (static/*.png, static/*.mp4) is captured separately by the git_isl
// headless docs pipeline and committed under static/.

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsDir = path.join(repoRoot, "docs");

// ---------------------------------------------------------------------------
// Shared sidebar (matches the live .docs-sidebar structure). Adding a guide
// here updates every page's sidebar in one pass.
// ---------------------------------------------------------------------------
const SIDEBAR = [
  { title: "Getting started", items: [["index.html", "Overview"]] },
  { title: "Remotes & sync", items: [["fetch.html", "Fetch"], ["pull.html", "Pull"], ["push.html", "Push"]] },
  {
    title: "History & branches",
    items: [
      ["commit-graph.html", "Visual Commit Graph"],
      ["branches-and-tags.html", "Branches & Tags"],
      ["drag-and-drop-rebase.html", "Drag-and-drop Rebase"],
      ["worktrees.html", "Linked Worktrees"],
      ["reflog.html", "Reflog"],
    ],
  },
  {
    title: "Stacked workflow",
    items: [
      ["stack.html", "Branch vs Stack mode"],
      ["stacked-prs.html", "Stacked PRs"],
      ["stack_reviewer.html", "Stack Reviewer"],
    ],
  },
  {
    title: "Changes & files",
    items: [
      ["uncommitted-changes.html", "Commit Management"],
      ["stash.html", "Stash"],
      ["file-explorer.html", "File Explorer"],
      ["folder-mode.html", "Folder Mode"],
      ["conflict-resolution.html", "Conflict Resolution"],
    ],
  },
  {
    title: "Customization & AI",
    items: [
      ["appearance.html", "Appearance"],
      ["ai-assistance.html", "AI Assistance"],
      ["entire.html", "Entire (Agent Sessions)"],
    ],
  },
];

const esc = s =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const stripTags = s => String(s).replace(/<[^>]+>/g, "");

function renderSidebar(activeHref) {
  const sections = SIDEBAR.map(group => {
    const links = group.items
      .map(([href, label]) => {
        const active = href === activeHref ? ' class="active"' : "";
        return `          <a href="${href}"${active}>${esc(label)}</a>`;
      })
      .join("\n");
    return [
      '      <div class="sidebar-section">',
      `        <div class="sidebar-title">${esc(group.title)}</div>`,
      "        <nav>",
      links,
      "        </nav>",
      "      </div>",
    ].join("\n");
  }).join("\n");
  return ['    <aside class="docs-sidebar">', sections, "    </aside>"].join("\n");
}

const SIDEBAR_RE = /    <aside class="docs-sidebar">[\s\S]*?<\/aside>/;

// ---------------------------------------------------------------------------
// Page chrome shared by every generated guide.
// ---------------------------------------------------------------------------
const LOGO_SVG = `<svg class="logo-svg" width="22" height="22" viewBox="0 0 64 64" fill="none">
    <g transform="rotate(15 32 32)">
      <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#14171f" stroke-width="1.5"/>
      <polygon points="32,4 29,9 35,9" fill="#14171f" stroke="#14171f"/>
      <circle cx="32" cy="16" r="4" fill="#ffffff" stroke="#14171f" stroke-width="2.5"/>
      <polygon points="32,59 29,54 35,59" fill="none" stroke="#14171f" stroke-width="1.5"/>
      <circle cx="47" cy="19" r="3" fill="#ffffff" stroke="#14171f" stroke-width="2"/>
      <circle cx="32" cy="47" r="4" fill="#ffffff" stroke="#14171f" stroke-width="2.5"/>
      <line x1="32" y1="19" x2="32" y2="44" stroke="#14171f" stroke-width="2.5"/>
      <path d="M 47,23 L 47,28 Q 47,33 42,33 L 32,33" stroke="#14171f" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path fill="#14171f" d="M 12.6,26.6 23.25,29.75 20.1,32.25 23.875,36 22,37.875 18.25,34.125 15.75,37.25 z"/>
    </g>
  </svg>`;

const header = () => `  <header class="docs-header">
    <div class="container">
      <div class="left">
        <a href="../index.html" style="display:flex;align-items:center;gap:11px">
          ${LOGO_SVG}
          <span class="brand-text">Git Navigator</span>
        </a>
        <span class="docs-badge">Docs</span>
      </div>
      <div class="right">
        <a href="https://github.com/binhonglee/git_navigator" style="font-size:14.5px;font-weight:500;color:var(--muted)">GitHub</a>
        <a class="nav-cta" href="../download.html" style="font-size:14px;padding:8px 16px;border-radius:8px">Download</a>
      </div>
    </div>
  </header>`;

const sidebarScript = () => `    <script>
      /* Restore docs sidebar scroll before first paint to avoid a flicker. */
      (function () {
        var sb = document.currentScript.previousElementSibling;
        if (!sb || !sb.classList.contains('docs-sidebar')) {
          sb = document.querySelector('.docs-sidebar');
        }
        if (!sb) return;
        var saved = sessionStorage.getItem('gn-docs-sidebar-scroll');
        if (saved !== null) sb.scrollTop = parseInt(saved, 10) || 0;
        var active = sb.querySelector('a.active');
        if (active) {
          var top = active.offsetTop;
          var visible = top >= sb.scrollTop && top <= sb.scrollTop + sb.clientHeight - active.offsetHeight;
          if (!visible) active.scrollIntoView({ block: 'center' });
        }
      })();
    </script>`;

// Pages live in docs/, so static assets sit one level up.
const rel = src => (src.startsWith("static/") ? `../${src}` : src);

const themedPicture = (src, alt, indent) => {
  const dark = rel(src.replace(/\.png$/, "-dark.png"));
  return `<picture>
${indent}  <source srcset="${esc(dark)}" media="(prefers-color-scheme: dark)" />
${indent}  <img src="${esc(rel(src))}" alt="${esc(alt)}" data-zoom />
${indent}</picture>`;
};

function headTags(p) {
  const url = `https://gitnav.xyz/docs/${p.slug}.html`;
  const og = p.ogImage ? `https://gitnav.xyz/${p.ogImage}` : "https://gitnav.xyz/static/base.jpg";
  const title = `${p.title} - Git Navigator`;
  const faq = p.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: p.faqs.map(f => ({
          "@type": "Question",
          name: stripTags(f.q),
          acceptedAnswer: { "@type": "Answer", text: stripTags(f.a) },
        })),
      }
    : null;
  const article = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: p.title,
    description: p.description,
    mainEntityOfPage: url,
    about: "Git Navigator",
    ...(p.ogImage ? { image: og } : {}),
  };
  const ld = [article, faq]
    .filter(Boolean)
    .map(b => `    <script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n    </script>`)
    .join("\n");
  return `<head>
  <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="../static/site.css" />
  <link rel="icon" href="../static/icon.png" type="image/png" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(p.description)}" />
    <meta name="keywords" content="${esc(p.keywords.join(", "))}" />
    <link rel="canonical" href="${url}" />

    <!-- OpenGraph -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Git Navigator" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(p.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${og}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(p.description)}" />
    <meta name="twitter:image" content="${og}" />

${ld}
</head>`;
}

function renderPage(p) {
  const sections = []; // for the on-this-page rail
  let sec = 0;
  const parts = [];

  // Hero media (image or video).
  if (p.heroMedia) {
    const inner =
      p.heroMedia.type === "video"
        ? `<video src="${esc(rel(p.heroMedia.src))}" autoplay muted loop playsinline data-zoom></video>`
        : themedPicture(p.heroMedia.src, p.heroMedia.alt, "              ");
    parts.push(`    <section>
      <div class="container">
          <figure>
            <div class="media-frame">
              ${inner}
            </div>
            <figcaption>${p.heroMedia.caption}</figcaption>
          </figure>
      </div>
    </section>`);
  }

  // Highlights.
  if (p.highlights?.length) {
    sec += 1;
    sections.push([`sec-${sec}`, p.highlightsTitle]);
    const cards = p.highlights
      .map(h => `          <div class="card">\n            <h3>${esc(h.title)}</h3>\n            <p>${h.body}</p>\n          </div>`)
      .join("\n");
    parts.push(`    <section>
      <div class="container">
        <h2 id="sec-${sec}" class="section-title">${esc(p.highlightsTitle)}</h2>
        <div class="grid">
${cards}
        </div>
      </div>
    </section>`);
  }

  // Walkthrough (single mode).
  if (p.walkthrough?.length) {
    sec += 1;
    sections.push([`sec-${sec}`, p.walkthroughTitle || "Walkthrough"]);
    const items = p.walkthrough
      .map((s, i) => {
        const n = i + 1;
        const idx = String(n).padStart(2, "0");
        const src = `static/${p.slug}-step-${idx}.png`;
        const alt = `Step ${n} — ${stripTags(s.caption).slice(0, 120)}`;
        return `          <li>
            <figure>
              <div class="media-frame">
                ${themedPicture(src, alt, "                ")}
              </div>
              <figcaption><strong>Step ${n}.</strong> ${s.caption}</figcaption>
            </figure>
          </li>`;
      })
      .join("\n");
    parts.push(`    <section>
      <div class="container">
        <h2 id="sec-${sec}" class="section-title">${esc(p.walkthroughTitle || "Walkthrough")}</h2>
        <ol class="walkthrough">
${items}
        </ol>
      </div>
    </section>`);
  }

  // Steps (tips list).
  if (p.steps?.items?.length) {
    sec += 1;
    sections.push([`sec-${sec}`, p.steps.title]);
    const items = p.steps.items
      .map(s => `            <li><strong>${esc(s.title)}.</strong> ${s.body}</li>`)
      .join("\n");
    parts.push(`    <section>
      <div class="container">
        <h2 id="sec-${sec}" class="section-title">${esc(p.steps.title)}</h2>
        <div class="card">
          <ol class="tips">
${items}
          </ol>
        </div>
      </div>
    </section>`);
  }

  // FAQ.
  if (p.faqs?.length) {
    sec += 1;
    sections.push([`sec-${sec}`, "Frequently asked questions"]);
    const cards = p.faqs
      .map(f => `          <div class="card">\n            <h3>${esc(f.q)}</h3>\n            <p>${f.a}</p>\n          </div>`)
      .join("\n");
    parts.push(`    <section>
      <div class="container">
        <h2 id="sec-${sec}" class="section-title">Frequently asked questions</h2>
        <div class="grid">
${cards}
        </div>
      </div>
    </section>`);
  }

  const prevNext = [];
  if (p.prev) prevNext.push(`        <a class="prev" href="${p.prev.href}">\n          <div class="dir">← Previous</div>\n          <div class="title">${esc(p.prev.label)}</div>\n        </a>`);
  if (p.next) prevNext.push(`        <a class="next" href="${p.next.href}">\n          <div class="dir">Next →</div>\n          <div class="title">${esc(p.next.label)}</div>\n        </a>`);
  const footerNav = prevNext.length ? `      <div class="docs-nav-footer">\n${prevNext.join("\n")}\n      </div>\n` : "";

  const railLinks = [`        <a href="#top" class="active">Overview</a>`]
    .concat(sections.map(([id, label]) => `        <a href="#${id}">${esc(label)}</a>`))
    .join("\n");

  return `<!doctype html>
<html lang="en">
${headTags(p)}
<body>

${header()}

  <button class="sidebar-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>
  <div class="sidebar-backdrop"></div>

  <div class="docs-layout">

${renderSidebar(`${p.slug}.html`)}
${sidebarScript()}

    <main class="docs-main">
      <div class="breadcrumb">${esc(p.breadcrumb)} <span class="sep">/</span> <span class="current">${esc(p.title)}</span></div>
      <header>
      <div class="container hero">
        <h1 id="top">${esc(p.hero.heading)}</h1>
        <p>${p.hero.lead}</p>
      </div>
    </header>
${parts.join("\n")}
${footerNav}    </main>

    <aside class="docs-rail">
      <div class="rail-title">On this page</div>
      <nav>
${railLinks}
      </nav>
    </aside>

  </div>

  <div class="overlay" id="media-overlay" aria-hidden="true">
    <div class="overlay-content">
      <button class="overlay-close" type="button" aria-label="Close media">×</button>
      <div class="overlay-body"></div>
    </div>
  </div>

  <script src="../static/site.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Content for the new guide pages.
// ---------------------------------------------------------------------------
const PAGES = require("./guide-content.js");

let wrote = 0;
for (const p of PAGES) {
  fs.writeFileSync(path.join(docsDir, `${p.slug}.html`), renderPage(p));
  console.log(`guide -> docs/${p.slug}.html`);
  wrote += 1;
}

// Sync the sidebar block on every existing guide page (and the hub).
const existing = fs
  .readdirSync(docsDir)
  .filter(f => f.endsWith(".html") && !PAGES.some(p => `${p.slug}.html` === f));
let synced = 0;
for (const f of existing) {
  const file = path.join(docsDir, f);
  const html = fs.readFileSync(file, "utf8");
  if (!SIDEBAR_RE.test(html)) continue;
  const active = f === "index.html" ? "index.html" : f;
  const next = html.replace(SIDEBAR_RE, renderSidebar(active));
  if (next !== html) {
    fs.writeFileSync(file, next);
    synced += 1;
    console.log(`sidebar -> docs/${f}`);
  }
}

console.log(`Wrote ${wrote} guide pages; synced sidebar on ${synced} existing pages.`);
