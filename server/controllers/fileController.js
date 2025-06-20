const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Messages = require("../models/messageModel");

// Configure Cloudinary (you'll need to set these environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Configure storage for different file types
const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatflow/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  }
});

const fileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatflow/files',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar'],
    resource_type: 'raw'
  }
});

// File size limits (in bytes)
const PHOTO_SIZE_LIMIT = 100 * 1024; // 100KB
const FILE_SIZE_LIMIT = 200 * 1024; // 200KB

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

      // Create message with photo
      const messageData = await Messages.create({
        message: {
          text: `📷 Photo`,
          type: 'image',
          fileUrl: req.file.path,
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
          fileUrl: req.file.path,
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

      // Create message with file
      const messageData = await Messages.create({
        message: {
          text: `📎 ${req.file.originalname}`,
          type: 'file',
          fileUrl: req.file.path,
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
          fileUrl: req.file.path,
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
