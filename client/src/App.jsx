import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./pages/sign_in";
import EditorPage from "./pages/EditorPage";
import WorkspacePage from "./pages/WorkspacePage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;