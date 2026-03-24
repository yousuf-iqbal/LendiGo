const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
// Simple verifyToken middleware for now
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // For now, just pass through
  req.userID = 1; // Temporary user ID
  next();
};
router.get('/', requestController.getAllRequests);
router.get('/filters', requestController.getFilterOptions);
router.get('/my', verifyToken, requestController.getMyRequests);
router.get('/:id', requestController.getRequestById);
router.post('/', verifyToken, requestController.createRequest);
router.put('/:id', verifyToken, requestController.updateRequest);
router.delete('/:id', verifyToken, requestController.deleteRequest);
router.patch('/:id/close', verifyToken, requestController.closeRequest);
module.exports = router;
