import { TodoList } from './todo.js';

const myTodoList = new TodoList();

myTodoList.addTask('Buy groceries');
myTodoList.addTask('Complete Node.js exercises');
myTodoList.addTask('Clean desk');

myTodoList.markComplete(1); // Complete task 2
myTodoList.listTasks();