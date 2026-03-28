import React, { useEffect, useState } from "react";
import { LogOut, FolderGit2, Search, Loader2, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchUserRepos } from "../services/githubService";
import { logout } from "../services/authService";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";
import "./WorkspacePage.css";

export default function WorkspacePage() {
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Matches Dashboard state
  const navigate = useNavigate();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.error("Failed to logout", err);
    }
  };

  useEffect(() => {
    const loadRepos = async () => {
      try {
        setLoading(true);
        const data = await fetchUserRepos();
        setRepos(data);
        setFilteredRepos(data);
      } catch (err) {
        setError(err.message || "Failed to load repositories");
        if (err.message.includes("403") || err.message.includes("Unauthorized")) {
            localStorage.clear();
            navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };
    loadRepos();
  }, [navigate]);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredRepos(
      repos.filter((r) => r.name.toLowerCase().includes(lowerSearch) || 
                          (r.description && r.description.toLowerCase().includes(lowerSearch)))
    );
  }, [search, repos]);

  const userName = localStorage.getItem("userName") || "Developer";

  return (
    <div className={`workspace-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      {/* Header - Fixed at the top */}
      <header className="workspace-header">
        <div className="header-left">
          <div className="workspace-logo">⚡ DEVSPACE</div>
          <div className="workspace-divider" />
          <h1 className="workspace-title">Your Environment</h1>
        </div>
        <div className="header-right">
          {/* Theme Toggle Added to match Dashboard */}
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="user-greeting">Welcome, {userName}</span>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content - Scrollable area */}
      <main className="workspace-main">
        <div className="workspace-content-wrapper">
          <div className="workspace-toolbar">
              <div className="search-bar">
                  <Search size={18} className="search-icon" />
                  <input 
                      type="text" 
                      placeholder="Search repositories..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="search-input"
                  />
              </div>
              <div className="repo-stats">
                   <FolderGit2 size={18} />
                   <span>{filteredRepos.length} Repositories</span>
              </div>
          </div>

          {error && (
              <div className="workspace-error">
                  <p>⚠️ {error}</p>
                  <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
              </div>
          )}

          {loading ? (
              <div className="workspace-loading">
                  <Loader2 size={40} className="spinner" />
                  <p>Syncing repositories from GitHub...</p>
              </div>
          ) : (
              <div className="repos-grid">
                  {filteredRepos.length > 0 ? (
                      filteredRepos.map(repo => (
                          <ProjectCard 
                              key={repo.id} 
                              repo={repo} 
                              onClick={() => setSelectedRepo(repo)} 
                          />
                      ))
                  ) : (
                      <div className="no-repos">
                          <FolderGit2 size={48} className="no-repos-icon" />
                          <h3>No repositories found</h3>
                          <p>We couldn't find any repositories matching your search.</p>
                      </div>
                  )}
              </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedRepo && (
          <ProjectModal 
              repo={selectedRepo} 
              onClose={() => setSelectedRepo(null)} 
          />
      )}
    </div>
  );
}