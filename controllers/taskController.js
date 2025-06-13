const Task = require('../models/task.model');
const Project = require('../models/project.model');

// Get all tasks for a project
module.exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId || req.user._id;

    // Check if user has access to the project
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching tasks'
    });
  }
};

// Get a single task by ID
module.exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to view this task'
      });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching task'
    });
  }
};

// Create a new task
module.exports.createTask = async (req, res) => {
  try {
    const { title, description, type, deadline, projectId } = req.body;
    const userId = req.user.userId || req.user._id;

    // Check if user has access to the project
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    const task = new Task({
      title,
      description,
      type,
      deadline,
      projectId,
      assignee: userId,
      status: req.body.status
    });

    const savedTask = await task.save();
    await savedTask.populate('assignee', 'fullName username');

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Create task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: error.message || 'Error creating task'
    });
  }
};

// Update task status
module.exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId || req.user._id;

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to update this task'
      });
    }

    task.status = status;
    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      message: error.message || 'Error updating task status'
    });
  }
};

// Update task details
module.exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId || req.user._id;

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to update this task'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'type', 'deadline', 'status'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        task[key] = updates[key];
      }
    });

    await task.save();
    await task.populate('assignee', 'fullName username');

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: error.message || 'Error updating task'
    });
  }
};

// Delete task
module.exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to delete this task'
      });
    }

    await task.deleteOne();

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: error.message || 'Error deleting task'
    });
  }
};

// Add comment to task
module.exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.userId || req.user._id;

    let task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to comment on this task'
      });
    }

    task.comments.push({
      user: userId,
      text
    });

    await task.save();

    // Fetch the updated task with all populated fields
    task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    res.json(task);
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: error.message || 'Error adding comment'
    });
  }
};

// Delete all tasks for a project
module.exports.deleteTasksByProject = async (projectId) => {
  try {
    const result = await Task.deleteMany({ projectId });
    console.log(`Deleted ${result.deletedCount} tasks for project ${projectId}`);
    return result;
  } catch (error) {
    console.error('Error deleting tasks:', error);
    throw error;
  }
}; 