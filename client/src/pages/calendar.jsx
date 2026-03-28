import React, { useState, useEffect } from "react";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [view, setView] = useState("month");
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("tasks")) || {});
  const [taskInput, setTaskInput] = useState("");
  const [taskColor, setTaskColor] = useState("#3b82f6");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const formatDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  const addTask = () => {
    if (!selectedDateStr || !taskInput) return alert("Select a date and enter a task!");
    setTasks((prev) => {
      const updated = { ...prev };
      if (!updated[selectedDateStr]) updated[selectedDateStr] = [];
      updated[selectedDateStr].push({ text: taskInput, color: taskColor, done: false });
      localStorage.setItem("tasks", JSON.stringify(updated));
      return updated;
    });
    setTaskInput("");
  };

  const toggleDone = (i) => {
  if (!selectedDateStr) return;
  setTasks(prev => {
    const updated = {
      ...prev,
      [selectedDateStr]: prev[selectedDateStr].map((t, idx) =>
        idx === i ? { ...t, done: !t.done } : t
      )
    };
    localStorage.setItem("tasks", JSON.stringify(updated));
    return updated;
  });
};

  const deleteTask = (i) => {
    setTasks((prev) => {
      const updated = { ...prev };
      updated[selectedDateStr].splice(i, 1);
      if (updated[selectedDateStr].length === 0) delete updated[selectedDateStr];
      localStorage.setItem("tasks", JSON.stringify(updated));
      return updated;
    });
  };

  const changeView = (v) => setView(v);

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
    let startDate, endDate;
    if (view === "week") {
      startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (view === "month") {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
    }

    const squares = [];
    const temp = new Date(startDate);
    while (temp <= endDate) {
      const key = formatDateKey(temp);
      const count = tasks[key]?.length || 0;
      const level = count > 0 ? Math.min(count, 4) : 0;
      squares.push(
        <div
          key={key}
          className="sq"
          data-level={level}
          title={`${key}: ${count} tasks`}
        />
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
    const dots = tasks[key]?.map((t, i) => <div key={i} className="dot" style={{ background: t.color }} />);

    return (
      <div
        key={key}
        className={`date-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
        onClick={() => setSelectedDateStr(key)}
      >
        <div>{day}</div>
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
      for (let i = 0; i < firstDay; i++) dates.push(<div key={`empty-${i}`}></div>);
      for (let i = 1; i <= lastDate; i++) dates.push(createDateBox(year, month, i));
    } else if (view === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(createDateBox(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    } else {
      for (let m = 0; m < 12; m++) {
        const firstDay = new Date(year, m, 1).getDay();
        const lastDate = new Date(year, m + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) dates.push(<div key={`empty-${m}-${i}`}></div>);
        for (let i = 1; i <= lastDate; i++) dates.push(createDateBox(year, m, i));
      }
    }
    return dates;
  };

  const selectedTasks = tasks[selectedDateStr] || [];

  return (
    <div>
      <h1>📅 Task Calendar & Activity</h1>

      <div className="graph-card">
        <div className="graph-months">
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
        </div>
        <div className="graph-flex">
          <div className="graph-days"><span>Mon</span><span>Wed</span><span>Fri</span></div>
          <div className="squares">{renderGraph()}</div>
        </div>
      </div>

      <div className="container">
        <div className="calendar">
          <div className="view-buttons">
            <button className={view==="month"?"active":""} onClick={()=>changeView("month")}>Monthly</button>
            <button className={view==="week"?"active":""} onClick={()=>changeView("week")}>Weekly</button>
            <button className={view==="year"?"active":""} onClick={()=>changeView("year")}>Yearly</button>
          </div>

          <div className="header">
            <button onClick={prev}>◀</button>
            <h2>{view==="month"?currentDate.toLocaleString("default",{month:"long",year:"numeric"}):
                view==="week"?"Weekly View":currentDate.getFullYear()+" Yearly View"}</h2>
            <button onClick={next}>▶</button>
          </div>

          {view!=="year" && <div className="days-grid">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d}>{d}</div>)}
          </div>}

          <div className="dates-grid">{renderDates()}</div>
        </div>

        <div className="task-panel">
          <h2>{selectedDateStr?"Tasks: "+selectedDateStr:"Select a date"}</h2>
          <input type="text" placeholder="What needs to be done?" value={taskInput} onChange={e=>setTaskInput(e.target.value)} />
          <div className="color-row">
            <span>Tag Color:</span>
            <input type="color" value={taskColor} onChange={e=>setTaskColor(e.target.value)} />
          </div>
          <button className="main-btn" onClick={addTask}>Add Task</button>
          <ul>
            {selectedTasks.map((t,i)=>(
              <li key={i} style={{background:t.color}} className={t.done?"done":""}>
                <span>{t.text}</span>
                <div className="action-btns">
                  <button onClick={()=>toggleDone(i)}>✔</button>
                  <button onClick={()=>deleteTask(i)}>✖</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Calendar;