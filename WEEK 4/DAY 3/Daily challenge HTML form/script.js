document.getElementById('user-form').addEventListener('submit', function (e) {
  // Prevent page refresh on submit
  e.preventDefault();

  // Retrieve input values
  const firstName = document.getElementById('firstname').value.trim();
  const lastName = document.getElementById('lastname').value.trim();

  // Create JS object
  const userData = {
    name: firstName,
    lastname: lastName
  };

  // Convert object to JSON string
  const jsonString = JSON.stringify(userData);

  // Append JSON string to the DOM
  document.getElementById('output').textContent = jsonString;
});