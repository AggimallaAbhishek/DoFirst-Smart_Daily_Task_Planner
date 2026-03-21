const express = require('express');
const { validateInput } = require('../../../middleware/validateInput');
const {
  createTaskSchema,
  taskIdSchema,
  todayTasksSchema,
  updateTaskSchema
} = require('../validators/taskSchemas');

function createTaskRouter({ taskController, authenticate }) {
  const router = express.Router();

  router.use(authenticate);
  router.get('/', validateInput(todayTasksSchema), taskController.listTodayTasks);
  router.post('/', validateInput(createTaskSchema), taskController.createTask);
  router.get('/suggestion', validateInput(todayTasksSchema), taskController.getSuggestion);
  router.patch('/:id', validateInput(updateTaskSchema), taskController.updateTask);
  router.delete('/:id', validateInput(taskIdSchema), taskController.deleteTask);

  return router;
}

module.exports = {
  createTaskRouter
};
