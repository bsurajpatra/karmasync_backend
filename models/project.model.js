const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    sparse: true
  },
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
  customBoards: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
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

// Generate short ID before saving
projectSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    // Generate a short hash using bcrypt
    const salt = await bcrypt.genSalt(4); // Using a smaller salt for shorter hash
    const hash = await bcrypt.hash(Date.now().toString(), salt);
    // Take first 8 characters and remove any non-alphanumeric characters
    this.shortId = hash.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '');
    next();
  } catch (error) {
    next(error);
  }
});

const Project = mongoose.model('Project', projectSchema);

// Initialize indexes when the model is first loaded
Project.initializeIndexes().catch(console.error);

module.exports = Project;