import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
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

  // Collaboration
  const [remoteCursors, setRemoteCursors] = useState({});
  const [users, setUsers] = useState([]);
  const [output, setOutput] = useState("Click RUN to execute");
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
    });

    newSocket.on("user-joined", (data) => {
      setUsers(data.users);
    });

    newSocket.on("receive-code", ({ fileName, content, userName }) => {
      setFiles((prev) => ({ ...prev, [fileName]: content }));
    });

    newSocket.on("cursor-position", ({ userId, cursor, userName, color }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { cursor, userName, color },
      }));
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

  const handleCodeChange = (value) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    if (socket) {
      socket.emit("code-change", { fileName: activeFile, content: value });
    }
  };

  const handleCursorChange = () => {
    if (editorRef.current && socket) {
      const position = editorRef.current.getPosition();
      socket.emit("cursor-move", {
        line: position.lineNumber,
        column: position.column,
      });
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
              {Object.entries(remoteCursors).map(([userId, { cursor, userName, color }]) => (
                <div
                  key={userId}
                  className="remote-cursor"
                  style={{
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                  title={userName}
                >
                  <span className="cursor-label">{userName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-header">Console Output</div>
            <pre className="output">{output}</pre>
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
