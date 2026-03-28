import React, { useEffect, useState, useRef } from "react";
import { MessageSquareText, Plus, LogOut, CheckSquare, Settings2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSocket, connectSocket, disconnectSocket } from "../services/socketService";
import { fetchAllUsers } from "../services/userService";
import { fetchDiscussions, createDiscussion, terminateDiscussion } from "../services/discussionService";
import { getCurrentUser } from "../services/authService";
import "./DiscussionsPage.css";

export default function DiscussionsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Data
  const [platformUsers, setPlatformUsers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [messages, setMessages] = useState({}); // { discussionId: [messages] }
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update for active discussion
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeDiscussion]);

  useEffect(() => {
    const initData = async () => {
      const currentUser = getCurrentUser();
      const token = localStorage.getItem("userToken");
      if (!currentUser || !token) {
        navigate("/");
        return;
      }
      setUser(currentUser);

      try {
        const [usersRes, discussionsRes] = await Promise.all([
          fetchAllUsers(),
          fetchDiscussions(),
        ]);
        
        // Exclude self from selection
        setPlatformUsers(usersRes.filter(u => u.uid !== currentUser.uid));
        setDiscussions(discussionsRes);
      } catch (err) {
        console.error("Failed to fetch discussion data:", err);
      } finally {
        setLoading(false);
      }

      // Initialize Socket
      const socket = connectSocket(token);
      socketRef.current = socket;

      socket.on("receive-message", ({ userName, message, timestamp, roomId }) => {
        setMessages(prev => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), { userName, message, timestamp }]
        }));
      });

      return () => {
        disconnectSocket();
      };
    };
    initData();
  }, [navigate]);

  useEffect(() => {
    if (activeDiscussion && socketRef.current) {
        // We multiplex discussions by telling socket to join this thread's room
        socketRef.current.emit("join-room", activeDiscussion.id);
    }
  }, [activeDiscussion]);

  const handleCreateDiscussion = async () => {
    if (!newTopic.trim()) return;
    try {
      const newD = await createDiscussion(newTopic, selectedParticipants);
      setDiscussions([newD, ...discussions]);
      setShowNewModal(false);
      setNewTopic("");
      setSelectedParticipants([]);
      setActiveDiscussion(newD);
    } catch (err) {
      console.error("Failed to create discussion", err);
    }
  };

  const handleTerminate = async () => {
    if (!activeDiscussion) return;
    const confirmTerm = window.confirm("Are you sure you want to terminate this discussion? It will remain visible but read-only.");
    if (!confirmTerm) return;

    try {
      const updated = await terminateDiscussion(activeDiscussion.id);
      setDiscussions(discussions.map(d => d.id === updated.id ? updated : d));
      setActiveDiscussion(updated);
    } catch (err) {
      console.error("Failed to terminate", err);
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !activeDiscussion || !socketRef.current) return;
    if (activeDiscussion.status === "terminated") return;

    // We rely on the backend "send-message" broadcasting to the joined room
    socketRef.current.emit("send-message", chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="discussions-container">
      {/* Sidebar */}
      <aside className="discussions-sidebar">
        <div className="sidebar-brand" onClick={() => navigate("/dashboard")}>
          <MessageSquareText size={20} />
          <span>DevSpace Topics</span>
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
             <div className="p-4 text-center text-secondary text-sm">No discussions yet.</div>
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
                  <span>{activeDiscussion.participants.length + 1} Participants</span>
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
                    Discussion "{activeDiscussion.topic}" created on {new Date(activeDiscussion.createdAt).toLocaleDateString()}
                </div>
                
                {(messages[activeDiscussion.id] || []).map((msg, idx) => (
                  <div key={idx} className="msg-bubble">
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
            <p>Choose an existing thread or create a new topic to start collaborating.</p>
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
