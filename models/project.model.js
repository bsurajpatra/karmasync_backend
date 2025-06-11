const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  githubLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('https://github.com/');
      },
      message: 'GitHub link must be a valid GitHub URL'
    }
  },
  projectType: {
    type: String,
    enum: ['personal', 'collaborative'],
    default: 'personal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Initialize function to handle index cleanup and creation
projectSchema.statics.initializeIndexes = async function() {
  try {
    // Drop all existing indexes
    await this.collection.dropIndexes();
    console.log('All existing indexes dropped successfully');

    // Create new indexes
    await this.collection.createIndex({ createdBy: 1 });
    await this.collection.createIndex({ 'collaborators.userId': 1 });
    await this.collection.createIndex({ projectType: 1 });
    await this.collection.createIndex(
      { title: 1, createdBy: 1 },
      { unique: true }
    );
    console.log('New indexes created successfully');
  } catch (error) {
    console.error('Error initializing indexes:', error);
    // Don't throw the error as it might prevent the application from starting
  }
};

const Project = mongoose.model('Project', projectSchema);

// Initialize indexes when the model is first loaded
Project.initializeIndexes().catch(console.error);

module.exports = Project;