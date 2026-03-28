import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticateUser);

// In-memory store for discussions
// Record: { id, topic, creatorId, participants: [uid1, uid2], status: 'active' | 'terminated', createdAt }
const discussionsMap = new Map();

router.get("/", (req, res) => {
  const userId = req.user.uid;
  
  // Return discussions where the user is a participant or creator
  const userDiscussions = Array.from(discussionsMap.values()).filter(d => 
    d.creatorId === userId || d.participants.includes(userId)
  );
  
  // Sort newest first
  userDiscussions.sort((a, b) => b.createdAt - a.createdAt);
  
  res.json(userDiscussions);
});

router.post("/", (req, res) => {
  const { topic, participants } = req.body;
  
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const newDiscussion = {
    id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    topic,
    creatorId: req.user.uid,
    participants: participants || [], // array of UIDs
    status: "active",
    createdAt: Date.now(),
  };

  discussionsMap.set(newDiscussion.id, newDiscussion);
  
  res.status(201).json(newDiscussion);
});

router.post("/:id/terminate", (req, res) => {
  const { id } = req.params;
  const discussion = discussionsMap.get(id);
  
  if (!discussion) {
    return res.status(404).json({ error: "Discussion not found" });
  }
  
  if (discussion.creatorId !== req.user.uid) {
    return res.status(403).json({ error: "Only the creator can terminate this discussion" });
  }
  
  discussion.status = "terminated";
  discussionsMap.set(id, discussion);
  
  res.json(discussion);
});

export default router;
