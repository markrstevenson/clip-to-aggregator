# Clip to Aggregator — Chrome extension

A lightweight Manifest V3 Chrome extension for marking news articles as you read
them. Each clip is saved as a small JSON file into an `inbox/` folder you choose,
ready to be picked up by whatever processes it — a digest script, a notes vault,
or an AI assistant watching the folder.

Nothing leaves your machine: no servers, no accounts, no tracking. The only
"transport" is a JSON file written into your own download folder.

> The format is deliberately generic — clip anything, point the inbox at any
> folder, and process it however you like.

## What it captures
- Page title and URL (auto-filled)
- Any text you've highlighted on the page (auto-captured)
- A category (News / Technology / Business / Science / Culture / Opinion / Other)
- An optional note on why it matters

## One-time setup (about 2 minutes)

> ⚠️ **This step is required — the extension won't work without it.** Clips are
> saved through Chrome's download mechanism, so they land wherever Chrome's
> download location points. If that's not set to your collection folder, your
> clips will end up in your normal Downloads folder instead.

**1. Point Chrome's downloads at the folder you want to collect clips in**

Chrome → Settings → Downloads → "Location" → choose your collection folder,
for example:

`~/Documents/clip-inbox`   (or any folder you like)

Leave "Ask where to save each file before downloading" **off** — otherwise
Chrome prompts on every clip. (Clips are tiny JSON files saved silently into an
`inbox/` subfolder, so they won't clutter your normal downloads.)

**2. Load the extension**

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this folder: `clip-to-aggregator`
5. Pin it to your toolbar (puzzle-piece icon → pin "Clip to Aggregator")

Done.

## Daily use
1. On any article, optionally highlight the key passage.
2. Click the **Clip to Aggregator** toolbar button.
3. Tweak the title, pick a category, add a note → **Save clip**.

The clip lands in `<your-folder>/inbox/` as `<title-slug>_<timestamp>.json` —
a title-based name so clips are browsable without opening them.

## Clip format
Each clip is a single JSON object:

```json
{
  "title": "How a small team shipped a feature in a weekend - Example Blog",
  "url": "https://example.com/blog/...",
  "favicon": "https://example.com/favicon.ico",
  "category": "Technology",
  "note": "useful pattern for small-team delivery",
  "highlight": "They cut scope aggressively and shipped...",
  "clipped_at": "2026-06-13T22:02:16.003Z"
}
```

A consumer (digest script, notes app, AI assistant) reads everything in
`inbox/`, processes it, and can move handled files to an `archive/` folder so
nothing is counted twice.

## Notes
- Clips can't be captured on `chrome://` pages, the Web Store, or some PDFs —
  the title/URL still save, just without highlighted text.
- To change the category list, edit the `<select>` options in `popup.html`.

## License
MIT — see [LICENSE](LICENSE).
