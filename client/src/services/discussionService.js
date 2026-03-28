const API_BASE_URL = "http://localhost:5000/api/discussions";

const getHeaders = () => {
  const token = localStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const fetchDiscussions = async () => {
  const response = await fetch(API_BASE_URL, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch discussions");
  }
  
  return response.json();
};

export const createDiscussion = async (topic, participants) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ topic, participants }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to create discussion");
  }
  
  return response.json();
};

export const terminateDiscussion = async (discussionId) => {
  const response = await fetch(`${API_BASE_URL}/${discussionId}/terminate`, {
    method: "POST",
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to terminate discussion");
  }
  
  return response.json();
};
