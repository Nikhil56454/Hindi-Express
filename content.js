let stopTranslation = false;
let translationStartTime = null;

function createPopup() {
  const popup = document.createElement("div");
  popup.id = "translate-popup";
  popup.innerHTML = `
<div style="
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  text-align: center;
">
  <h3 style="margin-bottom: 10px;">🔄 Translating...</h3>
  <p id="timer" style="color: dodgerblue;">⏱ 0s</p>
  <button id="stopBtn" style="padding: 8px 16px; background: crimson; color: white; border: none; border-radius: 5px; cursor: pointer;">Stop</button>
</div>
  `;
  Object.assign(popup.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 999999,
  });
  document.body.appendChild(popup);

  document.getElementById("stopBtn").onclick = () => {
    stopTranslation = true;
    removePopup();
  };

  translationStartTime = Date.now();
  updateTimer();
}

function updateTimer() {
  const timerElem = document.getElementById("timer");
  if (!timerElem) return;
  const elapsed = Math.floor((Date.now() - translationStartTime) / 1000);
  timerElem.textContent = `⏱ ${elapsed}s`;
  if (!stopTranslation) setTimeout(updateTimer, 1000);
}

function removePopup() {
  const popup = document.getElementById("translate-popup");
  if (popup) popup.remove();
}

function getTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim()) {
      nodes.push(node);
    }
  }
  return nodes;
}

function sendMessageAsync(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError || !response) {
        reject(chrome.runtime.lastError || new Error("No response received"));
      } else {
        resolve(response);
      }
    });
  });
}

async function translateAndReplace() {
  const nodes = getTextNodes();
  createPopup();

  for (const node of nodes) {
    if (stopTranslation) break;

    const text = node.nodeValue.trim();
    if (text.length > 0 && text.length <= 200) {
      try {
        const response = await sendMessageAsync({ action: "translateText", text });
        if (response && response.translated) {
          node.nodeValue = response.translated;
        }
      } catch {
        // fallback: don't translate
      }
    }

    await new Promise(res => setTimeout(res, 300)); // shorter delay for faster translation
  }

  removePopup();
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startTranslation") {
    stopTranslation = false;
    translateAndReplace().then(() => {
      sendResponse({ status: "done" }); // ✅ Respond after translation
    });
    return true; // ✅ Required for async response
  }
});

