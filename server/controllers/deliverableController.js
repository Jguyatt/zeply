import Deliverable from '../models/Deliverable.js';

// @desc    Get all deliverables
// @route   GET /api/deliverables
// @access  Private
export const getDeliverables = async (req, res) => {
  try {
    let query = {};

    // If client, only show their deliverables
    if (req.user.role === 'client') {
      query.client = req.user._id;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by client if admin
    if (req.user.role === 'admin' && req.query.clientId) {
      query.client = req.query.clientId;
    }

    const deliverables = await Deliverable.find(query)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliverables.length,
      deliverables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single deliverable
// @route   GET /api/deliverables/:id
// @access  Private
export const getDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findById(req.params.id)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name email');

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found'
      });
    }

    // Check if client can access this deliverable
    if (req.user.role === 'client' && deliverable.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      deliverable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create deliverable
// @route   POST /api/deliverables
// @access  Private/Admin
export const createDeliverable = async (req, res) => {
  try {
    const { title, description, type, client, dueDate, assignedTo } = req.body;

    const deliverable = await Deliverable.create({
      title,
      description,
      type,
      client,
      dueDate,
      assignedTo,
      createdBy: req.user._id
    });

    const populatedDeliverable = await Deliverable.findById(deliverable._id)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      deliverable: populatedDeliverable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update deliverable
// @route   PUT /api/deliverables/:id
// @access  Private
export const updateDeliverable = async (req, res) => {
  try {
    let deliverable = await Deliverable.findById(req.params.id);

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found'
      });
    }

    // Clients can only update status to 'review' or add notes
    if (req.user.role === 'client') {
      if (deliverable.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      // Only allow status update to 'review'
      if (req.body.status && req.body.status !== 'review') {
        return res.status(403).json({
          success: false,
          message: 'Clients can only submit deliverables for review'
        });
      }
    }

    const { title, description, type, status, dueDate, assignedTo, files } = req.body;

    deliverable = await Deliverable.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        type,
        status,
        dueDate,
        assignedTo,
        files,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // Set completedDate if status is completed
    if (status === 'completed' && !deliverable.completedDate) {
      deliverable.completedDate = Date.now();
      await deliverable.save();
    }

    res.status(200).json({
      success: true,
      deliverable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete deliverable
// @route   DELETE /api/deliverables/:id
// @access  Private/Admin
export const deleteDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findById(req.params.id);

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found'
      });
    }

    await deliverable.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Deliverable deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add note to deliverable
// @route   POST /api/deliverables/:id/notes
// @access  Private
export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    const deliverable = await Deliverable.findById(req.params.id);

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found'
      });
    }

    // Check access
    if (req.user.role === 'client' && deliverable.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    deliverable.notes.push({
      text,
      createdBy: req.user._id
    });

    await deliverable.save();

    const populatedDeliverable = await Deliverable.findById(deliverable._id)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name email');

    res.status(200).json({
      success: true,
      deliverable: populatedDeliverable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

