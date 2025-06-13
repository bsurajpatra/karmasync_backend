const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Get all tasks for a project
router.get('/projects/:projectId/tasks', auth, taskController.getTasksByProject);

// Get a single task by ID
router.get('/tasks/:id', auth, taskController.getTaskById);

// Create a new task
router.post('/tasks', auth, taskController.createTask);

// Update task status
router.patch('/tasks/:id', auth, taskController.updateTaskStatus);

// Update task details
router.put('/tasks/:id', auth, taskController.updateTask);

// Delete task
router.delete('/tasks/:id', auth, taskController.deleteTask);

// Add comment to task
router.post('/tasks/:id/comments', auth, taskController.addComment);

module.exports = router;
