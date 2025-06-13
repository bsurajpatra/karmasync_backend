const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    serialNumber: {
      type: Number,
      required: true,
      default: 0
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    status: {
      type: String,
      required: true,
      default: 'todo'
    },
    type: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          const predefinedTypes = ['tech', 'review', 'bug', 'feature', 'documentation'];
          // Allow predefined types or custom types that are alphanumeric with hyphens and underscores
          return predefinedTypes.includes(v) || /^[a-zA-Z0-9-_]+$/.test(v);
        },
        message: 'Invalid task type. Must be one of the predefined types or contain only letters, numbers, hyphens, and underscores.'
      }
    },
    deadline: {
      type: Date
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Add indexes for faster queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ deadline: 1 });

// Generate serial number before saving
taskSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    // Find the highest serial number for this project
    const highestTask = await this.constructor.findOne(
      { projectId: this.projectId },
      { serialNumber: 1 },
      { sort: { serialNumber: -1 } }
    );
    
    // Set the new serial number
    this.serialNumber = highestTask ? highestTask.serialNumber + 1 : 1;
    next();
  } catch (error) {
    console.error('Error generating serial number:', error);
    next(error);
  }
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
