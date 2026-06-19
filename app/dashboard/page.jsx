"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import Header from "../../components/Header";
import FarmNav from "../../components/FarmNav";
import Footer from "../../components/Footer";

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [plants, setPlants] = useState([]);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Theo dõi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  // Lấy danh sách farms
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "farms"), (snapshot) => {
      const farmList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFarms(farmList);
    });
    return () => unsub();
  }, []);

  // Lấy realtime crops trong từng farm
  useEffect(() => {
    const unsubList = [];

    if (farms.length === 0) {
      setPlants([]);
      return;
    }

    farms.forEach((farm) => {
      const unsub = onSnapshot(
        collection(db, "farms", farm.id, "crops"),
        (snapshot) => {
          setPlants((prev) => {
            const withoutFarm = prev.filter((p) => p.farmId !== farm.id);
            const newCrops = snapshot.docs.map((doc) => ({
              id: doc.id,
              farmId: farm.id,
              ...doc.data(),
            }));
            return [...withoutFarm, ...newCrops];
          });
        }
      );
      unsubList.push(unsub);
    });

    return () => unsubList.forEach((unsub) => unsub());
  }, [farms]);

  // Xử lý dữ liệu PieChart - phân loại cây
  const cropTypeData = plants.reduce((acc, plant) => {
    const type = plant.type || "Khác";
    const existing = acc.find((item) => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ["#22d3ee", "#f472b6", "#34d399", "#a78bfa", "#fb923c"];

  // Xử lý dữ liệu BarChart - số lượng cây mỗi farm
  const farmPlantData = farms.map((farm) => {
    const count = plants.filter((p) => p.farmId === farm.id).length;
    return { name: farm.name, value: count };
  });

  // Custom label cho PieChart
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Hiệu ứng động cho các thành phần
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <Header />
      <motion.div
        className="max-w-7xl mx-auto py-2 md:py-6 px-2 sm:px-4 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-white shadow-lg md:shadow-2xl rounded-lg md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border-t-4 border-green-400"
          variants={cardVariants}
        >
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-green-500 animate-pulse">📊</span> Dashboard
          </h1>
          <p className="text-xs md:text-base text-gray-600">Tổng quan quản lý nông trại và cây trồng</p>
        </motion.div>
        
        <div className="mb-4">
          <FarmNav />
        </div>

        <motion.div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6" variants={containerVariants}>
          {/* Pie Chart */}
          <motion.div
            className="bg-white shadow-md md:shadow-lg rounded-lg md:rounded-xl p-4 md:p-5 border-l-4 border-cyan-400"
            variants={cardVariants}
            whileHover="hover"
          >
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 text-center">Phân loại cây trồng</h2>
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
            >
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <PieChart>
                  <Pie
                    data={cropTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 100}
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {cropTypeData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} cây`, name]}
                    contentStyle={{ 
                      fontSize: isMobile ? '12px' : '14px',
                      borderRadius: '8px',
                      padding: '5px 10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
            {cropTypeData.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-3">
                {cropTypeData.map((entry, index) => (
                  <div key={index} className="flex items-center text-xs md:text-sm">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium">{entry.name}</span>
                    <span className="ml-1 text-gray-500">({entry.value})</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            className="bg-white shadow-md md:shadow-lg rounded-lg md:rounded-xl p-4 md:p-5 border-l-4 border-pink-400"
            variants={cardVariants}
            whileHover="hover"
          >
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 text-center">Số lượng cây theo nông trại</h2>
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart 
                  data={farmPlantData} 
                  margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 30 } : { top: 15, right: 15, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={isMobile ? -45 : 0} 
                    textAnchor={isMobile ? "end" : "middle"} 
                    interval={0}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    height={isMobile ? 60 : 70}
                  />
                  <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} cây`, 'Số lượng']}
                    contentStyle={{ 
                      fontSize: isMobile ? '12px' : '14px',
                      borderRadius: '8px',
                      padding: '5px 10px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: isMobile ? '12px' : '14px', 
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'center'
                    }} 
                  />
                  <Bar 
                    dataKey="value" 
                    name="Số lượng cây" 
                    fill="#34d399" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      <Footer />
    </div>
  );
}