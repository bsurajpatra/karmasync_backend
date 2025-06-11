const Project = require('../models/Project');

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    const project = new Project({
      title,
      description,
      createdBy: userId,
      collaborators: [{
        userId,
        role: 'project-manager'
      }]
    });

    await project.save();

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
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