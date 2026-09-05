//Exercise 1: Analyzing the map method

Output: [2, 4, 6]

//Explanation: The .map() method iterates through each element in [1, 2, 3]. Since every element is of type 'number', the if condition evaluates to true for all iterations, returning each number multiplied by 2.

//Exercise 2: Analyzing the reduce method

Output: [1, 2, 0, 1, 2, 3]

//Explanation: The initial value passed to .reduce() is [1, 2].

//1st step: [1, 2].concat([0, 1]) → [1, 2, 0, 1]

//2nd step: [1, 2, 0, 1].concat([2, 3]) → [1, 2, 0, 1, 2, 3]

//Exercise 3: Analyze this code

//Answer: i represents the index of the current element being processed in the array during each iteration. Its values will sequentially be 0, 1, 2, 3, 4, and 5.

//Exercise 4: Nested arrays

//JavaScript
// 1. Modify [[1],[2],[3],[[[4]]],[[[5]]]] to [1,2,3,[4],[5]]
const array = [[1],[2],[3],[[[4]]],[[[5]]]];
const modifiedArray = array.flat(2); 
// Bonus (One line): const modifiedArray = [[1],[2],[3],[[[4]]],[[[5]]]].flat(2);

// 2. Modify greeting array to ["Hello young grasshopper!","you are","learning fast!"]
const greeting = [["Hello", "young", "grasshopper!"], ["you", "are"], ["learning", "fast!"]];
const formattedGreeting = greeting.map(subArray => subArray.join(" "));

// 3. Turn the greeting array into a single string
const greetingString = greeting.map(subArray => subArray.join(" ")).join(" ");
// Output: "Hello young grasshopper! you are learning fast!"

// 4. Turn trapped number 3 into [3]
const trapped = [[[[[[[[[[[[[[[[[[[[[[[[[[3]]]]]]]]]]]]]]]]]]]]]]]]]];
const freed = trapped.flat(Infinity); // or trapped.flat(26)
// Output: [3]