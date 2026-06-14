// Clip to Aggregator — popup logic
// Captures the active tab's title, URL, and any highlighted text, lets the
// user add a note + category, then saves the clip as a JSON file into the
// browser's download folder under "inbox/" (point Chrome's download location
// at your Aggregator folder — see README).

const titleEl = document.getElementById("title");
const urlEl = document.getElementById("url");
const selectionEl = document.getElementById("selection");
const noteEl = document.getElementById("note");
const categoryEl = document.getElementById("category");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

// Sanity cap on the highlighted passage. Clips are written as a real file
// (Blob), so this guards against a runaway selection rather than a hard
// transport limit.
const MAX_HIGHLIGHT = 100000;

let pageUrl = "";
let favicon = "";

// Persist the in-progress form so highlighting — which closes the popup — doesn't
// wipe what you've typed. Scoped to the page URL so drafts don't leak across tabs.
function saveDraft() {
  chrome.storage.session.set({
    draft: {
      url: pageUrl,
      title: titleEl.value,
      category: categoryEl.value,
      note: noteEl.value,
      highlight: selectionEl.value,
    },
  });
}

// Pre-fill from the active tab, restore any saved draft, and pull the selection.
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  pageUrl = tab.url || "";
  favicon = tab.favIconUrl || "";
  urlEl.textContent = pageUrl;

  let title = tab.title || "";
  let selection = "";

  // Grab highlighted text from the page (best-effort; some pages block injection).
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });
    if (result && result.result) selection = result.result.trim();
  } catch (e) {
    // e.g. chrome:// pages or PDFs — silently skip.
  }

  // Restore a saved draft for this page, if any. A fresh page selection wins
  // over the saved one; everything else the user typed is restored.
  const { draft } = await chrome.storage.session.get("draft");
  if (draft && draft.url === pageUrl) {
    if (draft.title) title = draft.title;
    if (draft.category) categoryEl.value = draft.category;
    if (draft.note) noteEl.value = draft.note;
    if (!selection && draft.highlight) selection = draft.highlight;
  }

  titleEl.value = title;
  selectionEl.value = selection;

  // Autosave on every edit so nothing is lost when the popup closes.
  titleEl.addEventListener("input", saveDraft);
  noteEl.addEventListener("input", saveDraft);
  selectionEl.addEventListener("input", saveDraft);
  categoryEl.addEventListener("change", saveDraft);
}

// Turn a title into a filesystem-safe slug: ASCII alphanumerics only, dashes
// collapsed, length-capped, with a fallback so the prefix is never empty.
function slugify(s) {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return slug || "clip";
}

// Build a safe, unique, browsable filename: "<title-slug>_<timestamp>.json".
function clipFilename(title, ts) {
  const stamp = ts
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  return `inbox/${slugify(title)}_${stamp}.json`;
}

// Hand Chrome the JSON as a real file via a Blob URL. (Encoding the whole clip
// into a data: URL hits Chrome's data-URL size limit on large selections.)
function downloadJson(jsonStr, filename) {
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  return chrome.downloads
    .download({ url, filename, saveAs: false, conflictAction: "uniquify" })
    .then((id) => {
      // Release the blob once the download has landed on disk.
      chrome.downloads.onChanged.addListener(function handler(delta) {
        if (delta.id === id && delta.state && delta.state.current === "complete") {
          URL.revokeObjectURL(url);
          chrome.downloads.onChanged.removeListener(handler);
        }
      });
      return id;
    });
}

async function saveClip() {
  const title = titleEl.value.trim();
  let highlight = selectionEl.value.trim();
  const note = noteEl.value.trim();

  // Don't write empty clips into the inbox.
  if (!title && !highlight && !note) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Add a title, highlight, or note first.";
    return;
  }

  // Cap a pathological selection so a clip can't balloon unexpectedly.
  let truncated = false;
  if (highlight.length > MAX_HIGHLIGHT) {
    highlight = highlight.slice(0, MAX_HIGHLIGHT);
    truncated = true;
  }

  saveBtn.disabled = true;
  statusEl.style.color = "#1a7f37";
  statusEl.textContent = "Saving…";

  const now = new Date().toISOString();
  const clip = {
    title,
    url: pageUrl,
    favicon,
    category: categoryEl.value,
    note,
    highlight,
    clipped_at: now,
  };
  if (truncated) clip.highlight_truncated = true;

  const jsonStr = JSON.stringify(clip, null, 2);

  try {
    await downloadJson(jsonStr, clipFilename(title, now));
    await chrome.storage.session.remove("draft");
    statusEl.textContent = truncated
      ? "✓ Clipped (highlight truncated)"
      : "✓ Clipped to inbox";
    setTimeout(() => window.close(), 700);
  } catch (e) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Error: " + e.message;
    saveBtn.disabled = false;
  }
}

saveBtn.addEventListener("click", saveClip);
init().catch((e) => {
  statusEl.style.color = "#b00020";
  statusEl.textContent = "Couldn't read the active tab: " + e.message;
});
