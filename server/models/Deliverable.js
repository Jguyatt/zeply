import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['content', 'design', 'campaign', 'report', 'strategy', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'review', 'completed', 'rejected'],
    default: 'pending'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  files: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
deliverableSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Deliverable = mongoose.model('Deliverable', deliverableSchema);

export default Deliverable;

