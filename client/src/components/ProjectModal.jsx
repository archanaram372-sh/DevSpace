import React, { useEffect, useState } from "react";
import { X, ExternalLink, Code2, Users, FileCode2, Star, GitFork, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchRepoContributors } from "../services/githubService";
import "./ProjectModal.css";

export default function ProjectModal({ repo, onClose }) {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContributors = async () => {
      try {
        setLoading(true);
        const data = await fetchRepoContributors(repo.owner, repo.name);
        setContributors(data.slice(0, 10)); // max 10 to keep it clean
      } catch (err) {
        console.error("Failed to load contributors:", err);
      } finally {
        setLoading(false);
      }
    };
    if (repo) loadContributors();
  }, [repo]);

  if (!repo) return null;

  const handleOpenWorkspace = () => {
    navigate(`/editor?owner=${repo.owner}&repo=${repo.name}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="project-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{repo.name}</h2>
            <p className="modal-subtitle">by {repo.owner}</p>
          </div>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-section pb-4">
            <h3 className="section-title">About</h3>
            <p className="modal-description">
              {repo.description || "No description provided."}
            </p>
          </div>

          <div className="modal-section contributor-section">
            <h3 className="section-title">
              <Users size={16} />
              Top Contributors
            </h3>
            {loading ? (
              <div className="py-8 flex justify-center text-secondary">
                  <Loader2 size={24} className="spinner" />
              </div>
            ) : contributors.length > 0 ? (
              <div className="contributors-list">
                {contributors.map(c => (
                  <div key={c.login} className="contributor-item" title={`${c.contributions} commits`}>
                    <img src={c.avatar_url} alt={c.login} className="contributor-avatar" />
                    <div className="contributor-info">
                      <span className="contributor-name">{c.login}</span>
                      <span className="contributor-commits">{c.contributions} commits</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <p className="text-secondary text-sm">No contributor data available.</p>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => window.open(`https://github.com/${repo.owner}/${repo.name}`, "_blank")}>
            <ExternalLink size={18} />
            View on GitHub
          </button>
          
          <div className="flex gap-4">
            <button className="btn btn-primary" onClick={handleOpenWorkspace}>
              <Code2 size={18} />
              Open Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
