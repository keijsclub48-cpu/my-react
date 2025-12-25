import React, { useState } from 'react';
import Sketch from './p5Sketch.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    setRecorder(mediaRecorder);
    setChunks([]);

    mediaRecorder.ondataavailable = e => setChunks(prev => [...prev, e.data]);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        const res = await fetch('http://localhost:3000/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
          body: JSON.stringify({ audio: base64Audio })
        });
        const result = await res.json();
        setData(result);
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => recorder?.stop();

  return (
    <div>
      <h1>音楽測定アプリ（React + p5.js）</h1>
      <button onClick={startRecording}>録音開始</button>
      <button onClick={stopRecording}>録音終了</button>
      {data && <Sketch data={data} />}
    </div>
  );
}
