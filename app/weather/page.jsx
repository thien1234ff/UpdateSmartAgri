"use client";

// Sử dụng export const dynamic để tắt prerender
export const dynamic = "force-dynamic";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Suspense, lazy } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Lazy load components với error handling
const FarmMap = lazy(() => 
  import("../../components/FarmMap").catch(() => ({
    default: () => (
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 md:p-8 text-center shadow-lg">
        <h3 className="text-red-600 text-lg md:text-xl font-bold mb-2 md:mb-3">
          Không thể tải bản đồ
        </h3>
        <p className="text-red-500 text-sm md:text-base">Vui lòng thử lại sau</p>
      </div>
    )
  }))
);

// Loading components
const MapSkeleton = () => (
  <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-4 md:p-8 shadow-lg">
    <div className="h-8 md:h-10 bg-gray-200 rounded-lg mb-4 md:mb-6"></div>
    <div className="h-[300px] md:h-[500px] bg-gray-100 rounded-lg border"></div>
  </div>
);

// WeatherInfo component with API integration
const WeatherInfo = ({ selectedFarm, isOnline }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const weatherApiKey = "63c479484c69f866a6681beca8025b49";

  useEffect(() => {
    if (!selectedFarm || !selectedFarm.latitude || !selectedFarm.longitude) return;

    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch current weather
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${selectedFarm.latitude}&lon=${selectedFarm.longitude}&appid=${weatherApiKey}&units=metric&lang=vi`
        );
        
        if (!currentResponse.ok) throw new Error(`HTTP ${currentResponse.status}`);
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${selectedFarm.latitude}&lon=${selectedFarm.longitude}&appid=${weatherApiKey}&units=metric&lang=vi`
        );
        
        if (!forecastResponse.ok) throw new Error(`HTTP ${forecastResponse.status}`);
        const forecastData = await forecastResponse.json();
        
        setCurrentWeather({
          farmName: selectedFarm.name,
          temp: currentData.main.temp,
          humidity: currentData.main.humidity,
          rainfall: currentData.rain ? currentData.rain['1h'] || 0 : 0,
          condition: currentData.weather[0]?.description || 'N/A',
          alert: currentData.alerts ? currentData.alerts[0]?.description : 'Không có cảnh báo'
        });
        
        // Process forecast data for 5 days
        const dailyData = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        setForecastData(dailyData.map(day => ({
          day: new Date(day.dt * 1000).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }),
          temp: day.main.temp,
          rainfall: day.rain ? day.rain['3h'] || 0 : 0,
          condition: day.weather[0]?.main
        })));
        
      } catch (err) {
        setError(err.message);
        console.error('Lỗi khi lấy dữ liệu thời tiết:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedFarm, weatherApiKey]);

  const getWeatherIcon = (weatherMain) => {
    switch (weatherMain) {
      case 'Clear': return 'fas fa-sun text-yellow-500';
      case 'Clouds': return 'fas fa-cloud text-gray-500';
      case 'Rain': return 'fas fa-cloud-rain text-blue-500';
      case 'Drizzle': return 'fas fa-cloud-drizzle text-blue-400';
      case 'Thunderstorm': return 'fas fa-bolt text-yellow-700';
      case 'Snow': return 'fas fa-snowflake text-blue-200';
      case 'Mist': 
      case 'Fog': 
      case 'Haze': return 'fas fa-smog text-gray-400';
      default: return 'fas fa-cloud text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-4 md:p-6 shadow-2xl">
        <div className="animate-pulse">
          <div className="h-7 bg-blue-200 rounded-lg mb-4 w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white/90 rounded-lg p-4 h-48"></div>
            <div className="bg-white/90 rounded-lg p-4 h-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-4 md:p-6 shadow-2xl">
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-center">
          <h3 className="text-red-600 text-lg font-bold mb-2">Lỗi khi tải dữ liệu thời tiết</h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-4 md:p-6 shadow-2xl">
      {currentWeather ? (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
            Thời tiết {currentWeather.farmName}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Current Weather */}
            <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 md:p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Hiện tại</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <i className="fas fa-thermometer-half text-blue-500 w-6 mr-3"></i>
                  <p className="text-base md:text-lg text-gray-700">
                    <strong>Nhiệt Độ:</strong> {currentWeather.temp.toFixed(1)}°C
                  </p>
                </div>
                
                <div className="flex items-center">
                  <i className="fas fa-tint text-blue-400 w-6 mr-3"></i>
                  <p className="text-base md:text-lg text-gray-700">
                    <strong>Độ Ẩm:</strong> {currentWeather.humidity}%
                  </p>
                </div>
                
                <div className="flex items-center">
                  <i className="fas fa-cloud-rain text-blue-600 w-6 mr-3"></i>
                  <p className="text-base md:text-lg text-gray-700">
                    <strong>Lượng Mưa:</strong> {currentWeather.rainfall} mm
                  </p>
                </div>
                
                <div className="flex items-center">
                  <i className="fas fa-cloud text-gray-500 w-6 mr-3"></i>
                  <p className="text-base md:text-lg text-gray-700">
                    <strong>Tình Trạng:</strong> {currentWeather.condition}
                  </p>
                </div>
                
                <div className="flex items-center mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <i className="fas fa-exclamation-triangle text-yellow-600 w-6 mr-3"></i>
                  <p className="text-base md:text-lg text-yellow-700">
                    <strong>Cảnh Báo:</strong> {currentWeather.alert}
                  </p>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 md:p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
                Dự báo 5 ngày
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
                {forecastData && forecastData.map((day, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-2 md:p-3 border border-gray-100 hover:bg-opacity-80 transition-all duration-300 text-center"
                  >
                    <p className="text-gray-700 text-xs md:text-sm font-medium">{day.day}</p>
                    <div className="my-1 md:my-2">
                      <i className={getWeatherIcon(day.condition) + " text-xl"}></i>
                    </div>
                    <p className="text-gray-900 font-medium text-sm md:text-base">{day.temp.toFixed(1)}°C</p>
                    <p className="text-gray-600 text-xs">Mưa: {day.rainfall} mm</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-600 py-8">
          <i className="fas fa-cloud text-4xl text-gray-400 mb-3"></i>
          <p>Chọn một nông trại để xem dữ liệu thời tiết</p>
        </div>
      )}
    </div>
  );
};

// FarmSelector component as a standalone
const FarmSelector = ({ farms, selectedFarm, onFarmSelect }) => (
  <div className="mb-6 md:mb-8">
    <label htmlFor="farm-select" className="block text-base md:text-lg font-semibold text-gray-900 mb-2">
      Chọn Nông Trại:
    </label>
    <select
      id="farm-select"
      className="w-full p-2 md:p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-sm md:text-base"
      value={selectedFarm?.id || ""}
      onChange={(e) => {
        const farm = farms.find(f => f.id === e.target.value);
        onFarmSelect(farm);
      }}
    >
      <option value="">Chọn nông trại</option>
      {farms.map((farm) => (
        <option key={farm.id} value={farm.id}>
          {farm.name}
        </option>
      ))}
    </select>
  </div>
);

export default function WeatherPage() {
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('both');
  const [farms, setFarms] = useState([]);

  // Theo dõi trạng thái online/offline
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "farms"));
        const farmList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFarms(farmList);

        if (farmList.length > 0) {
          setSelectedFarm(farmList[0]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu farms:", error);
      }
    };

    fetchFarms();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh weather data
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) {
        setLastUpdated(new Date());
        // Trigger weather data refresh logic here
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Optimized farm selection handler
  const handleFarmSelect = useCallback((farm) => {
    setSelectedFarm(farm);
    if (farm && viewMode === 'both') {
      setTimeout(() => {
        document.getElementById('farm-map-section')?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [viewMode]);

  // Memoized view controls
  const ViewControls = useMemo(() => (
    <div className="flex justify-center mb-6 md:mb-8">
      <div className="bg-white border border-gray-200 rounded-full p-1 md:p-2 flex flex-wrap gap-1 md:gap-2 shadow-xl w-full max-w-md">
        <button
          onClick={() => setViewMode('weather')}
          className={`px-3 py-2 md:px-6 md:py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-xs md:text-base flex-1 ${
            viewMode === 'weather' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500'
          }`}
        >
          Chỉ thời tiết
        </button>
        <button
          onClick={() => setViewMode('both')}
          className={`px-3 py-2 md:px-6 md:py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-xs md:text-base flex-1 ${
            viewMode === 'both' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500'
          }`}
        >
          Cả hai
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`px-3 py-2 md:px-6 md:py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-xs md:text-base flex-1 ${
            viewMode === 'map' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500'
          }`}
        >
          Chỉ bản đồ
        </button>
      </div>
    </div>
  ), [viewMode]);

  // Status indicator
  const StatusIndicator = useMemo(() => (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 md:mb-8 text-sm md:text-base">
      <div className={`flex items-center gap-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="font-medium">{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
      </div>
      {lastUpdated && (
        <div className="text-gray-600 font-medium text-center sm:text-left">
          Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
        </div>
      )}
    </div>
  ), [isOnline, lastUpdated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent animate-fade-in">
            Dự Báo Thời Tiết & Bản Đồ Nông Trại
          </h1>
          <p className="text-base md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Khám phá công nghệ tiên tiến để theo dõi thời tiết và quản lý nông trại một cách thông minh và hiệu quả
          </p>
        </div>

        {StatusIndicator}
        {/* Farm Selector as standalone */}
        <FarmSelector farms={farms} selectedFarm={selectedFarm} onFarmSelect={handleFarmSelect} />
        {ViewControls}

        {/* Weather Section */}
        {(viewMode === 'weather' || viewMode === 'both') && (
          <section className="mb-8 md:mb-12" id="weather-section">
            <WeatherInfo 
              selectedFarm={selectedFarm}
              isOnline={isOnline}
            />
          </section>
        )}

        {/* Map Section */}
        {(viewMode === 'map' || viewMode === 'both') && (
          <section className="mb-8 md:mb-12" id="farm-map-section">
            <Suspense fallback={<MapSkeleton />}>
              <FarmMap 
                farm={selectedFarm}
                farms={farms}
                onFarmSelect={handleFarmSelect}
                isOnline={isOnline}
              />
            </Suspense>
          </section>
        )}

        {/* Selected Farm Info */}
        {selectedFarm && (
          <section className="bg-white/90 backdrop-blur-lg rounded-xl p-4 md:p-8 border border-gray-200 shadow-2xl transition-all duration-300 hover:shadow-xl">
            <h3 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
              Thông tin nông trại được chọn
            </h3>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <p className="text-base md:text-lg text-gray-700 mb-2"><strong>Tên:</strong> {selectedFarm.name}</p>
                <p className="text-base md:text-lg text-gray-700 mb-2"><strong>Loại:</strong> {
                  selectedFarm.type === 'organic' ? 'Hữu cơ' : 'Công nghệ cao'
                }</p>
                <p className="text-base md:text-lg text-gray-700"><strong>Diện tích:</strong> {selectedFarm.area}</p>
              </div>
              <div>
                <p className="text-base md:text-lg text-gray-700 mb-2"><strong>Cây trồng:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {selectedFarm.crops?.map((crop, index) => (
                    <span 
                      key={index}
                      className="bg-green-100 text-green-800 px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium border border-green-200 transform hover:scale-105 transition-transform"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
              <button
                onClick={() => {
                  document.getElementById("weather-section")?.scrollIntoView({ behavior: "smooth" });
                  setTimeout(() => {
                    document.getElementById("weather-section")?.classList.add("ring-4", "ring-blue-300");
                    setTimeout(() => {
                      document.getElementById("weather-section")?.classList.remove("ring-4", "ring-blue-300");
                    }, 2000);
                  }, 500);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
              >
                Xem chi tiết thời tiết
              </button>
              <button
                onClick={() => {
                  alert(`Gợi ý lịch tưới cho ${selectedFarm.name}:\n- Buổi sáng: 6h - 7h\n- Buổi chiều: 16h - 17h`);
                }}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
              >
                Lên kế hoạch tưới
              </button>
              <button
                onClick={() => {
                  alert(`Cảnh báo cho ${selectedFarm.name}:\n- Cây lúa có nguy cơ bị bệnh đạo ôn\n- Cây rau dễ bị sâu tơ tấn công`);
                }}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
              >
                Cảnh báo dịch bệnh
              </button>
            </div>
          </section>
        )}

        <section className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="text-blue-700 font-semibold text-base md:text-lg mb-2 md:mb-3">Tổng số nông trại</h4>
            <p className="text-3xl md:text-4xl font-bold text-blue-800">{farms.length}</p>
            <p className="text-blue-600 text-xs md:text-sm mt-1 md:mt-2">Đang theo dõi</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 md:p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="text-green-700 font-semibold text-base md:text-lg mb-2 md:mb-3">Trạng thái kết nối</h4>
            <p className="text-3xl md:text-4xl font-bold text-green-800">{isOnline ? '100%' : '0%'}</p>
            <p className="text-green-600 text-xs md:text-sm mt-1 md:mt-2">Hoạt động</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 md:p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="text-purple-700 font-semibold text-base md:text-lg mb-2 md:mb-3">Cập nhật gần nhất</h4>
            <p className="text-lg md:text-xl font-bold text-purple-800">
              {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : 'Chưa có'}
            </p>
            <p className="text-purple-600 text-xs md:text-sm mt-1 md:mt-2">Tự động mỗi 5 phút</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}