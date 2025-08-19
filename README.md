# Hil ChatApp

A full-stack, real-time chat application with one-to-one and group messaging, media/file sharing, search, notifications, user profiles, and authentication. Built as a monorepo with a React + Vite + Tailwind frontend and an Express + Socket.io + MongoDB backend. Includes a future-ready Customer Request system scaffold.

## Tech Stack
- Frontend: React (Vite), TailwindCSS, React Router, Socket.io client
- Backend: Node.js, Express, Socket.io, MongoDB (Mongoose), JWT auth
- Storage: AWS S3 (optional) or local uploads

## Features Implemented

### ✅ Core Chat Features
- **JWT Authentication** - Register, login, and secure token-based auth
- **1:1 & Group Chats** - Create direct chats and group conversations
- **Real-time Messaging** - Instant message delivery via Socket.io
- **File Sharing** - Images, videos, and documents with preview
- **Message Reactions** - Emoji reactions on messages
- **Typing Indicators** - Real-time typing status
- **Online Status** - See who's online/offline
- **Search** - Find chats and messages

### ✅ Media & File Features
- **Image Preview** - Preview images before sending with size constraints
- **File Size Limits** - 5MB maximum file size
- **Multiple Formats** - Images, videos, PDFs, Office documents
- **Responsive Display** - Images scale properly (max 256px height in chat)
- **Click to Enlarge** - Click images to view full size

### ✅ Customer Request System
- **Real-time Notifications** - New requests appear instantly on all devices
- **Request Management** - Create, update, and close requests
- **Status Tracking** - Open, awaiting info, resolved, closed
- **Solution Attachments** - Add files to request solutions
- **Notification Badges** - Red badge shows new request count

### ✅ User Experience
- **Responsive Design** - Works on desktop and mobile
- **Blue/White Theme** - Clean, professional interface
- **Error Handling** - Proper error messages and validation
- **Loading States** - Upload progress and loading indicators

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Environment Setup
Create two `.env` files:

**Backend** (`server/.env`):
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/hitachi_chatapp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_ORIGIN=http://localhost:5173
BASE_URL=http://localhost:4000
STORAGE_DRIVER=local
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:4000
```

### Install & Run

1. **Install Dependencies:**
```bash
# Backend
cd server
npm install

# Frontend  
cd client
npm install
```

2. **Start MongoDB** (if using local):
```bash
mongod
```

3. **Start Servers:**
```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd client
npm run dev
```

4. **Open Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Usage Guide

### Creating Chats
1. **New 1:1 Chat**: Click "New Chat" → Enter user email
2. **New Group**: Click "New Group" → Enter name → Select members by email

### Sending Messages
- **Text**: Type and press Enter or click Send
- **Files**: Click 📎 → Select file → Preview → Send
- **Emojis**: Click 😊 → Select emoji
- **Reactions**: Click emoji buttons on messages

### Customer Requests
1. **Create Request**: Go to Requests page → Fill title/description → Create
2. **Real-time Updates**: Requests appear instantly on all connected devices
3. **Close Request**: Click "Close" button when resolved

### File Upload Features
- **Preview**: Images show preview before sending
- **Size Limits**: 5MB maximum per file
- **Formats**: Images, videos, PDFs, Office docs
- **Responsive**: Images scale to fit chat (max 256px height)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile
- `PUT /api/auth/me` - Update profile

### Chats
- `GET /api/chats` - List user's chats
- `POST /api/chats/dm` - Create 1:1 chat
- `POST /api/chats/group` - Create group chat

### Messages
- `GET /api/messages/:chatId` - Get chat messages
- `POST /api/messages/:chatId` - Send message
- `POST /api/messages/:chatId/:messageId/react` - Add reaction

### Users
- `GET /api/users/all` - Get all users
- `GET /api/users/search` - Search users
- `GET /api/users/online` - Get online users

### Requests
- `GET /api/requests` - Get user's requests
- `POST /api/requests` - Create request
- `POST /api/requests/:id/close` - Close request

## Socket Events

### Client → Server
- `chat:join` - Join chat room
- `chat:typing` - Send typing indicator
- `chat:leave` - Leave chat room

### Server → Client
- `message:new` - New message received
- `chat:typing` - User typing indicator
- `user:online` - User came online
- `user:offline` - User went offline
- `request:new` - New request created
- `request:updated` - Request updated

## File Structure

```
Hitachi-ChatApp New/
├── server/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth middleware
│   │   ├── socket/          # Socket.io handlers
│   │   ├── config.js        # Environment config
│   │   ├── db.js           # Database connection
│   │   ├── app.js          # Express app setup
│   │   └── index.js        # Server entry point
│   ├── uploads/            # Local file storage
│   └── package.json
├── client/
│   ├── src/
│   │   ├── ui/             # React components
│   │   ├── lib/            # API and socket clients
│   │   ├── main.jsx        # App entry point
│   │   └── styles.css      # Tailwind styles
│   └── package.json
└── README.md
```

## Notes
- **Local Storage**: Files stored in `server/uploads/` when `STORAGE_DRIVER=local`
- **S3 Storage**: Set S3 credentials in `.env` for cloud storage
- **MongoDB**: Ensure MongoDB is running before starting server
- **Real-time**: All features work in real-time across multiple browser tabs/devices

## Future Enhancements
- Push notifications
- Message encryption
- Voice/video calls
- Advanced search filters
- User roles and permissions
- Message threading
- File compression
- Mobile app
