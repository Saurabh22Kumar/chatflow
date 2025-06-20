# ChatFlow Client - Modern Real-Time Communication Platform 🚀

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/saurabhkumar/chatflow)
[![React](https://img.shields.io/badge/react-17.0.2-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

A cutting-edge React.js frontend client for the ChatFlow communication platform, featuring real-time messaging, video calls, file sharing, and innovative chat experiences with a beautiful, responsive design.

## 🌟 **What Makes ChatFlow Client Special**

- ⚡ **Real-Time Everything** - Instant messaging, live typing indicators, and real-time status updates
- 🎨 **Beautiful UI/UX** - Modern design system with dark/light themes and smooth animations
- 📱 **Mobile-First** - Fully responsive design optimized for all screen sizes
- 🎥 **Video & Voice Calls** - High-quality WebRTC-based communication with call history
- 📁 **Smart File Sharing** - Drag & drop file uploads with preview and progress tracking
- 🔒 **Advanced Security** - Secure authentication with email verification and OTP
- 🎯 **Smart Features** - Message reactions, typing indicators, and read receipts
- 🌐 **PWA Ready** - Progressive Web App capabilities for native-like experience

---

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **ChatFlow Server** running (see server documentation)

### Installation

```bash
# Clone the repository (if not already cloned)
git clone https://github.com/saurabhkumar/chatflow.git
cd chatflow/public

# Install dependencies
npm install
# or
yarn install

# Start development server
npm start
# or
yarn start
```

### Environment Setup

Create a `.env` file in the `public` directory:

```env
# React App Configuration
REACT_APP_LOCALHOST_KEY=chat-app-current-user
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Optional: Analytics & Monitoring
REACT_APP_ANALYTICS_ID=your-analytics-id
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

---

## 🏗️ **Project Structure**

```
public/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ChatContainer.jsx     # Main chat interface
│   │   ├── ChatInput.jsx         # Message input with file upload
│   │   ├── Contacts.jsx          # Contact list with search
│   │   ├── VideoCallModal.jsx    # Video calling interface
│   │   ├── MessageStatus.jsx     # Message delivery status
│   │   ├── Settings.jsx          # User preferences
│   │   └── ...
│   ├── pages/               # Main application pages
│   │   ├── Chat.jsx             # Main chat dashboard
│   │   ├── Login.jsx            # Authentication page
│   │   ├── Register.jsx         # User registration
│   │   └── ...
│   ├── contexts/            # React Context providers
│   │   └── ThemeContext.js      # Theme management
│   ├── utils/              # Utility functions
│   │   ├── APIRoutes.js         # API endpoint definitions
│   │   └── ...
│   ├── assets/             # Static assets
│   ├── styles/             # Global styles and design system
│   └── hooks/              # Custom React hooks
├── public/                 # Static files
└── package.json           # Dependencies and scripts
```

---

## ✨ **Core Features**

### 🔐 **Authentication & Security**
- **Secure Registration** - Email verification with OTP
- **JWT Authentication** - Token-based secure sessions
- **Password Management** - Forgot password with email recovery
- **Profile Setup** - Avatar selection and profile customization
- **Session Management** - Automatic token refresh and logout

### 💬 **Real-Time Messaging**
- **Instant Messages** - Lightning-fast message delivery
- **Message Types** - Text, images, files, voice messages
- **Message Status** - Sent, delivered, read indicators
- **Typing Indicators** - See when someone is typing
- **Message Reactions** - Express yourself with reactions
- **Message Deletion** - Delete for me or everyone
- **Message Search** - Find messages quickly
- **Call History Deletion** - Manage call records with smart selection

### 🎥 **Video & Voice Calls**
- **HD Video Calls** - High-quality video communication
- **Voice Calls** - Crystal clear audio calls
- **Call Controls** - Mute, camera toggle, screen share
- **Call History** - Track call duration and status
- **Call Notifications** - Incoming call alerts
- **Call Quality** - Adaptive quality based on connection

### 📁 **File & Media Sharing**
- **Drag & Drop Upload** - Easy file sharing
- **Image Preview** - In-chat image viewing
- **File Progress** - Upload progress tracking
- **Multiple Formats** - Support for various file types
- **File Size Validation** - Smart file size limits
- **Voice Messages** - Record and send voice notes

### 👥 **Contact Management**
- **Friend System** - Add and manage friends
- **User Search** - Find users by username
- **Online Status** - See who's online
- **User Profiles** - View detailed user information
- **Block/Unblock** - Privacy controls
- **Contact Organization** - Smart contact sorting

### 🎨 **UI/UX & Personalization**
- **Dark/Light Themes** - Toggle between themes
- **Responsive Design** - Perfect on all devices
- **Smooth Animations** - Delightful micro-interactions
- **Custom Avatars** - Personalized profile pictures
- **Notification System** - Smart notifications
- **Accessibility** - WCAG compliant design

---

## 🛠️ **Tech Stack & Dependencies**

### **Core Technologies**
- **React 17.0.2** - Frontend framework
- **Socket.IO Client** - Real-time communication
- **Styled Components** - CSS-in-JS styling
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls

### **Key Dependencies**

```json
{
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "socket.io-client": "^4.4.1",
    "styled-components": "^5.3.3",
    "axios": "^0.28.1",
    "react-router-dom": "^6.2.1",
    "react-icons": "^4.3.1",
    "emoji-picker-react": "^3.5.1",
    "simple-peer": "^9.11.1",
    "uuid": "^8.3.2",
    "react-toastify": "^8.1.1",
    "@multiavatar/multiavatar": "^1.0.7"
  }
}
```

### **Development Tools**
- **CRACO** - Create React App Configuration Override
- **ESLint** - Code linting and formatting
- **Web Vitals** - Performance monitoring
- **Testing Library** - Component testing utilities

---

## 📱 **Available Scripts**

```bash
# Development
npm start          # Start development server (http://localhost:3000)
npm test           # Run test suite in watch mode
npm run build      # Build for production
npm run build-vercel  # Build for Vercel deployment (CI=false)

# Advanced
npm run eject      # Eject from Create React App (one-way operation)
```

---

## 🔧 **Configuration & Customization**

### **Theme Customization**

The app supports extensive theming through the `ThemeContext`:

```javascript
// src/contexts/ThemeContext.js
const themes = {
  light: {
    primary: '#6366f1',
    background: '#ffffff',
    surface: '#f8fafc',
    // ... more theme properties
  },
  dark: {
    primary: '#00ff88',
    background: '#0f172a',
    surface: '#1e293b',
    // ... more theme properties
  }
};
```

### **API Configuration**

Update API endpoints in `src/utils/APIRoutes.js`:

```javascript
export const host = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const sendMessageRoute = `${host}/api/messages/addmsg`;
// ... more routes
```

### **Socket Configuration**

Socket.IO connection is configured in the main Chat component:

```javascript
useEffect(() => {
  if (currentUser) {
    socket.current = io(process.env.REACT_APP_SOCKET_URL || host);
    socket.current.emit("add-user", currentUser._id);
  }
}, [currentUser]);
```

---

## 🚀 **Deployment**

### **Production Build**

```bash
# Create optimized production build
npm run build

# The build folder contains the optimized app
# Deploy the contents to your web server
```

### **Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Or use the build-vercel script
npm run build-vercel
```

### **Railway.app Deployment (Full-Stack)**

#### **Step-by-Step Railway Deployment**

**1. Project Structure for Railway**
Ensure your project has this structure:
```
chatflow/
├── server/              # Backend (Node.js/Express)
│   ├── package.json
│   ├── server.js       # Main server file
│   └── ...
├── public/             # Frontend (React)
│   ├── package.json
│   ├── src/
│   └── build/         # Generated after npm run build
├── railway.json       # Railway configuration
└── README.md
```

**2. Railway Configuration Files**

Create `railway.json` in your project root:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**3. Environment Variables Setup**

**Backend Environment Variables:**
```env
NODE_ENV=production
PORT=8080
MONGO_URI=${{Railway.MONGO_URI}}
JWT_SECRET=your-jwt-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CORS_ORIGIN=${{Railway.RAILWAY_STATIC_URL}}
```

**Frontend Environment Variables:**
```env
REACT_APP_API_URL=${{Railway.RAILWAY_STATIC_URL}}
REACT_APP_SOCKET_URL=${{Railway.RAILWAY_STATIC_URL}}
REACT_APP_LOCALHOST_KEY=chat-app-current-user
REACT_APP_DEMO_MODE=true
```

**4. Quick Railway Deployment Commands**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Add MongoDB database
railway add --database mongodb

# Deploy backend
cd server
railway up

# Deploy frontend (as static site or served by backend)
cd ../public
npm run build
# Frontend will be served by your Express server
```

---

## 🔍 **Key Components Documentation**

### **ChatContainer.jsx**
The main chat interface component handling:
- Message display and rendering
- Real-time message updates
- Video call integration
- Message selection and deletion
- File upload handling
- Typing indicators

### **ChatInput.jsx**
Advanced message input component featuring:
- Rich text input with emoji picker
- File drag & drop upload
- Voice message recording
- Message composition features
- Auto-resize textarea

### **VideoCallModal.jsx**
Full-featured video calling interface:
- WebRTC video/audio streams
- Call controls (mute, camera, end call)
- Screen sharing capabilities
- Call quality indicators
- Call history integration

### **Contacts.jsx**
Smart contact management:
- Real-time online status
- User search and filtering
- Friend request system
- Contact organization
- Quick actions menu

---

## 🧪 **Testing**

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test ChatContainer.test.js
```

### **Testing Structure**

```
src/
├── __tests__/              # Test files
├── components/
│   └── __tests__/          # Component tests
└── utils/
    └── __tests__/          # Utility tests
```

---

## 🔧 **Browser Support**

### **Supported Browsers**
- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)
- **Mobile browsers** (iOS Safari, Chrome Mobile)

