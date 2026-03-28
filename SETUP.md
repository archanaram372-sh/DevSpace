# DevSpace - Real-Time Collaborative Coding Platform

A full-stack collaborative coding platform with live cursor tracking, multiple user support, and real-time code synchronization.

## Features

✅ **GitHub OAuth Authentication** - Secure login via Firebase
✅ **Real-Time Collaboration** - Multiple users editing the same file simultaneously
✅ **Live Cursor Tracking** - See where other users are typing with unique colors
✅ **Multi-Language Support** - JavaScript, Python, TypeScript, Java, C++, HTML, CSS
✅ **Code Execution** - Run code directly in the browser
✅ **Team Chat** - Built-in messaging for collaboration
✅ **File Management** - Create, edit, and delete multiple files

## Project Structure

```
DevSpace/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── sign_in.tsx       # Authentication page
│   │   │   ├── Editor.jsx        # Main editor with collaboration
│   │   │   └── Editor.css
│   │   ├── services/
│   │   │   ├── authService.js    # Firebase auth logic
│   │   │   └── socketService.js  # Socket.IO connection
│   │   ├── App.jsx               # Router setup
│   │   └── firebase.js           # Firebase config
│   └── package.json
├── server/                 # Node.js + Express backend
│   ├── index.js           # Main server with Socket.IO
│   ├── firebaseAdmin.js   # Firebase Admin setup
│   ├── routes/
│   │   └── auth.js        # Authentication endpoints
│   └── package.json
└── README.md
```

## Setup & Installation

### Prerequisites

- Node.js 16+
- npm or pnpm
- Firebase project (created at console.firebase.google.com)
- GitHub OAuth app credentials

### 1. Backend Setup

```bash
cd server
npm install  # or pnpm install

# Create serviceAccountKey.json from Firebase Console
# Settings → Service Accounts → Generate New Private Key
```

**server/.env:**
```
FIREBASE_PROJECT_ID=devspace-3c65a
PORT=5000
NODE_ENV=development
```

**Start the server:**
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install  # or pnpm install
```

**client/.env:**
```
VITE_BACKEND_URL=http://127.0.0.1:5000
```

**Start the development server:**
```bash
npm run dev
```

Visit: `http://localhost:5173`

## Authentication Flow

1. **Sign In Page** → User clicks "Continue with GitHub"
2. **Firebase** → Authenticates with GitHub OAuth
3. **ID Token Retrieval** → Frontend gets Firebase ID token
4. **Backend Verification** → Token sent to backend API `/api/auth`
5. **Socket Connection** → Client connects to Socket.IO with token
6. **Socket Middleware** → Backend verifies token before accepting connection
7. **Editor Access** → User enters collaborative editor

## Real-Time Collaboration Features

### Cursor Tracking
- Each user gets a unique color
- Cursor position updates broadcast via Socket.IO
- Remote cursors displayed in editor
- Shows user name on cursor hover

### Code Synchronization
- Code changes emit `code-change` event
- Other clients receive `receive-code` event
- Monaco Editor updates reflect in all clients
- No conflict resolution (last-write-wins for simplicity)

### User Presence
- User list shows all connected collaborators
- User indicators in navbar with unique colors
- Join/leave notifications
- Real-time user count

### Chat
- In-editor team messaging
- Messages broadcast to all connected users
- Timestamps included

## API Endpoints

### Authentication
```
POST /api/auth
Body: { token: "firebase-id-token" }
Response: { message: "Authenticated", uid, email, name }
```

### Code Execution
```
POST /run
Body: { code: "string", language: "javascript" }
Response: { output: "execution result" }
```

## Socket.IO Events

### Server → Client
- `users-list` - Initial list of connected users
- `user-joined` - New user connected
- `receive-code` - Code change from another user
- `cursor-position` - Remote cursor movement
- `receive-message` - Chat message
- `user-left` - User disconnected

### Client → Server
- `code-change` - User edited code
- `cursor-move` - User moved cursor
- `selection-change` - User selected text
- `send-message` - User sent chat message

## Security Considerations

✅ **Token Verification** - All Socket.IO connections verified via Firebase ID token
✅ **Auth Middleware** - Socket middleware validates token before allowing connection
✅ **CORS Enabled** - Cross-origin requests configured
✅ **Environment Variables** - Sensitive keys in .env files
✅ **Service Account Key** - Never exposed to frontend

## File Operations

- **Add File** - Click `+` button in sidebar
- **Delete File** - Click trash icon on file hover
- **Switch File** - Click file name in list
- **Edit** - Click in editor area

## Code Execution

1. Write code in any supported language
2. Click `RUN` button
3. Output appears in console panel
4. Errors displayed with line numbers

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

**Install dependencies:**
```bash
# From root
pnpm install  # Install both client and server deps
```

**Run both servers (from root):**
```bash
# Terminal 1 - Backend
cd server && pnpm dev

# Terminal 2 - Frontend
cd client && pnpm dev
```

## Common Issues

### "Token verification failed"
- Ensure Firebase Admin SDK serviceAccountKey.json is valid
- Check if token is being sent to backend auth endpoint
- Verify Socket.IO token in handshake.auth

### Socket connection refused
- Check backend is running on port 5000
- Verify CORS settings in Socket.IO
- Check token is being sent during Socket.IO connection

### Code changes not syncing
- Ensure Socket.IO is connected before typing
- Check browser console for socket errors
- Verify no firewall blocking WebSocket connections

### Cursor positions not visible
- Confirm cursor-move events are being emitted
- Check remote cursors CSS is not hidden
- Verify user colors are assigned correctly

## Performance Tips

- Debounce cursor position updates for large files
- Implement incremental code synchronization (Operational Transformation)
- Add room-based multiplexing for scale
- Cache user list to reduce broadcasts

## Future Enhancements

- [ ] Operational Transformation for conflict resolution
- [ ] File persistence (cloud storage)
- [ ] User permissions and access control
- [ ] Code review comments
- [ ] Git integration
- [ ] Terminal sharing
- [ ] Screen sharing
- [ ] Dark/Light theme toggle

## License

MIT

## Support

For issues and questions, create an issue in the repository.
