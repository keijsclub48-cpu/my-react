import React from 'react';
import Sketch from 'react-p5';

export default function P5Sketch({ data }) {
  let score = data?.score || 0;
  let stability = data?.stability || 0;
  let mean = data?.mean || 0;
  let distribution = data?.distribution || [];

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(400, 200).parent(canvasParentRef);
  };

  const draw = (p5) => {
    p5.background(240);

    p5.fill(100, 200, 100);
    p5.textSize(16);
    p5.text(`Score: ${score}`, 20, 30);
    p5.text(`Stability: ${stability}`, 20, 60);
    p5.text(`Mean: ${mean}`, 20, 90);

    // 分布棒グラフ
    if (distribution.length) {
      const barWidth = 50;
      distribution.forEach((val, i) => {
        p5.fill(100, 100, 250);
        p5.rect(20 + i * (barWidth + 10), 150 - val, barWidth, val);
      });
    }
  };

  return <Sketch setup={setup} draw={draw} />;
}
