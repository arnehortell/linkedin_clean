async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function deleteVisibleCommentsByAuthor(targetAuthor) {
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
            console.log(">>> Raderade kommentar av:", targetAuthor);
            deletedCount++;
            await sleep(2);
          }
        }
      }
    }
  }

  return deletedCount;
}

async function autoScrollAndDeleteCommentsWithRefresh(targetAuthor, reloadThreshold = 50) {
  console.log("*** Börjar auto-radering av kommentarer för:", targetAuthor, "***");

  let lastHeight = 0;
  let totalDeleted = 0;
  let consecutiveNoNewComments = 0;

  while (true) {
    const deleted = await deleteVisibleCommentsByAuthor(targetAuthor);
    totalDeleted += deleted;

    // Om vi nått gränsen, ladda om sidan
    if (totalDeleted >= reloadThreshold) {
      console.log("*** Nådde", reloadThreshold, "raderade kommentarer – laddar om sidan! ***");
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
      break;
    }
  }
}

// Kör
autoScrollAndDeleteCommentsWithRefresh("Arne Hortell", 50);
