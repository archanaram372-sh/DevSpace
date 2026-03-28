import express from "express";
import admin from "../firebaseAdmin.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticateUser);

// GET /api/users - Fetch all registered internal users
router.get("/", async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || userRecord.email?.split("@")[0] || "Unknown User",
      photoURL: userRecord.photoURL || null,
    }));
    
    // Quick sort alphabetically by name
    users.sort((a, b) => a.name.localeCompare(b.name));

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch platform users" });
  }
});

export default router;
