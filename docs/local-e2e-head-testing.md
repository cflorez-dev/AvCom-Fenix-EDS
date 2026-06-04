# Local E2E testing of `head.html` changes

## The problem

`aem up` serves your local `scripts/`, `blocks/`, `styles/` and `aem.js` from disk,
but it **proxies the fully-rendered page — including its `<head>`** — from the
upstream. So when you change `head.html` locally (move a script out of the head,
add a preload, change load order…) and browse a normal route, **you are looking at
the upstream's head, not yours.** The change appears to "not take effect".

This is a known caveat (see the team memory on validate-before-deploy /
clone-and-bisect): `head.html` is proxied; only the JS/CSS code is local.

Two extra traps make ad-hoc testing unreliable:

- **Stripping the proxied head tag in the browser doesn't work.** Removing a
  parser-inserted `<script src>` node via an `initScript`/MutationObserver does
  **not** cancel a fetch that already started — the script still executes.
- **You can't re-inject the same third-party script in one page.** Many vendor
  scripts declare top-level `const`s; running the file twice in the same realm
  throws "identifier already declared", so loading it again from `delayed.js`
  silently aborts.

## The pattern: serve a local page built from your local head

Take the real rendered page (real content + body structure) and **rebuild its
`<head>` from your local `head.html`**, keeping only the page-specific metadata
scripts depend on (lang, title, meta, canonical/alternate, JSON-LD). Write the
result to a local `.html` file. `aem up` serves that file **straight from disk —
no proxy** — so the browser runs your local head, your local scripts, and the
real body.

A helper script does this: [`tools/local-e2e-page.mjs`](../tools/local-e2e-page.mjs).

### Steps

```bash
# 1. Start the dev server against an upstream where the path is 200.
#    The default upstream can be empty (every path 404s), which makes
#    loadEager fall into the empty-page branch and never finish — pick a
#    content-bearing host instead:
aem up --no-open --url https://main--fenix--aviancavsts.aem.page

# 2. Generate a local page from a route (uses your local head.html):
node tools/local-e2e-page.mjs /pt
#    -> writes e2e-pt.html

# 3. Open it in the browser, adding any flags/query overrides you need:
#    http://localhost:3000/e2e-pt.html?chat=on
#    The page now runs entirely on your local head + scripts.

# 4. Delete the throwaway file when done:
rm e2e-pt.html
```

`LOCAL_BASE` overrides the dev-server origin (default `http://localhost:3000`),
and an optional second arg sets the output filename.

### How to pick a working upstream

If `/pt` 404s on the configured upstream, probe candidates:

```bash
for h in main--fenix--aviancavsts.aem.page main--fenix--aviancavsts.aem.live ; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' https://$h/pt)  $h"
done
```

Use any host that returns `200`.

## Worked example: Centribal chat moved to `delayed.js` (`AV_CENTRIBAL_CHAT_ENABLED`)

The chat used to be a render-blocking `<script>`/`<link>` in `head.html`. It was
moved to `scripts/delayed.js` behind the `AV_CENTRIBAL_CHAT_ENABLED` Config
Service flag (with a `?chat=on|off` QA override). The vendor script bootstraps
itself via `window.onload`, so it relies on the `window.onload` safety net in
`scripts.js` (which had to be hardened to seed `pageFullyLoaded` from
`document.readyState`).

Validation with this pattern — on a page whose **head has no Centribal**, the
chat can only come from the delayed path:

| URL | Centribal CSS/JS loaded | Chat (`#fixedButton`, `grecaptcha`) |
| --- | --- | --- |
| `/e2e-pt.html?chat=on`  | yes — injected by `delayed.js` | **renders** |
| `/e2e-pt.html?chat=off` | none | **absent** |

This proves end-to-end that the flag gates the chat and that the delayed-load +
safety-net path renders it — none of which is observable on a proxied-head route.

## Caveats

- This validates everything **downstream of the head** (load order, deferred
  loading, flags, safety nets) faithfully. The *literal* removal of a tag from
  `head.html` in production is still only confirmed on deploy, because the
  generated page is built FROM your local head.html (so by construction it
  matches it).
- Preserved page metadata is a best-effort subset; if a script reads some other
  head element, add it to the `PRESERVE` selector in the helper.
- The generated `e2e-*.html` files are throwaway artifacts — don't commit them.
