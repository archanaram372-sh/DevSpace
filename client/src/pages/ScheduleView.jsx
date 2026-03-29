import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { ArrowLeft, Check, X, Calendar as CalIcon, ChevronLeft, ChevronRight, Moon, Sun, Plus, Search, Users, UserPlus } from "lucide-react";
import "./ScheduleView.css";

// Updated Heatmap with Tooltip
const ActivityHeatmap = ({ tasks }) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const getActivityLevel = (week, day) => {
    const year = 2026;
    const firstDayOfYear = new Date(year, 0, 1);
    const startOffset = firstDayOfYear.getDay(); 
    const targetDate = new Date(year, 0, (week * 7) + day - startOffset + 1);
    if (targetDate.getFullYear() !== year) return 0;
    const dateStr = `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}`;
    const dayTasks = tasks.filter(t => t.date === dateStr);
    const count = dayTasks.length;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3; 
  };

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <CalIcon size={18} />
        <h3>Task Activity & Contributions</h3>
      </div>
      <div className="heatmap-container">
        <div className="heatmap-months">
          {months.map(m => <span key={m}>{m}</span>)}
        </div>
        <div className="heatmap-scroll-area">
          <div className="heatmap-grid">
            {[...Array(53)].map((_, weekIdx) => (
              <div className="heatmap-col" key={weekIdx}>
                {[...Array(7)].map((_, dayIdx) => {
                  const level = getActivityLevel(weekIdx, dayIdx);
                  const dateObj = new Date(2026, 0, (weekIdx * 7) + dayIdx - new Date(2026, 0, 1).getDay() + 1);
                  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div 
                      key={dayIdx} 
                      className={`heatmap-cell lvl-${level}`}
                      title={level > 0 ? `${displayDate}: ${level} tasks` : `No tasks on ${displayDate}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ScheduleView() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("#6366f1");
  const [collabInput, setCollabInput] = useState("");
  const [collaborators, setCollaborators] = useState([]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const q = query(collection(db, "teams", teamId, "schedule"));
    const unsub = onSnapshot(q, (snapshot) => {
      const activeTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(activeTasks);
    });
    return () => unsub();
  }, [teamId]);

  const addCollabToDraft = () => {
    if (collabInput && !collaborators.includes(collabInput)) {
      setCollaborators([...collaborators, collabInput]);
      setCollabInput("");
    }
  };

  const removeCollabFromDraft = (id) => {
    setCollaborators(collaborators.filter(c => c !== id));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await addDoc(collection(db, "teams", teamId, "schedule"), {
        title: newTaskTitle,
        tag: newTaskTag,
        color: newTaskColor,
        date: selectedDate,
        collaborators: collaborators, // Added feature
        isCompleted: false,
        createdAt: Date.now()
      });
      setNewTaskTitle("");
      setNewTaskTag("");
      setCollaborators([]);
    } catch (err) { console.error(err); }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    await updateDoc(doc(db, "teams", teamId, "schedule", taskId), { isCompleted: !currentStatus });
  };

  const deleteTask = async (taskId) => {
    await deleteDoc(doc(db, "teams", teamId, "schedule", taskId));
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const filteredTasks = tasks.filter(t => {
    const matchesDate = t.date === selectedDate;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.tag && t.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.collaborators && t.collaborators.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesDate && matchesSearch;
  });

  return (
    <div className={`workspace-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <header className="workspace-header">
        <div className="header-left">
          <button className="back-nav-btn" onClick={() => navigate("/timeline")}>
            <ArrowLeft size={18} />
          </button>
          <div className="workspace-logo">⚡ {teamId.toUpperCase()}</div>
          <div className="workspace-divider" />
          <h1 className="workspace-title">Sprint Schedule</h1>
        </div>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="user-badge">Admin</div>
        </div>
      </header>

      <main className="workspace-main">
        <div className="workspace-content-wrapper">
          <ActivityHeatmap tasks={tasks} />

          <div className="schedule-grid">
            <div className="calendar-card">
              <div className="calendar-controls">
                <div className="nav-group">
                   <button onClick={() => changeMonth(-1)}><ChevronLeft size={20}/></button>
                   <h3>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                   <button onClick={() => changeMonth(1)}><ChevronRight size={20}/></button>
                </div>
                <div className="view-switch">
                   <button className="active">Monthly</button>
                   <button>Weekly</button>
                </div>
              </div>

              <div className="calendar-grid-header">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
              </div>
              
              <div className="calendar-days">
                {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} className="day-cell empty" />)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
                  const isSelected = selectedDate === dateKey;
                  const dayTasks = tasks.filter(t => t.date === dateKey);
                  const hasTasks = dayTasks.length > 0;
                  return (
                    <div 
                      key={day} 
                      className={`day-cell ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDate(dateKey)}
                      title={hasTasks ? `Tasks: ${dayTasks.map(t => t.title).join(", ")}` : "No tasks"}
                    >
                      <span>{day}</span>
                      {hasTasks && <div className="task-indicator" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="task-panel-card">
              <div className="task-panel-header">
                <h3>Tasks: {selectedDate}</h3>
                <div className="search-wrapper">
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search tasks or members..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="task-search-input"
                  />
                </div>
              </div>

              <form className="quick-add-form" onSubmit={handleAddTask}>
                <input 
                  type="text" 
                  placeholder="Task title..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="main-input"
                />
                
                <div className="collab-input-group">
                  <div className="input-with-btn">
                    <input 
                      type="text" 
                      placeholder="Add member (Email/GitHub)" 
                      value={collabInput}
                      onChange={(e) => setCollabInput(e.target.value)}
                    />
                    <button type="button" onClick={addCollabToDraft}><UserPlus size={16}/></button>
                  </div>
                  {collaborators.length > 0 && (
                    <div className="draft-collabs">
                      {collaborators.map(c => (
                        <span key={c} className="collab-pill">
                          {c} <X size={10} onClick={() => removeCollabFromDraft(c)}/>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <input 
                    type="text" 
                    placeholder="Tag" 
                    value={newTaskTag}
                    onChange={(e) => setNewTaskTag(e.target.value)}
                  />
                  <input type="color" value={newTaskColor} onChange={(e) => setNewTaskColor(e.target.value)} />
                  <button type="submit" disabled={!newTaskTitle.trim()} className="submit-task-btn">
                    <Plus size={18}/> Add Task
                  </button>
                </div>
              </form>

              <div className="task-scroller">
                {filteredTasks.map((task) => (
                  <div key={task.id} className={`task-item ${task.isCompleted ? 'done' : ''}`}>
                    <div className="task-color-tag" style={{ background: task.color }} />
                    <div className="task-info">
                      <div className="task-main-row">
                        <p className="task-name">{task.title}</p>
                        {task.tag && <span className="task-label">{task.tag}</span>}
                      </div>
                      
                      {task.collaborators && task.collaborators.length > 0 && (
                        <div className="task-collaborators">
                          <Users size={12} />
                          {task.collaborators.map(email => (
                            <span key={email} className="member-badge" title={email}>
                              {email.charAt(0).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="task-actions">
                      <button onClick={() => toggleTaskCompletion(task.id, task.isCompleted)}><Check size={16}/></button>
                      <button onClick={() => deleteTask(task.id)} className="del-btn"><X size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}