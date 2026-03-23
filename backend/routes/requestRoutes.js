const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const {verifyToken} = require('../middleware/verifyToken');

router.get('/', requestController.getAllRequests);
router.get('/filters', requestController.getFilterOptions);
router.get('/my', verifyToken, requestController.getMyRequests);
router.get('/:id', requestController.getRequestById);

router.post('/', verifyToken, requestController.createRequest);
router.put('/:id', verifyToken, requestController.updateRequest);
router.delete('/:id', verifyToken, requestController.deleteRequest);
router.patch('/:id/close', verifyToken, requestController.closeRequest);

module.exports = router;