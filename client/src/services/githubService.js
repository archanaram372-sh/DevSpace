const API_BASE_URL = "http://localhost:5000/api/repos";

const getHeaders = () => {
  const token = localStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const fetchUserRepos = async () => {
  const response = await fetch(API_BASE_URL, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }
  
  return response.json();
};

export const fetchRepoContributors = async (owner, repo) => {
  const response = await fetch(`${API_BASE_URL}/${owner}/${repo}/contributors`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch contributors");
  }
  
  return response.json();
};

export const fetchRepoTree = async (owner, repo) => {
  const response = await fetch(`${API_BASE_URL}/${owner}/${repo}/files`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch repository tree");
  }
  
  return response.json();
};

export const fetchFileContent = async (owner, repo, path) => {
  const encodedPath = encodeURIComponent(path);
  const response = await fetch(`${API_BASE_URL}/${owner}/${repo}/contents/${encodedPath}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch file content");
  }
  
  return response.text();
};
