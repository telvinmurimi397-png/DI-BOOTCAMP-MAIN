//Exercise 1 : Menu

const menu = [
  { type: "starter", name: "Houmous with Pita" },
  { type: "starter", name: "Vegetable Soup with Houmous peas" },
  { type: "dessert", name: "Chocolate Cake" }
];

// 1. Check if at least one element is a dessert
const hasDessert = menu.some(item => item.type === "dessert") 
  ? "At least one dessert exists." 
  : "No desserts found.";
console.log(hasDessert);

// 2. Check if all elements are starters
const allStarters = menu.every(item => item.type === "starter");
console.log("All starters:", allStarters); // false

// 3. Check for main course; if not found, add one
const hasMain = menu.some(item => item.type === "main course");
if (!hasMain) {
  menu.push({ type: "main course", name: "Grilled Chicken" });
}

// 4. Add "vegetarian" boolean key based on vegetarian array matches
const vegetarian = ["vegetable", "houmous", "eggs", "vanilla", "potatoes"];

menu.forEach(item => {
  const nameLower = item.name.toLowerCase();
  item.vegetarian = vegetarian.some(veg => nameLower.includes(veg));
});

console.log(menu);
//Exercise 2 : Chop into chunks


function string_chop(str, size) {
  if (!str || size <= 0) return [];
  
  const result = [];
  for (let i = 0; i < str.length; i += size) {
    result.push(str.slice(i, i + size));
  }
  return result;
}

console.log(string_chop('developers', 2)); 
// Output: ["de", "ve", "lo", "pe", "rs"]
//Exercise 3 : You said string ?

function search_word(text, word) {
  // Split string into words (ignoring punctuation/case)
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const count = words.filter(w => w === word.toLowerCase()).length;
  
  return `'${word}' was found ${count} times.`;
}

console.log(search_word('The quick brown fox', 'fox')); 
// Output: "'fox' was found 1 times."
//Exercise 4 : Reverse Array


function reverseArray(arr) {
  let start = 0;
  let end = arr.length - 1;
  
  // Swap elements in place without creating a new array
  while (start < end) {
    const temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    
    start++;
    end--;
  }
  
  return arr;
}

console.log(reverseArray([1, 2, 3, 4, 5])); // [5, 4, 3, 2, 1]
console.log(reverseArray([1, 2]));          // [2, 1]
console.log(reverseArray([]));              // []
console.log(reverseArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])); // [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]