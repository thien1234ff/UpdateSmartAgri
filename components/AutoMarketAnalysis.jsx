'use client';
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  BarChart3, 
  Calendar, 
  MapPin,
  Leaf,
  AlertTriangle,
  Info,
  Target,
  DollarSign,
  Package,
  Activity,
  Filter,
  RefreshCw,
  FileText,
  Printer
} from "lucide-react";

export default function AutoMarketAnalysis({ data }) {
  const [crop, setCrop] = useState(Object.keys(data)[0]);
  const [region, setRegion] = useState("Miền Nam");
  const [time, setTime] = useState("7 ngày");
  const [reportDate, setReportDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("overview");

  useEffect(() => {
    setReportDate(new Date().toLocaleDateString("vi-VN"));
  }, []);

  const cropData = data[crop] || {};

  // Get trend direction and color
  const getTrendInfo = (value) => {
    if (!value) return { icon: Activity, color: "text-gray-500", bg: "bg-gray-50" };
    
    if (value.includes("+") || value.toLowerCase().includes("tăng")) {
      return { icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" };
    }
    if (value.includes("-") || value.toLowerCase().includes("giảm")) {
      return { icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" };
    }
    return { icon: Activity, color: "text-blue-600", bg: "bg-blue-50" };
  };

  // Get metric icon
  const getMetricIcon = (key) => {
    const iconMap = {
      "Giá hiện tại": DollarSign,
      "Biến động giá": TrendingUp,
      "Nhu cầu": Target,
      "Biến động nhu cầu": Activity,
      "Xu hướng": BarChart3,
      "Khối lượng giao dịch": Package,
      "Biến động khối lượng": Activity
    };
    return iconMap[key] || Info;
  };

  const exportReport = async () => {
    setIsLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let report = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    BÁO CÁO PHÂN TÍCH THỊ TRƯỜNG NÔNG SẢN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Ngày báo cáo: ${reportDate}
🌾 Sản phẩm: ${crop}
📍 Khu vực: ${region}
⏰ Thời gian phân tích: ${time}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    THÔNG TIN CHI TIẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
    
    for (let [key, value] of Object.entries(cropData)) {
      report += `${key}: ${value}\n\n`;
    }
    
    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Báo cáo được tạo tự động bởi Hệ thống Phân tích Nông sản
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCao_${crop}_${region}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    setIsLoading(false);
  };

  const printReport = () => {
    window.print();
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setReportDate(new Date().toLocaleDateString("vi-VN"));
      setIsLoading(false);
    }, 800);
  };

  // Filter metrics and details
  const metrics = Object.entries(cropData).filter(([key]) =>
    ["Giá hiện tại", "Biến động giá", "Nhu cầu", "Biến động nhu cầu", "Xu hướng", "Chi tiết xu hướng", "Khối lượng giao dịch", "Biến động khối lượng"].includes(key)
  );

  const details = Object.entries(cropData).filter(([key]) =>
    ["Tóm tắt", "Dự báo", "Yếu tố ảnh hưởng", "Khuyến nghị", "Rủi ro"].includes(key)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-full">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Phân tích Thị trường Nông sản
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Hệ thống phân tích và dự báo giá nông sản thông minh</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Cập nhật: {reportDate}</span>
            <button 
              onClick={refreshData}
              disabled={isLoading}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Bộ lọc dữ liệu</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Leaf className="w-4 h-4" />
                Chọn nông sản
              </label>
              <select 
                value={crop} 
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              >
                {Object.keys(data).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4" />
                Khu vực
              </label>
              <select 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option>Miền Bắc</option>
                <option>Miền Trung</option>
                <option>Miền Nam</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                Thời gian
              </label>
              <select 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option>7 ngày</option>
                <option>1 tháng</option>
                <option>3 tháng</option>
                <option>1 năm</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <BarChart3 className="w-4 h-4" />
                Kiểu xem
              </label>
              <select 
                value={view} 
                onChange={(e) => setView(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="overview">Tổng quan</option>
                <option value="detailed">Chi tiết</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {metrics.map(([key, value]) => {
            const MetricIcon = getMetricIcon(key);
            const trendInfo = getTrendInfo(value);
            const TrendIcon = trendInfo.icon;
            
            return (
              <div key={key} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${trendInfo.bg}`}>
                    <MetricIcon className={`w-5 h-5 ${trendInfo.color}`} />
                  </div>
                  <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">{key}</h3>
                <p className={`text-lg font-bold ${trendInfo.color}`}>{value}</p>
              </div>
            );
          })}
        </div>

        {/* Details Section */}
        {view === "detailed" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Info className="w-6 h-6 text-blue-600" />
              Phân tích chi tiết
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {details.map(([key, value]) => {
                const getDetailIcon = (key) => {
                  const iconMap = {
                    "Tóm tắt": FileText,
                    "Dự báo": TrendingUp,
                    "Yếu tố ảnh hưởng": Activity,
                    "Khuyến nghị": Target,
                    "Rủi ro": AlertTriangle
                  };
                  return iconMap[key] || Info;
                };
                
                const DetailIcon = getDetailIcon(key);
                const isRisk = key === "Rủi ro";
                
                return (
                  <div key={key} className={`p-6 rounded-xl border-l-4 ${isRisk ? 'bg-red-50 border-red-400' : 'bg-blue-50 border-blue-400'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <DetailIcon className={`w-5 h-5 ${isRisk ? 'text-red-600' : 'text-blue-600'}`} />
                      <h3 className={`text-lg font-semibold ${isRisk ? 'text-red-800' : 'text-blue-800'}`}>{key}</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={exportReport}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isLoading ? "Đang xuất..." : "Xuất báo cáo"}
            </button>
            
            <button
              onClick={printReport}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Printer className="w-5 h-5" />
              In báo cáo
            </button>
            
            <button
              onClick={() => setView(view === "overview" ? "detailed" : "overview")}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <BarChart3 className="w-5 h-5" />
              {view === "overview" ? "Xem chi tiết" : "Xem tổng quan"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .min-h-screen {
            background: white !important;
          }
          
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}