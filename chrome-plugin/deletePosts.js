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

  async function deleteVisiblePostsByAuthor() {
    const posts = document.querySelectorAll("div.feed-shared-update-v2");
    let deletedCount = 0;

    for (const post of posts) {
      const authorElement = post.querySelector(".update-components-header__text-view a");
      if (authorElement && authorElement.textContent.trim() === targetAuthor) {
        console.log(">>> Hittade inlägg av:", targetAuthor);

        const controlMenuButton = post.querySelector(".feed-shared-control-menu__trigger");
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

  async function autoScrollAndDeletePostsWithAutoRestart() {
    console.log("*** Börjar auto-radering av inlägg för:", targetAuthor, "***");

    let lastHeight = 0;
    let totalDeleted = parseInt(localStorage.getItem("autoDelete_totalDeleted") || "0");
    let consecutiveNoNewPosts = 0;

    while (true) {
      const deleted = await deleteVisiblePostsByAuthor();
      totalDeleted += deleted;
      localStorage.setItem("autoDelete_totalDeleted", totalDeleted.toString());

      if (totalDeleted >= reloadThreshold) {
        console.log("*** Nådde", reloadThreshold, "raderade inlägg – laddar om sidan och fortsätter! ***");
        localStorage.setItem("autoDelete_continue", "true");
        location.reload();
        break;
      }

      window.scrollTo(0, document.body.scrollHeight);
      await sleep(3);

      const newHeight = document.body.scrollHeight;

      if (newHeight === lastHeight) {
        consecutiveNoNewPosts++;
      } else {
        consecutiveNoNewPosts = 0;
      }

      lastHeight = newHeight;

      if (consecutiveNoNewPosts >= 3) {
        console.log("*** Klar! Totalt raderade inlägg:", totalDeleted, "***");
        localStorage.removeItem("autoDelete_continue");
        localStorage.removeItem("autoDelete_totalDeleted");
        break;
      }
    }
  }

  if (localStorage.getItem("autoDelete_continue") === "true") {
    console.log("*** Startar om auto-radering efter reload ***");
    autoScrollAndDeletePostsWithAutoRestart();
  }
})();
