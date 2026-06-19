"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Import dynamic với kích thước responsive
const PlotlyComponent = dynamic(() => import("./PlotlyComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 md:h-80 lg:h-72">
      <div className="text-center text-gray-500">
        <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
        <p>Đang tải biểu đồ...</p>
      </div>
    </div>
  )
});

/*====================================================================
  1️⃣  CSDL các loại cây
====================================================================*/
const cropDatabase = {
  rice: {
    name: "Lúa",
    N: [60, 99],
    P: [35, 60],
    K: [35, 45],
    ph: [5.01, 7.87],
    temp: [20.05, 26.93],
    humidity: [80.12, 84.97],
    rainfall: [182.56, 298.56],
  },
  maize: {
    name: "Ngô",
    N: [60, 100],
    P: [35, 60],
    K: [15, 25],
    ph: [5.55, 6.97],
    temp: [18.05, 26.1],
    humidity: [55.28, 74.83],
    rainfall: [60.65, 109.75],
  },
  jute: {
    name: "Đay",
    N: [60, 100],
    P: [35, 59],
    K: [35, 44],
    ph: [6.01, 7.43],
    temp: [23.09, 26.99],
    humidity: [70.96, 89.86],
    rainfall: [150.24, 199.34],
  },
  coffee: {
    name: "Cà phê",
    N: [80, 120],
    P: [15, 40],
    K: [25, 35],
    ph: [6.02, 7.49],
    temp: [23.06, 27.92],
    humidity: [50.05, 69.95],
    rainfall: [115.16, 199.47],
  },
};

/*====================================================================
  2️⃣  Cấu hình endpoint API
====================================================================*/
const API_URL = process.env.NEXT_PUBLIC_API_URL; // Ví dụ: https://api.yoursite.com

