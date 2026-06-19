'use client'

import { useState } from 'react'
import { auth, db } from '../../lib/firebase'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { toast } from '../../lib/toast'
import './register.css' // Import file CSS gốc
import Footer from '../../components/Footer'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    terms: false
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      toast.error('Tên hiển thị không được để trống.')
      setMessage('Tên hiển thị không được để trống.')
      return
    }
    if (!formData.firstName.trim()) {
      toast.error('Tên không được để trống.')
      setMessage('Tên không được để trống.')
      return
    }
    if (!formData.lastName.trim()) {
      toast.error('Họ không được để trống.')
      setMessage('Họ không được để trống.')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Email không được để trống.')
      setMessage('Email không được để trống.')
      return
    }
    if (!formData.password) {
      toast.error('Mật khẩu không được để trống.')
      setMessage('Mật khẩu không được để trống.')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu quá ngắn (tối thiểu 6 ký tự).')
      setMessage('Mật khẩu quá ngắn (tối thiểu 6 ký tự).')
      return
    }
    if (!formData.terms) {
      toast.error('Bạn phải đồng ý với điều khoản dịch vụ.')
      setMessage('Vui lòng đồng ý với điều khoản.')
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      const user = userCredential.user

      await updateProfile(user, { displayName: formData.username })

      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        displayName: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'user'
      })

      await sendEmailVerification(user)

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email của bạn.')
      setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.')
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        terms: false
      })

      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)
    } catch (error) {
      toast.error(`Đăng ký thất bại: ${error.message}`)
      setMessage(`Đăng ký thất bại: ${error.message}`)
    }
  }

  return (
    <div className="page-container">
      <header>
        <div className="logo">SMART AGRICULTURE</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="#">Register</a></li>
            <li><a href="#" id="logoutLink" style={{ display: 'none' }}>Logout</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="register-container">
          <h2>ĐĂNG KÝ</h2>
          <p className="login-link">
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Tên hiển thị"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="firstName"
              placeholder="Tên"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Họ"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <div className="terms-row">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
              />
              <label htmlFor="terms" className="terms-label">
                <span className="terms-text">Tôi đồng ý với</span>{' '}
                <b>Điều khoản & Điều kiện</b>
              </label>
            </div>

            <button type="submit" className="create-button">
              Tạo tài khoản
            </button>
          </form>

          {message && (
            <p
              id="register-message"
              className="error"
              role={message.includes('thành công') ? 'status' : 'alert'}
              aria-live="polite"
              style={{ color: message.includes('thành công') ? '#2e7d32' : '#d32f2f' }}
            >
              {message}
            </p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
