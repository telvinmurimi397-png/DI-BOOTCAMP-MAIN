//1st Daily Challenge: Play with Words


function makeAllCaps(words) {
  return new Promise((resolve, reject) => {
    const isAllStrings = words.every((word) => typeof word === "string");
    if (isAllStrings) {
      resolve(words.map((word) => word.toUpperCase()));
    } else {
      reject("Error: Not all items in the array are strings!");
    }
  });
}

function sortWords(words) {
  return new Promise((resolve, reject) => {
    if (words.length > 4) {
      resolve([...words].sort());
    } else {
      reject("Error: Array length must be greater than 4 to sort!");
    }
  });
}

// Test Case 1: Rejects (contains a non-string: 1)
makeAllCaps([1, "pear", "banana"])
  .then((arr) => sortWords(arr))
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

// Test Case 2: Rejects (length is not greater than 4)
makeAllCaps(["apple", "pear", "banana"])
  .then((arr) => sortWords(arr))
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

// Test Case 3: Resolves and outputs ["APPLE", "BANANA", "KIWI", "MELON", "PEAR"]
makeAllCaps(["apple", "pear", "banana", "melon", "kiwi"])
  .then((arr) => sortWords(arr))
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

  
//2nd Daily Challenge: Morse Code Translator

const morse = `{
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  "a": ".-",
  "b": "-...",
  "c": "-.-.",
  "d": "-..",
  "e": ".",
  "f": "..-.",
  "g": "--.",
  "h": "....",
  "i": "..",
  "j": ".---",
  "k": "-.-",
  "l": ".-..",
  "m": "--",
  "n": "-.",
  "o": "---",
  "p": ".--.",
  "q": "--.-",
  "r": ".-.",
  "s": "...",
  "t": "-",
  "u": "..-",
  "v": "...-",
  "w": ".--",
  "x": "-..-",
  "y": "-.--",
  "z": "--..",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "-": "-....-",
  "/": "-..-.",
  "@": ".--.-.",
  "(": "-.--.",
  ")": "-.--.-"
}`;

// Function 1: Convert JSON to JavaScript Object
function toJs() {
  return new Promise((resolve, reject) => {
    const morseJS = JSON.parse(morse);
    if (Object.keys(morseJS).length === 0) {
      reject("Error: Morse object is empty!");
    } else {
      resolve(morseJS);
    }
  });
}

// Function 2: Prompt user and map input to Morse array
function toMorse(morseJS) {
  return new Promise((resolve, reject) => {
    const userInput = prompt("Enter a word or a sentence:").toLowerCase();
    const result = [];

    for (const char of userInput) {
      if (char in morseJS) {
        result.push(morseJS[char]);
      } else {
        reject(`Error: Character "${char}" does not exist in the morse dictionary!`);
        return;
      }
    }
    resolve(result);
  });
}

// Function 3: Render translation on the DOM
function joinWords(morseTranslation) {
  const container = document.createElement("div");
  container.innerText = morseTranslation.join("\n");
  document.body.appendChild(container);
}

// Chaining the functions
toJs()
  .then((morseJS) => toMorse(morseJS))
  .then((morseTranslation) => joinWords(morseTranslation))
  .catch((error) => console.log(error));