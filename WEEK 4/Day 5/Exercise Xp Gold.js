//Exercise 1: Giphy API #2

const apiKey = "hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My";
const giphyUrl = `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}`;

async function fetchAndAppendGif() {
  try {
    const response = await fetch(giphyUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    
    // Retrieve image URL from data.images
    const gifUrl = result.data.images.original.url;

    if (typeof document !== "undefined") {
      // Create img element and append to body
      const img = document.createElement("img");
      img.src = gifUrl;
      document.body.appendChild(img);
    } else {
      console.log("GIF URL:", gifUrl);
    }
  } catch (error) {
    console.error("Error fetching GIF:", error);
  }
}

fetchAndAppendGif();
//Exercise 2: Analyze #2

//Outcome Sequence:

//Logs ==SEQUENTIAL START== immediately.

//Calls resolveAfter2Seconds(), logging starting slow promise.

//Pauses inside sequentialStart for 2 seconds.

//Inside the timeout, slow promise is done is logged and the promise resolves to "slow".

//Logs slow.

//Calls resolveAfter1Second(), logging starting fast promise.

//Pauses inside sequentialStart for 1 second.

//Inside the timeout, fast promise is done is logged and the promise resolves to "fast".

//Logs fast.

//Console Logs Output:

//Plaintext
//==SEQUENTIAL START==
//starting slow promise
//slow promise is done
//slow
//starting fast promise
//fast promise is done
//fast
//Exercise 3: Analyze #3

//Outcome Sequence:

//Waits 4 seconds due to setTimeout(concurrentStart, 4000).

//Logs ==CONCURRENT START with await==.

//Initiates both promises concurrently:

//Calls resolveAfter2Seconds(), logging starting slow promise.

//Immediately calls resolveAfter1Second(), logging starting fast promise.

//After 1 second, the fast timer completes: logs fast promise is done.

//After 2 seconds total, the slow timer completes: logs slow promise is done.

//await slow finishes resolving: logs slow.

//await fast was already resolved: immediately logs fast.

//Console Logs Output:

//Plaintext
//==CONCURRENT START with await==
//starting slow promise
//starting fast promise
//fast promise is done
//slow promise is done
//slow
//fast


//Exercise 4: Modify fetch with Async/Await


const urls = [
  "https://jsonplaceholder.typicode.com/users",
  "https://jsonplaceholder.typicode.com/posts",
  "https://jsonplaceholder.typicode.com/albums"
];

const getData = async function() {
  try {
    const [ users, posts, albums ] = await Promise.all(
      urls.map(async (url) => {
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`HTTP error! Status: ${resp.status}`);
        }
        return await resp.json();
      })
    );
    console.log('users', users);
    console.log('posts', posts);
    console.log('albums', albums);
  } catch (error) {
    console.log('ooooooops');
  }
};

getData();