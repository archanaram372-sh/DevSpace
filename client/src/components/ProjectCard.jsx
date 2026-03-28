import React from "react";
import { FolderGit2, Globe, Lock, Clock } from "lucide-react";
import "./ProjectCard.css";

export default function ProjectCard({ repo, onClick }) {
  const isPrivate = repo.visibility === "private";
  const formattedDate = new Date(repo.updated_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="project-card" onClick={onClick}>
      <div className="card-header">
        <div className="repo-info-top">
          <FolderGit2 className="repo-icon" size={20} />
          <h3 className="repo-name">{repo.name}</h3>
        </div>
        <div className={`visibility-badge ${isPrivate ? "private" : "public"}`}>
          {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
          <span>{repo.visibility}</span>
        </div>
      </div>
      
      <div className="card-body">
        <p className="repo-description">
          {repo.description || "No description provided."}
        </p>
      </div>

      <div className="card-footer">
        <div className="footer-item">
          <span className="language-color" />
          <span className="language-text">{repo.language || "Multiple"}</span>
        </div>
        <div className="footer-item">
          <Clock size={14} />
          <span>Updated {formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
