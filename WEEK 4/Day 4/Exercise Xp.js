//Exercise 1: Comparison

function compareToTen(num) {
  return new Promise((resolve, reject) => {
    if (num <= 10) {
      resolve(`${num} is less than or equal to 10`);
    } else {
      reject(`${num} is greater than 10`);
    }
  });
}

// Test: Should reject
compareToTen(15)
  .then(result => console.log(result))
  .catch(error => console.log(error));

// Test: Should resolve
compareToTen(8)
  .then(result => console.log(result))
  .catch(error => console.log(error));
//Exercise 2: Promises   


const delayedPromise = new Promise((resolve) => {
  setTimeout(() => {
    resolve("success");
  }, 4000);
});

delayedPromise.then(result => console.log(result));
//Exercise 3: Resolve & Reject

// 1. Resolves immediately with value 3
const resolvedPromise = Promise.resolve(3);

resolvedPromise.then(value => console.log(value));

// 2. Rejects immediately with "Boo!"
const rejectedPromise = Promise.reject("Boo!");

rejectedPromise.catch(error => console.log(error));