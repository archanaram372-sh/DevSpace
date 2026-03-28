import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://127.0.0.1:5000");

function App() {
  // Editor states
  const [code, setCode] = useState("// Start coding...");
  const [output, setOutput] = useState("Click RUN to execute");

  // Chat states ⭐ (these were missing → caused blank screen)
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  // Receive realtime code + chat
  useEffect(() => {
    socket.on("receive-code", (newCode) => {
      setCode(newCode);
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);

  // Run code
  const runCode = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/run", {
        code: code,
      });
      setOutput(res.data.output);
    } catch (err) {
      setOutput("Server error");
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (newMsg.trim() === "") return;
    socket.emit("send-message", newMsg);
    setNewMsg("");
  };

  return (
    <div className="app">

      {/* TOP NAVBAR */}
      <div className="navbar">
        <div className="logo">🟦 DevSpace</div>
        <button className="runBtn" onClick={runCode}>▶ Run</button>
      </div>

      <div className="main">
        
        {/* LEFT SIDEBAR */}
        <div className="sidebar">
          <h3>Explorer</h3>
          <p>📄 index.js</p>
          <p>📄 app.js</p>
          <p>📄 styles.css</p>
        </div>

        {/* CENTER EDITOR */}
        <div className="editorSection">
          <Editor
            height="70vh"
            language="javascript"
            value={code}
            theme="vs-dark"
            onChange={(value) => {
              setCode(value);
              socket.emit("code-change", value);
            }}
          />

          {/* OUTPUT PANEL */}
          <div className="outputPanel">
            <h3>Output</h3>
            <pre>{output}</pre>
          </div>
        </div>

        {/* RIGHT CHAT PANEL */}
        <div className="chatPanel">
          <h3>💬 Team Chat</h3>

          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className="msg">{msg}</div>
            ))}
          </div>

          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type message..."
          />

          <button onClick={sendMessage}>Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;