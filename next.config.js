/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Bật các tính năng thử nghiệm nếu cần (tùy chọn)
    // serverComponents: true, // Đã mặc định trong Next.js 14
  },
  // Thêm tùy chọn để kiểm soát prerender (không cần thiết ở đây, xử lý trong page)
};

module.exports = nextConfig;