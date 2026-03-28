// client/src/pages/EditorPage.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { getSocket, connectSocket, disconnectSocket } from "../services/socketService";
import { logout, getCurrentUser } from "../services/authService";
import { getLanguage, injectCodeAttribution } from "../utils/editorUtils";

import Navbar from "../components/editor/Navbar";
import Sidebar from "../components/editor/Sidebar";
import MonacoEditor from "../components/editor/MonacoEditor";
import Terminal from "../components/editor/Terminal";
import ChatPanel from "../components/editor/ChatPanel";

import "./EditorPage.css";

const DEFAULT_FILES = {
  "index.js": "// Type some JS code...",
  "main.py": "# Type some Python code...",
  "styles.css": "/* Style your app */",
};

export default function EditorPage() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // Auth
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  // Files
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState("index.js");

  // Collaboration
  const [remoteCursors, setRemoteCursors] = useState({});
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({});

  // UI State
  const [output, setOutput] = useState("Click RUN to execute");
  const [analysis, setAnalysis] = useState("Click ANALYZE to inspect your code.");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  // ── Socket & Auth Setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const currentUser = getCurrentUser();
    const token = localStorage.getItem("userToken");

    if (!currentUser || !token) {
      navigate("/");
      return;
    }

    setUser(currentUser);

    const newSocket = connectSocket(token);
    setSocket(newSocket);

    const buildUserMap = (usersList) => {
      const map = {};
      usersList.forEach((u) => { map[u.id] = { name: u.name, color: u.color }; });
      return map;
    };

    newSocket.on("users-list", (usersList) => {
      setUsers(usersList);
      setUserMap(buildUserMap(usersList));
    });

    newSocket.on("user-joined", ({ users: usersList }) => {
      setUsers(usersList);
      setUserMap(buildUserMap(usersList));
    });

    newSocket.on("receive-code", ({ fileName, content, userName, userId }) => {
      const language = getLanguage(fileName);
      const attributedCode = injectCodeAttribution(content, userName, language);
      setFiles((prev) => ({ ...prev, [fileName]: attributedCode }));
    });

    newSocket.on("cursor-position", ({ userId, cursor, userName, color }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { top: cursor.top, left: cursor.left, userName, color },
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

    return () => { disconnectSocket(); };
  }, [navigate]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCodeChange = (value) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    if (socket) socket.emit("code-change", { fileName: activeFile, content: value });
  };

  const handleCursorChange = (selection) => {
    if (!editorRef.current || !socket) return;
    const editor = editorRef.current;
    const position = selection.position;

    try {
      const lineHeight = editor.getLineHeight ? editor.getLineHeight() : 20;
      const charWidth = 8.4;
      const topPx = (position.lineNumber - 1) * lineHeight - editor.getScrollTop();
      const leftPx = (position.column - 1) * charWidth - editor.getScrollLeft();

      socket.emit("cursor-move", {
        top: topPx,
        left: leftPx,
        line: position.lineNumber,
        column: position.column,
      });
    } catch (err) {
      console.warn("Cursor position calculation error:", err);
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
    } catch {
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
      ["userToken", "userName", "userId"].forEach((k) => localStorage.removeItem(k));
      navigate("/");
    } catch {
      alert("Logout failed");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const language = getLanguage(activeFile);

  return (
    <div className="editor-container">
      <Navbar
        user={user}
        users={users}
        activeFile={activeFile}
        code={files[activeFile]}
        language={language}
        onAnalysisResult={setAnalysis}
        onRun={runCode}
        onLogout={handleLogout}
      />

      <div className="editor-workspace">
        <Sidebar
          files={files}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
          onAddFile={addFile}
          onDeleteFile={deleteFile}
        />

        <main className="editor-main">
          <div className="tab-bar">
            <span className="tab-info">
              Editing: <strong>{activeFile}</strong>
              <span className="lang-badge">{language}</span>
            </span>
          </div>

          <MonacoEditor
            editorRef={editorRef}
            language={language}
            activeFile={activeFile}
            value={files[activeFile]}
            remoteCursors={remoteCursors}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
          />

          <Terminal output={output} analysis={analysis} />
        </main>

        <ChatPanel
          messages={messages}
          newMsg={newMsg}
          onMsgChange={setNewMsg}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
