// 1. Create a sentence variable
const sentence = "The movie is not that bad, I like it";

// 2. Find the index of the substring "not"
const wordNot = sentence.indexOf("not");

// 3. Find the index of the substring "bad"
const wordBad = sentence.indexOf("bad");

// 4 & 5. Check if both words exist and if "bad" appears after "not"
if (wordNot !== -1 && wordBad !== -1 && wordBad > wordNot) {
  // Extract from beginning up to "not", append "good", and append everything after "bad" (+3 for the length of "bad")
  const result = sentence.slice(0, wordNot) + "good" + sentence.slice(wordBad + 3);
  console.log(result);
} else {
  console.log(sentence);
}