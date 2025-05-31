// Ladda tidigare sparat författarnamn
chrome.storage.local.get("authorName", (data) => {
  if (data.authorName) {
    document.getElementById("authorName").value = data.authorName;
  }
});

// Spara författarnamn
document.getElementById("saveAuthor").addEventListener("click", () => {
  const authorName = document.getElementById("authorName").value.trim();
  if (authorName) {
    chrome.storage.local.set({ authorName }, () => {
      alert("Författarnamn sparat!");
    });
  }
});

// Radera inlägg
document.getElementById("deletePosts").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.executeScript(tabs[0].id, { file: "deletePosts.js" });
  });
});

// Radera kommentarer
document.getElementById("deleteComments").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.executeScript(tabs[0].id, { file: "deleteComments.js" });
  });
});
