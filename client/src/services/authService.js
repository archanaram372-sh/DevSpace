import { getAuth, signInWithPopup, GithubAuthProvider, signOut } from "firebase/auth";
import { app } from "../firebase";

const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();

export const loginWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const githubToken = credential.accessToken;
    
    const user = result.user;
    const token = await user.getIdToken();
    return { user, token, githubToken };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const verifyTokenWithBackend = async (token, githubToken) => {
  try {
    const response = await fetch("http://localhost:5000/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, githubToken }),
    });

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};
