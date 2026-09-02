// Task objects storage (Bonus I & II included)
const tasks = [];
let idCounter = 0;

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const listTasksDiv = document.querySelector('.listTasks');

// 1. Add Task Function
function addTask(event) {
  event.preventDefault();

  const textValue = taskInput.value.trim();
  if (textValue === '') return;

  const taskObj = {
    task_id: idCounter,
    text: textValue,
    done: false
  };

  tasks.push(taskObj);
  renderTask(taskObj);

  idCounter++;
  taskInput.value = '';
}

// Render individual task element to DOM
function renderTask(taskObj) {
  const taskDiv = document.createElement('div');
  taskDiv.classList.add('task-item');
  taskDiv.setAttribute('data-task-id', taskObj.task_id);

  // 'X' Delete Icon
  const deleteIcon = document.createElement('i');
  deleteIcon.classList.add('fa-solid', 'fa-xmark', 'delete-btn');
  deleteIcon.addEventListener('click', () => deleteTask(taskObj.task_id));

  // Checkbox Input
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `task-${taskObj.task_id}`;
  checkbox.addEventListener('change', () => doneTask(taskObj.task_id, checkbox.checked));

  // Task Label
  const label = document.createElement('label');
  label.htmlFor = `task-${taskObj.task_id}`;
  label.classList.add('task-label');
  label.textContent = taskObj.text;

  // Append elements in order: X button -> Checkbox -> Label
  taskDiv.appendChild(deleteIcon);
  taskDiv.appendChild(checkbox);
  taskDiv.appendChild(label);

  listTasksDiv.appendChild(taskDiv);
}

// 2. Bonus I: Mark Task as Done
function doneTask(taskId, isChecked) {
  const task = tasks.find((t) => t.task_id === taskId);
  if (task) {
    task.done = isChecked;
  }

  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    if (isChecked) {
      taskElement.classList.add('is-done');
    } else {
      taskElement.classList.remove('is-done');
    }
  }
}

// 3. Bonus II: Delete Task from DOM and Array
function deleteTask(taskId) {
  const index = tasks.findIndex((t) => t.task_id === taskId);
  if (index !== -1) {
    tasks.splice(index, 1);
  }

  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.remove();
  }
}

// Form submit event listener
taskForm.addEventListener('submit', addTask);