// client/src/components/editor/Terminal.jsx
import React from "react";

export default function Terminal({ output, analysis }) {
  return (
    <>
      <div className="terminal">
        <div className="terminal-header">Console Output</div>
        <pre className="output">{output}</pre>
      </div>

      <div className="terminal">
        <div className="terminal-header">AI Analysis</div>
        <pre className="output">{analysis}</pre>
      </div>
    </>
  );
}
