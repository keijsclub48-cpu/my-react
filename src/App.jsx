import React, { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

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
        try {
          const base64Audio = reader.result.split(",")[1];
          if (!base64Audio) throw new Error("録音データが空です");

          const res = await fetch(`${API_BASE}/api/score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
            },
            body: JSON.stringify({ audio: base64Audio }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "API Error");
          }

          const json = await res.json();
          setApiData(json);
        } catch (e) {
          console.error(e);
          setError(e.message);
        }
      };

      reader.readAsDataURL(blob);
    };

    recorderRef.current.stop();
  };

  return (
    <div>
      <h1>ダミー API 連携テスト</h1>
      <button onClick={startRecording}>録音開始</button>
      <button onClick={stopRecording}>録音終了</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {apiData && (
        <div>
          <p>Pitch: {apiData.pitch}</p>
          <p>Stability: {apiData.stability}</p>
          <p>Score: {apiData.score}</p>
        </div>
      )}
    </div>
  );
}
