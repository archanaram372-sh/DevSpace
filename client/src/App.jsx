import { useState } from "react";
import Editor from "@monaco-editor/react";

function App() {

  // 🟢 Fake project files
  const [files, setFiles] = useState({
    "index.js": "console.log('Hello from index.js');",
    "app.js": "function app(){ return 'DevSpace'; }",
    "style.css": "body { background:black; }"
  });

  const [activeFile, setActiveFile] = useState("index.js");

  // When code changes → update file content
  function handleEditorChange(value) {
    setFiles({
      ...files,
      [activeFile]: value
    });
  }

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column" }}>

      {/* NAVBAR */}
      <div style={{height:"45px",background:"#1e1e1e",color:"white",display:"flex",alignItems:"center",paddingLeft:"15px",fontWeight:"bold"}}>
        DevSpace IDE 🚀
      </div>

      <div style={{ flex:1, display:"flex" }}>

        {/* SIDEBAR FILES */}
        <div style={{width:"220px",background:"#252526",color:"white",padding:"10px"}}>
          <h3>Explorer</h3>

          {Object.keys(files).map(file => (
            <p
              key={file}
              style={{cursor:"pointer", color: activeFile===file ? "#4fc3f7":"white"}}
              onClick={() => setActiveFile(file)}
            >
              📄 {file}
            </p>
          ))}

        </div>

        {/* EDITOR AREA */}
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>

          {/* FILE TAB */}
          <div style={{height:"35px",background:"#2d2d2d",color:"white",display:"flex",alignItems:"center",paddingLeft:"10px"}}>
            {activeFile}
          </div>

          {/* MONACO EDITOR */}
          <div style={{ flex:1 }}>
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={files[activeFile]}
              onChange={handleEditorChange}
            />
          </div>

        </div>
      </div>

      {/* TERMINAL */}
      <div style={{height:"120px",background:"#1e1e1e",color:"white",padding:"10px"}}>
        Terminal (Coming Soon)
      </div>

    </div>
  );
}

export default App;