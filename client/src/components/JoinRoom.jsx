import { useState } from "react";
import "./JoinRoom.css";

function JoinRoom({ onJoin }) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = () => {
    if (!username || !room) {
      alert("Enter username and room ID");
      return;
    }
    onJoin(username, room);
  };

  return (
    <div className="joinContainer">
      <div className="joinBox">
        <h2>🚀 Join DevSpace</h2>

        <input
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          placeholder="Enter Room ID"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        <button onClick={handleJoin}>Join Workspace</button>
      </div>
    </div>
  );
}

export default JoinRoom;