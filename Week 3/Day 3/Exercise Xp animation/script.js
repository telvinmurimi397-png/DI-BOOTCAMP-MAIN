// Exercise 1: Timer
(function() {
  const container = document.getElementById("container");
  const clearBtn = document.getElementById("clear");

  if (!container) return;

  // --- Part I ---
  setTimeout(function() {
    alert("Hello World");
  }, 2000);

  // --- Part II ---
  setTimeout(function() {
    const p = document.createElement("p");
    p.textContent = "Hello World";
    container.appendChild(p);
  }, 2000);

  // --- Part III ---
  let timer = setInterval(function() {
    const p = document.createElement("p");
    p.textContent = "Hello World";
    container.appendChild(p);

    const paragraphs = container.querySelectorAll("p");
    if (paragraphs.length >= 5) {
      clearInterval(timer);
    }
  }, 2000);

  if (clearBtn) {
    clearBtn.addEventListener("click", function() {
      clearInterval(timer);
      container.querySelectorAll("p").forEach(function(paragraph) {
        paragraph.remove();
      });
    });
  }
})();

// Exercise 2: Move the box
function myMove() {
  const elem = document.getElementById("animate");
  const container = document.getElementById("container");

  if (!elem || !container) return;

  const maxDistance = container.offsetWidth - elem.offsetWidth;
  let pos = 0;

  const id = setInterval(function() {
    if (pos >= maxDistance) {
      clearInterval(id);
    } else {
      pos++;
      elem.style.left = pos + "px";
    }
  }, 1);
}