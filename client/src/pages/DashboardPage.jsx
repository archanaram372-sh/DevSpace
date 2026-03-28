import React, { useState, useEffect } from "react";
import { Code2, Calendar, MessageSquareText, LogOut, Activity, Users, Zap, Bell, X, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const userName = localStorage.getItem("userName") || "Developer";

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const notifications = [
    { id: 1, text: "New commit in Workspace by Arjun", time: "2 mins ago" },
    { id: 2, text: "Timeline updated: Phase 2 Milestone", time: "1 hour ago" },
    { id: 3, text: "New discussion started in Contributors", time: "3 hours ago" },
  ];

  const stats = [
    { label: "Active Projects", value: "12", icon: <Zap size={16} /> },
    { label: "Team Members", value: "8", icon: <Users size={16} /> },
    { label: "Status", value: "Online", icon: <Activity size={16} />, color: "#10b981" },
  ];

  const dashboardItems = [
    { title: "Workspace", description: "Collaborate in real-time code environments.", icon: <Code2 size={40} />, route: "/workspace", color: "#6366f1" },
    { title: "Timeline", description: "Sync up on roadmaps and task calendars.", icon: <Calendar size={40} />, route: "/timeline", color: "#10b981" },
    { title: "Contributors", description: "Start topic-specific discussion threads.", icon: <MessageSquareText size={40} />, route: "/discussions", color: "#f59e0b" },
  ];

  return (
    <div className={`dashboard-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-logo">⚡ DEVSPACE HUB</div>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn notification-btn" onClick={() => setSidebarOpen(true)}>
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>
          <span className="user-greeting">{userName}</span>
          <button className="logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Notifications Sidebar */}
      <div className={`notification-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h3>Notifications</h3>
          <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="sidebar-content">
          {notifications.map(n => (
            <div key={n.id} className="notification-item">
              <p>{n.text}</p>
              <span>{n.time}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-intro">
            <h1 className="intro-title">Project Control Center</h1>
            <p className="intro-subtitle">Manage your development workflow across all modules.</p>
          </div>

          <div className="stats-bar">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-icon" style={{ color: stat.color }}>{stat.icon}</span>
                <span className="stat-label">{stat.label}:</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            {dashboardItems.map((item) => (
              <div key={item.title} className="dashboard-card" onClick={() => navigate(item.route)} style={{ "--card-accent": item.color }}>
                <div className="card-icon-wrapper" style={{ color: item.color }}>{item.icon}</div>
                <h2 className="card-title">{item.title}</h2>
                <p className="card-description">{item.description}</p>
                <div className="card-action">Open Module &rarr;</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}