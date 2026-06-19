'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { collection, query, getDocs, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function ProductsSection({ addToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const productsCol = collection(db, 'products')
      const q = query(productsCol, limit(3)) // Lấy 3 sản phẩm
      const productSnapshot = await getDocs(q)
      
      const productList = []
      productSnapshot.forEach(doc => {
        const data = doc.data()
        productList.push({
          id: doc.id,
          name: data.name || 'Chưa đặt tên',
          description: data.description || '',
          price: data.price || 0,
          imageUrl: data.imageUrl || '/placeholder.svg?height=200&width=200'
        })
      })
      
      setProducts(productList)
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error)
    } finally {
      setLoading(false)
    }
  }

  const getProductImageSrc = (imageUrl) => {
    if (!imageUrl) {
      return "/placeholder.svg?height=200&width=200"
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    if (!imageUrl.startsWith('/')) {
      return `/${imageUrl}`
    }
    return imageUrl
  }

  return (
    <section id="products" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="section-heading">
          SẢN PHẨM NỔI BẬT
        </h2>
        
        {loading ? (
          <p className="text-center text-gray-600">Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600">Không có sản phẩm nào để hiển thị.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {products.map((product) => (
              <Card key={product.id} className="product-card-style">
                <CardContent className="p-6">
                  <img 
                    src={getProductImageSrc(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                  <p className="text-green-600 font-bold text-lg mb-4">
                    {product.price.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => addToCart && addToCart(product)}
                  >
                    Thêm vào giỏ hàng
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            <a href="/products">Xem tất cả sản phẩm</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
