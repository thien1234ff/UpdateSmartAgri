# UpdateSmartAgri

## Deploy lại lên Vercel (đăng nhập bằng VSCode)

### 1) Mở Terminal trong VSCode
- VSCode → **Terminal** → **New Terminal**

### 2) Vào thư mục dự án
```bat
cd c:/Users/acer/Desktop/smart-agri
```

### 3) Cài Vercel CLI (nếu chưa có)
```bat
npm i -g vercel
```

### 4) Đăng nhập Vercel
```bat
npm i vercel@latest
vercel login 22T1020444@husc.edu.vn
```
Terminal sẽ hiển thị menu đăng nhập (ví dụ: Continue with Google / GitHub / Email...).
- Chọn đúng phương thức bạn đã dùng trước đây
- Hoàn tất xác nhận trên trình duyệt rồi quay lại terminal

### 5) Deploy lại lên Vercel
Trong thư mục dự án:
```bat
vercel
```
- Nếu hỏi chọn project thì chọn đúng project trên Vercel
- Vercel sẽ tự build theo cấu hình Next.js (thường tương ứng `next build`)

**Nếu muốn deploy Production**:
```bat
vercel --prod
```

### 6) Nếu deploy xong bị lỗi (thường do thiếu biến môi trường)
1. Vào **Vercel Dashboard**
2. Chọn đúng project
3. **Settings → Environment Variables**
4. Thêm các biến mà code của bạn đang dùng (ví dụ Firebase/OpenAI keys...)
5. Bấm **Redeploy**