/*====================================================================
  3️⃣  Hàm gọi API
====================================================================*/
const getCropPrediction = async (inputs) => {
  if (!API_URL) {
    throw new Error(
      "API URL chưa được cấu hình. Hãy đặt NEXT_PUBLIC_API_URL trong môi trường."
    );
  }

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} ${text}`);
    }

    const data = await response.json();

    // Kiểm tra dữ liệu trả về
    if (!data.prediction || !data.probabilities) {
      throw new Error(
        "Dữ liệu trả về không hợp lệ: thiếu prediction hoặc probabilities."
      );
    }

    // Đảm bảo mảng probabilities được sắp xếp giảm dần
    let probabilities = [];
    if (Array.isArray(data.probabilities)) {
      probabilities = [...data.probabilities].sort(
        (a, b) => b.probability - a.probability
      );
    } else if (typeof data.probabilities === "object") {
      probabilities = Object.entries(data.probabilities)
        .map(([crop, prob]) => ({ crop, probability: prob }))
        .sort((a, b) => b.probability - a.probability);
    }

    return { prediction: data.prediction, probabilities };
  } catch (error) {
    console.error("Error fetching crop prediction:", error);
    throw error;
  }
};

/*====================================================================
  3.1️⃣  Hàm dự đoán có sẵn (fallback)
====================================================================*/
const fallbackPrediction = (inputs) => {
  const weights = {
    N: 0.35, // Tăng trọng số cho đạm vì tầm quan trọng trong sinh trưởng
    P: 0.25,
    K: 0.25,
    ph: 0.08, // Giảm nhẹ trọng số pH
    temp: 0.04,
    humidity: 0.02,
    rainfall: 0.01, // Lượng mưa ít quan trọng hơn
  };

  const scores = Object.keys(cropDatabase).map((cropKey) => {
    const crop = cropDatabase[cropKey];
    let score = 0;

    // Hàm tính điểm dựa trên khoảng cách chuẩn hóa
    const calculateScore = (value, range, weight) => {
      if (value == null || !range || range[0] == null || range[1] == null) return 0;
      const [min, max] = range;
      const optimal = (min + max) / 2;
      const rangeWidth = max - min || 1; // Tránh chia cho 0
      // Chuẩn hóa khoảng cách từ giá trị đầu vào đến giá trị tối ưu
      const distance = Math.abs(value - optimal) / (rangeWidth / 2);
      // Điểm giảm tuyến tính, từ 1 (tối ưu) xuống 0 (ngoài khoảng)
      const normalizedScore = Math.max(0, 1 - distance);
      return weight * normalizedScore;
    };

    // Tính điểm cho từng thông số
    score += calculateScore(inputs.N, crop.N, weights.N);
    score += calculateScore(inputs.P, crop.P, weights.P);
    score += calculateScore(inputs.K, crop.K, weights.K);
    score += calculateScore(inputs.ph, crop.ph, weights.ph);
    score += calculateScore(inputs.temperature, crop.temp, weights.temp);
    score += calculateScore(inputs.humidity, crop.humidity, weights.humidity);
    score += calculateScore(inputs.rainfall, crop.rainfall, weights.rainfall);

    return { crop: cropKey, score };
  });

  // Sắp xếp theo điểm số giảm dần
  const sortedScores = scores.sort((a, b) => b.score - a.score);

  // Chuẩn hóa điểm số thành xác suất
  const totalScore = sortedScores.reduce((sum, item) => sum + item.score, 0) || 1; // Tránh chia cho 0
  const probabilities = sortedScores.map((item) => ({
    crop: item.crop,
    probability: item.score / totalScore,
  }));

  return {
    prediction: sortedScores[0]?.crop || Object.keys(cropDatabase)[0], // Fallback nếu không có kết quả
    probabilities: probabilities.slice(0, 5), // Top 5 cây trồng
  };
};

/*====================================================================
  4️⃣  Component chính
====================================================================*/
const CropPredictionApp = () => {
  /* ── State cho input form ── */
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [ph, setPh] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [rainfall, setRainfall] = useState("");

  /* ── State cho kết quả ── */
  const [predictedCrop, setPredictedCrop] = useState("");
  const [predictedCropKey, setPredictedCropKey] = useState("");
  const [confidence, setConfidence] = useState("");
  const [probabilities, setProbabilities] = useState([]);
  const [inputSummary, setInputSummary] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const predictionSectionRef = useRef(null);

  /* ── Hỗ trợ fill dữ liệu mẫu ── */
  const fillSampleData = () => {
    setNitrogen(90);
    setPhosphorus(42);
    setPotassium(43);
    setPh(6.5);
    setTemperature(20.9);
    setHumidity(82);
    setRainfall(202);
  };

  /* ── Submit form, gọi API hoặc dùng fallback ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const inputs = {
      N: parseFloat(nitrogen),
      P: parseFloat(phosphorus),
      K: parseFloat(potassium),
      ph: parseFloat(ph),
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      rainfall: parseFloat(rainfall),
    };

    /* Kiểm tra hợp lệ */
    for (const key in inputs) {
      if (isNaN(inputs[key])) {
        alert(`Vui lòng nhập giá trị hợp lệ cho ${key}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      let result;
      if (API_URL) {
        result = await getCropPrediction(inputs);
      } else {
        console.warn("API URL không khả dụng, sử dụng logic dự đoán có sẵn.");
        result = fallbackPrediction(inputs);
      }
      displayResults(result, inputs);
    } catch (error) {
      console.warn("API lỗi, chuyển sang logic dự đoán có sẵn:", error);
      const result = fallbackPrediction(inputs);
      displayResults(result, inputs);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Hiển thị kết quả ── */
  const displayResults = (result, inputs) => {
    setShowResults(true);
    setShowAnalysis(true);

    const cropName = cropDatabase[result.prediction]?.name || result.prediction;
    setPredictedCrop(cropName);
    setPredictedCropKey(result.prediction);
    setConfidence(
      `Độ tin cậy: ${(result.probabilities[0].probability * 100).toFixed(1)}%`
    );
    setProbabilities(result.probabilities.slice(0, 5));

    /* Lưu summary để hiển thị trong phần phân tích */
    setInputSummary(inputs);

    if (predictionSectionRef.current) {
      predictionSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ── Tooltips cho các input ── */
  const tooltips = {
    nitrogen:
      "Đạm là chất dinh dưỡng quan trọng cho sự phát triển của lá và thân cây",
    phosphorus:
      "Lân giúp phát triển hệ thống rễ và quá trình ra hoa, kết quả",
    potassium:
      "Kali tăng cường khả năng chống chịu bệnh tật và điều kiện khắc nghiệt",
    ph: "Độ pH ảnh hưởng đến khả năng hấp thụ chất dinh dưỡng của cây",
    temperature:
      "Nhiệt độ quyết định tốc độ phát triển và giai đoạn sinh trưởng",
    humidity:
      "Độ ẩm không khí ảnh hưởng đến quá trình thoát hơi nước",
    rainfall:
      "Lượng mưa cung cấp nguồn nước cần thiết cho cây trồng",
  };

  /* ── Tạo mảng dữ liệu so sánh đặc trưng ── */
  function getComparisonChartFeatures(inputs = {}, cropKey) {
    if (!cropDatabase[cropKey]) return [];
    const cropInfo = cropDatabase[cropKey];
    return [
      {
        name: "Đạm (N)",
        current: inputs.N,
        optimal: (cropInfo.N[0] + cropInfo.N[1]) / 2,
        unit: " mg/kg",
      },
      {
        name: "Lân (P)",
        current: inputs.P,
        optimal: (cropInfo.P[0] + cropInfo.P[1]) / 2,
        unit: " mg/kg",
      },
      {
        name: "Kali (K)",
        current: inputs.K,
        optimal: (cropInfo.K[0] + cropInfo.K[1]) / 2,
        unit: " mg/kg",
      },
      {
        name: "pH",
        current: inputs.ph,
        optimal: (cropInfo.ph[0] + cropInfo.ph[1]) / 2,
        unit: "",
      },
      {
        name: "Nhiệt độ",
        current: inputs.temperature,
        optimal: (cropInfo.temp[0] + cropInfo.temp[1]) / 2,
        unit: "°C",
      },
      {
        name: "Độ ẩm",
        current: inputs.humidity,
        optimal: (cropInfo.humidity[0] + cropInfo.humidity[1]) / 2,
        unit: "%",
      },
      {
        name: "Lượng mưa",
        current: inputs.rainfall,
        optimal: (cropInfo.rainfall[0] + cropInfo.rainfall[1]) / 2,
        unit: "mm",
      },
    ];
  }

  const comparisonFeatures =
    showAnalysis && predictedCropKey
      ? getComparisonChartFeatures(inputSummary, predictedCropKey)
      : [];

  /*====================================================================
     Render component
  ====================================================================*/
  return (
    <div className="root">
      <Header />

      <div className="bg-gray-50 font-sans">
        {/* Header */}
        <header className="bg-gray-200 text-dark-green py-8" id="first">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-green-800">
                <i className="fas fa-seedling mr-3"></i>
                Hệ thống dự đoán cây trồng
              </h1>
              <p className="text-lg md:text-xl opacity-90 text-green-800 font-medium">
                Sử dụng AI để tìm cây trồng phù hợp với điều kiện đất đai và thời tiết
              </p>
            </div>
          </div>
        </header>

        {/* Navigation sticky */}
        <div
          className="mx-auto py-4 sticky top-0 z-50 shadow-md w-full max-w-[1370px] px-4 rounded-3xl"
          style={{ backgroundColor: "#1b4332" }}
        >
          <div className="container mx-auto px-0">
            <ul className="flex flex-wrap gap-2 md:gap-4 justify-center">
              <li>
                <a
                  href="#input"
                  className="text-white rounded-full px-4 py-1 md:px-6 md:py-2 text-sm md:text-base hover:bg-green-700 hover:text-white font-bold hover:no-underline no-underline"
                >
                  Nhập dữ liệu
                </a>
              </li>
              <li>
                <a
                  href="#prediction"
                  className="text-white rounded-full px-4 py-1 md:px-6 md:py-2 text-sm md:text-base hover:bg-green-700 hover:text-white font-bold hover:no-underline no-underline"
                >
                  Kết quả dự đoán
                </a>
              </li>
              <li>
                <a
                  href="#analysis"
                  className="text-white rounded-full px-4 py-1 md:px-6 md:py-2 text-sm md:text-base hover:bg-green-700 hover:text-white font-bold hover:no-underline no-underline"
                >
                  Phân tích
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Input section */}
          <section id="input" className="mb-12">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8 card-hover">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800">
                <i className="fas fa-edit mr-3 text-blue-600"></i>
                Nhập thông số đất đai và thời tiết
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* N */}
                  <div className="space-y-2">
                    <label
                      htmlFor="nitrogen"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-flask mr-2 text-green-600"></i>
                      Đạm (N) - mg/kg
                    </label>
                    <input
                      type="number"
                      id="nitrogen"
                      step="0.01"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 90"
                      required
                      value={nitrogen}
                      onChange={(e) => setNitrogen(e.target.value)}
                      title={tooltips.nitrogen}
                    />
                    <div className="text-xs text-gray-500">
                      Khuyến nghị: 0-140 mg/kg
                    </div>
                  </div>
                  {/* P */}
                  <div className="space-y-2">
                    <label
                      htmlFor="phosphorus"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-flask mr-2 text-orange-600"></i>
                      Lân (P) - mg/kg
                    </label>
                    <input
                      type="number"
                      id="phosphorus"
                      step="0.01"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 42"
                      required
                      value={phosphorus}
                      onChange={(e) => setPhosphorus(e.target.value)}
                      title={tooltips.phosphorus}
                    />
                    <div className="text-xs text-gray-500">
                      Khuyến nghị: 5-145 mg/kg
                    </div>
                  </div>
                  {/* K */}
                  <div className="space-y-2">
                    <label
                      htmlFor="potassium"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-flask mr-2 text-purple-600"></i>
                      Kali (K) - mg/kg
                    </label>
                    <input
                      type="number"
                      id="potassium"
                      step="0.01"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 43"
                      required
                      value={potassium}
                      onChange={(e) => setPotassium(e.target.value)}
                      title={tooltips.potassium}
                    />
                    <div className="text-xs text-gray-500">
                      Khuyến nghị: 5-205 mg/kg
                    </div>
                  </div>
                  {/* ph */}
                  <div className="space-y-2">
                    <label
                      htmlFor="ph"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-tint mr-2 text-blue-600"></i>
                      Độ pH
                    </label>
                    <input
                      type="number"
                      id="ph"
                      step="0.01"
                      min="0"
                      max="14"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 6.5"
                      required
                      value={ph}
                      onChange={(e) => setPh(e.target.value)}
                      title={tooltips.ph}
                    />
                    <div className="text-xs text-gray-600">Khuyến nghị: 3.5-9.9</div>
                  </div>
                  {/* temp */}
                  <div className="space-y-2">
                    <label
                      htmlFor="temperature"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-thermometer-half mr-2 text-red-600"></i>
                      Nhiệt độ (°C)
                    </label>
                    <input
                      type="number"
                      id="temperature"
                      step="0.01"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 20.9"
                      required
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      title={tooltips.temperature}
                    />
                    <div className="text-xs text-gray-500">
                      Khuyến nghị: 8.8-43.7°C
                    </div>
                  </div>
                  {/* humidity */}
                  <div className="space-y-2">
                    <label
                      htmlFor="humidity"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-cloud mr-2 text-cyan-600"></i>
                      Độ ẩm (%)
                    </label>
                    <input
                      type="number"
                      id="humidity"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 82"
                      required
                      value={humidity}
                      onChange={(e) => setHumidity(e.target.value)}
                      title={tooltips.humidity}
                    />
                    <div className="text-xs text-gray-500">Khuyến nghị: 14-100%</div>
                  </div>
                  {/* rainfall */}
                  <div className="space-y-2">
                    <label
                      htmlFor="rainfall"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      <i className="fas fa-cloud-rain mr-2 text-indigo-600"></i>
                      Lượng mưa (mm)
                    </label>
                    <input
                      type="number"
                      id="rainfall"
                      step="0.01"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg input-focus"
                      placeholder="Ví dụ: 202"
                      required
                      value={rainfall}
                      onChange={(e) => setRainfall(e.target.value)}
                      title={tooltips.rainfall}
                    />
                    <div className="text-xs text-gray-500">Khuyến nghị: 20-300mm</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 md:pt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 md:px-8 md:py-3 bg-green-500 from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        Dự đoán cây trồng
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={fillSampleData}
                    className="px-6 py-2 md:px-8 md:py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                  >
                    <i className="fas fa-fill-drip mr-2"></i>Điền dữ liệu mẫu
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Prediction results */}
          <section id="prediction" className="mb-12" ref={predictionSectionRef}>
            {showResults && (
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8 card-hover">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800">
                  <i className="fas fa-chart-line mr-3 text-green-600"></i>
                  Kết quả dự đoán
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Top crop */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 md:p-6 rounded-xl">
                    <div className="text-center">
                      <i className="fas fa-seedling text-3xl md:text-4xl mb-3 md:mb-4"></i>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">
                        Cây trồng được đề xuất
                      </h3>
                      <div id="predictedCrop" className="text-2xl md:text-3xl font-bold">
                        {predictedCrop}
                      </div>
                      <div id="confidence" className="text-base md:text-lg mt-2 opacity-90">
                        {confidence}
                      </div>
                    </div>
                  </div>

                  {/* Probabilities */}
                  <div className="bg-gray-50 p-4 md:p-6 rounded-xl">
                    <h4 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      Xác suất dự đoán top 5
                    </h4>
                    <div id="probabilityList" className="space-y-2 md:space-y-3">
                      {probabilities.map(({ crop, probability }) => (
                        <div
                          key={crop}
                          className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg"
                        >
                          <span className="font-medium text-sm md:text-base">
                            {cropDatabase[crop]?.name || crop}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 md:w-20 lg:w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full feature-bar"
                                style={{ width: `${probability * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs md:text-sm font-semibold">
                              {(probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Input summary */}
                <div className="mt-6 md:mt-8 bg-gray-50 p-4 md:p-6 rounded-xl">
                  <h4 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Thông số đầu vào</h4>
                  <div id="inputSummary" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        {inputSummary.N}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">Đạm (N)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-orange-600">
                        {inputSummary.P}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">Lân (P)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-purple-600">
                        {inputSummary.K}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">Kali (K)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-blue-600">
                        {inputSummary.ph}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">pH</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-red-600">
                        {inputSummary.temperature}°C
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">Nhiệt độ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-cyan-600">
                        {inputSummary.humidity}%
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">Độ ẩm</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-indigo-600">
                        {inputSummary.rainfall}mm
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">Lượng mưa</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Analysis */}
          <section id="analysis" className="mb-12">
            {showAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8 card-hover">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800">
                  <i className="fas fa-chart-bar mr-3 text-purple-600"></i>
                  Phân tích đặc trưng
                </h2>

                <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
                  {/* Radar chart - Đã sửa để responsive trên mobile */}
                  <div className="w-full xl:w-1/2 order-2 xl:order-1">
                    <h4 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      So sánh với giá trị trung bình
                    </h4>
                    <div id="comparisonChart" className="space-y-3 md:space-y-4">
                      {comparisonFeatures.map((feature, index) => {
                        const percentage =
                          feature.optimal !== 0
                            ? Math.min(
                                (feature.current / feature.optimal) * 100,
                                200
                              )
                            : 0;
                        const status =
                          percentage >= 80 && percentage <= 120
                            ? "optimal"
                            : percentage < 80
                            ? "low"
                            : "high";
                        const statusColor =
                          status === "optimal"
                            ? "bg-green-500"
                            : status === "low"
                            ? "bg-yellow-500"
                            : "bg-red-500";
                        const statusText =
                          status === "optimal"
                            ? "Tối ưu"
                            : status === "low"
                            ? "Thấp"
                            : "Cao";

                        return (
                          <div key={index} className="bg-gray-50 p-3 md:p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm md:text-base">{feature.name}</span>
                              <span
                                className={`text-xs md:text-sm px-2 py-1 rounded text-white ${statusColor}`}
                              >
                                {statusText}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
                              <span>
                                Hiện tại: {feature.current}
                                {feature.unit}
                              </span>
                              <span>
                                Tối ưu: {feature.optimal.toFixed(1)}
                                {feature.unit}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${statusColor} feature-bar`}
                                style={{
                                  width: `${Math.min(percentage, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radar chart - Đặt sau bảng so sánh trên mobile */}
                  <div className="w-full xl:w-1/2 order-1 xl:order-2">
                    <h4 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      Biểu đồ radar các đặc trưng
                    </h4>
                    <div className="w-full h-64 md:h-80 lg:h-96 mx-auto flex items-center justify-center bg-gray-50 rounded-lg p-2">
                      <PlotlyComponent inputs={inputSummary} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Biểu đồ hiển thị mức độ phù hợp của các thông số với cây trồng được đề xuất
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <style jsx global>{`
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .card-hover {
            transition: transform 0.3s, box-shadow 0.3s;
          }
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }
          .input-focus:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          .prediction-result {
            animation: fadeInUp 0.5s ease-out;
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .feature-bar {
            transition: width 0.8s ease-out;
          }
          @keyframes animate-fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: animate-fade-in 0.6s ease-out forwards;
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          ::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #5a67d8;
          }

          /* Responsive improvements */
          @media (max-width: 768px) {
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            .text-4xl {
              font-size: 2rem;
            }
            .text-3xl {
              font-size: 1.75rem;
            }
            .text-2xl {
              font-size: 1.5rem;
            }
            .text-xl {
              font-size: 1.25rem;
            }
          }

          @media (max-width: 640px) {
            .grid-cols-2 {
              grid-template-columns: 1fr;
            }
            .grid-cols-4 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `}</style>
      </div>

      <Footer />
    </div>
  );
};

export default CropPredictionApp;