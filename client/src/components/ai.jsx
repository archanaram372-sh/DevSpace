import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const AnalyzeCode = ({ activeFile, code, language, onAnalysisResult }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!code) return;

    setIsAnalyzing(true);
    onAnalysisResult("🤖 AI is analyzing your code... please wait.");

    try {
      const res = await axios.post(`${API_BASE_URL}/analyze`, {
        code,
        fileName: activeFile,
        language,
      });

      onAnalysisResult(`--- AI ANALYSIS (${activeFile}) ---\n\n${res.data.analysis}`);
    } catch (err) {
      onAnalysisResult("❌ Error: AI analysis failed.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <button
      className="analyze-btn"
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      style={{
        // Match a typical "Run" green (Success color)
        backgroundColor: isAnalyzing ? "#2e7d32" : "#4caf50", 
        color: "black",
        padding: "5px 12px",     // Smaller padding
        fontSize: "12px",        // Smaller font
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
        fontWeight: "600",
        marginRight: "8px",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "#4caf50")}
    >
      {/* Shortened text to keep it small like a 'Run' button */}
      {isAnalyzing ? "⌛ ..." : " ANALYZE"}
    </button>
  );
};

export default AnalyzeCode;