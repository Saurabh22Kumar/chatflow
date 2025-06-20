const express = require('express');
const router = express.Router();
const { uploadPhoto, uploadFile, uploadVoice } = require('../controllers/fileControllerLocal');

// Route to upload photos
router.post('/upload-photo', uploadPhoto);

// Route to upload files
router.post('/upload-file', uploadFile);

// Route to upload voice messages
router.post('/upload-file/voice', uploadVoice);

module.exports = router;
