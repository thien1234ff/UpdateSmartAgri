"use client";

import React, { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";

/**
 * Biểu đồ radar hiển thị các đặc trưng đất/khí hậu.
 *
 * @param {{ inputs: {
 *   N: number,
 *   P: number,
 *   K: number,
 *   ph: number,
 *   temp: number,
 *   humidity: number,
 *   rainfall: number
 * }}} props
 */
export default function PlotlyComponent({ inputs }) {
  const chartRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // ---------------------------------------------------------
  // 2️⃣ Vẽ / cập nhật radar mỗi khi `inputs` thay đổi
  // ---------------------------------------------------------
  useEffect(() => {
    if (!chartRef.current) return;

    const variables = [
      "Đạm (N)",
      "Lân (P)",
      "Kali (K)",
      "pH",
      "Nhiệt độ",
      "Độ ẩm",
      "Lượng mưa",
    ];

    const values = [
      inputs.N,
      inputs.P,
      inputs.K,
      inputs.ph,
      inputs.temperature,
      inputs.humidity,
      inputs.rainfall,
    ];

    // Đóng vòng tròn cho radar (lặp lại phần tử đầu)
    const r = [...values, values[0]];
    const theta = [...variables, variables[0]];

    const data = [
      {
        type: "scatterpolar",
        r,
        theta,
        fill: "toself",
        name: "Giá trị hiện tại",
        fillcolor: "rgba(52, 211, 153, 0.3)", // Màu fill với độ trong suốt
        marker: { color: "#34d399" }, // xanh lá nhạt
        line: {
          color: "#34d399",
          width: 2
        },
      },
    ];

    // Tự động tính max + 20% margin để biểu đồ không bị cắt
    const max = Math.max(...values) * 1.2;

    const layout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, max],
          tickfont: {
            size: isMobile ? 10 : 12
          },
          angle: 90,
          tickangle: 0
        },
        angularaxis: {
          tickfont: {
            size: isMobile ? 10 : 12
          },
          direction: 'clockwise'
        },
        bgcolor: 'rgba(0,0,0,0)'
      },
      showlegend: false,
      margin: isMobile 
        ? { t: 30, b: 30, l: 40, r: 40 } 
        : { t: 40, b: 40, l: 60, r: 60 },
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      staticPlot: isMobile // Tắt tính năng tương tác trên mobile để tối ưu hiệu năng
    };

    Plotly.react(chartRef.current, data, layout, config);

    // Xử lý resize để biểu đồ tự điều chỉnh
    const handleResize = () => {
      Plotly.Plots.resize(chartRef.current);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [inputs, isMobile]);

  // ---------------------------------------------------------
  // 3️⃣ Render placeholder <div> để Plotly vẽ vào
  // ---------------------------------------------------------
  return (
    <div className="w-full h-64 md:h-80 lg:h-96 flex items-center justify-center bg-gray-50 rounded-lg p-2">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}