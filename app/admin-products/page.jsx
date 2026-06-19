"use client"

import { useState, useEffect } from "react"
import Papa from "papaparse"
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { toast } from "../../lib/toast"
import "./admin-products.css"

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [message, setMessage] = useState("")
  const [editProduct, setEditProduct] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [imageFile, setImageFile] = useState(null)
  const [editImageFile, setEditImageFile] = useState(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    imageUrl: "",
    category: "",
    description: "",
    detailedDescription: "",
    stock: "",
    discount: "",
    brand: "",
    weight: "",
    dimensions: "",
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const itemsPerPage = 10
  const productsCol = collection(db, "products")

  useEffect(() => {
    const unsub = onSnapshot(productsCol, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setProducts(list)
    })
    return () => unsub()
  }, [])

  const handleImageUpload = async (file) => {
    if (!file) return ""

    // Create a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `product_${timestamp}.${fileExtension}`

    // In a real application, you would upload to a server or cloud storage
    // For now, we'll create a local URL path
    const imagePath = `/images/${fileName}`

    // Note: In a production environment, you would need to implement actual file upload
    // This is a simplified version that assumes the file is handled by the system
    return imagePath
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = newProduct.imageUrl
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
      }

      await addDoc(productsCol, {
        ...newProduct,
        imageUrl,
        price: Number.parseInt(newProduct.price),
        stock: Number.parseInt(newProduct.stock) || 0,
        discount: Number.parseInt(newProduct.discount) || 0,
        createdAt: new Date(),
      })
      toast.success("Đã thêm sản phẩm mới!")
      setMessage("✅ Đã thêm sản phẩm mới!")
      setNewProduct({
        name: "",
        price: "",
        imageUrl: "",
        category: "",
        description: "",
        detailedDescription: "",
        stock: "",
        discount: "",
        brand: "",
        weight: "",
        dimensions: "",
      })
      setImageFile(null)
      setShowAddForm(false)
    } catch (error) {
      toast.error("Lỗi khi thêm sản phẩm: " + error.message)
      setMessage("❌ Lỗi khi thêm sản phẩm: " + error.message)
    }
  }

  const handleAddCSV = (e) => {
    e.preventDefault()
    if (!csvFile) {
      toast.error("Vui lòng chọn file CSV!")
      return
    }
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productsArray = results.data
          for (const product of productsArray) {
            product.price = Number.parseInt(product.price)
            product.stock = Number.parseInt(product.stock) || 0
            product.discount = Number.parseInt(product.discount) || 0
            await addDoc(productsCol, product)
          }
          toast.success("Đã thêm nhiều sản phẩm từ CSV!")
          setMessage("✅ Đã thêm nhiều sản phẩm từ CSV!")
          setCsvFile(null)
        } catch (error) {
          toast.error("Lỗi khi import CSV: " + error.message)
        }
      },
    })
  }

  const handleDelete = async (id) => {
    if (confirm("Xóa sản phẩm này?")) {
      try {
        await deleteDoc(doc(db, "products", id))
        toast.success("Đã xóa sản phẩm!")
        setMessage("✅ Đã xóa sản phẩm!")
      } catch (error) {
        toast.error("Lỗi khi xóa sản phẩm: " + error.message)
      }
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = editProduct.imageUrl
      if (editImageFile) {
        imageUrl = await handleImageUpload(editImageFile)
      }

      const refDoc = doc(db, "products", editProduct.id)
      await updateDoc(refDoc, {
        name: editProduct.name,
        price: Number.parseInt(editProduct.price),
        imageUrl: imageUrl,
        category: editProduct.category || "",
        description: editProduct.description || "",
        detailedDescription: editProduct.detailedDescription || "",
        stock: Number.parseInt(editProduct.stock) || 0,
        discount: Number.parseInt(editProduct.discount) || 0,
        brand: editProduct.brand || "",
        weight: editProduct.weight || "",
        dimensions: editProduct.dimensions || "",
      })
      toast.success("Đã cập nhật sản phẩm!")
      setMessage("✅ Đã cập nhật sản phẩm!")
      setEditProduct(null)
      setEditImageFile(null)
    } catch (error) {
      toast.error("Lỗi khi cập nhật sản phẩm: " + error.message)
    }
  }

  const handleDeleteSelected = async () => {
    const checkedIds = document.querySelectorAll(".select-checkbox:checked")
    if (checkedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để xóa.")
      return
    }
    if (!confirm(`Bạn có chắc muốn xóa ${checkedIds.length} sản phẩm không?`)) {
      return
    }
    try {
      for (const cb of checkedIds) {
        await deleteDoc(doc(db, "products", cb.dataset.id || ""))
      }
      toast.success("Đã xóa nhiều sản phẩm!")
      setMessage("✅ Đã xóa nhiều sản phẩm!")
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm đã chọn: " + error.message)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("⚠ Bạn có chắc muốn XÓA HẾT TẤT CẢ sản phẩm không?")) return
    try {
      const snapshot = await getDocs(productsCol)
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, "products", docSnap.id))
      }
      toast.success("Đã xóa toàn bộ sản phẩm!")
      setMessage("✅ Đã xóa toàn bộ sản phẩm!")
    } catch (error) {
      toast.error("Lỗi khi xóa tất cả sản phẩm: " + error.message)
    }
  }

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🛒 Quản Lý Sản Phẩm
          </h1>
          <p className="text-gray-600">Thêm, sửa, xóa sản phẩm một cách dễ dàng</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            {showAddForm ? "Ẩn Form" : "Thêm Sản Phẩm Mới"}
          </button>
          <button
            onClick={handleDeleteSelected}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Xóa Nhiều Sản Phẩm
          </button>
          <button
            onClick={handleDeleteAll}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Xóa Hết Tất Cả
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg text-green-800 font-semibold animate-fade-in">
            {message}
          </div>
        )}

        {showAddForm && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                +
              </span>
              Thêm Sản Phẩm Mới
            </h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Giá *</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập giá"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Số lượng còn lại</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Số lượng trong kho"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Khuyến mãi (%)</label>
                <input
                  type="number"
                  value={newProduct.discount}
                  onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Phần trăm giảm giá"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Danh mục</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Danh mục sản phẩm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Thương hiệu</label>
                <input
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Thương hiệu"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Cân nặng</label>
                <input
                  type="text"
                  value={newProduct.weight}
                  onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="VD: 500g, 1.2kg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Kích thước</label>
                <input
                  type="text"
                  value={newProduct.dimensions}
                  onChange={(e) => setNewProduct({ ...newProduct, dimensions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="VD: 20x15x10cm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Hình ảnh sản phẩm</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-gray-500">Chọn file ảnh (JPG, PNG, GIF...)</p>
                {imageFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(imageFile) || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Mô tả ngắn</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Mô tả ngắn gọn về sản phẩm"
                  rows="2"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Mô tả chi tiết</label>
                <textarea
                  value={newProduct.detailedDescription}
                  onChange={(e) => setNewProduct({ ...newProduct, detailedDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Mô tả chi tiết về tính năng, cách sử dụng, lợi ích..."
                  rows="4"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Thêm Sản Phẩm
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {!editProduct && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                📄
              </span>
              Thêm Nhiều Sản Phẩm (CSV)
            </h3>
            <form onSubmit={handleAddCSV} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn file CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Upload CSV
              </button>
            </form>
            <p className="text-sm text-gray-600 mt-2">
              CSV cần có các cột: name, price, imageUrl (đường dẫn file ảnh), category, description,
              detailedDescription, stock, discount, brand, weight, dimensions
            </p>
          </div>
        )}

        {editProduct && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                ✏️
              </span>
              Chỉnh Sửa Sản Phẩm
            </h3>
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Giá *</label>
                <input
                  type="number"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Số lượng còn lại</label>
                <input
                  type="number"
                  value={editProduct.stock || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Khuyến mãi (%)</label>
                <input
                  type="number"
                  value={editProduct.discount || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, discount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Danh mục</label>
                <input
                  type="text"
                  value={editProduct.category}
                  onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Thương hiệu</label>
                <input
                  type="text"
                  value={editProduct.brand || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, brand: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Cân nặng</label>
                <input
                  type="text"
                  value={editProduct.weight || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Kích thước</label>
                <input
                  type="text"
                  value={editProduct.dimensions || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, dimensions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Hình ảnh sản phẩm</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files[0])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-gray-500">Chọn file ảnh mới (để trống nếu không thay đổi)</p>
                {editImageFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(editImageFile) || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {editProduct.imageUrl && !editImageFile && (
                  <div className="mt-2">
                    <img
                      src={editProduct.imageUrl || "/placeholder.svg"}
                      alt="Current"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ảnh hiện tại</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Mô tả ngắn</label>
                <textarea
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows="2"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Mô tả chi tiết</label>
                <textarea
                  value={editProduct.detailedDescription || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, detailedDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows="4"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 text-sm"
                >
                  Lưu Thay Đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transform hover:scale-105 transition-all duration-200 text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedProducts.map((p, index) => (
            <div
              key={p.id}
              className="group relative bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-300"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              <input
                type="checkbox"
                className="select-checkbox absolute top-3 left-3 w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 z-10"
                data-id={p.id}
              />

              {p.discount > 0 && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10 animate-pulse">
                  -{p.discount}%
                </div>
              )}

              {p.stock > 0 && (
                <div className="absolute top-12 right-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                  Còn {p.stock}
                </div>
              )}

              {p.stock === 0 && (
                <div className="absolute top-12 right-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                  Hết hàng
                </div>
              )}

              <div className="aspect-square overflow-hidden">
                <img
                  src={p.imageUrl || "/placeholder.svg?height=200&width=200&query=product"}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{p.name}</h3>
                </div>

                {p.brand && <div className="text-sm text-blue-600 font-semibold mb-1">{p.brand}</div>}

                {p.category && (
                  <div className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs rounded-full mb-2">
                    {p.category}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {p.discount > 0 ? (
                    <>
                      <span className="text-lg font-bold text-red-600">
                        {((p.price * (100 - p.discount)) / 100).toLocaleString()} đ
                      </span>
                      <span className="text-sm text-gray-500 line-through">{p.price?.toLocaleString()} đ</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-800">{p.price?.toLocaleString()} đ</span>
                  )}
                </div>

                {p.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.description}</p>}

                <div className="flex flex-wrap gap-1 mb-3 text-xs text-gray-500">
                  {p.weight && <span className="bg-gray-100 px-2 py-1 rounded">⚖️ {p.weight}</span>}
                  {p.dimensions && <span className="bg-gray-100 px-2 py-1 rounded">📏 {p.dimensions}</span>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditProduct(p)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 text-sm"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 text-sm"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              ◀
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  currentPage === index + 1
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => goToPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              ▶
            </button>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeInUp 0.5s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
