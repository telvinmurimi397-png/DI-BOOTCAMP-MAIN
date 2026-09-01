// Exercise 1: Select a kind of Music
const genresSelect = document.getElementById("genres");

if (genresSelect) {
  console.log(genresSelect.value);

  const newOption = new Option("Classic", "classic", true, true);
  genresSelect.add(newOption);
}

// Exercise 2: Delete colors
const button = document.querySelector('input[type="button"]');

if (button) {
  button.addEventListener("click", removecolor);
}

function removecolor() {
  const colorSelect = document.getElementById("colorSelect");
  if (colorSelect && colorSelect.selectedIndex !== -1) {
    colorSelect.remove(colorSelect.selectedIndex);
  }
}

// Exercise 3: Create a shopping list
let shoppingList = [];
const root = document.getElementById("root");

if (root) {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter item";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "AddItem";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "ClearAll";

  form.appendChild(input);
  form.appendChild(addBtn);
  root.appendChild(form);
  root.appendChild(clearBtn);

  addBtn.addEventListener("click", function () {
    const item = input.value.trim();
    if (item !== "") {
      shoppingList.push(item);
      input.value = "";
      console.log("Current Shopping List:", shoppingList);
    }
  });

  clearBtn.addEventListener("click", function () {
    shoppingList = [];
    console.log("Shopping list cleared:", shoppingList);
  });
}