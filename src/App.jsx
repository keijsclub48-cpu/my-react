import React, { useState, useRef } from "react";
import Sketch from "./p5Sketch.jsx";
import { createCrepePitchDetector } from "./crepeWrapper.js"; // CREPE 初期化用ラッパー

const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const f0Ref = useRef([]); // CREPE で取得した f0 配列

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recorderRef.current = mediaRecorder;
      f0Ref.current = [];

      // CREPE ピッチ検出器の初期化
      const detector = await createCrepePitchDetector(stream);

      // 定期的に f0 を取得
      const intervalId = setInterval(async () => {
        const pitch = await detector.getPitch(); // { f0, conf }
        if (pitch && pitch.f0 > 0) {
          f0Ref.current.push({ t: performance.now() / 1000, f0: pitch.f0, conf: pitch.conf });
        }
      }, 20); // 50Hz

      recorderRef.current.intervalId = intervalId;

      mediaRecorder.start();
    } catch (e) {
      console.error(e);
      setError("マイクが使用できません");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    recorderRef.current.stop();
    clearInterval(recorderRef.current.intervalId);

    try {
      const payload = {
        meta: {
          target_pitch: 440,
          session_type: "long_tone",
        },
        data: f0Ref.current,
      };

      const res = await fetch(`${API_BASE}/api/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(import.meta.env.VITE_API_KEY && {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
          }),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("API が JSON を返していません");
      }

      if (!res.ok) throw new Error(json.error || "API Error");

      setData(json);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  return (
    <div>
      <h1>音楽測定アプリ</h1>
      <button onClick={startRecording}>録音開始</button>
      <button onClick={stopRecording}>録音終了</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && <Sketch data={data} />}
    </div>
  );
}
