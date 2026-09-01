function printWordsInStars(userInput) {
    if (!userInput || !userInput.trim()) {
        console.log('Usage: node "Daily Challenges Words in the stars.js" "hello, world, coding"');
        return;
    }

    // Split string into an array and trim extra spaces from each word
    const words = userInput
        .split(",")
        .map(word => word.trim())
        .filter(Boolean);

    if (words.length === 0) {
        console.log('Usage: node "Daily Challenges Words in the stars.js" "hello, world, coding"');
        return;
    }

    // Find the length of the longest word
    let maxLength = 0;
    for (const word of words) {
        if (word.length > maxLength) {
            maxLength = word.length;
        }
    }

    // Create top and bottom borders
    const border = "*".repeat(maxLength + 4);

    // Console.log the framed output
    console.log(border);
    for (const word of words) {
        const paddedWord = word.padEnd(maxLength, " ");
        console.log(`* ${paddedWord} *`);
    }
    console.log(border);
}

const defaultInput = "hello, world, coding";
const cliInput = process.argv.slice(2).join(" ") || defaultInput;

if (cliInput) {
    printWordsInStars(cliInput);
} else if (typeof prompt === "function") {
    printWordsInStars(prompt("Enter several words separated by commas:"));
} else {
    printWordsInStars(defaultInput);
}