import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { ArrowLeft, Check, X, Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import "./ScheduleView.css";

// Helper components
const ActivityHeatmap = ({ tasks }) => {
  // Simplified Heatmap rendering 52 weeks x 7 days
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Calculate activity levels per day (just randomly or based on tasks)
  // For MVP: Mark squares based on real Firestore tasks + Simulated GitHub Commits
  const activityMap = {};
  
  // 1: Add real Firestore tasks
  tasks.forEach(t => {
    if (!activityMap[t.date]) activityMap[t.date] = { tasks: 0, commits: 0 };
    activityMap[t.date].tasks++;
  });

  // 2: Add mock GitHub commits (simulating recent push events)
  // In a real production app, this would fetch from /users/username/events
  const mockGithubCommitsDates = [
    "2026-1-2", "2026-1-5", "2026-1-10", "2026-2-14", "2026-2-20", "2026-3-5"
  ];
  mockGithubCommitsDates.forEach(date => {
    if (!activityMap[date]) activityMap[date] = { tasks: 0, commits: 0 };
    activityMap[date].commits += Math.floor(Math.random() * 5) + 1;
  });

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <CalIcon size={20} className="heatmap-icon" />
        <h2>Task Calendar & Activity</h2>
      </div>
      <div className="heatmap-graph">
        <div className="heatmap-months">
          {months.map(m => <span key={m}>{m}</span>)}
        </div>
        <div className="heatmap-grid">
           {/* Mocking 52 weeks of 7 days */}
           {[...Array(52)].map((_, weekIdx) => (
             <div className="heatmap-col" key={weekIdx}>
               {[...Array(7)].map((_, dayIdx) => {
                 // rough date calc just for visual MVP
                 const mockDateObj = new Date(2026, 0, weekIdx * 7 + dayIdx);
                 const dateStr = `${mockDateObj.getFullYear()}-${mockDateObj.getMonth()+1}-${mockDateObj.getDate()}`;
                 
                 const metrics = activityMap[dateStr] || { tasks: 0, commits: 0 };
                 const count = metrics.tasks + metrics.commits;
                 
                 let bgClass = "bg-level-0";
                 if (count > 0 && count <= 2) bgClass = "bg-level-1";
                 if (count > 2 && count <= 5) bgClass = "bg-level-2";
                 if (count > 5) bgClass = "bg-level-3";

                 const titleStr = `${metrics.tasks} tasks, ${metrics.commits} commits on ${dateStr}`;

                 return <div key={dayIdx} className={`heatmap-cell ${bgClass}`} title={titleStr} />
               })}
             </div>
           ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: '#888', marginTop: '0.5rem', gap: '0.5rem' }}>
        <span>Less</span>
        <div className="heatmap-cell bg-level-0"></div>
        <div className="heatmap-cell bg-level-1"></div>
        <div className="heatmap-cell bg-level-2"></div>
        <div className="heatmap-cell bg-level-3" style={{backgroundColor: 'var(--heat-4)'}}></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default function ScheduleView() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  const [tasks, setTasks] = useState([]);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("#ff007f"); // Default pink as per mockup

  useEffect(() => {
    // Listen to firestore changes directly
    const q = query(collection(db, "teams", teamId, "schedule"));
    const unsub = onSnapshot(q, (snapshot) => {
      const activeTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(activeTasks);
    });
    
    return () => unsub();
  }, [teamId]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addDoc(collection(db, "teams", teamId, "schedule"), {
        title: newTaskTitle,
        tag: newTaskTag,
        color: newTaskColor,
        date: selectedDate,
        isCompleted: false,
        createdAt: Date.now()
      });
      setNewTaskTitle("");
      setNewTaskTag("");
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      await updateDoc(doc(db, "teams", teamId, "schedule", taskId), {
        isCompleted: !currentStatus
      });
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "teams", teamId, "schedule", taskId));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  // Calendar Math
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Filter tasks for the selected date on the right panel
  const selectedDateTasks = tasks.filter(t => t.date === selectedDate);
  const selectedDateTasksCount = selectedDateTasks.length;

  return (
    <div className="schedule-layout">
      <header className="schedule-header">
        <button className="back-btn" onClick={() => navigate("/timeline")}>
          <ArrowLeft size={18} /> Teams
        </button>
        <div className="team-badge">Team: {teamId.toUpperCase()}</div>
      </header>

      <div className="schedule-content">
        <ActivityHeatmap tasks={tasks} />

        <div className="schedule-bottom-grid">
          {/* Calendar Panel */}
          <div className="calendar-panel">
            <div className="calendar-nav">
               <div className="view-toggles">
                 <button className="view-toggle">Monthly</button>
                 <button className="view-toggle">Weekly</button>
                 <button className="view-toggle active">Yearly</button>
               </div>
               <div className="month-picker">
                 <button className="nav-arrow" onClick={handlePrevMonth}><ChevronLeft size={20}/></button>
                 <h3>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                 <button className="nav-arrow" onClick={handleNextMonth}><ChevronRight size={20}/></button>
               </div>
            </div>

            <div className="calendar-grid">
              {/* Day Headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="cal-day-header">{d}</div>
              ))}
              
              {/* Empty slots before first day */}
              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} className="cal-cell empty"></div>
              ))}
              
              {/* Actual Days */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const fullDateStr = `${currentYear}-${currentMonth + 1}-${day}`;
                const isSelected = selectedDate === fullDateStr;
                
                // Check if date has tasks
                const hasTasks = tasks.some(t => t.date === fullDateStr);
                
                return (
                  <div 
                    key={day} 
                    className={`cal-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(fullDateStr)}
                  >
                    <span>{day}</span>
                    {hasTasks && <div className="task-dot" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task Panel */}
          <div className="task-panel">
             <h2 className="task-panel-title">Tasks: {selectedDate}</h2>
             
             <form className="task-form" onSubmit={handleAddTask}>
               <input 
                 type="text" 
                 className="task-input" 
                 placeholder="What needs to be done?" 
                 value={newTaskTitle}
                 onChange={(e) => setNewTaskTitle(e.target.value)}
               />
               
               <div className="task-meta-inputs">
                 <div className="meta-group">
                   <label>Tag</label>
                   <input 
                     type="text" 
                     className="meta-input" 
                     value={newTaskTag}
                     onChange={(e) => setNewTaskTag(e.target.value)}
                   />
                 </div>
                 <div className="meta-group line-group">
                   <label>Color:</label>
                   <input 
                     type="color" 
                     className="color-picker"
                     value={newTaskColor}
                     onChange={(e) => setNewTaskColor(e.target.value)}
                   />
                 </div>
               </div>

               <button type="submit" className="add-task-btn" disabled={!newTaskTitle.trim()}>
                 Add Task
               </button>
             </form>

             <div className="task-list">
               {selectedDateTasksCount > 0 ? (
                 selectedDateTasks.map((task) => (
                   <div 
                     key={task.id} 
                     className={`task-item ${task.isCompleted ? 'completed' : ''}`}
                     style={{ '--task-color': task.color }}
                   >
                     <div className="task-content">
                       <span className="task-title">{task.title}</span>
                       {task.tag && <span className="task-tag">{task.tag}</span>}
                     </div>
                     <div className="task-actions">
                       <button className="task-act-btn check" onClick={() => toggleTaskCompletion(task.id, task.isCompleted)}>
                         <Check size={16} />
                       </button>
                       <button className="task-act-btn del" onClick={() => deleteTask(task.id)}>
                         <X size={16} />
                       </button>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="no-tasks-msg">No tasks scheduled for this day.</div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
