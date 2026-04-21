"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔁 Load chat history from backend (DB)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("http://localhost:8000/history");
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.log("Failed to load history");
      }
    };

    loadHistory();
  }, []);

  // 🧠 Ask AI
  const askAI = async () => {
    if (!question.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(newMessages);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.answer || "No response received.",
          plan: data.plan,
        },
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠️ Error connecting to backend.",
        },
      ]);
    }

    setLoading(false);
  };

  // 🧹 Clear Chat
  const clearChat = async () => {
    try {
      await fetch("http://localhost:8000/clear", {
        method: "DELETE",
      });

      setMessages([]);
    } catch (error) {
      console.log("Failed to clear chat");
    }
  };

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 700,
        margin: "0 auto",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ marginBottom: 10 }}>AI Ops Copilot 🚀</h1>

      {/* Clear Button */}
      <button
        onClick={clearChat}
        style={{
          marginBottom: 20,
          padding: "8px 15px",
          backgroundColor: "#ff4d4d",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Clear Chat
      </button>

      {/* Chat Messages */}
      <div style={{ marginBottom: 20 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 15 }}>
            <b>{msg.role === "user" ? "You:" : "AI:"}</b>
            <p style={{ margin: "5px 0 10px 0" }}>{msg.content}</p>

            {msg.plan && (
              <details style={{ marginBottom: 10 }}>
                <summary style={{ cursor: "pointer" }}>
                  🧠 View AI Plan
                </summary>
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: 10,
                    borderRadius: 5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.plan}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something..."
        style={{
          width: "100%",
          padding: 10,
          fontSize: 16,
          marginBottom: 10,
        }}
      />

      {/* Send Button */}
      <button
        onClick={askAI}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}