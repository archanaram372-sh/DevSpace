import React, { useEffect, useState, useRef } from "react";
import { MessageSquareText, Plus, CheckSquare, Settings2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { fetchAllUsers } from "../services/userService";
import { getCurrentUser } from "../services/authService";
import "./DiscussionsPage.css";

const TEAMS = [
  { id: "team-a", name: "Team A" },
  { id: "team-b", name: "Team B" },
  { id: "team-c", name: "Team C" },
  { id: "team-d", name: "Team D" }
];

export default function DiscussionsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Data
  const [platformUsers, setPlatformUsers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [messages, setMessages] = useState([]); 
  
  // Team 
  const [activeTeamId, setActiveTeamId] = useState(TEAMS[0].id);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeDiscussion]);

  // Init User & Platform Directory
  useEffect(() => {
    const initData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate("/");
        return;
      }
      setUser(currentUser);

      try {
        const usersRes = await fetchAllUsers();
        setPlatformUsers(usersRes.filter(u => u.uid !== currentUser.uid));
      } catch (err) {
        console.error("Failed to fetch user directory:", err);
      } 
    };
    initData();
  }, [navigate]);

  // Firestore: Listen to Discussions for active Team
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, "teams", activeTeamId, "discussions"),
      orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter for discussions user is participant or creator
      const myThreads = threads.filter(d => 
         d.creatorId === user.uid || (d.participants && d.participants.includes(user.uid)) || true // Showing all for transparency in MVP
      );
      setDiscussions(myThreads);
      setLoading(false);
      
      // Update active discussion reference if modified
      if (activeDiscussion) {
        const updatedActive = myThreads.find(t => t.id === activeDiscussion.id);
        if (updatedActive) setActiveDiscussion(updatedActive);
      }
    });

    return () => unsub();
  }, [activeTeamId, user]);

  // Firestore: Listen to Messages for Active Discussion
  useEffect(() => {
    if (!activeDiscussion) return;

    const messagesRef = collection(db, "teams", activeTeamId, "discussions", activeDiscussion.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsub();
  }, [activeDiscussion, activeTeamId]);


  const handleCreateDiscussion = async () => {
    if (!newTopic.trim() || !user) return;
    try {
      const docRef = await addDoc(collection(db, "teams", activeTeamId, "discussions"), {
        topic: newTopic,
        creatorId: user.uid,
        participants: selectedParticipants, // array of UIDs
        status: "active",
        createdAt: serverTimestamp()
      });
      
      setShowNewModal(false);
      setNewTopic("");
      setSelectedParticipants([]);
      setActiveDiscussion({ id: docRef.id, topic: newTopic, status: "active", participants: selectedParticipants, creatorId: user.uid });
    } catch (err) {
      console.error("Failed to create discussion", err);
    }
  };

  const handleTerminate = async () => {
    if (!activeDiscussion) return;
    const confirmTerm = window.confirm("Are you sure you want to terminate this discussion? It will remain visible but read-only.");
    if (!confirmTerm) return;

    try {
      await updateDoc(doc(db, "teams", activeTeamId, "discussions", activeDiscussion.id), {
        status: "terminated"
      });
    } catch (err) {
      console.error("Failed to terminate", err);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeDiscussion || !user) return;
    if (activeDiscussion.status === "terminated") return;

    const txt = chatInput.trim();
    setChatInput(""); // optimistic clear

    try {
      await addDoc(collection(db, "teams", activeTeamId, "discussions", activeDiscussion.id, "messages"), {
        userName: user.displayName || user.email,
        userId: user.uid,
        message: txt,
        timestamp: serverTimestamp()
      });
    } catch(err) {
      console.error("Failed sending msg", err);
    }
  };

  return (
    <div className="discussions-container">
      {/* Sidebar */}
      <aside className="discussions-sidebar">
        <div className="sidebar-brand" onClick={() => navigate("/dashboard")}>
          <MessageSquareText size={20} />
          <span>DevSpace Topics</span>
        </div>
        
        <div className="team-selector-wrap" style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--border)'}}>
           <select 
             className="modal-input" 
             style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem'}}
             value={activeTeamId}
             onChange={e => {
                setActiveTeamId(e.target.value);
                setActiveDiscussion(null);
                setMessages([]);
             }}
           >
             {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
           </select>
        </div>

        <div className="sidebar-actions">
          <button className="new-btn" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> New Topic
          </button>
        </div>

        <div className="thread-list">
          {loading ? (
            <div className="p-4 text-center text-secondary">Loading...</div>
          ) : discussions.length > 0 ? (
            discussions.map(d => (
              <div 
                key={d.id} 
                className={`thread-item ${activeDiscussion?.id === d.id ? "active" : ""} ${d.status === "terminated" ? "terminated-item" : ""}`}
                onClick={() => setActiveDiscussion(d)}
              >
                <div className="thread-title">{d.topic}</div>
                <div className="thread-meta">
                  <span className={`status-badge ${d.status}`}>{d.status}</span>
                </div>
              </div>
            ))
          ) : (
             <div className="p-4 text-center" style={{ color: 'var(--text-secondary)', fontSize:'0.9rem' }}>No discussions in this team yet.</div>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="discussions-main">
        {activeDiscussion ? (
          <div className="chat-interface">
            <header className="chat-header">
              <div className="chat-header-info">
                <h2>{activeDiscussion.topic}</h2>
                <div className="chat-header-meta">
                  <span>{(activeDiscussion.participants?.length || 0) + 1} Participants</span>
                  {activeDiscussion.status === "terminated" && <span className="term-badge">TERMINATED</span>}
                </div>
              </div>
              
              <div className="chat-header-actions">
                  {user && activeDiscussion.creatorId === user.uid && activeDiscussion.status === "active" && (
                    <button className="terminate-btn" onClick={handleTerminate}>
                      <Trash2 size={16} /> Terminate
                    </button>
                  )}
              </div>
            </header>
            
            <div className="chat-messages">
                <div className="chat-notice">
                    Discussion "{activeDiscussion.topic}" created in Team {TEAMS.find(t => t.id === activeTeamId)?.name}
                </div>
                
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className="msg-bubble">
                    <span className="msg-author">{msg.userName}</span>
                    <span className="msg-text">{msg.message}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
              {activeDiscussion.status === "active" ? (
                  <>
                    <input 
                      type="text" 
                      className="chat-input" 
                      placeholder="Type your message..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button className="send-btn" onClick={sendMessage}>Send</button>
                  </>
              ) : (
                  <div className="read-only-banner">This discussion has been terminated and is now read-only.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <MessageSquareText size={64} className="empty-icon" />
            <h2>Select a conversation</h2>
            <p>Choose an existing thread or create a new topic to start collaborating in {TEAMS.find(t => t.id === activeTeamId)?.name}.</p>
          </div>
        )}
      </main>

      {/* New Topic Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-content disc-modal" onClick={e => e.stopPropagation()}>
            <h3>Start New Discussion</h3>
            <div className="input-group">
                <label>Topic Name</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="E.g., Production Auth Issue" 
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  className="modal-input"
                />
            </div>
            
            <div className="input-group">
                <label>Invite Contributors</label>
                <div className="users-list">
                    {platformUsers.length > 0 ? platformUsers.map(u => (
                      <label key={u.uid} className="user-cb">
                        <input 
                          type="checkbox" 
                          checked={selectedParticipants.includes(u.uid)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedParticipants([...selectedParticipants, u.uid]);
                            else setSelectedParticipants(selectedParticipants.filter(id => id !== u.uid));
                          }}
                        />
                        <span className="cb-name">{u.name} <em>({u.email})</em></span>
                      </label>
                    )) : (
                      <div className="no-users">No other users found on the platform.</div>
                    )}
                </div>
            </div>

            <div className="modal-actions-bot">
                <button className="cancel-btn" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button className="create-btn" onClick={handleCreateDiscussion} disabled={!newTopic.trim()}>Create Thread</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
