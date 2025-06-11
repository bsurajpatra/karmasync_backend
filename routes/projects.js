const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/project.model');

// Get all projects for the authenticated user
router.get('/', auth, async (req, res) => {
  console.log('GET /api/projects - Request received');
  try {
    const userId = req.user._id;
    console.log('User ID from auth:', userId);
    
    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    })
    .populate('createdBy', 'fullName')
    .populate('collaborators.userId', 'fullName')
    .sort({ createdAt: -1 });

    console.log('Projects found:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Get a single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { 'collaborators.userId': req.user._id }
      ]
    })
    .populate('createdBy', 'fullName')
    .populate('collaborators.userId', 'fullName');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project' });
  }
});

// Create a new project
router.post('/', auth, async (req, res) => {
  console.log('POST /api/projects - Request received');
  console.log('Request body:', req.body);
  console.log('User from auth:', req.user);
  
  try {
    const { title, description, collaborators } = req.body;
    const userId = req.user._id;

    if (!title) {
      console.log('Validation error: Title is required');
      return res.status(400).json({ message: 'Title is required' });
    }

    const project = new Project({
      title,
      description,
      createdBy: userId,
      collaborators: collaborators || []
    });

    console.log('Project object created:', project);

    const savedProject = await project.save();
    console.log('Project saved successfully:', savedProject);

    await savedProject.populate('createdBy', 'fullName');
    await savedProject.populate('collaborators.userId', 'fullName');

    console.log('Project populated with user details');
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(400).json({ message: 'Error creating project' });
  }
});

// Update a project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { title, description, collaborators, status } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (collaborators) project.collaborators = collaborators;
    if (status) project.status = status;

    const updatedProject = await project.save();
    await updatedProject.populate('createdBy', 'fullName');
    await updatedProject.populate('collaborators.userId', 'fullName');

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(400).json({ message: 'Error updating project' });
  }
});

// Delete a project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

module.exports = router; 