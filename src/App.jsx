import React, { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE; // 例: http://localhost:3000
const API_KEY = import.meta.env.VITE_API_KEY;

export default function App() {
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setError(null);
      console.log("録音開始");
    } catch (e) {
      console.error(e);
      setError("マイクが使用できません");
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;

    recorderRef.current.onstop = async () => {
      if (!chunksRef.current.length) {
        setError("録音データがありません");
        return;
      }

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Audio = reader.result?.split(",")[1];
        if (!base64Audio) {
          setError("録音データ取得に失敗しました");
          return;
        }

        console.log("base64Audio length:", base64Audio.length);

        try {
          const res = await fetch(`${API_BASE}/api/score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
            },
            body: JSON.stringify({ audio: base64Audio }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "API Error");
          }

          const json = await res.json();
          setApiData(json);
          setError(null);
          console.log("API Response:", json);
        } catch (e) {
          console.error(e);
          setError(e.message);
        }
      };

      reader.readAsDataURL(blob);
    };

    recorderRef.current.stop();
    console.log("録音終了");
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "sans-serif" }}>
      <h1>VocaScan API テスト</h1>

      <div style={{ margin: "20px" }}>
        <button onClick={startRecording} style={styles.buttonStart}>録音開始</button>
        <button onClick={stopRecording} style={styles.buttonStop}>録音終了</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {apiData && (
        <div style={{ marginTop: "20px" }}>
          <p>Pitch: {apiData.pitch}</p>
          <p>Stability: {apiData.stability}</p>
          <p>Score: {apiData.score}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  buttonStart: {
    padding: "10px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    background: "#4caf50",
    color: "#fff",
    cursor: "pointer",
    marginRight: "10px",
  },
  buttonStop: {
    padding: "10px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    background: "#f44336",
    color: "#fff",
    cursor: "pointer",
  },
};
