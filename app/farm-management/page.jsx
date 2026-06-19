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
import "./FarmManagement.css";
import Header from "../../components/Header";
import FarmNav from "../../components/FarmNav";
import Footer from "../../components/Footer";
export default function FarmManagement() {
  const [farms, setFarms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    area: "",
    location: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    status: "Đang hoạt động",
    description: "",
  });
  const [editId, setEditId] = useState(null);

  // Chuẩn hóa trạng thái để so sánh
  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.trim().toLowerCase();
    if (["active", "đang hoạt động"].includes(s)) return "đang hoạt động";
    if (["inactive", "ngừng hoạt động"].includes(s)) return "ngừng hoạt động";
    return s;
  };

  // Lấy dữ liệu farms từ Firestore
  useEffect(() => {
    const q = query(collection(db, "farms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setFarms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!formData.name || !formData.owner || !formData.area || !formData.location) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }

    if (editId) {
      await updateDoc(doc(db, "farms", editId), formData);
    } else {
      await addDoc(collection(db, "farms"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (farm) => {
    setFormData(farm);
    setEditId(farm.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa nông trại này?")) {
      await deleteDoc(doc(db, "farms", id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      owner: "",
      area: "",
      location: "",
      phone: "",
      email: "",
      latitude: "",
      longitude: "",
      status: "Đang hoạt động",
      description: "",
    });
    setEditId(null);
  };

  // Lọc danh sách farms
  const filteredFarms = farms.filter((farm) => {
    const farmStatus = normalizeStatus(farm.status);
    const filterStatus = normalizeStatus(statusFilter);
    return (
      farm.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === "tất cả" || farmStatus === filterStatus)
    );
  });

  return (
    <div className="root">
        <Header />
        <div className="farm-container">
            <div className="header">
                <h1>🌾 Quản lý Nông trại</h1>
                <p>Quản lý thông tin nông trại, cây trồng và các hoạt động liên quan.</p>
            </div>
            <FarmNav />

            <div className="main-content">
                <div className="farm-header">
                <h2>Quản lý Nông trại</h2>
                <div className="farm-controls">
                    <input
                    type="text"
                    placeholder="🔍 Tìm kiếm nông trại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    >
                    <option value="Tất cả">Tất cả</option>
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                    </select>
                    <button
                    className="btn-add"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    >
                    + Thêm nông trại
                    </button>
                </div>
                </div>

                {showForm && (
                <div className="farm-form">
                    <h3>Thông tin nông trại</h3>
                    <div className="form-grid">
                    <input
                        name="name"
                        placeholder="Tên nông trại *"
                        value={formData.name}
                        onChange={handleChange}
                    />
                    <input
                        name="owner"
                        placeholder="Chủ nông trại *"
                        value={formData.owner}
                        onChange={handleChange}
                    />
                    <input
                        name="area"
                        placeholder="Diện tích (hecta) *"
                        value={formData.area}
                        onChange={handleChange}
                    />
                    <input
                        name="location"
                        placeholder="Địa điểm *"
                        value={formData.location}
                        onChange={handleChange}
                    />
                    <input
                        name="phone"
                        placeholder="Số điện thoại"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                    <input
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <input
                        name="latitude"
                        placeholder="Vĩ độ"
                        value={formData.latitude}
                        onChange={handleChange}
                    />
                    <input
                        name="longitude"
                        placeholder="Kinh độ"
                        value={formData.longitude}
                        onChange={handleChange}
                    />
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="Đang hoạt động">Đang hoạt động</option>
                        <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                    </select>
                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                    </div>
                    <div className="form-actions">
                    <button className="btn-save" onClick={handleSave}>
                        {editId ? "Cập nhật" : "Tạo nông trại mới"}
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

                <div className="farm-list">
                {filteredFarms.map((farm) => (
                    <div key={farm.id} className="farm-card">
                    <h4>🌾 {farm.name}</h4>
                    <span
                        className={`status ${
                        normalizeStatus(farm.status) === "đang hoạt động"
                            ? "active"
                            : "inactive"
                        }`}
                    >
                        {normalizeStatus(farm.status)}
                    </span>
                    <p>
                        <strong>Chủ nông trại:</strong> {farm.owner}
                    </p>
                    <p>
                        <strong>Diện tích:</strong> {farm.area} ha
                    </p>
                    <p>
                        <strong>Địa điểm:</strong> {farm.location}
                    </p>
                    <p>
                        <strong>Điện thoại:</strong> {farm.phone}
                    </p>
                    <p>
                        <strong>Email:</strong> {farm.email}
                    </p>
                    <p>
                        <strong>Mô tả:</strong> {farm.description}
                    </p>
                    <div className="card-actions">
                        <button className="btn-edit" onClick={() => handleEdit(farm)}>
                        Sửa
                        </button>
                        <button className="btn-view">Xem</button>
                        <button
                        className="btn-delete"
                        onClick={() => handleDelete(farm.id)}
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
