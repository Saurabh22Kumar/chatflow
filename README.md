# ChatFlow - Modern Real-Time Communication Platform

[![CI](https://github.com/saurabhkumar/chatflow/actions/workflows/simple-ci.yml/badge.svg)](https://github.com/saurabhkumar/chatflow/actions/workflows/simple-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-17.0.2-blue)](https://reactjs.org/)

A cutting-edge, full-stack messaging platform built with the MERN stack, featuring advanced real-time communication, smart user interactions, and innovative chat experiences.

**🚀 Live Demo:** [https://chatflow-production-2fcc.up.railway.app/](https://chatflow-production-2fcc.up.railway.app/)

## 🌟 What Makes ChatFlow Special

- � **Lightning-Fast Messaging** - Instant message delivery with optimized performance
- 🎨 **Dynamic Themes** - Multiple UI themes with dark/light mode toggle
- 🔐 **Advanced Security** - End-to-end encryption and secure authentication
- � **Cross-Platform** - Seamless experience across all devices
- 🤖 **Smart Features** - AI-powered message suggestions and sentiment analysis
- 🌐 **Global Ready** - Multi-language support and localization
- � **Analytics Dashboard** - Chat insights and user activity tracking

## ✨ Unique Features

### 🎯 Smart Chat Experience
- **Message Reactions** - Express yourself with animated reactions
- **Typing Indicators** - See when others are typing in real-time
- **Message Status** - Delivered, read, and typing status
- **Smart Replies** - AI-suggested quick responses

### 🎨 Personalization
- **Custom Themes** - Create and share your own themes
- **Profile Customization** - Rich profiles with status messages
- **Chat Backgrounds** - Personalized chat wallpapers
- **Sound Notifications** - Custom notification sounds

### 🔒 Privacy & Security
- **Email Verification** - Secure OTP-based account verification
- **Message Encryption** - Your conversations stay private
- **Self-Destructing Messages** - Auto-delete sensitive messages
- **Privacy Controls** - Granular privacy settings
- **Secure Sessions** - Advanced session management

## 🛠️ Technologies Used

### Frontend
- React.js
- Socket.IO Client
- Styled Components
- Axios
- React Router DOM
- React Toastify

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB/Mongoose
- bcrypt
- CORS

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (for cloud database)

## 🚀 Quick Start

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/saurabhkumar/chatflow.git
cd chatflow
```

2. **Run the setup script**
```bash
chmod +x deploy.sh
./deploy.sh
```

3. **Configure environment variables**
```bash
# Backend
cd server
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string
# IMPORTANT: Configure email settings for user registration
# See EMAIL_SETUP.md for detailed instructions

# Frontend  
cd ../public
cp .env.example .env
# Edit if needed (defaults work for local development)
```

4. **Start the application**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd public && npm start
```

5. **Open your browser**
Navigate to `http://localhost:3000` and experience ChatFlow!

## 🐳 Docker Deployment

You can also run the application using Docker:

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d
```

This will start:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5001`

## 📁 Project Structure

```
chatify/
├── public/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # API routes and utilities
│   │   └── assets/        # Static assets
│   ├── package.json
│   └── Dockerfile
├── server/                # Node.js backend
│   ├── controllers/       # Request handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── index.js          # Server entry point
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔧 Configuration

### MongoDB Setup
1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) account
2. Create a new cluster
3. Get your connection string
4. Add your IP to the whitelist
5. Update the `MONGO_URL` in your `.env` file

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5001 |
| `MONGO_URL` | MongoDB connection string | Required |
| `REACT_APP_BACKEND_URL` | Backend API URL | http://localhost:5001 |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Thanks to the MERN stack community
- Socket.IO for real-time functionality
- MongoDB Atlas for cloud database hosting

---

⭐ Star this repository if you found it helpful!