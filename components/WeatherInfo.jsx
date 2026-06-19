"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function WeatherInfo({ onFarmSelect }) {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [status, setStatus] = useState("");

  const weatherApiKey = process.env.WEATHER_API_KEY || "63c479484c69f866a6681beca8025b49"; // Sử dụng env variable

  useEffect(() => {
    async function loadFarms() {
      try {
        const snapshot = await getDocs(collection(db, "farms"));
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name && data.latitude && data.longitude) {
            list.push({
              id: doc.id,
              name: data.name,
              lat: data.latitude,
              lon: data.longitude,
            });
          }
        });
        setFarms(list);
      } catch (err) {
        setStatus("Lỗi khi tải danh sách nông trại: " + err.message);
      }
    }
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      fetchWeather(selectedFarm.lat, selectedFarm.lon, selectedFarm.name);
      if (onFarmSelect) onFarmSelect(selectedFarm);
    }
  }, [selectedFarm]);

  async function fetchWeather(lat, lon, farmName) {
    try {
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&lang=vi`
      );
      const currentData = await currentResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&lang=vi`
      );
      const forecastData = await forecastResponse.json();

      setWeather({
        farmName,
        temperature: currentData.main?.temp ?? "N/A",
        humidity: currentData.main?.humidity ?? "N/A",
        precipitation: currentData.rain ? currentData.rain["1h"] ?? 0 : 0,
        description: currentData.weather?.[0]?.description ?? "N/A",
        alert: currentData.alerts?.[0]?.description ?? "Không có cảnh báo",
      });

      const dailyData = forecastData.list
        .filter((_, index) => index % 8 === 0)
        .slice(0, 5);

      setForecast(
        dailyData.map((day) => ({
          date: new Date(day.dt * 1000).toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "numeric",
            month: "numeric",
          }),
          temp: day.main.temp ?? "N/A",
          rain: day.rain ? day.rain["3h"] ?? 0 : 0,
        }))
      );

      setStatus("");
    } catch (err) {
      setStatus("Lỗi khi lấy dữ liệu thời tiết: " + err.message);
    }
  }

  return (
    <div className="card">
      <div className="header">
        <h2 className="text-xl font-semibold">Chọn Nông Trại</h2>
      </div>
      <div className="p-4">
        <select
          className="border p-2 w-full mb-2 text-black"
          value={selectedFarm ? JSON.stringify(selectedFarm) : ""}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedFarm(JSON.parse(e.target.value));
            } else {
              setSelectedFarm(null);
            }
          }}
        >
          <option value="">Chọn nông trại</option>
          {farms.map((farm) => (
            <option key={farm.id} value={JSON.stringify(farm)}>
              {farm.name}
            </option>
          ))}
        </select>
      </div>

      {weather && (
        <div className="p-4">
          <p><strong>Nông Trại:</strong> {weather.farmName}</p>
          <p><strong>Nhiệt Độ:</strong> {weather.temperature} °C</p>
          <p><strong>Độ Ẩm:</strong> {weather.humidity}%</p>
          <p><strong>Lượng Mưa:</strong> {weather.precipitation} mm</p>
          <p><strong>Mô Tả:</strong> {weather.description}</p>
          <p><strong>Cảnh Báo:</strong> {weather.alert}</p>

          <h3 className="mt-4 font-semibold">Dự báo 5 ngày</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {forecast.map((day, idx) => (
              <div key={idx} className="forecast-card">
                <p><strong>{day.date}</strong></p>
                <p>{day.temp}°C</p>
                <p>Mưa: {day.rain} mm</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {status && <p className="mt-2 text-red-500">{status}</p>}
    </div>
  );
}