import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://127.0.0.1:5000");

function App() {
  const [code, setCode] = useState("// Start coding...");
  const [output, setOutput] = useState("Click RUN to execute");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    const handleCode = (newCode) => setCode(newCode);
    const handleMsg = (msg) => setMessages((prev) => [...prev, msg]);

    socket.on("receive-code", handleCode);
    socket.on("receive-message", handleMsg);

    return () => {
      socket.off("receive-code", handleCode);
      socket.off("receive-message", handleMsg);
    };
  }, []);

  const runCode = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/run", { code });
      setOutput(res.data.output);
    } catch (err) {
      setOutput("Server error");
    }
  };

  const sendMessage = () => {
    if (!newMsg.trim()) return;
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

        {/* CENTER EDITOR + OUTPUT */}
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

          <div className="outputPanel">
            <h3>Output</h3>
            <pre style={{ whiteSpace: "pre-wrap", color: "#4ade80" }}>
              {output}
            </pre>
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