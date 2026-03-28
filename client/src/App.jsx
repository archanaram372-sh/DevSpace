import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { socket } from "./socket/socket";
import JoinRoom from "./components/JoinRoom";   // ⭐ NEW
import "./App.css";

function App() {
  // ⭐ NEW ROOM STATES
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  // --- STATE ---
  const [files, setFiles] = useState({
    "index.js": "// Type some JS code...",
    "main.py": "# Type some Python code...",
    "styles.css": "/* Style your app */",
  });
  const [activeFile, setActiveFile] = useState("index.js");
  const [output, setOutput] = useState("Click RUN to execute");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ⭐ NEW JOIN ROOM FUNCTION
  const handleJoinRoom = (name, roomId) => {

    setUsername(name);
    setRoom(roomId);
    setJoined(true);

    socket.emit("join-room", { username: name, room: roomId });

    socket.off("receive-code");
    socket.off("receive-message");

    socket.on("receive-code", ({ fileName, content }) => {
    setFiles((prev) => ({ ...prev, [fileName]: content }));
    });

    socket.on("receive-message", (msg) => {
    setMessages((prev) => [...prev, msg]);
    });
  };

  // --- HELPERS ---
  const getLanguage = (filename) => {
    const ext = filename.split(".").pop();
    const map = {
      js: "javascript",
      py: "python",
      cpp: "cpp",
      java: "java",
      html: "html",
      css: "css",
    };
    return map[ext] || "plaintext";
  };

  // --- ACTIONS ---
  const addFile = () => {
    const name = prompt("Enter filename with extension (e.g., script.py):");
    if (name && !files[name]) {
      setFiles((prev) => ({ ...prev, [name]: "" }));
      setActiveFile(name);
    }
  };

  const deleteFile = (fileName) => {
    if (Object.keys(files).length === 1) return alert("Must have at least one file!");
    const newFiles = { ...files };
    delete newFiles[fileName];
    setFiles(newFiles);
    if (activeFile === fileName) setActiveFile(Object.keys(newFiles)[0]);
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

  const sendMessage = () => {
    if (!newMsg.trim()) return;

    const msgData = {
      sender: username,
      text: newMsg,
      time: new Date().toLocaleTimeString(),
      room: room,
    };

    socket.emit("send-message", msgData);
    setNewMsg("");
  };

  // ⭐ SHOW JOIN SCREEN FIRST
  if (!joined) {
    return <JoinRoom onJoin={handleJoinRoom} />;
  }

  // ================= YOUR ORIGINAL UI (UNCHANGED) =================

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand">
          <span className="logo-icon">🟦</span>
          <h1>DevSpace <small>v2.0</small></h1>
        </div>
        <div className="nav-actions">
          <button className="run-btn" onClick={runCode}>▶ RUN</button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <span>FILES</span>
            <button onClick={addFile} className="add-btn">+</button>
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
                <button className="del-file" onClick={(e) => { e.stopPropagation(); deleteFile(name); }}>×</button>
              </div>
            ))}
          </div>
        </aside>

        <main className="editor-area">
          <div className="tab-indicator">
            Editing: <strong>{activeFile}</strong> 
            <span className="lang-badge">{getLanguage(activeFile)}</span>
          </div>

          <div className="monaco-wrapper">
            <Editor
              theme="vs-dark"
              language={getLanguage(activeFile)}
              value={files[activeFile]}
              onChange={(val) => {
                setFiles((prev) => ({ ...prev, [activeFile]: val }));
                socket.emit("code-change", { fileName: activeFile, content: val, room });
              }}
              options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
            />
          </div>

          <div className="terminal">
            <div className="terminal-header">Console Output</div>
            <pre className="output">{output}</pre>
          </div>
        </main>

        <section className="chat-section">
          <div className="message-list">
            {messages.map((m, i) => (
              <div key={i}>
                <b>{m.sender}</b>: {m.text} <small>{m.time}</small>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type message..."
          />
        </section>
      </div>
    </div>
  );
}

export default App;