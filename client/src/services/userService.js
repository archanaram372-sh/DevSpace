const API_BASE_URL = "http://localhost:5000/api/users";

const getHeaders = () => {
  const token = localStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const fetchAllUsers = async () => {
  const response = await fetch(API_BASE_URL, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  
  return response.json();
};
