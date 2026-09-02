// ==========================================
// 🌟 Exercise 1 : Scope
// ==========================================

// #1
function funcOne() {
    let a = 5;
    if (a > 1) {
        a = 3;
    }
    if (typeof alert !== 'undefined') {
        alert(`inside the funcOne function ${a}`);
    }
}

// #1.1 Prediction: Alerts "inside the funcOne function 3".
// Explanation: `a` is initialized to 5 inside `funcOne`. The `if` condition (5 > 1) evaluates to true, reassigning `a` to 3.
// #1.2 If declared with `const`, a TypeError will be thrown at `a = 3` because constant variables cannot be reassigned.

// #2
let globalA = 0;
function funcTwo() {
    globalA = 5;
}

function funcThree() {
    if (typeof alert !== 'undefined') {
        alert(`inside the funcThree function ${globalA}`);
    }
}

// #2.1 Prediction:
// First funcThree() call: Alerts "inside the funcThree function 0".
// funcTwo() runs: Reassigns global variable `globalA` to 5.
// Second funcThree() call: Alerts "inside the funcThree function 5".
// Explanation: `globalA` exists in the global scope. `funcTwo` modifies this global value directly.
// #2.2 If declared with `const` in the global scope, `funcTwo()` will throw a TypeError upon execution due to attempting to reassign a constant variable.

// #3
function funcFour() {
    globalThis.a = "hello";
}

function funcFive() {
    if (typeof alert !== 'undefined') {
        alert(`inside the funcFive function ${globalThis.a}`);
    }
}

// #3.1 Prediction: Alerts "inside the funcFive function hello".
// Explanation: `funcFour()` sets `a` on the global object, making it accessible when `funcFive()` is called.

// #4
let shadowA = 1;
function funcSix() {
    let a = "test";
    if (typeof alert !== 'undefined') {
        alert(`inside the funcSix function ${a}`);
    }
}

// #4.1 Prediction: Alerts "inside the funcSix function test".
// Explanation: Variable shadowing occurs. The local variable `a` inside `funcSix` overrides the outer variable `shadowA`.
// #4.2 If declared with `const` inside `funcSix`, it behaves identically, alerting "inside the funcSix function test" because it declares a new block-scoped constant without reassigning the outer variable.

// #5
let outerA = 2;
if (true) {
    let a = 5;
    if (typeof alert !== 'undefined') {
        alert(`in the if block ${a}`);
    }
}
if (typeof alert !== 'undefined') {
    alert(`outside of the if block ${outerA}`);
}

// #5.1 Prediction:
// First alert: "in the if block 5"
// Second alert: "outside of the if block 2"
// Explanation: `let` is block-scoped. The inner `a` exists only inside the `if` block, leaving the outer `outerA` unaffected.
// #5.2 If replaced with `const` in both declarations, the behavior remains identical because they are treated as two distinct block-scoped variables.

// ==========================================
// 🌟 Exercise 2 : Ternary operator
// ==========================================

const winBattle = () => true;
const experiencePoints = winBattle() ? 10 : 1;
console.log(`Experience Points: ${experiencePoints}`);

// ==========================================
// 🌟 Exercise 3 : Is it a string ?
// ==========================================

const isString = (value) => typeof value === 'string';
console.log(isString('hello')); // true
console.log(isString([1, 2, 4, 0])); // false

// ==========================================
// 🌟 Exercise 4 : Find the sum
// ==========================================

const sum = (a, b) => a + b;

// ==========================================
// 🌟 Exercise 5 : Kg and grams
// ==========================================

// 1. Function Declaration
function convertKgToGramsDeclaration(kg) {
    return kg * 1000;
}
console.log(convertKgToGramsDeclaration(2));

// 2. Function Expression
const convertKgToGramsExpression = function (kg) {
    return kg * 1000;
};
console.log(convertKgToGramsExpression(3));

// 3. Difference: Function declarations are hoisted to the top of their scope, while function expressions are not hoisted and cannot be invoked before their definition.

// 4. One-line Arrow Function
const convertKgToGramsArrow = (kg) => kg * 1000;
console.log(convertKgToGramsArrow(4));

// ==========================================
// 🌟 Exercise 6 : Fortune teller
// ==========================================

if (typeof document !== 'undefined') {
    (() => {
        const numOfChildren = 2;
        const partnerName = 'Alex';
        const location = 'Paris';
        const jobTitle = 'Full-Stack Developer';

        const sentence = `You will be a ${jobTitle} in ${location}, and married to ${partnerName} with ${numOfChildren} kids.`;
        const p = document.createElement('p');
        p.textContent = sentence;
        document.getElementById('output')?.appendChild(p);
    })();
}

// ==========================================
// 🌟 Exercise 7 : Welcome
// ==========================================

if (typeof document !== 'undefined') {
    ((userName) => {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        const userDiv = document.createElement('div');
        userDiv.style.display = 'flex';
        userDiv.style.alignItems = 'center';
        userDiv.style.gap = '8px';

        const span = document.createElement('span');
        span.textContent = `Welcome, ${userName}!`;

        const img = document.createElement('img');
        img.src = 'https://via.placeholder.com/40';
        img.alt = `${userName}'s profile picture`;
        img.style.borderRadius = '50%';

        userDiv.appendChild(img);
        userDiv.appendChild(span);
        navbar.appendChild(userDiv);
    })('John');
}

// ==========================================
// 🌟 Exercise 8 : Juice Bar
// ==========================================

// Part II implementation (includes 6 ingredients via array)
function makeJuice(size) {
    const ingredients = [];

    function addIngredients(first, second, third) {
        ingredients.push(first, second, third);
    }

    function displayJuice() {
        const sentence = `The client wants a ${size} juice, containing ${ingredients.join(', ')}.`;
        if (typeof document !== 'undefined') {
            const p = document.createElement('p');
            p.textContent = sentence;
            document.getElementById('output')?.appendChild(p);
        } else {
            console.log(sentence);
        }
    }

    addIngredients('apple', 'banana', 'orange');
    addIngredients('mango', 'pineapple', 'spinach');
    displayJuice();
}

makeJuice('large');