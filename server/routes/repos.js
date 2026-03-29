import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { githubTokens } from "../tokenStore.js";

const router = express.Router();

// Middleware to ensure we have a GitHub token for the authenticated user
const requireGithubToken = (req, res, next) => {
  const token = githubTokens.get(req.user.uid);
  if (!token) {
    return res.status(403).json({ error: "No GitHub token found. Please re-authenticate." });
  }
  req.githubToken = token;
  next();
};

router.use(authenticateUser);
router.use(requireGithubToken);

// Helper function to fetch from GitHub API
const fetchFromGitHub = async (url, token) => {
  const response = await fetch(`https://api.github.com${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${err}`);
  }
  return response.json();
};

// GET /api/repos - Fetch user repositories
router.get("/", async (req, res) => {
  try {
    const repos = await fetchFromGitHub("/user/repos?sort=updated&per_page=100", req.githubToken);
    
    // Map to simple structure
    const formattedRepos = repos.map(r => ({
      id: r.id,
      name: r.name,
      owner: r.owner.login,
      description: r.description,
      language: r.language,
      visibility: r.visibility,
      updated_at: r.updated_at,
    }));

    res.json(formattedRepos);
  } catch (error) {
    console.error("Error fetching repos:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// GET /api/repos/:owner/:repo/contributors - Fetch contributors
router.get("/:owner/:repo/contributors", async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const contributors = await fetchFromGitHub(`/repos/${owner}/${repo}/contributors`, req.githubToken);
    
    const formatted = contributors.map(c => ({
      login: c.login,
      avatar_url: c.avatar_url,
      contributions: c.contributions,
      html_url: c.html_url
    }));

    res.json(formatted);
  } catch (error) {
    console.error(`Error fetching contributors for ${owner}/${repo}:`, error);
    res.status(500).json({ error: "Failed to fetch contributors" });
  }
});

// GET /api/repos/:owner/:repo/files - Fetch simple repository tree
router.get("/:owner/:repo/files", async (req, res) => {
  const { owner, repo } = req.params;
  try {
    // Get default branch or master/main
    const repoData = await fetchFromGitHub(`/repos/${owner}/${repo}`, req.githubToken);
    const branch = repoData.default_branch || "main";

    const treeData = await fetchFromGitHub(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, req.githubToken);
    
    // Filter to only simple files for editor representation, limit depth to avoid massive payloads
    // Monaco can just be fed an array of paths and type
    const files = treeData.tree.map(node => ({
      path: node.path,
      type: node.type, // 'blob' for file, 'tree' for directory
      size: node.size,
      url: node.url
    }));

    res.json(files);
  } catch (error) {
    console.error(`Error fetching files for ${owner}/${repo}:`, error);
    res.status(500).json({ error: "Failed to fetch repository files" });
  }
});

// GET /api/repos/:owner/:repo/contents/:path - Fetch file content
router.get("/:owner/:repo/contents/:path", async (req, res) => {
  const { owner, repo, path } = req.params;
  try {
    const data = await fetchFromGitHub(`/repos/${owner}/${repo}/contents/${path}`, req.githubToken);
    
    // GitHub contents API returns base64 encoded content for files
    if (data.type === 'file' && data.encoding === 'base64') {
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      res.send(content);
    } else {
      res.send(""); // In case it's empty or unexpected
    }
  } catch (error) {
    console.error(`Error fetching file content for ${owner}/${repo}/${path}:`, error);
    res.status(500).json({ error: "Failed to fetch file content" });
  }
});

export default router;
