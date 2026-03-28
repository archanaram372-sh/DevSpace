# 🚀 DevSpace - Get Started NOW

## The Error You're Seeing

```
POST http://localhost:5000/api/auth net::ERR_CONNECTION_REFUSED
```

**This means**: Backend server is NOT running!

## Quick Fix - Start Both Servers

### Terminal 1: Start Backend

```bash
cd /home/gayathri/devspace/DevSpace/server
npm install
npm run dev
```

**You should see:**
```
✅ Server running on port 5000
```

### Terminal 2: Start Frontend (in new terminal)

```bash
cd /home/gayathri/devspace/DevSpace/client
npm install
npm run dev
```

**You should see:**
```
  ➜  Local:   http://localhost:5173/
```

## Next: Test It

1. Open `http://localhost:5173` in browser
2. Click "Continue with GitHub"
3. Login with GitHub account
4. Should redirect to editor page ✅

## If Still Getting Errors

### Error 1: "Cannot find module 'lucide-react'"
```bash
cd client
npm install lucide-react
```

### Error 2: "Cannot find module 'react-router-dom'"
```bash
cd client
npm install react-router-dom
```

### Error 3: "Cannot find module 'firebase'"
```bash
cd client
npm install firebase
```

### Error 4: Backend won't start
Check `server/serviceAccountKey.json` exists - if not:
1. Go to Firebase Console
2. Settings → Service Accounts
3. Generate New Private Key
4. Save as `server/serviceAccountKey.json`

## What's Fixed

✅ **Sign-in UI** - Now properly aligned and styled
✅ **Error handling** - Shows clear error messages
✅ **Backend connectivity** - Just needs to be running

## File Structure

```
DevSpace/
├── client/
│   ├── src/pages/
│   │   ├── sign_in.tsx       ← Updated UI
│   │   ├── sign_in.css       ← NEW styling
│   │   └── Editor.jsx        ← Main editor
│   └── package.json
├── server/
│   ├── index.js              ← Main server
│   └── package.json
└── README.md
```

## Backend Connection Checklist

- [ ] Backend terminal shows "Server running on port 5000"
- [ ] Frontend terminal shows "http://localhost:5173"
- [ ] Both terminals are running simultaneously
- [ ] No firewall blocking port 5000
- [ ] VITE_BACKEND_URL in client/.env is correct

## Troubleshooting

### Port 5000 already in use?
```bash
lsof -i :5000  # See what's using it
kill -9 <PID>  # Kill it
```

### Port 5173 already in use?
```bash
lsof -i :5173
kill -9 <PID>
```

### Clear node_modules and reinstall
```bash
cd client && rm -rf node_modules && npm install
cd ../server && rm -rf node_modules && npm install
```

## Expected Workflow

1. ✅ Sign-in page loads (beautiful UI)
2. ✅ Click GitHub button
3. ✅ Get redirected to GitHub OAuth
4. ✅ Approve permissions
5. ✅ Backend verifies token
6. ✅ Editor page loads
7. ✅ Open second browser → same page
8. ✅ See other user online
9. ✅ Start typing → see sync in real-time
10. ✅ See cursor tracking with colors

## Key Files Modified

### Frontend
- `client/src/pages/sign_in.tsx` - Fixed layout + proper auth
- `client/src/pages/sign_in.css` - Beautiful styling (NEW)
- `client/src/services/authService.js` - Auth logic
- `client/src/App.jsx` - Router setup

### Backend
- `server/index.js` - Socket.IO auth + events
- `server/routes/auth.js` - Token verification

## Next Steps After Testing

1. **Add more files** - Test multi-file editing
2. **Collaborate** - Get a friend to join
3. **Try code execution** - Click RUN button
4. **Test chat** - Send messages
5. **Check cursors** - Move cursor → see sync

## Debug Tips

### Check if backend is listening
```bash
curl http://localhost:5000
```

### Check if frontend can reach backend
```bash
# In browser console
fetch('http://localhost:5000/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'test' })
}).then(r => r.json()).then(console.log)
```

### Monitor socket connection
```bash
# In browser console
socket.on('connect', () => console.log('Connected!'))
socket.on('disconnect', () => console.log('Disconnected!'))
socket.on('connect_error', (err) => console.error('Error:', err))
```

---

**Start servers → Refresh browser → Should work! 🎉**
