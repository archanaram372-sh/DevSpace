// client/src/components/editor/Navbar.jsx
import React from "react";
import { LogOut, Play } from "lucide-react";
import AnalyzeCode from "../ai.jsx";

export default function Navbar({ user, users, activeFile, code, language, onAnalysisResult, onRun, onLogout }) {
  return (
    <header className="editor-navbar">
      <div className="navbar-left">
        <span className="logo">⚡ DEVSPACE</span>
        <div className="user-badge">{user?.displayName || user?.email}</div>
      </div>

      <div className="navbar-center">
        {users.length > 0 && (
          <div className="online-users">
            {users.map((u) => (
              <div key={u.id} className="user-indicator" style={{ borderColor: u.color }}>
                {u.name.charAt(0)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-right">
        <AnalyzeCode
          activeFile={activeFile}
          code={code}
          language={language}
          onAnalysisResult={onAnalysisResult}
        />
        <button className="run-btn" onClick={onRun}>
          <Play size={16} />
          RUN
        </button>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
