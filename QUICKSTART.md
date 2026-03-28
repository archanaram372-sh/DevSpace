# Quick Start Guide - DevSpace

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
# From workspace root
cd client && npm install
cd ../server && npm install
```

### Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project "DevSpace"
3. Go to **Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `server/serviceAccountKey.json`

### Step 3: Configure Environment

**server/.env:**
```
FIREBASE_PROJECT_ID=devspace-3c65a
PORT=5000
NODE_ENV=development
```

**client/.env:**
```
VITE_BACKEND_URL=http://127.0.0.1:5000
```

### Step 4: Run Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server running on http://127.0.0.1:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Frontend running on http://localhost:5173
```

### Step 5: Test Collaboration

1. Open `http://localhost:5173` in **Browser 1**
2. Click "Continue with GitHub"
3. Open `http://localhost:5173` in **Browser 2** (different user or incognito)
4. Login with different GitHub account
5. Both should see each other online
6. Type in editor → see changes in both browsers ✨

## Key Features to Test

### ✅ Real-Time Code Sync
- Type in one browser
- See changes appear instantly in other browser

### ✅ Cursor Tracking
- Move cursor in one browser
- See colored cursor in other browser with name label

### ✅ Multiple Users
- Each user gets unique color
- All colors visible in navbar

### ✅ Code Execution
- Click RUN button
- Code executes and output appears below editor

### ✅ Chat
- Type message in chat panel
- Message broadcasts to all users

### ✅ File Management
- Click `+` to add new file
- Switch between files
- Changes sync for all files

## Troubleshooting

### "Cannot find module 'firebase'"
```bash
cd client && npm install firebase
```

### "Socket connection refused"
- Check backend is running on port 5000
- Run `npm run dev` in server directory

### "Authentication error: No token provided"
- Clear browser localStorage
- Logout and login again
- Check network tab in DevTools

### "Token verification failed"
- Verify serviceAccountKey.json is in server directory
- Check Firebase Admin SDK initialization

## Project Files Reference

```
DevSpace/
├── client/
│   ├── src/
│   │   ├── firebase.js              ← Firebase config
│   │   ├── App.jsx                  ← Router setup
│   │   ├── main.jsx                 ← Entry point
│   │   ├── pages/
│   │   │   ├── sign_in.tsx          ← GitHub login
│   │   │   └── Editor.jsx           ← Main editor
│   │   └── services/
│   │       ├── authService.js       ← Auth logic
│   │       └── socketService.js     ← Socket config
│   ├── package.json
│   └── .env                         ← Set VITE_BACKEND_URL
│
├── server/
│   ├── index.js                     ← Main server
│   ├── firebaseAdmin.js             ← Firebase admin init
│   ├── routes/
│   │   └── auth.js                  ← Auth endpoint
│   ├── serviceAccountKey.json       ← Firebase credentials
│   ├── package.json
│   └── .env                         ← Set PORT & PROJECT_ID
│
├── SETUP.md                         ← Full setup guide
├── IMPLEMENTATION.md                ← What was built
└── ARCHITECTURE.md                  ← System design
```

## Code Structure Overview

### Frontend Auth Flow
```javascript
// 1. User clicks login button
handleGitHubLogin()

// 2. Auth service handles login
loginWithGithub()
  → signInWithPopup(auth, provider)
  → user.getIdToken()
  → return { user, token }

// 3. Verify token on backend
verifyTokenWithBackend(token)
  → POST /api/auth
  → backend validates token
  → return user info

// 4. Store and connect socket
localStorage.setItem("userToken", token)
connectSocket(token)
  → io("url", { auth: { token } })
  → socket middleware verifies token
  → connection established
```

### Backend Socket Flow
```javascript
// 1. Client connects with token
socket = io(url, { auth: { token } })

// 2. Server middleware validates
io.use(async (socket, next) => {
  const decoded = await admin.auth().verifyIdToken(token)
  socket.userId = decoded.uid
  next()
})

// 3. Connection established - track user
io.on("connection", (socket) => {
  users.set(socket.id, {
    userId: socket.userId,
    name: socket.userName,
    color: userColors[...]
  })
})

// 4. Broadcast events
socket.on("code-change", (data) => {
  socket.broadcast.emit("receive-code", data)
})
```

### Editor Real-Time Sync
```javascript
// Code changes
<Editor
  onChange={(value) => {
    setFiles(prev => ({ ...prev, [activeFile]: value }))
    socket.emit("code-change", { fileName, content: value })
  }}
/>

// Cursor tracking
<Editor
  onCursorPositionChange={() => {
    const pos = editorRef.current.getPosition()
    socket.emit("cursor-move", {
      line: pos.lineNumber,
      column: pos.column
    })
  }}
/>

// Remote cursors rendered
{Object.entries(remoteCursors).map(([userId, { cursor, color }]) => (
  <div className="remote-cursor" style={{ backgroundColor: color }} />
))}
```

## Common Operations

### Add a New File
1. Click `+` button in FILES sidebar
2. Enter filename (e.g., "app.js")
3. File created and selected

### Delete a File
1. Hover over file name
2. Click trash icon
3. File deleted (must have at least 1 file)

### Run Code
1. Write code in editor
2. Click `RUN` button
3. Output appears in console panel

### Send Message
1. Type in chat input at bottom
2. Press Enter or click Send
3. Message broadcasts to all users

## Browser DevTools Tips

### Check Socket Connection
```javascript
// In browser console
socket.connected  // true/false
socket.id         // unique socket ID
socket.auth       // { token: "..." }
```

### Check Users List
```javascript
// In browser console
localStorage.getItem("userName")
localStorage.getItem("userToken")
```

### Monitor Events
```javascript
// In browser console
socket.onAny((event, data) => {
  console.log("Socket event:", event, data)
})
```

## Performance Tips

- Large files: Disable minimap (already done)
- Many users: Implement room-based isolation
- Frequent typing: Add cursor position debouncing
- Concurrent edits: Implement Operational Transformation

## Next Steps

1. **Test with real team** - Invite team members to test
2. **Add persistence** - Save files to storage
3. **Deploy online** - Use Render, Heroku, or Vercel
4. **Enhance UI** - Add themes, syntax highlighting tweaks
5. **Add features** - Comments, code review, Git integration

## Support

- Check `SETUP.md` for detailed setup
- Check `ARCHITECTURE.md` for system design
- Check `IMPLEMENTATION.md` for what was built
- Check browser console for errors
- Check server logs for connection issues

---

**Happy Collaborating! 🚀**
