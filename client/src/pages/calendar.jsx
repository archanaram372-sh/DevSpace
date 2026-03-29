import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Moon, Sun, Check, Trash2, Plus } from "lucide-react";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [view, setView] = useState("month");
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("tasks")) || {});
  const [taskInput, setTaskInput] = useState("");
  const [taskColor, setTaskColor] = useState("#6366f1");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const formatDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  const addTask = () => {
    if (!selectedDateStr || !taskInput) return alert("Select a date and enter a task!");
    setTasks((prev) => {
      const updated = { ...prev };
      if (!updated[selectedDateStr]) updated[selectedDateStr] = [];
      updated[selectedDateStr].push({ text: taskInput, color: taskColor, done: false });
      return updated;
    });
    setTaskInput("");
  };

  const toggleDone = (i) => {
    if (!selectedDateStr) return;
    setTasks(prev => ({
      ...prev,
      [selectedDateStr]: prev[selectedDateStr].map((t, idx) =>
        idx === i ? { ...t, done: !t.done } : t
      )
    }));
  };

  const deleteTask = (i) => {
    setTasks((prev) => {
      const updated = { ...prev };
      updated[selectedDateStr].splice(i, 1);
      if (updated[selectedDateStr].length === 0) delete updated[selectedDateStr];
      return updated;
    });
  };

  const prev = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else if (view === "year") d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  };

  const next = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else if (view === "year") d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  };

  const renderGraph = () => {
    let startDate = new Date(currentDate.getFullYear(), 0, 1);
    let endDate = new Date(currentDate.getFullYear(), 11, 31);
    
    const squares = [];
    const temp = new Date(startDate);
    while (temp <= endDate) {
      const key = formatDateKey(temp);
      const count = tasks[key]?.length || 0;
      const level = count > 0 ? Math.min(count, 4) : 0;
      squares.push(
        <div key={key} className="sq" data-level={level} title={`${key}: ${count} tasks`} />
      );
      temp.setDate(temp.getDate() + 1);
    }
    return squares;
  };

  const createDateBox = (year, month, day) => {
    const key = `${year}-${month + 1}-${day}`;
    const today = new Date();
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = selectedDateStr === key;
    const dots = tasks[key]?.map((t, i) => (
      <div key={i} className="dot" style={{ background: t.color, opacity: t.done ? 0.4 : 1 }} />
    ));

    return (
      <div
        key={key}
        className={`date-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
        onClick={() => setSelectedDateStr(key)}
      >
        <span className="date-num">{day}</span>
        <div className="dots">{dots}</div>
      </div>
    );
  };

  const renderDates = () => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === "month") {
      const firstDay = new Date(year, month, 1).getDay();
      const lastDate = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) dates.push(<div key={`empty-${i}`} className="date-cell empty"></div>);
      for (let i = 1; i <= lastDate; i++) dates.push(createDateBox(year, month, i));
    } else if (view === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        dates.push(createDateBox(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    } else {
      // Yearly view simplified
      for (let i = 1; i <= 31; i++) dates.push(createDateBox(year, month, i));
    }
    return dates;
  };

  const selectedTasks = tasks[selectedDateStr] || [];

  return (
    <div className={`workspace-container ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      {/* FIXED HEADER */}
      <header className="workspace-header">
        <div className="header-left">
          <div className="workspace-logo">⚡ DEVSPACE</div>
          <div className="workspace-divider" />
          <h1 className="workspace-title">Task Calendar</h1>
        </div>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="logout-btn" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT */}
      <main className="workspace-main">
        <div className="workspace-content-wrapper">
          
          {/* ACTIVITY GRAPH SECTION */}
          <div className="graph-card">
            <h3>Yearly Activity</h3>
            <div className="graph-months">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
            </div>
            <div className="graph-flex">
              <div className="graph-days"><span>M</span><span>W</span><span>F</span></div>
              <div className="squares">{renderGraph()}</div>
            </div>
          </div>

          <div className="calendar-layout-grid">
            {/* LEFT: CALENDAR VIEW */}
            <div className="calendar-card">
              <div className="calendar-controls">
                <div className="view-switch">
                  <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button>
                  <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Week</button>
                </div>
                <div className="nav-controls">
                  <button onClick={prev}><ChevronLeft size={20} /></button>
                  <h2>{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</h2>
                  <button onClick={next}><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="days-header">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="dates-grid">{renderDates()}</div>
            </div>

            {/* RIGHT: TASK PANEL */}
            <div className="task-panel-card">
              <h3>{selectedDateStr ? `Tasks for ${selectedDateStr}` : "Select a day"}</h3>
              <div className="task-input-group">
                <input 
                  type="text" 
                  placeholder="Plan your sprint..." 
                  value={taskInput} 
                  onChange={e => setTaskInput(e.target.value)} 
                />
                <input type="color" value={taskColor} onChange={e => setTaskColor(e.target.value)} className="color-picker" />
                <button className="add-task-btn" onClick={addTask}><Plus size={20} /></button>
              </div>

              <ul className="task-list">
                {selectedTasks.map((t, i) => (
                  <li key={i} className={`task-item ${t.done ? "task-done" : ""}`}>
                    <div className="task-color-bar" style={{ background: t.color }} />
                    <span className="task-text">{t.text}</span>
                    <div className="task-actions">
                      <button onClick={() => toggleDone(i)} className="done-btn"><Check size={16} /></button>
                      <button onClick={() => deleteTask(i)} className="delete-btn"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
                {selectedTasks.length === 0 && <p className="empty-msg">No tasks scheduled for this day.</p>}
              </ul>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Calendar;