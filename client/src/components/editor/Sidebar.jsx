// client/src/components/editor/Sidebar.jsx
import React, { useState, useMemo } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from "lucide-react";

const buildFileTree = (filePaths) => {
  const root = { name: "root", path: "", isDir: true, children: {} };
  for (const path of filePaths) {
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: i < parts.length - 1,
          children: {},
        };
      }
      current = current.children[part];
    }
  }
  return root;
};

const TreeNode = ({ node, activeFile, onFileSelect, onDeleteFile, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!node.isDir) {
    const isActive = activeFile === node.path;
    return (
      <div
        className={`tree-item file-item ${isActive ? "active" : ""}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        <FileCode size={14} className="tree-icon file-icon-svg" />
        <span className="file-name">{node.name}</span>
        <button
          className="del-file"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFile(node.path);
          }}
          title="Delete file"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  // Render directory
  const childrenNodes = Object.values(node.children).sort((a, b) => {
    // Sort directories first, then alphabetical
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="tree-folder">
      <div
        className="tree-item folder-item"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="folder-toggle">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        {isOpen ? <FolderOpen size={14} className="tree-icon folder-icon-svg" color="#dcb67a" /> : <Folder size={14} className="tree-icon folder-icon-svg" color="#dcb67a" />}
        <span className="folder-name">{node.name}</span>
      </div>
      {isOpen && (
        <div className="folder-children">
          {childrenNodes.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({ files, activeFile, onFileSelect, onAddFile, onDeleteFile }) {
  const filePaths = Object.keys(files);
  const treeRoot = useMemo(() => buildFileTree(filePaths), [filePaths]);

  const topLevelNodes = Object.values(treeRoot.children).sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <aside className="editor-sidebar">
      <div className="sidebar-header">
        <span>EXPLORER</span>
        <button onClick={onAddFile} className="add-btn" title="Add file">
          <Plus size={16} />
        </button>
      </div>

      <div className="file-list tree-view">
        {topLevelNodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            onDeleteFile={onDeleteFile}
            level={0}
          />
        ))}
      </div>
    </aside>
  );
}
