/* eslint-disable no-console */
/**
 * Build a fully-local E2E test page that uses YOUR local head.html.
 *
 * Why this exists
 * ---------------
 * `aem up` proxies the rendered page INCLUDING its <head>, so local edits to
 * head.html are NOT reflected when you browse a proxied route — only
 * scripts/aem.js/blocks/styles are served from disk. That makes it impossible
 * to validate head.html changes (e.g. moving a martech script out of the head)
 * through the normal dev server.
 *
 * This script takes the rendered page (real content + structure) and rebuilds
 * its <head> from your LOCAL head.html, preserving only the page-specific
 * metadata that scripts.js relies on (lang, title, meta, canonical/alternate,
 * JSON-LD). The result is written to a local .html file which `aem up` then
 * serves straight from disk (no proxy) — so the browser runs your local head,
 * your local scripts, and the real body content.
 *
 * Usage
 * -----
 *   1. Start the dev server against a content-bearing upstream:
 *        aem up --no-open --url https://main--fenix--aviancavsts.aem.page
 *      (the default upstream may be empty/404 — pick one where the path is 200)
 *   2. Generate the page:
 *        node tools/local-e2e-page.mjs /pt
 *   3. Open http://localhost:3000/e2e-pt.html  (append query flags as needed,
 *      e.g. ?chat=on). The page runs entirely on your local head + scripts.
 *   4. Delete the generated file when done (it is a throwaway test artifact).
 *
 * Env: LOCAL_BASE overrides the dev-server origin (default http://localhost:3000).
 */
import { readFileSync, writeFileSync } from 'node:fs';
// happy-dom is a devDependency; this is a dev-only tooling script, never shipped.
// eslint-disable-next-line import/no-extraneous-dependencies
import { Window } from 'happy-dom';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node tools/local-e2e-page.mjs <path> [outFile]');
  process.exit(1);
}

const base = process.env.LOCAL_BASE || 'http://localhost:3000';
const outFile = process.argv[3]
  || `e2e-${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'index'}.html`;

const res = await fetch(`${base}${path}`);
if (!res.ok) {
  console.error(`Failed to fetch ${base}${path}: ${res.status}. Is the dev server up and the path 200?`);
  process.exit(1);
}
const rendered = await res.text();
const localHead = readFileSync(new URL('../head.html', import.meta.url), 'utf8');

// Pass a base url so relative resource hints (e.g. /countrieslist.json
// preloads) in the markup resolve instead of throwing "Invalid URL".
const win = new Window({ url: `${base}${path}` });
const { document } = win;
document.write(rendered);

// Keep only page-specific metadata from the proxied head; everything else
// (the head.html-managed part) is replaced by the local head.html.
const PRESERVE = 'title, base, meta, link[rel="canonical"], link[rel="alternate"], script[type="application/ld+json"]';
const preserved = [...document.head.querySelectorAll(PRESERVE)]
  .map((n) => n.outerHTML)
  .join('\n');

document.head.innerHTML = `${preserved}\n${localHead}`;

const html = `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
writeFileSync(outFile, html);
console.log(`Wrote ${outFile} (${html.length} bytes): local head.html + body from ${base}${path}`);
