import React, { useState, useEffect } from "react";
import { Users, ChevronRight, Server, Shield, Monitor, Sparkles, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TeamsSelectionPage.css";

const MOCK_TEAMS = [
  { id: "team-a", name: "Team A", description: "Frontend Architecture & UI", icon: <Monitor size={24} />, color: "#3b82f6" },
  { id: "team-b", name: "Team B", description: "Backend Services & API", icon: <Server size={24} />, color: "#10b981" },
  { id: "team-c", name: "Team C", description: "DevOps & Security", icon: <Shield size={24} />, color: "#f59e0b" },
  { id: "team-d", name: "Team D", description: "AI & Data Engineering", icon: <Sparkles size={24} />, color: "#8b5cf6" },
];

export default function TeamsSelectionPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Persistence logic for the theme toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <div className={`teams-page-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      {/* HEADER SECTION */}
      <header className="teams-header">
        <div className="header-inner">
          <div className="teams-brand" onClick={() => navigate("/dashboard")}>
            <Users size={24} className="brand-icon" />
            <span>Select a Team</span>
          </div>
          
          <div className="header-actions">
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="user-profile-mini">Admin</div>
          </div>
        </div>
      </header>

      {/* CENTERED SCROLLABLE MAIN CONTENT */}
      <main className="teams-main">
        <div className="teams-scroll-wrapper">
            <div className="teams-content-wrapper">
          
          {/* INTRO SECTION */}
          <div className="teams-intro">
            <h1 className="teams-title">Organization Teams</h1>
            <p className="teams-subtitle">
              Select a specific team to view their detailed timeline, activity schedules, and allocated tasks.
            </p>
          </div>

          {/* TEAMS LIST */}
          <div className="teams-grid">
            {MOCK_TEAMS.map((team) => (
              <div 
                key={team.id} 
                className="team-card"
                style={{ "--team-color": team.color }}
                onClick={() => navigate(`/timeline/${team.id}`)}
              >
                <div 
                  className="team-icon-wrapper" 
                  style={{ backgroundColor: `${team.color}20`, color: team.color }}
                >
                  {team.icon}
                </div>
                
                <div className="team-info">
                  <h3>{team.name}</h3>
                  <p>{team.description}</p>
                </div>
                
                <ChevronRight className="team-arrow" size={20} />
              </div>
            ))}
          </div>

        </div>
      </div>
      </main>
    </div>
  );
}