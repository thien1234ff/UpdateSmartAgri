"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import "./PlantManagement.css";
import Header from "../../components/Header";
import FarmNav from "../../components/FarmNav";
import Footer from "../../components/Footer";
export default function PlantManagement() {
  const [plants, setPlants] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    farmId: "",
    name: "",
    type: "",
    season: "",
    growthTime: "",
    plantDate: "",
    quantityArea: "",
    description: "",
  });

  const [editId, setEditId] = useState(null);

  // Lấy danh sách nông trại
  useEffect(() => {
    const q = query(collection(db, "farms"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const farmList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFarms(farmList);
    });
    return () => unsub();
  }, []);

  // Lấy dữ liệu cây trồng dựa trên farm được chọn
  useEffect(() => {
    if (selectedFarm === "all") {
      // Lấy tất cả crops của tất cả farms
      const unsubList = [];
      let allPlants = [];
      farms.forEach((farm) => {
        const q = query(
          collection(db, "farms", farm.id, "crops"),
          orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snapshot) => {
          const farmPlants = snapshot.docs.map((doc) => ({
            id: doc.id,
            farmId: farm.id,
            farmName: farm.name,
            ...doc.data(),
          }));
          allPlants = [...allPlants.filter(p => p.farmId !== farm.id), ...farmPlants];
          setPlants([...allPlants]);
        });
        unsubList.push(unsub);
      });
      return () => unsubList.forEach((unsub) => unsub());
    } else if (selectedFarm) {
      // Lấy crops của farm cụ thể
      const q = query(
        collection(db, "farms", selectedFarm, "crops"),
        orderBy("createdAt", "desc")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setPlants(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            farmId: selectedFarm,
            farmName: farms.find(f => f.id === selectedFarm)?.name || "",
            ...doc.data(),
          }))
        );
      });
      return () => unsub();
    }
  }, [selectedFarm, farms]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!formData.name || !formData.type || !formData.season || !formData.farmId) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }

    const cropRef = collection(db, "farms", formData.farmId, "crops");

    if (editId) {
      await updateDoc(doc(db, "farms", formData.farmId, "crops", editId), formData);
    } else {
      await addDoc(cropRef, {
        ...formData,
        createdAt: serverTimestamp(),
      });
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (plant) => {
    setFormData(plant);
    setEditId(plant.id);
    setShowForm(true);
  };

  const handleDelete = async (farmId, id) => {
    if (confirm("Bạn có chắc muốn xóa cây trồng này?")) {
      await deleteDoc(doc(db, "farms", farmId, "crops", id));
    }
  };

  const resetForm = () => {
    setFormData({
      farmId: "",
      name: "",
      type: "",
      season: "",
      growthTime: "",
      plantDate: "",
      quantityArea: "",
      description: "",
    });
    setEditId(null);
  };

  const filteredPlants = plants.filter((plant) => {
    return (
      plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (typeFilter === "Tất cả" || plant.type === typeFilter)
    );
  });

  return (
    <div className="root">
        <Header />
        <div className="plant-container">
            <div className="header">
                <h1>🌱 Quản lý Cây trồng</h1>
                <p>Quản lý thông tin cây trồng cho từng nông trại.</p>
            </div>
            <FarmNav />

            <div className="main-content">
                <div className="plant-header">
                <h2>Quản lý Cây trồng</h2>
                <div className="plant-controls">
                    <input
                    type="text"
                    placeholder="🔍 Tìm kiếm cây trồng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    >
                    <option value="Tất cả">Tất cả loại cây</option>
                    <option value="Rau">Rau</option>
                    <option value="Hoa">Hoa</option>
                    <option value="Trái cây">Trái cây</option>
                    </select>
                    <select
                    value={selectedFarm}
                    onChange={(e) => setSelectedFarm(e.target.value)}
                    >
                    <option value="all">-- Tất cả nông trại --</option>
                    {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                        {farm.name}
                        </option>
                    ))}
                    </select>
                    <button
                    className="btn-add"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    >
                    + Thêm cây trồng
                    </button>
                </div>
                </div>

                {showForm && (
                <div className="plant-form">
                    <h3>Thông tin cây trồng</h3>
                    <div className="form-grid">
                    <select
                        name="farmId"
                        value={formData.farmId}
                        onChange={handleChange}
                    >
                        <option value="">-- Chọn nông trại --</option>
                        {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                            {farm.name}
                        </option>
                        ))}
                    </select>
                    <input
                        name="name"
                        placeholder="Tên cây trồng *"
                        value={formData.name}
                        onChange={handleChange}
                    />
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                    >
                        <option value="">Chọn loại cây *</option>
                        <option value="Rau">Rau</option>
                        <option value="Hoa">Hoa</option>
                        <option value="Trái cây">Trái cây</option>
                        <option value="Khác">Khác</option>
                    </select>
                    <select
                        name="season"
                        value={formData.season}
                        onChange={handleChange}
                    >
                        <option value="">Chọn mùa trồng *</option>
                        <option value="Xuân">Xuân</option>
                        <option value="Hạ">Hạ</option>
                        <option value="Thu">Thu</option>
                        <option value="Đông">Đông</option>
                    </select>
                    <input
                        name="growthTime"
                        placeholder="Thời gian sinh trưởng (ngày)"
                        value={formData.growthTime}
                        onChange={handleChange}
                    />
                    <input
                        type="date"
                        name="plantDate"
                        value={formData.plantDate}
                        onChange={handleChange}
                    />
                    <input
                        name="quantityArea"
                        placeholder="Số lượng/Diện tích"
                        value={formData.quantityArea}
                        onChange={handleChange}
                    />
                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                    </div>
                    <div className="form-actions">
                    <button className="btn-save" onClick={handleSave}>
                        {editId ? "Cập nhật" : "Tạo cây trồng mới"}
                    </button>
                    <button
                        className="btn-cancel"
                        onClick={() => {
                        resetForm();
                        setShowForm(false);
                        }}
                    >
                        Hủy
                    </button>
                    </div>
                </div>
                )}

                <div className="plant-list">
                {filteredPlants.map((plant) => (
                    <div key={plant.id} className="plant-card">
                    <h4>🌱 {plant.name}</h4>
                    <p>
                        <strong>Nông trại:</strong> {plant.farmName}
                    </p>
                    <p>
                        <strong>Loại cây:</strong> {plant.type}
                    </p>
                    <p>
                        <strong>Mùa trồng:</strong> {plant.season}
                    </p>
                    <p>
                        <strong>Thời gian sinh trưởng:</strong> {plant.growthTime} ngày
                    </p>
                    <p>
                        <strong>Ngày trồng:</strong> {plant.plantDate}
                    </p>
                    <p>
                        <strong>Số lượng/Diện tích:</strong> {plant.quantityArea}
                    </p>
                    <p>
                        <strong>Mô tả:</strong> {plant.description}
                    </p>
                    <div className="card-actions">
                        <button className="btn-edit" onClick={() => handleEdit(plant)}>
                        Sửa
                        </button>
                        <button className="btn-view">Xem</button>
                        <button
                        className="btn-delete"
                        onClick={() => handleDelete(plant.farmId, plant.id)}
                        >
                        Xóa
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
        <Footer />
    </div>
    
  );
}
