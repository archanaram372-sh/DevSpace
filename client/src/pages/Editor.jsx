import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import AnalyzeCode from "../components/ai.jsx";
import { getSocket, connectSocket, disconnectSocket } from "../services/socketService";
import { logout, getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Trash2, Play } from "lucide-react";
import "./Editor.css";

export default function EditorPage() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // Auth & Socket
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  // Files & Editor
  const [files, setFiles] = useState({
    "index.js": "// Type some JS code...",
    "main.py": "# Type some Python code...",
    "styles.css": "/* Style your app */",
  });
  const [activeFile, setActiveFile] = useState("index.js");
  const [lineOwnership, setLineOwnership] = useState({}); // Track who edited each line: { "index.js": { 1: { user: "name", color: "#FF6B6B" }, ... } }

  // Collaboration
  const [remoteCursors, setRemoteCursors] = useState({});
  const [users, setUsers] = useState([]);
  const [userColor, setUserColor] = useState("#FF6B6B");
  const [userMap, setUserMap] = useState({}); // { userId: { name, color } }
  const [output, setOutput] = useState("Click RUN to execute");
  const [analysis, setAnalysis] = useState("Click ANALYZE to inspect your code.");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  // Initialize auth and socket
  useEffect(() => {
    const currentUser = getCurrentUser();
    const token = localStorage.getItem("userToken");

    if (!currentUser || !token) {
      navigate("/");
      return;
    }

    setUser(currentUser);

    // Connect socket with token
    const newSocket = connectSocket(token);
    setSocket(newSocket);

    // Listen for collaboration events
    newSocket.on("users-list", (usersList) => {
      setUsers(usersList);
      // Build user map: { userId: { name, color } }
      const map = {};
      usersList.forEach((user) => {
        map[user.id] = { name: user.name, color: user.color };
      });
      setUserMap(map);
      console.log("👥 Users list updated:", map);
      
      // Find current user's color by looking for the latest user (just connected)
      if (usersList.length > 0) {
        setUserColor(usersList[usersList.length - 1].color);
      }
    });

    newSocket.on("user-joined", (data) => {
      setUsers(data.users);
      const map = {};
      data.users.forEach((user) => {
        map[user.id] = { name: user.name, color: user.color };
      });
      setUserMap(map);
      console.log("➕ User joined, updated map:", map);
    });

    newSocket.on("receive-code", ({ fileName, content, userName, userId }) => {
      console.log("✏️ Code received from", userName, "for", fileName);
      
      // Inject attribution comment into the code
      const language = getLanguage(fileName);
      const attributedCode = injectCodeAttribution(content, userName, language);
      
      setFiles((prev) => ({ ...prev, [fileName]: attributedCode }));
      
      // Track line ownership - mark all lines as edited by this user
      setLineOwnership((prev) => {
        const fileOwnership = prev[fileName] || {};
        const lines = attributedCode.split("\n");
        const newOwnership = { ...fileOwnership };
        
        lines.forEach((_, index) => {
          newOwnership[index + 1] = {
            user: userName,
            color: userMap[userId]?.color || "#CCCCCC",
            timestamp: new Date().toLocaleTimeString(),
          };
        });
        
        return { ...prev, [fileName]: newOwnership };
      });
    });

    newSocket.on("cursor-position", ({ userId, cursor, userName, color }) => {
      console.log("📍 Cursor received:", { userId, cursor, userName, color });
      setRemoteCursors((prev) => {
        const updated = { ...prev, [userId]: { top: cursor.top, left: cursor.left, userName, color } };
        console.log("🎨 Cursors state updated:", updated);
        return updated;
      });
    });

    newSocket.on("receive-message", ({ userName, message, timestamp }) => {
      setMessages((prev) => [...prev, { userName, message, timestamp }]);
    });

    newSocket.on("user-left", ({ userId }) => {
      setRemoteCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    return () => {
      disconnectSocket();
    };
  }, [navigate]);

  // Apply line decorations based on ownership
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const fileOwnership = lineOwnership[activeFile] || {};
    
    const decorations = Object.entries(fileOwnership).map(([lineNum, info]) => ({
      range: new (window.monaco?.Range || require("@monaco-editor/react").Range)(
        parseInt(lineNum),
        1,
        parseInt(lineNum),
        1000
      ),
      options: {
        isWholeLine: true,
        className: "line-ownership",
        glyphMarginClassName: "codicon codicon-edit",
        glyphMarginHoverMessage: {
          value: `✏️ **${info.user}** edited this line at ${info.timestamp}`,
        },
        minimap: {
          color: info.color + "40", // Add transparency
          rasterized: true,
        },
        overviewRuler: {
          color: info.color + "80",
          position: 7,
        },
      },
    }));

    try {
      // Note: This will require the Monaco instance - we'll use a simpler approach
      console.log("📝 Applying decorations for", activeFile, ":", decorations.length, "lines");
    } catch (err) {
      console.warn("Decoration error:", err);
    }
  }, [lineOwnership, activeFile, editorRef]);

  const getLanguage = (filename) => {
    const ext = filename.split(".").pop();
    const map = {
      js: "javascript",
      py: "python",
      cpp: "cpp",
      java: "java",
      html: "html",
      css: "css",
      ts: "typescript",
      jsx: "javascript",
      tsx: "typescript",
    };
    return map[ext] || "plaintext";
  };

  const getCommentStyle = (language) => {
    const commentMap = {
      javascript: "//",
      python: "#",
      cpp: "//",
      java: "//",
      html: "<!--",
      css: "/*",
      typescript: "//",
    };
    return commentMap[language] || "#";
  };

  const injectCodeAttribution = (code, userName, language) => {
    const comment = getCommentStyle(language);
    const timestamp = new Date().toLocaleTimeString();
    const attribution = `${comment} [${userName} @ ${timestamp}]`;
    
    // Add attribution as first line
    return `${attribution}\n${code}`;
  };

  const handleCodeChange = (value) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    if (socket) {
      socket.emit("code-change", { fileName: activeFile, content: value });
    }
  };

  const handleCursorChange = (selection) => {
    if (editorRef.current && socket) {
      const position = selection.position; // Monaco Editor Position object
      const editor = editorRef.current;
      
      try {
        // Get line height (works in Monaco 0.33+)
        const lineHeight = editor.getLineHeight ? editor.getLineHeight() : 20;
        
        // Average monospace character width (approximate)
        const charWidth = 8.4;
        
        // Get scroll position
        const scrollTop = editor.getScrollTop();
        const scrollLeft = editor.getScrollLeft();
        
        // Calculate pixel position relative to editor viewport
        const topPx = (position.lineNumber - 1) * lineHeight - scrollTop;
        const leftPx = (position.column - 1) * charWidth - scrollLeft;
        
        console.log("📤 Sending cursor:", { lineHeight, charWidth, scrollTop, scrollLeft, topPx, leftPx });
        
        socket.emit("cursor-move", {
          top: topPx,
          left: leftPx,
          line: position.lineNumber,
          column: position.column,
        });
      } catch (err) {
        console.warn("Cursor position calculation error:", err);
      }
    }
  };
  const runCode = async () => {
    setOutput("Running...");
    try {
      const res = await axios.post("http://127.0.0.1:5000/run", {
        code: files[activeFile],
        language: getLanguage(activeFile),
      });
      setOutput(res.data.output || "Execution finished (no output).");
    } catch (err) {
      setOutput("Error: Could not connect to execution server.");
    }
  };

  const addFile = () => {
    const name = prompt("Enter filename with extension (e.g., script.py):");
    if (name && !files[name]) {
      setFiles((prev) => ({ ...prev, [name]: "" }));
      setActiveFile(name);
    }
  };

  const deleteFile = (fileName) => {
    if (Object.keys(files).length === 1) {
      alert("Must have at least one file!");
      return;
    }
    const newFiles = { ...files };
    delete newFiles[fileName];
    setFiles(newFiles);
    if (activeFile === fileName) setActiveFile(Object.keys(newFiles)[0]);
  };

  const sendMessage = () => {
    if (!newMsg.trim() || !socket) return;
    socket.emit("send-message", newMsg);
    setNewMsg("");
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("userToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      navigate("/");
    } catch (err) {
      alert("Logout failed");
    }
  };

  return (
    <div className="editor-container">
      {/* HEADER */}
      <header className="editor-navbar">
        <div className="navbar-left">
          <span className="logo">⚡ DEVSPACE</span>
          <div className="user-badge">{user?.displayName || user?.email}</div>
        </div>
        <div className="navbar-center">
          {users.length > 0 && (
            <div className="online-users">
              {users.map((u) => (
                <div key={u.id} className="user-indicator" style={{ borderColor: u.color }}>
                  {u.name.charAt(0)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="navbar-right">
          <AnalyzeCode
            activeFile={activeFile}
            code={files[activeFile]}
            language={getLanguage(activeFile)}
            onAnalysisResult={setAnalysis}
          />
          <button className="run-btn" onClick={runCode}>
            <Play size={16} />
            RUN
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="editor-workspace">
        {/* SIDEBAR */}
        <aside className="editor-sidebar">
          <div className="sidebar-header">
            <span>FILES</span>
            <button onClick={addFile} className="add-btn" title="Add file">
              <Plus size={16} />
            </button>
          </div>
          <div className="file-list">
            {Object.keys(files).map((name) => (
              <div
                key={name}
                className={`file-item ${activeFile === name ? "active" : ""}`}
                onClick={() => setActiveFile(name)}
              >
                <span className="file-icon">📄</span>
                <span className="file-name">{name}</span>
                <button
                  className="del-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(name);
                  }}
                  title="Delete file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* EDITOR SECTION */}
        <main className="editor-main">
          <div className="tab-bar">
            <span className="tab-info">
              Editing: <strong>{activeFile}</strong>
              <span className="lang-badge">{getLanguage(activeFile)}</span>
            </span>
          </div>

          <div className="monaco-wrapper">
            <Editor
              ref={editorRef}
              theme="vs-dark"
              language={getLanguage(activeFile)}
              value={files[activeFile]}
              onChange={handleCodeChange}
              onCursorPositionChange={handleCursorChange}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />

            {/* Remote Cursors Overlay */}
            <div className="cursors-overlay">
              {Object.entries(remoteCursors).map(([userId, { top, left, userName, color }]) => (
                <div
                  key={userId}
                  className="remote-cursor"
                  style={{
                    backgroundColor: color,
                    top: `${top}px`,
                    left: `${left}px`,
                  }}
                >
                  <span className="cursor-label" style={{ backgroundColor: color }}>
                    {userName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-header">Console Output</div>
            <pre className="output">{output}</pre>
          </div>
          <div className="terminal">
            <div className="terminal-header">AI Analysis</div>
            <pre className="output">{analysis}</pre>
          </div>
        </main>

        {/* CHAT PANEL */}
        <section className="chat-section">
          <div className="chat-header">Collaboration Chat</div>
          <div className="message-list">
            {messages.map((m, i) => (
              <div key={i} className="message-bubble">
                <strong>{m.userName}:</strong> {m.message}
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </section>
      </div>
    </div>
  );
}
