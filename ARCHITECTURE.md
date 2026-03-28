# DevSpace Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Sign In     │  │   Editor     │  │    Chat      │      │
│  │   (OAuth)    │  │  (Monaco)    │  │  (Messages)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                      │                                       │
│            ┌─────────▼──────────┐                           │
│            │  authService.js    │                           │
│            │  socketService.js  │                           │
│            └─────────┬──────────┘                           │
│                      │                                       │
└──────────────────────┼──────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼────┐              ┌────────▼───┐
    │ Firebase │              │ Socket.IO  │
    │ Auth API │              │ WebSocket  │
    └────┬─────┘              └────────┬───┘
         │                            │
         └────────────────┬───────────┘
                          │
    ┌─────────────────────▼────────────────────────┐
    │        Backend (Node.js + Express)           │
    ├─────────────────────────────────────────────┤
    │                                              │
    │  ┌──────────────┐  ┌──────────────────┐    │
    │  │  Auth Route  │  │  Socket Handler  │    │
    │  │ /api/auth    │  │ • Users tracking │    │
    │  └──────┬───────┘  │ • Code sync      │    │
    │         │          │ • Cursor tracking│    │
    │         │          │ • Messages       │    │
    │         │          └──────────┬───────┘    │
    │         │                     │             │
    │         └─────────────────────┴─┐          │
    │                                 │          │
    │          ┌──────────────────────▼──┐       │
    │          │  Firebase Admin SDK      │       │
    │          │  • Token verification    │       │
    │          │  • User management       │       │
    │          └──────────────┬───────────┘       │
    │                         │                   │
    │  ┌──────────────────────▼──────┐           │
    │  │   Code Execution Engine     │           │
    │  │   • VM2 sandbox             │           │
    │  │   • Multi-language support  │           │
    │  └─────────────────────────────┘           │
    │                                              │
    └──────────────────────────────────────────────┘
         │
         │
    ┌────▼─────┐
    │ Firebase │
    │ Console  │
    └──────────┘
```

## Data Flow

### Authentication Flow
```
1. User clicks "GitHub Login"
   ↓
2. Firebase Auth → GitHub OAuth
   ↓
3. Firebase returns ID Token
   ↓
4. Frontend sends token to backend /api/auth
   ↓
5. Backend verifies token with Firebase Admin SDK
   ↓
6. Backend returns user info
   ↓
7. Frontend connects Socket.IO with token
   ↓
8. Backend middleware verifies token
   ↓
9. User enters editor (authenticated)
```

### Real-Time Code Sync
```
User A types code
   ↓
Editor onChange → emit "code-change"
   ↓
Socket broadcasts to all users
   ↓
User B receives "receive-code"
   ↓
User B's editor updates
```

### Cursor Position Sync
```
User A moves cursor
   ↓
Editor onCursorPositionChange → emit "cursor-move"
   ↓
Socket broadcasts to all users
   ↓
User B receives "cursor-position"
   ↓
Remote cursor rendered at position with label
```

## File Organization

### Frontend Services
- **authService.js** - Firebase login, logout, token management
- **socketService.js** - Socket.IO connection with auth token

### Frontend Components
- **sign_in.tsx** - GitHub OAuth login UI
- **Editor.jsx** - Main collaborative editor
  - Monaco Editor integration
  - Socket.IO event handlers
  - Remote cursor rendering
  - Chat functionality

### Backend Routes
- **routes/auth.js** - Token verification endpoint

### Backend Services
- **firebaseAdmin.js** - Firebase Admin SDK initialization
- **index.js** - Express + Socket.IO server
  - User tracking
  - Event handling
  - Code execution

## Authentication Security

```
┌─────────────────────────────────────────────┐
│      Socket.IO Connection Handshake         │
├─────────────────────────────────────────────┤
│                                              │
│  Client: io(url, { auth: { token } })      │
│             ↓                                │
│  Server: io.use(async (socket, next) => {  │
│    const decoded = await                    │
│      admin.auth().verifyIdToken(token)      │
│    socket.userId = decoded.uid              │
│    next()                                    │
│  })                                          │
│             ↓                                │
│  Connection Established ✓                   │
│                                              │
└─────────────────────────────────────────────┘
```

## State Management

### Frontend State
- **User** - Current logged-in user
- **Socket** - Socket.IO instance
- **Files** - Editing files map
- **activeFile** - Currently selected file
- **remoteCursors** - Map of remote user cursors
- **users** - List of connected users
- **messages** - Chat messages

### Backend State
- **users Map** - Connected users with metadata
  ```javascript
  Map {
    socketId: {
      userId: "firebase-uid",
      name: "username",
      email: "user@github.com",
      color: "#FF6B6B",
      cursor: { line: 0, column: 0 },
      selection: null
    }
  }
  ```

## Event Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    User A (Editor)                         │
│  Types: console.log("hello")                               │
│                │                                            │
│                ▼                                            │
│        Monaco onChange                                      │
│                │                                            │
│                ▼                                            │
│   emit "code-change"                                        │
│    { fileName, content }                                    │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
         ┌─────────────────┐
         │   Socket.IO     │
         │   Broadcast     │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐     ┌──────────────────┐
│   User B        │     │   User C         │
│ (Editor)        │     │ (Editor)         │
│                 │     │                  │
│ on "receive     │     │ on "receive      │
│ -code"          │     │ -code"           │
│   ↓             │     │   ↓              │
│ setFiles()      │     │ setFiles()       │
│   ↓             │     │   ↓              │
│ Monaco          │     │ Monaco           │
│ updated ✓       │     │ updated ✓        │
└─────────────────┘     └──────────────────┘
```

## Scalability Considerations

Current implementation handles:
- ✓ Up to 10-20 concurrent users per room
- ✓ Real-time synchronization with <100ms latency
- ✓ Multi-language code execution

For scale:
- Implement rooms (separate collaboration spaces)
- Add Operational Transformation for conflict resolution
- Use Redis for user session management
- Implement incremental sync (diff-based)
- Add rate limiting on events
- Cache user list in memory

## Error Handling

### Frontend
- Try-catch blocks in auth service
- Socket connection error handlers
- User-friendly error messages
- Local storage fallback for session

### Backend
- Token verification error handling
- Socket middleware error propagation
- Code execution VM timeout/error catch
- Graceful disconnect handling

## Performance Optimization

1. **Cursor Debouncing** - Throttle cursor updates to 100ms
2. **Code Sync** - Batch rapid changes
3. **Message Buffering** - Queue messages during disconnect
4. **Lazy User List** - Only fetch on connection
5. **Memory Management** - Clear remote cursors on disconnect
