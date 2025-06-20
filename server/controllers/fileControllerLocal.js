const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Messages = require("../models/messageModel");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const photosDir = path.join(uploadsDir, 'photos');
const filesDir = path.join(uploadsDir, 'files');
const voicesDir = path.join(uploadsDir, 'voices');

if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

if (!fs.existsSync(voicesDir)) {
  fs.mkdirSync(voicesDir, { recursive: true });
}

// Local storage configuration
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, voicesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File size limits (in bytes)
const PHOTO_SIZE_LIMIT = 100 * 1024; // 100KB
const FILE_SIZE_LIMIT = 200 * 1024; // 200KB
const VOICE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

// Multer configurations
const photoUpload = multer({
  storage: photoStorage,
  limits: {
    fileSize: PHOTO_SIZE_LIMIT
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
  }
});

const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: FILE_SIZE_LIMIT
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

const voiceUpload = multer({
  storage: voiceStorage,
  limits: {
    fileSize: VOICE_SIZE_LIMIT
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/m4a'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Upload photo handler
module.exports.uploadPhoto = async (req, res, next) => {
  try {
    photoUpload.single('photo')(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            msg: 'Photo size must be less than 100KB',
            error: 'FILE_TOO_LARGE' 
          });
        }
        return res.status(400).json({ 
          msg: err.message,
          error: 'UPLOAD_ERROR' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          msg: 'No photo file provided',
          error: 'NO_FILE' 
        });
      }

      const { from, to } = req.body;
      
      if (!from || !to) {
        return res.status(400).json({ 
          msg: 'Missing sender or recipient information',
          error: 'MISSING_DATA' 
        });
      }

      // Create file URL for local storage
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/photos/${req.file.filename}`;

      // Create message with photo
      const messageData = await Messages.create({
        message: {
          text: `📷 Photo`,
          type: 'image',
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size
        },
        users: [from, to],
        sender: from,
        status: "sent"
      });

      if (messageData) {
        return res.json({
          msg: "Photo uploaded successfully",
          messageId: messageData._id,
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          status: messageData.status
        });
      } else {
        return res.status(500).json({ 
          msg: "Failed to save photo message",
          error: 'DATABASE_ERROR' 
        });
      }
    });
  } catch (ex) {
    next(ex);
  }
};

// Upload file handler
module.exports.uploadFile = async (req, res, next) => {
  try {
    fileUpload.single('file')(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            msg: 'File size must be less than 200KB',
            error: 'FILE_TOO_LARGE' 
          });
        }
        return res.status(400).json({ 
          msg: err.message,
          error: 'UPLOAD_ERROR' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          msg: 'No file provided',
          error: 'NO_FILE' 
        });
      }

      const { from, to } = req.body;
      
      if (!from || !to) {
        return res.status(400).json({ 
          msg: 'Missing sender or recipient information',
          error: 'MISSING_DATA' 
        });
      }

      // Create file URL for local storage
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/files/${req.file.filename}`;

      // Create message with file
      const messageData = await Messages.create({
        message: {
          text: `📎 ${req.file.originalname}`,
          type: 'file',
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size
        },
        users: [from, to],
        sender: from,
        status: "sent"
      });

      if (messageData) {
        return res.json({
          msg: "File uploaded successfully",
          messageId: messageData._id,
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          status: messageData.status
        });
      } else {
        return res.status(500).json({ 
          msg: "Failed to save file message",
          error: 'DATABASE_ERROR' 
        });
      }
    });
  } catch (ex) {
    next(ex);
  }
};

// Helper function to format file size
module.exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Upload voice message handler
module.exports.uploadVoice = async (req, res, next) => {
  console.log('Voice upload request received:', {
    files: req.files,
    file: req.file,
    body: req.body,
    headers: req.headers
  });
  
  try {
    voiceUpload.single('voice')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            msg: 'Voice message size must be less than 5MB',
            error: 'FILE_TOO_LARGE' 
          });
        }
        return res.status(400).json({ 
          msg: err.message,
          error: 'UPLOAD_ERROR' 
        });
      }

      console.log('File processed by multer:', req.file);

      if (!req.file) {
        return res.status(400).json({ 
          msg: 'No voice file provided',
          error: 'NO_FILE' 
        });
      }

      const { from, to } = req.body;
      
      if (!from || !to) {
        return res.status(400).json({ 
          msg: 'Missing sender or recipient information',
          error: 'MISSING_DATA' 
        });
      }

      // Create file URL for local storage
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/voices/${req.file.filename}`;

      console.log('Creating voice message in database:', {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        from,
        to
      });

      // Create message with voice
      const messageData = await Messages.create({
        message: {
          text: `🎵 Voice message`,
          type: 'voice',
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size
        },
        users: [from, to],
        sender: from,
        status: "sent"
      });

      if (messageData) {
        console.log('Voice message saved successfully:', messageData._id);
        return res.json({
          msg: "Voice message uploaded successfully",
          messageId: messageData._id,
          fileUrl: fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          status: messageData.status
        });
      } else {
        return res.status(500).json({ 
          msg: "Failed to save voice message",
          error: 'DATABASE_ERROR' 
        });
      }
    });
  } catch (ex) {
    console.error('Voice upload error:', ex);
    next(ex);
  }
};
