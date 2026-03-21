const Joi = require('joi');

const taskId = Joi.string().guid({ version: 'uuidv4' }).required();
const title = Joi.string().trim().max(255).min(1);
const priority = Joi.string().valid('high', 'medium', 'low');
const estimatedMinutes = Joi.number().integer().valid(15, 30, 60);
const taskDate = Joi.date().iso();

const createTaskSchema = Joi.object({
  body: Joi.object({
    title: title.required(),
    priority: priority.required(),
    estimatedMinutes: estimatedMinutes.required(),
    taskDate
  }).required(),
  params: Joi.object({}).unknown(false),
  query: Joi.object({}).unknown(false)
});

const updateTaskSchema = Joi.object({
  body: Joi.object({
    title,
    priority,
    estimatedMinutes,
    isCompleted: Joi.boolean()
  })
    .min(1)
    .required(),
  params: Joi.object({
    id: taskId
  }).required(),
  query: Joi.object({}).unknown(false)
});

const taskIdSchema = Joi.object({
  body: Joi.object({}).unknown(false),
  params: Joi.object({
    id: taskId
  }).required(),
  query: Joi.object({}).unknown(false)
});

const todayTasksSchema = Joi.object({
  body: Joi.object({}).unknown(false),
  params: Joi.object({}).unknown(false),
  query: Joi.object({}).unknown(false)
});

module.exports = {
  createTaskSchema,
  taskIdSchema,
  todayTasksSchema,
  updateTaskSchema
};
