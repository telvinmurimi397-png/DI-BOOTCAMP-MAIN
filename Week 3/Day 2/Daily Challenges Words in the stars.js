function printWordsInStars(userInput) {
    const input = userInput ?? (typeof prompt === "function"
        ? prompt("Enter several words separated by commas:")
        : "");

    if (!input) return;

    const words = input
        .split(",")
        .map(word => word.trim())
        .filter(word => word.length > 0);

    if (words.length === 0) return;

    let maxLength = 0;
    for (const word of words) {
        if (word.length > maxLength) {
            maxLength = word.length;
        }
    }

    const border = "*".repeat(maxLength + 4);

    console.log(border);
    for (const word of words) {
        const paddedWord = word.padEnd(maxLength, " ");
        console.log(`* ${paddedWord} *`);
    }
    console.log(border);
}

if (typeof process !== "undefined" && process.versions && process.versions.node) {
    const terminalInput = process.argv.slice(2).join(" ");

    if (terminalInput) {
        printWordsInStars(terminalInput);
    } else {
        console.log("Usage: node \"Daily Challenges Words in the stars.js\" \"hello, world, coding\"");
    }
} else {
    printWordsInStars();
}