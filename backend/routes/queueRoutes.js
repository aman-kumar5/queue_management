const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

router.get('/status', queueController.getQueueStatus);
router.post('/settings', queueController.updateSettings);
router.post('/call-next', queueController.callNext);
router.post('/mark-completed', queueController.markCompleted);
router.post('/skip-current', queueController.skipToken);
router.post('/reset', queueController.resetQueue);

module.exports = router;
