// Exercise 1: Change the article
console.log("Exercise 1: Change the article");

const article = {
    h1: "My Article Title",
    h2: "Section Heading",
    h3: "Hidden Section",
    paragraphs: [
        "This is the first paragraph.",
        "This is the second paragraph.",
        "This is the third paragraph."
    ]
};

console.log("H1:", article.h1);

article.paragraphs.pop();
console.log("After removing the last paragraph:", article.paragraphs);

const h2 = {
    text: article.h2,
    backgroundColor: "transparent"
};

h2.onClick = () => {
    h2.backgroundColor = "red";
    console.log("h2 clicked -> backgroundColor = red");
};
h2.onClick();

const h3 = {
    text: article.h3,
    display: "block"
};

h3.onClick = () => {
    h3.display = "none";
    console.log("h3 clicked -> display = none");
};
h3.onClick();

const boldButton = {
    text: "Make Text Bold",
    onClick: () => {
        article.paragraphs = article.paragraphs.map(p => `**${p}**`);
        console.log("Bold button clicked -> paragraphs:", article.paragraphs);
    }
};

boldButton.onClick();

const randomFontSize = () => Math.floor(Math.random() * 101);
console.log("Random h1 font size on hover:", `${randomFontSize()}px`);

const secondParagraph = article.paragraphs[1];
console.log("Second paragraph hover effect:", secondParagraph);

// Exercise 2: Work with forms
console.log("\nExercise 2: Work with forms");

const form = {
    submit: (firstName, lastName) => {
        const usersAnswer = [firstName, lastName];
        console.log("Submitted values:", usersAnswer);
    }
};

const fnameInput = { value: "John" };
const lnameInput = { value: "Doe" };

console.log("Inputs by id:", fnameInput, lnameInput);
console.log("Inputs by name attribute:", "firstname = John", "lastname = Doe");

form.submit(fnameInput.value.trim(), lnameInput.value.trim());

// Exercise 3: Transform the sentence
console.log("\nExercise 3: Transform the sentence");

let allBoldItems = ["Hello", "World", "JavaScript"];

function getBoldItems() {
    return allBoldItems;
}

function highlight() {
    allBoldItems = allBoldItems.map(item => `blue:${item}`);
    console.log("Highlighted bold items:", allBoldItems);
}

function returnItemsToDefault() {
    allBoldItems = getBoldItems();
    console.log("Items returned to default:", allBoldItems);
}

console.log("Bold items:", getBoldItems());
highlight();
returnItemsToDefault();

// Exercise 4: Volume of a sphere
console.log("\nExercise 4: Volume of a sphere");

function calculateSphereVolume(radius) {
    if (Number.isNaN(radius) || radius < 0) {
        return "Invalid Radius";
    }
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    return volume.toFixed(2);
}

console.log("Volume for radius 3:", calculateSphereVolume(3));
console.log("Volume for invalid radius:", calculateSphereVolume(-2));