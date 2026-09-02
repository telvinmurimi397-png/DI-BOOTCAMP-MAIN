let client = "John";

const groceries = {
    fruits : ["pear", "apple", "banana"],
    vegetables: ["tomatoes", "cucumber", "salad"],
    totalPrice : "20$",
    other : {
        paid : true,
        meansOfPayment : ["cash", "creditCard"]
    }
};

// 1. Display Groceries Function
const displayGroceries = () => {
    groceries.fruits.forEach((fruit) => console.log(fruit));
};

// Call to test display function
displayGroceries();

// 2. Clone Groceries Function
const cloneGroceries = () => {
    // Copy primitive value
    let user = client;
    client = "Betty";
    // Explanation: We will NOT see "Betty" in the `user` variable.
    // Reason: `client` holds a primitive string value (passed by value). 
    // Assigning `user = client` creates an independent copy in memory.

    // Copy reference value
    let shopping = groceries;

    // Modify top-level property
    groceries.totalPrice = "35$";
    // Explanation: YES, we will see this modification in the `shopping` object.
    // Reason: Objects are passed by reference. Both `shopping` and `groceries` point to the exact same memory address.

    // Modify nested property
    groceries.other.paid = false;
    // Explanation: YES, we will see this modification in the `shopping` object as well.
    // Reason: Since `shopping` and `groceries` reference the exact same object in memory, changing nested properties via `groceries` reflects in `shopping`.

    console.log("user:", user); // Output: "John"
    console.log("client:", client); // Output: "Betty"
    console.log("shopping totalPrice:", shopping.totalPrice); // Output: "35$"
    console.log("shopping paid:", shopping.other.paid); // Output: false
};

// 3. Invoke cloneGroceries
cloneGroceries();