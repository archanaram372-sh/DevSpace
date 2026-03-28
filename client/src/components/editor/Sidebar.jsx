// client/src/components/editor/Sidebar.jsx
import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function Sidebar({ files, activeFile, onFileSelect, onAddFile, onDeleteFile }) {
  return (
    <aside className="editor-sidebar">
      <div className="sidebar-header">
        <span>FILES</span>
        <button onClick={onAddFile} className="add-btn" title="Add file">
          <Plus size={16} />
        </button>
      </div>

      <div className="file-list">
        {Object.keys(files).map((name) => (
          <div
            key={name}
            className={`file-item ${activeFile === name ? "active" : ""}`}
            onClick={() => onFileSelect(name)}
          >
            <span className="file-icon">📄</span>
            <span className="file-name">{name}</span>
            <button
              className="del-file"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(name);
              }}
              title="Delete file"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
