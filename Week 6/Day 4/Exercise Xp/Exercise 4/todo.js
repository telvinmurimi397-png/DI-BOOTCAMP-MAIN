export class TodoList {
  constructor() {
    this.tasks = [];
  }

  addTask(taskName) {
    this.tasks.push({ id: this.tasks.length + 1, task: taskName, completed: false });
    console.log(`Added task: "${taskName}"`);
  }

  markComplete(index) {
    if (this.tasks[index]) {
      this.tasks[index].completed = true;
      console.log(`Marked task "${this.tasks[index].task}" as complete.`);
    } else {
      console.log('Task not found.');
    }
  }

  listTasks() {
    console.log('\n--- Todo List ---');
    this.tasks.forEach((item, idx) => {
      const status = item.completed ? '[X]' : '[ ]';
      console.log(`${idx + 1}. ${status} ${item.task}`);
    });
  }
}