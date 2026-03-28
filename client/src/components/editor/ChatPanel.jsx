// client/src/components/editor/ChatPanel.jsx
import React from "react";

export default function ChatPanel({ messages, newMsg, onMsgChange, onSend }) {
  return (
    <section className="chat-section">
      <div className="chat-header">Collaboration Chat</div>

      <div className="message-list">
        {messages.map((m, i) => (
          <div key={i} className="message-bubble">
            <strong>{m.userName}:</strong> {m.message}
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <input
          value={newMsg}
          onChange={(e) => onMsgChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Message..."
        />
        <button onClick={onSend}>Send</button>
      </div>
    </section>
  );
}
