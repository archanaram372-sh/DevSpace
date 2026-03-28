import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

// Connect to your backend
const socket = io("http://127.0.0.1:5000");

function App() {
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
      // Send both code AND language to your backend
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
    socket.emit("send-message", newMsg);
    setNewMsg("");
  };

  // --- EFFECTS ---
  useEffect(() => {
    const handleCodeSync = ({ fileName, content }) => {
      setFiles((prev) => ({ ...prev, [fileName]: content }));
    };

    const handleMsg = (msg) => setMessages((prev) => [...prev, msg]);

    socket.on("receive-code", handleCodeSync);
    socket.on("receive-message", handleMsg);

    return () => {
      socket.off("receive-code");
      socket.off("receive-message");
    };
  }, []);

  return (
    <div className="app-container">
      {/* HEADER */}
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
        {/* SIDEBAR */}
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

        {/* EDITOR SECTION */}
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
                socket.emit("code-change", { fileName: activeFile, content: val });
              }}
              options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
            />
          </div>
          <div className="terminal">
            <div className="terminal-header">Console Output</div>
            <pre className="output">{output}</pre>
          </div>
        </main>

        {/* CHAT PANEL */}
        <section className="chat-section">
          <div className="chat-header">Team Chat</div>
          <div className="message-list">
            {messages.map((m, i) => (
              <div key={i} className="message-bubble">{m}</div>
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

export default App;