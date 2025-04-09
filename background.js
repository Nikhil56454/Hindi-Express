const API_KEY = "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"; // Replace with your actual key

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translateText") {
    fetch("https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-hi", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: request.text })
    })
      .then(res => res.json())
      .then(data => {
        const translated = Array.isArray(data) && data[0]?.translation_text
          ? data[0].translation_text
          : request.text;
        sendResponse({ translated });
      })
      .catch(() => sendResponse({ translated: request.text }));

    return true; // needed to keep sendResponse alive
  }
});
// checked background.js

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }, () => {
    // Injected. Now send message.
    chrome.tabs.sendMessage(tab.id, { action: "startTranslation" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      }
    });
  });
});

