const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const container = document.getElementById("container");

// Switch to Sign Up panel
signUpBtn.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

// Switch back to Sign In panel
signInBtn.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});