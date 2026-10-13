#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { AltimeterConfig, AltimeterDestination, genRun } = require("@globetrotte/altimeter");

const repoRoot = path.resolve(__dirname, "..");
const pagesPath = path.join(__dirname, "og-pages.json");
const previewDir = path.join(repoRoot, "static", "og");
const siteUrl = process.env.SITE_URL || "https://gitnav.xyz";
const serverHost = process.env.PREVIEW_HOST || "127.0.0.1";
const serverPort = Number(process.env.PREVIEW_PORT || 4173);

const pages = JSON.parse(fs.readFileSync(pagesPath, "utf8"));

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const resolveFilePath = requestPath => {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const relativePath = normalized === "/" ? "index.html" : normalized.replace(/^\//, "");
  const filePath = path.join(repoRoot, relativePath);

  if (!filePath.startsWith(repoRoot)) {
    return null;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, "index.html");
    return fs.existsSync(indexPath) ? indexPath : null;
  }

  return fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : null;
};

const startStaticServer = () => new Promise((resolve, reject) => {
  const server = http.createServer((request, response) => {
    const filePath = resolveFilePath(request.url || "/");
    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(response);
  });

  server.on("error", reject);
  server.listen(serverPort, serverHost, () => {
    resolve(server);
  });
});

const stopStaticServer = server => new Promise(resolve => {
  server.close(() => resolve());
});

const buildAltimeterConfig = baseURL => {
  const config = new AltimeterConfig();
  config.baseURL = baseURL;
  config.dir = previewDir;
  config.width = 1200;
  config.height = 630;
  config.destURLs = pages.map(page => new AltimeterDestination(page.name, page.path));
  return config;
};

const previewUrlFor = name => `${siteUrl}/static/og/${name}.jpg`;

const upsertMetaTag = (html, attribute, content) => {
  const pattern = new RegExp(`<meta ${attribute} content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attribute} content="${content}" />`;

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  const anchor = attribute === 'property="og:image"'
    ? /<meta property="og:url" content="[^"]*"\s*\/?>/
    : /<meta name="twitter:card" content="[^"]*"\s*\/?>/;

  if (anchor.test(html)) {
    return html.replace(anchor, match => `${match}\n  ${tag}`);
  }

  throw new Error(`Could not find insertion point for ${attribute}`);
};

const updateHtmlPreviewTags = () => {
  let updated = 0;

  for (const page of pages) {
    const filePath = path.join(repoRoot, page.html);
    const previewUrl = previewUrlFor(page.name);
    const html = fs.readFileSync(filePath, "utf8");
    let nextHtml = upsertMetaTag(html, 'property="og:image"', previewUrl);

    if (/<meta name="twitter:image"/.test(nextHtml)) {
      nextHtml = upsertMetaTag(nextHtml, 'name="twitter:image"', previewUrl);
    } else if (/<meta name="twitter:card"/.test(nextHtml)) {
      nextHtml = upsertMetaTag(nextHtml, 'name="twitter:image"', previewUrl);
    }

    if (nextHtml !== html) {
      fs.writeFileSync(filePath, nextHtml);
      updated += 1;
      console.log(`Updated preview tags in ${page.html}`);
    }
  }

  return updated;
};

const maybeInstallPlaywright = async () => {
  try {
    const { chromium } = require("playwright-core");
    const browser = await chromium.launch();
    await browser.close();
  } catch {
    console.log("Installing Playwright Chromium for altimeter...");
    await new Promise((resolve, reject) => {
      const child = spawn("npx", ["playwright", "install", "chromium"], {
        cwd: repoRoot,
        stdio: "inherit",
        shell: true,
      });
      child.on("error", reject);
      child.on("close", code => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`playwright install exited with code ${code}`));
      });
    });
  }
};

const main = async () => {
  fs.mkdirSync(previewDir, { recursive: true });
  await maybeInstallPlaywright();

  const baseURL = `http://${serverHost}:${serverPort}`;
  const server = await startStaticServer();
  console.log(`Serving ${repoRoot} at ${baseURL}`);

  try {
    await genRun(buildAltimeterConfig(baseURL));
    const updated = updateHtmlPreviewTags();
    console.log(`Generated ${pages.length} preview images in static/og/ (${updated} HTML files updated).`);
  } finally {
    await stopStaticServer(server);
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
