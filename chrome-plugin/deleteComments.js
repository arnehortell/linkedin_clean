(async () => {
  const targetAuthor = await new Promise((resolve) => {
    chrome.storage.local.get("authorName", (data) => {
      resolve(data.authorName || "Arne Hortell");
    });
  });

  const reloadThreshold = 50;

  async function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  function dismissToastIfVisible() {
    const dismissBtn = document.querySelector(".artdeco-toast-item__dismiss");
    if (dismissBtn) {
      dismissBtn.click();
      console.log(">>> Stängde toast-notis");
    }
  }

  async function deleteVisibleCommentsByAuthor() {
    const comments = document.querySelectorAll("article.comments-comment-entity");
    let deletedCount = 0;

    for (const comment of comments) {
      const authorElement = comment.querySelector(".comments-comment-meta__description-title");
      if (authorElement && authorElement.textContent.trim() === targetAuthor) {
        console.log(">>> Hittade kommentar av:", targetAuthor);

        const controlMenuButton = comment.querySelector(".comment-options-trigger button");
        if (controlMenuButton) {
          controlMenuButton.click();
          await sleep(1);

          const deleteOption = Array.from(document.querySelectorAll(".artdeco-dropdown__item span"))
            .find(span => span.textContent.includes("Delete") || span.textContent.includes("Ta bort"));

          if (deleteOption) {
            deleteOption.click();
            await sleep(1);

            const confirmButton = document.querySelector("button.artdeco-button--primary");
            if (confirmButton) {
              confirmButton.click();
              await sleep(2);

              dismissToastIfVisible();
              deletedCount++;
            }
          }
        }
      }
    }

    return deletedCount;
  }

  async function autoScrollAndDeleteCommentsWithAutoRestart() {
    console.log("*** Börjar auto-radering av kommentarer för:", targetAuthor, "***");

    let lastHeight = 0;
    let totalDeleted = parseInt(localStorage.getItem("autoDelete_totalDeleted") || "0");
    let consecutiveNoNewComments = 0;

    while (true) {
      const deleted = await deleteVisibleCommentsByAuthor();
      totalDeleted += deleted;
      localStorage.setItem("autoDelete_totalDeleted", totalDeleted.toString());

      if (totalDeleted >= reloadThreshold) {
        console.log("*** Nådde", reloadThreshold, "raderade kommentarer – laddar om sidan och fortsätter! ***");
        localStorage.setItem("autoDelete_continue", "true");
        location.reload();
        break;
      }

      window.scrollTo(0, document.body.scrollHeight);
      await sleep(3);

      const newHeight = document.body.scrollHeight;

      if (newHeight === lastHeight) {
        consecutiveNoNewComments++;
      } else {
        consecutiveNoNewComments = 0;
      }

      lastHeight = newHeight;

      if (consecutiveNoNewComments >= 3) {
        console.log("*** Klar! Totalt raderade kommentarer:", totalDeleted, "***");
        localStorage.removeItem("autoDelete_continue");
        localStorage.removeItem("autoDelete_totalDeleted");
        break;
      }
    }
  }

  if (localStorage.getItem("autoDelete_continue") === "true") {
    console.log("*** Startar om auto-radering efter reload ***");
    autoScrollAndDeleteCommentsWithAutoRestart();
  }
})();