### **Required Features**
- WebRTC support (for video calls)
- WebSocket support (for real-time messaging)
- ES6+ support
- Local Storage
- File API (for file uploads)

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Connection Issues**
```bash
# Check if the server is running
curl http://localhost:5000/health

# Verify environment variables
echo $REACT_APP_API_URL
```

#### **Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
npm start -- --reset-cache
```

#### **WebRTC Issues**
- Ensure HTTPS in production (required for WebRTC)
- Check camera/microphone permissions
- Verify STUN/TURN server configuration

### **Debug Mode**

Enable debug logging:

```javascript
// Add to .env
REACT_APP_DEBUG=true

// Or set in code
localStorage.setItem('debug', 'socket.io-client:*');
```

---

## 🔄 **Version History**

### **v2.0.0** (Current)
- ✅ Complete UI/UX redesign
- ✅ Advanced message deletion system
- ✅ Call history management
- ✅ Enhanced video calling
- ✅ Mobile-first responsive design
- ✅ Theme system improvements

### **v1.x.x**
- Basic messaging functionality
- User authentication
- File sharing
- Video calls

---

## 🤝 **Contributing**

### **Development Setup**

```bash
# Fork the repository
git clone https://github.com/yourusername/chatflow.git
cd chatflow/public

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/amazing-feature

