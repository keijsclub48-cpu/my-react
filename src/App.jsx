import React, { useState, useRef } from 'react';
import Sketch from './p5Sketch.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();

          reader.onloadend = async () => {
            try {
              const base64Audio = reader.result.split(',')[1];

              const res = await fetch('/api/score', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(import.meta.env.VITE_API_KEY && {
                    Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`
                  })
                },
                body: JSON.stringify({ audio: base64Audio })
              });

              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'API Error');
              }

              const result = await res.json();
              setData(result);
              setError(null);

            } catch (e) {
              console.error(e);
              setError(e.message);
            }
          };

          reader.readAsDataURL(blob);

        } catch (e) {
          console.error(e);
          setError('録音データ処理に失敗しました');
        }
      };

      mediaRecorder.start();

    } catch (e) {
      console.error(e);
      setError('マイクが使用できません');
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  return (
    <div>
      <h1>音楽測定アプリ（React + p5.js）</h1>
      <button onClick={startRecording}>録音開始</button>
      <button onClick={stopRecording}>録音終了</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data && <Sketch data={data} />}
    </div>
  );
}
