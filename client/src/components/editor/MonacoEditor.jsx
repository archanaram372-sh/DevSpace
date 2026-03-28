// client/src/components/editor/MonacoEditor.jsx
import React from "react";
import Editor from "@monaco-editor/react";

export default function MonacoEditor({
  editorRef,
  language,
  activeFile,
  value,
  remoteCursors,
  onChange,
  onCursorChange,
}) {
  return (
    <div className="monaco-wrapper">
      <Editor
        ref={editorRef}
        theme="vs-dark"
        language={language}
        value={value}
        onChange={onChange}
        onCursorPositionChange={onCursorChange}
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
  );
}
