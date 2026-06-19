'use client'

import { useState } from 'react'
import { auth } from '../../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { toast } from '../../lib/toast'
import './login.css' // giữ nguyên CSS cũ (bạn copy login.css vào thư mục app/login)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Vui lòng nhập email.')
      setMessage('❌ Vui lòng nhập email.')
      return
    }
    if (!password) {
      toast.error('Vui lòng nhập mật khẩu.')
      setMessage('❌ Vui lòng nhập mật khẩu.')
      return
    }
    if (password.length < 6) {
      toast.error('Mật khẩu quá ngắn (tối thiểu 6 ký tự).')
      setMessage('❌ Mật khẩu quá ngắn.')
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Đăng nhập thành công.')
      setMessage('🎉 Đăng nhập thành công.')
      // Chuyển hướng sang trang chủ hoặc dashboard - tăng độ trễ lên 3000ms để kịp phát âm thanh
      setTimeout(() => {
        window.location.href = '/'
      }, 3000)
    } catch (error) {
      console.error(error)
      toast.error('Đăng nhập thất bại. Sai tài khoản hoặc mật khẩu.')
      setMessage('❌ Đăng nhập thất bại. Sai tài khoản hoặc mật khẩu.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-1">
        <h2>ĐĂNG NHẬP</h2>
        <p id="loichao">
          <b>SmartAgri</b> chào <b>bạn</b>, <b>bạn</b> cần đăng kí hoặc đăng <br />
          nhập tài khoản trước khi sử dụng để nhận được <br />
          nhiều ưu đãi và <b>SmartAgri</b> phục vụ <b>bạn</b> tốt hơn <br />
          nhé!<br />
          Cảm ơn <b>bạn</b> rất nhiều!
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email" style={{ marginTop: 30 }}>Email</label>
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">ĐĂNG NHẬP</button>

          <div className="links">
            <a href="/password" className="forgot-password">Quên mật khẩu?</a>
            <a href="/register" className="logout">Đăng ký</a>
          </div>

          <div
            className="error-message"
            role={message.includes('🎉') ? 'status' : 'alert'}
            aria-live="polite"
            style={{ color: message.includes('🎉') ? 'green' : 'red' }}
          >
            {message}
          </div>
        </form>
      </div>
      <div className="login-2"></div>
    </div>
  )
}
