const Project = require('../models/project.model');

// Create a new project
exports.createProject = async (req, res) => {
  try {
    console.log('Creating project with data:', req.body);
    const { title, description, githubLink, projectType } = req.body;
    const userId = req.user.userId || req.user._id;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const project = new Project({
      title,
      description,
      githubLink,
      projectType: projectType || 'personal',
      createdBy: userId,
      collaborators: [{
        userId,
        role: 'admin'
      }],
      status: 'active'
    });

    console.log('Project object created:', project);
    const savedProject = await project.save();
    console.log('Project saved successfully:', savedProject);

    await savedProject.populate('createdBy', 'fullName username');
    await savedProject.populate('collaborators.userId', 'fullName username');

    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You already have a project with this title'
      });
    }
    res.status(500).json({
      message: error.message || 'Error creating project'
    });
  }
};

// Get all projects where user is a collaborator
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    })
    .populate('createdBy', 'fullName username')
    .populate('collaborators.userId', 'fullName username')
    .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching projects'
    });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    })
    .populate('createdBy', 'fullName username')
    .populate('collaborators.userId', 'fullName username');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching project'
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description } = req.body;

    const project = await Project.findOne({
      _id: id,
      'collaborators.userId': userId,
      'collaborators.role': 'project-manager'
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have permission to update'
      });
    }

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;

    await project.save();

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      message: error.message || 'Error updating project'
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      _id: id,
      'collaborators.userId': userId,
      'collaborators.role': 'project-manager'
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have permission to delete'
      });
    }

    await project.deleteOne();

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      message: error.message || 'Error deleting project'
    });
  }
};

// Add custom board
exports.addCustomBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    // Generate board ID from name
    const boardId = name.toLowerCase().replace(/\s+/g, '-');

    // Check if board with same ID already exists
    if (project.customBoards && project.customBoards.some(board => board.id === boardId)) {
      return res.status(400).json({
        message: 'A board with this name already exists'
      });
    }

    // Add new board
    project.customBoards = project.customBoards || [];
    project.customBoards.push({
      id: boardId,
      name
    });

    await project.save();

    res.json({
      id: boardId,
      name
    });
  } catch (error) {
    console.error('Add custom board error:', error);
    res.status(500).json({
      message: error.message || 'Error adding custom board'
    });
  }
};

// Update custom board
exports.updateCustomBoard = async (req, res) => {
  try {
    const { id, boardId } = req.params;
    const { name } = req.body;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    const board = project.customBoards.find(b => b.id === boardId);
    if (!board) {
      return res.status(404).json({
        message: 'Board not found'
      });
    }

    board.name = name;
    await project.save();

    res.json(board);
  } catch (error) {
    console.error('Update custom board error:', error);
    res.status(500).json({
      message: error.message || 'Error updating custom board'
    });
  }
};

// Delete custom board
exports.deleteCustomBoard = async (req, res) => {
  try {
    const { id, boardId } = req.params;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    // Remove board
    project.customBoards = project.customBoards.filter(board => board.id !== boardId);
    await project.save();

    res.json({
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Delete custom board error:', error);
    res.status(500).json({
      message: error.message || 'Error deleting custom board'
    });
  }
}; 