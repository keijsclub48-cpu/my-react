export async function createCrepePitchDetector(stream) {
  const ml5Instance = window.ml5;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return new Promise((resolve) => {
    const pitch = ml5Instance.pitchDetection(
      "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models@master/models/pitch-detection/crepe/",
      audioContext,
      stream,
      () => {
        resolve({
          getPitch: async () => new Promise((res) => {
            pitch.getPitch((err, frequency) => {
              if (err || !frequency) res({ f0: 0, conf: 0 });
              else res({ f0: frequency, conf: 0.9 });
            });
          }),
        });
      }
    );
  });
}
