import express from "express";
import admin from "../firebaseAdmin.js";
import { githubTokens } from "../tokenStore.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { token, githubToken } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    if (githubToken) {
      githubTokens.set(decoded.uid, githubToken);
      console.log(`Stored GitHub token for user: ${decoded.email}`);
    } else {
      console.log(`User authenticated without GitHub token: ${decoded.email}`);
    }

    res.json({
      message: "Authenticated",
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ error: "Invalid token", details: err.message });
  }
});

export default router;