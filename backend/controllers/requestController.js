const requestModel = require('../models/requestModel');

// ── CREATE ────────────────────────────────────────────────────────────────────
async function createRequest(req, res) {
  try {
    const { title, description, categoryId, startDate, endDate, maxBudget, city, area } = req.body;
    
    // Validation
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
    if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ error: 'End date must be after start date' });
    if (maxBudget && maxBudget < 0) return res.status(400).json({ error: 'Budget cannot be negative' });

    const requestId = await requestModel.createRequest({
      title: title.trim(),
      description: description?.trim(),
      categoryId,
      startDate,
      endDate,
      maxBudget: maxBudget ? parseFloat(maxBudget) : null,
      city: city?.trim(),
      area: area?.trim(),
    }, req.userID);

    res.status(201).json({ 
      message: 'Request created successfully', 
      requestId,
      request: { title, startDate, endDate, maxBudget }
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message || 'Failed to create request' });
  }
}

// ── READ ─────────────────────────────────────────────────────────────────────
async function getAllRequests(req, res) {
  try {
    const requests = await requestModel.getAllRequests(req.query);
    res.json(requests);
  } catch (err) {
    console.error('Get all requests error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch requests' });
  }
}

async function getRequestById(req, res) {
  try {
    const request = await requestModel.getRequestById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    console.error('Get request by ID error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch request' });
  }
}

async function getMyRequests(req, res) {
  try {
    const requests = await requestModel.getRequestsByUser(req.userID);
    res.json(requests);
  } catch (err) {
    console.error('Get my requests error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch your requests' });
  }
}

async function getFilterOptions(req, res) {
  try {
    const options = await requestModel.getFilterOptions();
    res.json(options);
  } catch (err) {
    console.error('Get filter options error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch filter options' });
  }
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
async function updateRequest(req, res) {
  try {
    const { title, description, categoryId, startDate, endDate, maxBudget, city, area } = req.body;
    
    // Validation
    if (title && !title.trim()) return res.status(400).json({ error: 'Title cannot be empty' });
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    await requestModel.updateRequest(req.params.id, {
      title: title?.trim(),
      description: description?.trim(),
      categoryId,
      startDate,
      endDate,
      maxBudget: maxBudget ? parseFloat(maxBudget) : null,
      city: city?.trim(),
      area: area?.trim(),
    }, req.userID);

    res.json({ message: 'Request updated successfully' });
  } catch (err) {
    console.error('Update request error:', err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to update request' });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'fulfilled', 'closed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    await requestModel.updateRequestStatus(req.params.id, status, req.userID);
    res.json({ message: `Request marked as ${status}` });
  } catch (err) {
    console.error('Update request status error:', err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to update request status' });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function deleteRequest(req, res) {
  try {
    await requestModel.deleteRequest(req.params.id, req.userID);
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    console.error('Delete request error:', err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to delete request' });
  }
}

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  getFilterOptions,
  updateRequest,
  updateRequestStatus,
  deleteRequest,
};