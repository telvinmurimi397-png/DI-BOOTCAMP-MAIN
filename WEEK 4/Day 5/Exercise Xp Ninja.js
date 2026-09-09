//Exercise 1: Giphy API #3

if (typeof document !== "undefined") {
  const apiKey = "hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My";
  const gifForm = document.getElementById("gifForm");
  const searchInput = document.getElementById("searchInput");
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  const gifContainer = document.getElementById("gif-container");

  if (gifForm && searchInput && deleteAllBtn && gifContainer) {
    gifForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const category = searchInput.value.trim();
      if (!category) return;

      const url = `https://api.giphy.com/v1/gifs/random?tag=${encodeURIComponent(category)}&api_key=${apiKey}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.images) {
          const gifUrl = data.data.images.original.url;
          const img = document.createElement("img");
          img.src = gifUrl;
          gifContainer.appendChild(img);
        } else {
          alert("No GIF found for that category!");
        }
      } catch (error) {
        console.error("Error fetching GIF:", error);
      }

      searchInput.value = "";
    });

    deleteAllBtn.addEventListener("click", () => {
      gifContainer.innerHTML = "";
    });
  }
} else {
  console.log("Exercise 1 requires a browser page with #gifForm, #searchInput, #deleteAllBtn, and #gif-container.");
}


//Exercise 2: Analyze #4
//Outcome Sequence:Waits 1 second due to setTimeout(concurrentPromise, 1000).Logs ==CONCURRENT START with Promise.all==.Calls resolveAfter2Seconds() and resolveAfter1Second() simultaneously:Logs starting slow promise.Logs starting fast promise.After 1 second, the fast timer completes: logs fast promise is done.After 2 seconds total, the slow timer completes: logs slow promise is done.Promise.all resolves and passes ["slow", "fast"] to .then():Logs slow (messages[0]).Logs fast (messages[1]).Console Output:Plaintext==CONCURRENT START with Promise.all==
//starting slow promise
//starting fast promise
//fast promise is done
//slow promise is done
//slow
//fast


//Exercise 3: Analyze #5
//Outcome Sequence:Waits 5 seconds due to setTimeout(parallel, 5000).Logs ==PARALLEL with await Promise.all==.Both async functions execute in parallel:First IIFE calls resolveAfter2Seconds() -> logs starting slow promise.Second IIFE calls resolveAfter1Second() -> logs starting fast promise.After 1 second, fast promise resolves -> logs fast promise is done, then logs fast.After 2 seconds total, slow promise resolves -> logs slow promise is done, then logs slow.Console Output:Plaintext==PARALLEL with await Promise.all==
//starting slow promise
//starting fast promise
//fast promise is done
//fast
//slow promise is done
//slow


//Exercise 4: Analyze #6
//Outcome Sequence:Waits 13 seconds due to setTimeout(parallelPromise, 13000).Logs ==PARALLEL with Promise.then==.Calls resolveAfter2Seconds() and resolveAfter1Second():Logs starting slow promise.Logs starting fast promise.After 1 second, fast promise completes:Logs fast promise is done.The .then() callback executes immediately -> logs fast.After 2 seconds total, slow promise completes:Logs slow promise is done.The .then() callback executes immediately -> logs slow.Console Output:Plaintext==PARALLEL with Promise.then==
//starting slow promise
//starting fast promise
//fast promise is done
//fast
//slow promise is done
//slow