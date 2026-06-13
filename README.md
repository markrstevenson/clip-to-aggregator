# Clip to Aggregator — Chrome extension

A lightweight Manifest V3 Chrome extension for marking news articles as you read
them. Each clip is saved as a small JSON file into an `inbox/` folder you choose,
ready to be picked up by whatever processes it — a digest script, a notes vault,
or an AI assistant watching the folder.

Nothing leaves your machine: no servers, no accounts, no tracking. The only
"transport" is a JSON file written into your own download folder.

> Originally built to feed a weekly defence-tech news digest, but the format is
> generic — clip anything, point the inbox at any folder.

## What it captures
- Page title and URL (auto-filled)
- Any text you've highlighted on the page (auto-captured)
- A category (Air / Land / Sea / Space / Logistics / Startup / Other)
- An optional note on why it matters

## One-time setup (about 2 minutes)

**1. Point Chrome's downloads at the folder you want to collect clips in**

Chrome → Settings → Downloads → "Location" → choose your collection folder,
for example:

`~/Documents/news-inbox`   (or any folder you like)

Leave "Ask where to save each file before downloading" **off**. (Clips are tiny
JSON files saved silently into an `inbox/` subfolder, so they won't clutter your
normal downloads.)

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

The clip lands in `<your-folder>/inbox/` as `clip-<timestamp>.json`.

## Clip format
Each clip is a single JSON object:

```json
{
  "title": "Europe's largest drone testing centre opens in Swindon - GOV.UK",
  "url": "https://www.gov.uk/government/news/...",
  "category": "Air",
  "note": "new UK uncrewed-systems test facility",
  "highlight": "The new Uncrewed Systems Centre (USC)...",
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
