import React from "react";
import { Code2, Calendar, MessageSquareText, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Developer";

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.error("Failed to logout", err);
    }
  };

  const dashboardItems = [
    {
      title: "Workspace",
      description: "Access your GitHub repositories and enter collaborative real-time editor instances.",
      icon: <Code2 size={40} className="card-icon" />,
      route: "/workspace",
      color: "var(--accent)",
    },
    {
      title: "Timeline",
      description: "Manage task allocations, review milestone calendars, and sync up on roadmaps.",
      icon: <Calendar size={40} className="card-icon" />,
      route: "/timeline",
      color: "#10b981", // Emerald
    },
    {
      title: "Contributors",
      description: "Create topic-specific discussion threads, invite users, and collaborate directly.",
      icon: <MessageSquareText size={40} className="card-icon" />,
      route: "/discussions",
      color: "#f59e0b", // Amber
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-logo">⚡ DEVSPACE HUB</div>
        </div>
        <div className="header-right">
          <span className="user-greeting">Welcome, {userName}</span>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h1 className="intro-title">Where do you want to go?</h1>
          <p className="intro-subtitle">Select a module below to start collaborating with your team.</p>
        </div>

        <div className="dashboard-grid">
          {dashboardItems.map((item) => (
            <div
              key={item.title}
              className="dashboard-card"
              onClick={() => navigate(item.route)}
              style={{ "--card-accent": item.color }}
            >
              <div className="card-icon-wrapper" style={{ color: item.color }}>
                {item.icon}
              </div>
              <h2 className="card-title">{item.title}</h2>
              <p className="card-description">{item.description}</p>
              
              <div className="card-action">
                Enter {item.title} &rarr;
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
