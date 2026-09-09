//Exercise 1: Promise.all()

const promise1 = Promise.resolve(3);
const promise2 = 42; // Non-promise values are automatically wrapped in Promise.resolve()
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 3000, 'foo');
});

Promise.all([promise1, promise2, promise3])
  .then((results) => {
    console.log(results); // Output: [3, 42, "foo"]
  })
  .catch((error) => {
    console.error("An error occurred:", error);
  });


//Exercise 2: Analyse Promise.all()
function timesTwoAsync(x) {
  return new Promise(resolve => resolve(x * 2));
}

const arr = [1, 2, 3];
const promiseArr = arr.map(timesTwoAsync);

Promise.all(promiseArr)
  .then(result => {
    console.log(result);
  });
// Output:
[2, 4, 6]