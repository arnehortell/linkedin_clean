async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function deleteVisiblePostsByAuthor(targetAuthor) {
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
            console.log(">>> Raderade inlägg av:", targetAuthor);
            deletedCount++;
            await sleep(2);
          }
        }
      }
    }
  }

  return deletedCount;
}

async function autoScrollAndDeletePostsWithRefresh(targetAuthor, reloadThreshold = 50) {
  console.log("*** Börjar auto-radering av inlägg för:", targetAuthor, "***");

  let lastHeight = 0;
  let totalDeleted = 0;
  let consecutiveNoNewPosts = 0;

  while (true) {
    const deleted = await deleteVisiblePostsByAuthor(targetAuthor);
    totalDeleted += deleted;

    // Om vi nått gränsen, ladda om sidan
    if (totalDeleted >= reloadThreshold) {
      console.log("*** Nådde", reloadThreshold, "raderingar – laddar om sidan! ***");
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

    // Om inga nya inlägg laddats på 3 rundor – klart!
    if (consecutiveNoNewPosts >= 3) {
      console.log("*** Klar! Totalt raderade inlägg:", totalDeleted, "***");
      break;
    }
  }
}

// Kör
autoScrollAndDeletePostsWithRefresh("Arne Hortell", 50);
