const express = require('express');
const router = express.Router();
const { createRequest, getAllRequests } = require('../controllers/requestController');

router.post('/', createRequest);
router.get('/', getAllRequests);

module.exports = router;
