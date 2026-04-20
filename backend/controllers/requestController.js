const requestModel = require('../models/requestModel');

async function getAllRequests(req, res) {
    try {
        const requests = await requestModel.getAllRequests(req.query);
        res.json(requests);
    } catch (err) {
        console.error('Error in getAllRequests:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getFilterOptions(req, res) {
    try {
        const options = await requestModel.getFilterOptions();
        res.json(options);
    } catch (err) {
        console.error('Error in getFilterOptions:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAllRequests, getFilterOptions };
