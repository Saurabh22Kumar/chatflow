# ChatFlow File Sharing Feature

## Overview
ChatFlow now supports sharing photos and files with built-in size validation and modern UI components.

## Features

### Photo Sharing
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Size limit**: 100KB maximum
- **Features**:
  - Auto-compression and optimization via Cloudinary
  - Click to view full-size image in new tab
  - Thumbnail preview in chat
  - File size and name display

### File Sharing
- **Supported formats**: PDF, DOC, DOCX, TXT, ZIP, RAR
- **Size limit**: 200KB maximum
- **Features**:
  - File icon with download link
  - File name and size display
  - Secure cloud storage via Cloudinary
  - Direct download functionality

## How to Use

### Sharing Photos/Files
1. Click the attachment button (📎) in the chat input
2. Select "Photos" for images or "Files" for documents
3. Choose your file from the file picker
4. The file will be automatically uploaded and shared

### Size Validation
- Photos larger than 100KB will be rejected with an error message
- Files larger than 200KB will be rejected with an error message
- Users will see clear feedback about size limits

### Viewing Shared Content
- **Photos**: Display as inline images with click-to-expand
- **Files**: Show as cards with download links
- **Metadata**: File name, size, and upload status are displayed

## Technical Implementation

### Backend
- **File Upload**: Multer middleware for handling multipart form data
- **Storage**: Cloudinary for cloud file storage and optimization
- **Validation**: Server-side file type and size validation
- **API Endpoints**:
  - `POST /api/files/upload-photo` - Photo upload
  - `POST /api/files/upload-file` - File upload

### Frontend
- **File Selection**: Hidden file inputs with type restrictions
- **Upload Progress**: Loading states and user feedback
- **Error Handling**: Toast notifications for validation errors
- **UI Components**: Custom styled file and image message bubbles

### Database Schema
```javascript
message: {
  text: String,
  type: { type: String, enum: ["text", "image", "file", "audio", "video"] },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
}
```

## Configuration

### Cloudinary Setup
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get your credentials from the dashboard
3. Update the environment variables in `/server/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### File Size Limits
You can modify the size limits in `/server/controllers/fileController.js`:
```javascript
const PHOTO_SIZE_LIMIT = 100 * 1024; // 100KB
const FILE_SIZE_LIMIT = 200 * 1024;  // 200KB
```

## Security Features
- Server-side file type validation
- File size limits to prevent abuse
- Secure cloud storage with access controls
- Sanitized file names and metadata

## UI/UX Features
- Smooth animations for file upload states
- Toast notifications for user feedback
- Responsive design for mobile and desktop
- Themed components matching ChatFlow's design system
- Accessibility features (alt text, keyboard navigation)

## Error Handling
- Network connection errors
- File size validation
- File type validation
- Upload failures with retry options
- Clear user feedback for all error states

## Future Enhancements
- Drag and drop file upload
- Multiple file selection
- Image compression options
- File preview for more formats
- Audio/video message support
- File search and filtering
