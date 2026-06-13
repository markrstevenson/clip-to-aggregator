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

let pageUrl = "";

// Pre-fill from the active tab, and pull the current text selection.
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  titleEl.value = tab.title || "";
  pageUrl = tab.url || "";
  urlEl.textContent = pageUrl;

  // Grab highlighted text from the page (best-effort; some pages block injection).
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });
    if (result && result.result) selectionEl.value = result.result.trim();
  } catch (e) {
    // e.g. chrome:// pages or PDFs — silently skip.
  }
}

// Build a safe, unique filename from the timestamp.
function clipFilename(ts) {
  const stamp = ts
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  return `inbox/clip-${stamp}.json`;
}

// JSON -> base64 data URL (works inside a popup without Blob URLs).
function toDataUrl(jsonStr) {
  const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return `data:application/json;base64,${b64}`;
}

async function saveClip() {
  saveBtn.disabled = true;
  statusEl.textContent = "Saving…";

  const now = new Date().toISOString();
  const clip = {
    title: titleEl.value.trim(),
    url: pageUrl,
    category: categoryEl.value,
    note: noteEl.value.trim(),
    highlight: selectionEl.value.trim(),
    clipped_at: now,
  };

  const jsonStr = JSON.stringify(clip, null, 2);

  try {
    await chrome.downloads.download({
      url: toDataUrl(jsonStr),
      filename: clipFilename(now),
      saveAs: false,
      conflictAction: "uniquify",
    });
    statusEl.textContent = "✓ Clipped to inbox";
    setTimeout(() => window.close(), 700);
  } catch (e) {
    statusEl.style.color = "#b00020";
    statusEl.textContent = "Error: " + e.message;
    saveBtn.disabled = false;
  }
}

saveBtn.addEventListener("click", saveClip);
init();
