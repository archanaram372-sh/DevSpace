import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

function App() {
  // State
  const [code, setCode] = useState("// Write JavaScript code here");
  const [output, setOutput] = useState("Click RUN to execute code");

  // Run button function
  const runCode = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/run",{
        code: code,
      });
      setOutput(res.data.output);
    } catch (err) {
      setOutput("❌ Error connecting to server");
    }
  };

  return (
    <div className="container">
      <h1>🚀 DevSpace IDE</h1>

      <button className="runBtn" onClick={runCode}>
        ▶ Run Code
      </button>

      <div className="editor">
        <Editor
          height="60vh"
          defaultLanguage="javascript"
          defaultValue={code}
          theme="vs-dark"
          onChange={(value) => setCode(value)}
        />
      </div>

      <div className="output">
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default App;