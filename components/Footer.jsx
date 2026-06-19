'use client'

export default function Footer() {
  return (
    <footer className="footer-style">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-bold">SMART AGRICULTURE</span>
            </div>
            <p className="text-green-200">
              Giải pháp nông nghiệp thông minh hàng đầu, giúp tối ưu hóa canh tác và nâng cao năng suất cho nông dân Việt Nam.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-green-200">
              <li><a href="#home" className="footer-link">Trang chủ</a></li>
              <li><a href="#features" className="footer-link">Tính năng</a></li>
              <li><a href="#products" className="footer-link">Sản phẩm</a></li>
              <li><a href="#knowledge" className="footer-link">Tin tức</a></li>
              <li><a href="#contact" className="footer-link">Liên hệ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Chính sách</h3>
            <ul className="space-y-2 text-green-200 mb-6">
              <li><a href="#" className="footer-link">Chính sách quyền riêng tư</a></li>
              <li><a href="#" className="footer-link">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="footer-link">Chính sách hoàn tiền</a></li>
            </ul>
            <p className="text-green-200 text-sm">© 2026 Smart Agriculture. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
