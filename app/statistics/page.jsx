"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import Header from "../../components/Header";
import FarmNav from "../../components/FarmNav";
import "./Statistics.css";
import Footer from "../../components/Footer";
export default function Statistics() {
  const [avgArea, setAvgArea] = useState(0);
  const [mostPopularCrop, setMostPopularCrop] = useState("-");
  const [cropsPerFarm, setCropsPerFarm] = useState(0);
  const [seasonalDistribution, setSeasonalDistribution] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const farmsSnap = await getDocs(collection(db, "farms"));
      let totalArea = 0;
      let totalFarms = farmsSnap.size;
      let cropCountByType = {};
      let cropCountBySeason = {};
      let totalCrops = 0;

      for (const farmDoc of farmsSnap.docs) {
        const farmData = farmDoc.data();
        totalArea += Number(farmData.area) || 0;

        const cropsSnap = await getDocs(
          collection(db, "farms", farmDoc.id, "crops")
        );

        totalCrops += cropsSnap.size;

        cropsSnap.forEach((cropDoc) => {
          const crop = cropDoc.data();
          cropCountByType[crop.type] = (cropCountByType[crop.type] || 0) + 1;
          cropCountBySeason[crop.season] =
            (cropCountBySeason[crop.season] || 0) + 1;
        });
      }

      setAvgArea(totalFarms ? (totalArea / totalFarms).toFixed(2) : 0);
      setMostPopularCrop(
        Object.entries(cropCountByType).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
      );
      setCropsPerFarm(totalFarms ? (totalCrops / totalFarms).toFixed(1) : 0);
      setSeasonalDistribution(cropCountBySeason);

      setChartData(
        Object.entries(cropCountByType).map(([type, count]) => ({
          name: type,
          value: count,
        }))
      );
    };

    fetchData();
  }, []);

  const COLORS = ["#4CAF50", "#2196F3", "#FFC107", "#F44336"];

  return (
    <div className="root">
      <Header />
        <div className="farm-container">
        <div className="header">
            <h1>📊 Thống kê</h1>
            <p>Báo cáo và số liệu phân tích nông trại</p>
        </div>
        <FarmNav />

        <div className="main-content">
            <div className="farm-header">
            <h2>Thống kê & Báo cáo</h2>
            </div>

            <div className="stats-grid">
            <div className="stat-card">
                <h3>{avgArea}</h3>
                <p>Diện tích trung bình (ha)</p>
            </div>
            <div className="stat-card">
                <h3>{mostPopularCrop}</h3>
                <p>Loại cây phổ biến nhất</p>
            </div>
            <div className="stat-card">
                <h3>{cropsPerFarm}</h3>
                <p>Số cây trồng/nông trại</p>
            </div>
            <div className="stat-card">
                <h3>
                {Object.entries(seasonalDistribution)
                    .map(([season, count]) => `${season}: ${count}`)
                    .join(", ")}
                </h3>
                <p>Phân bố theo mùa</p>
            </div>
            </div>

            <div className="form-section">
            <h3>Biểu đồ loại cây</h3>
            <div id="charts-container">
                <PieChart width={400} height={300}>
                <Pie
                    data={chartData}
                    cx={200}
                    cy={150}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                >
                    {chartData.map((entry, index) => (
                    <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                    />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
                </PieChart>
            </div>
            </div>
        </div>
        </div>
        <Footer />
    </div>
  );
}