# Start development
npm start
```

### **Code Style**

- Use **ESLint** configuration provided
- Follow **React best practices**
- Use **styled-components** for styling
- Write **meaningful commit messages**
- Add **tests** for new features

### **Pull Request Process**

1. Update documentation for new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update version numbers appropriately
5. Create detailed pull request description

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ **Support & Contact**

- **Issues**: [GitHub Issues](https://github.com/saurabhkumar/chatflow/issues)
- **Documentation**: [Wiki](https://github.com/saurabhkumar/chatflow/wiki)
- **Email**: support@chatflow.dev
- **Discord**: [ChatFlow Community](https://discord.gg/chatflow)

---

## 🚀 **What's Next?**

### **Upcoming Features**
- 🔮 **AI Integration** - Smart message suggestions
- 🌍 **Internationalization** - Multi-language support
- 📊 **Analytics Dashboard** - Chat insights and metrics
- 🎵 **Voice Messages** - Enhanced audio messaging
- 📱 **Mobile Apps** - Native iOS and Android apps
- 🔐 **End-to-End Encryption** - Enhanced security

### **Performance Improvements**
- Bundle optimization
- Lazy loading implementation
- Progressive Web App features
- Offline support

---

**Made with ❤️ by the ChatFlow Team**

*Happy chatting! 🎉*
