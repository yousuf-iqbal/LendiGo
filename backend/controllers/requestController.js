const requestModel = require('../models/requestModel');

// GET /api/requests
async function getAllRequests(req, res) {
  try {
    const { search, status, category, city, area, minBudget, maxBudget } = req.query;
    const requests = await requestModel.getAllRequests({ search, status, category, city, area, minBudget, maxBudget });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// GET /api/requests/filters
async function getFilterOptions(req, res) {
  try {
    const options = await requestModel.getFilterOptions();
    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not fetch filters' });
  }
}

// GET /api/requests/my
async function getMyRequests(req, res) {
  try {
    const requests = await requestModel.getRequestsByUser(req.userID);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// GET /api/requests/:id
async function getRequestById(req, res) {
  try {
    const request = await requestModel.getRequestById(req.params.id);
    if (!request) return res.status(404).json({ error: 'request not found' });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// POST /api/requests
async function createRequest(req, res) {
  try {
    const { categoryID, title, description, city, area, startDate, endDate, maxBudget } = req.body;
    
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!description || description.length < 5)
      return res.status(400).json({ error: 'description must be at least 5 characters' });
    if (!startDate || !endDate)
      return res.status(400).json({ error: 'startDate and endDate are required' });
    
    const request = await requestModel.createRequest({
      requesterID: req.userID,
      categoryID, title, description, city, area, startDate, endDate, maxBudget
    });
    res.status(201).json({ request });
  } catch (err) {
    console.error('ERROR in createRequest:', err);
    res.status(500).json({ error: 'server error: ' + err.message });
  }
}

// PUT /api/requests/:id
async function updateRequest(req, res) {
  try {
    const { categoryID, title, description, city, area, startDate, endDate, maxBudget } = req.body;
    const result = await requestModel.updateRequest(
      req.params.id, req.userID,
      { categoryID, title, description, city, area, startDate, endDate, maxBudget }
    );
    if (result?.error) return res.status(result.status).json({ error: result.error });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// DELETE /api/requests/:id
async function deleteRequest(req, res) {
  try {
    const result = await requestModel.deleteRequest(req.params.id, req.userID);
    if (result?.error) return res.status(result.status).json({ error: result.error });
    res.json({ message: 'request deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// PATCH /api/requests/:id/close
async function closeRequest(req, res) {
  try {
    const request = await requestModel.closeRequest(req.params.id, req.userID);
    if (!request) return res.status(404).json({ error: 'request not found or not your request' });
    res.json({ message: 'request closed', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = {
  getAllRequests, getFilterOptions, getMyRequests,
  getRequestById, createRequest, updateRequest,
  deleteRequest, closeRequest
};