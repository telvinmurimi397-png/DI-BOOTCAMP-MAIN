const gameInfo = [
  {
    username: "john",
    team: "red",
    score: 5,
    items: ["ball", "book", "pen"]
  },
  {
    username: "becky",
    team: "blue",
    score: 10,
    items: ["tape", "backpack", "pen"]
  },
  {
    username: "susy",
    team: "red",
    score: 55,
    items: ["ball", "eraser", "pen"]
  },
  {
    username: "tyson",
    team: "green",
    score: 1,
    items: ["book", "pen"]
  },
];

// 1. Usernames with exclamation points using forEach
const usernames = [];
gameInfo.forEach(player => {
  usernames.push(`${player.username}!`);
});
console.log(usernames); 
// Output: ["john!", "becky!", "susy!", "tyson!"]

// 2. Winners with score > 5 using forEach
const winners = [];
gameInfo.forEach(player => {
  if (player.score > 5) {
    winners.push(player.username);
  }
});
console.log(winners); 
// Output: ["becky", "susy"]

// 3. Total score using reduce
const totalScore = gameInfo.reduce((acc, player) => acc + player.score, 0);
console.log(totalScore); 
// Output: 71