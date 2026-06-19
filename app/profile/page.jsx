'use client'

import { useEffect, useState, useRef } from 'react'
import { auth, db, storage } from '../../lib/firebase'
import {
  onAuthStateChanged,
  updateProfile,
  signOut
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toast } from '../../lib/toast'
import './profile.css'
import Footer from '../../components/Footer'

export default function ProfilePage() {
  const [theme, setTheme] = useState('light')
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    phone: '',
    photoURL: ''
  })
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    editName: '',
    editPhone: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const phoneInputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Theme init
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('sa-theme') : null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme)
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserData((prev) => ({
          ...prev,
          email: user.email || 'Chưa cập nhật',
          displayName: user.displayName || 'Chưa cập nhật',
          photoURL: user.photoURL || ''
        }))

        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          const phone = data.phone || ''
          const photoURL = data.photoURL || user.photoURL || ''

          setUserData({
            displayName: user.displayName || 'Chưa cập nhật',
            email: user.email || 'Chưa cập nhật',
            phone: phone || 'Chưa cập nhật',
            photoURL
          })

          if (!phone) {
            setEditMode(true)
            setMessage('Bạn chưa có số điện thoại, vui lòng cập nhật.')
          }
        } else {
          // Tạo mới document nếu chưa có
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            phone: '',
            photoURL: user.photoURL || ''
          })
          setUserData((prev) => ({
            ...prev,
            phone: 'Chưa cập nhật'
          }))
          setEditMode(true)
          setMessage('Bạn chưa có số điện thoại, vui lòng cập nhật.')
        }
        setLoading(false)
      } else {
        window.location.href = '/'
      }
    })

    return () => unsubscribe()
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('sa-theme', next)
    }
  }

  const handleEditClick = () => {
    setFormData({
      editName: userData.displayName !== 'Chưa cập nhật' ? userData.displayName : '',
      editPhone: userData.phone !== 'Chưa cập nhật' ? userData.phone : ''
    })
    setEditMode(true)
    setMessage('')
  }

  const handlePhoneChangeLink = () => {
    handleEditClick()
    setTimeout(() => {
      if (phoneInputRef.current) phoneInputRef.current.focus()
    }, 0)
  }

  const handleCancelClick = () => {
    setEditMode(false)
    setMessage('')
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!formData.editName.trim()) {
      toast.error('Vui lòng nhập tên.')
      setMessage('Tên không được để trống.')
      return
    }
    if (!/^[0-9]{10}$/.test(formData.editPhone)) {
      toast.error('Số điện thoại không hợp lệ. Phải gồm mười chữ số.')
      setMessage('Số điện thoại phải là 10 chữ số.')
      return
    }

    const user = auth.currentUser
    if (user) {
      try {
        await updateProfile(user, { displayName: formData.editName })

        await updateDoc(doc(db, 'users', user.uid), {
          phone: formData.editPhone
        })

        const updatedDoc = await getDoc(doc(db, 'users', user.uid))
        const updatedData = updatedDoc.data()

        setUserData((prev) => ({
          ...prev,
          displayName: formData.editName,
          phone: updatedData.phone || 'Chưa cập nhật'
        }))

        setEditMode(false)
        toast.success('Cập nhật hồ sơ thành công.')
        setMessage('Cập nhật thành công!')
      } catch (error) {
        toast.error('Cập nhật hồ sơ thất bại.')
        setMessage('Cập nhật thất bại: ' + error.message)
      }
    }
  }

  const handleLogout = () => {
    signOut(auth).then(() => {
      toast.success('Đăng xuất thành công.')
      setTimeout(() => {
        window.location.href = '/'
      }, 3000)
    }).catch((error) => {
      toast.error('Đăng xuất thất bại.')
      console.error('Đăng xuất thất bại:', error.message)
    })
  }

  const handleChoosePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    // To support fallback storing as base64 in Firestore, keep file small
    const MAX_BYTES = 700 * 1024 // ~700KB so base64 stays under Firestore 1MiB doc limit
    if (file.size > MAX_BYTES) {
      toast.error('Dung lượng ảnh quá lớn.')
      setMessage('Ảnh quá lớn. Vui lòng chọn ảnh ≤ 700KB')
      return
    }
    const user = auth.currentUser
    if (!user) return
    try {
      const path = `avatars/${user.uid}`
      const ref = storageRef(storage, path)
      try {
        await uploadBytes(ref, file, { contentType: file.type })
        const url = await getDownloadURL(ref)
        await updateProfile(user, { photoURL: url })
        await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
        setUserData((prev) => ({ ...prev, photoURL: url }))
        toast.success('Cập nhật ảnh đại diện thành công.')
        setMessage('Cập nhật ảnh đại diện thành công!')
        return
      } catch (storageErr) {
        // Fallback: store as base64 data URL in Firestore/Auth when Storage is unavailable
        const toDataURL = (fileObj) => new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(fileObj)
        })
        const dataUrl = await toDataURL(file)
        await updateProfile(user, { photoURL: dataUrl })
        await updateDoc(doc(db, 'users', user.uid), { photoURL: dataUrl })
        setUserData((prev) => ({ ...prev, photoURL: dataUrl }))
        toast.success('Cập nhật ảnh đại diện thành công.')
        setMessage('Cập nhật ảnh đại diện (chế độ dự phòng) thành công!')
        return
      }
    } catch (err) {
      toast.error('Cập nhật ảnh đại diện thất bại.')
      setMessage('Tải ảnh thất bại: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="loading-wrapper" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <p className="loading-text">Đang tải hồ sơ...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="modern-header">
        <div className="logo" aria-label="Smart Agriculture">SMART AGRICULTURE</div>
        <nav aria-label="Điều hướng chính">
          <ul>
            <li><a href="/">Home</a></li>
            <li aria-current="page"><a href="#">Profile</a></li>
            <li><button className="link-like" onClick={handleLogout} aria-label="Đăng xuất">Logout</button></li>
            <li>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
                title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="profile-container glass" aria-labelledby="profile-heading">
          <div className="section-top">
            <h2 id="profile-heading">Hồ Sơ Của Tôi</h2>
            <div className="actions">
              {!editMode && (
                <button id="editButton" onClick={handleEditClick} aria-label="Chỉnh sửa hồ sơ">Chỉnh Sửa</button>
              )}
            </div>
          </div>

          <p className="section-sub">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>

          <div className="profile-grid">
            <div className="form-column">
              <form id="editForm" onSubmit={handleSave} aria-describedby={message ? 'message' : undefined}>
                <div className="field">
                  <label htmlFor="loginName">Tên đăng nhập</label>
                  <input id="loginName" type="text" value={(userData.email || '').split('@')[0] || ''} readOnly />
                </div>

                <div className="field">
                  <div className="label-row">
                    <label htmlFor="displayName">Tên</label>
                  </div>
                  <input
                    id="displayName"
                    type="text"
                    placeholder="Tên hiển thị"
                    value={editMode ? formData.editName : (userData.displayName !== 'Chưa cập nhật' ? userData.displayName : '')}
                    onChange={(e) => setFormData({ ...formData, editName: e.target.value })}
                    readOnly={!editMode}
                    required
                  />
                </div>

                <div className="field">
                  <div className="label-row">
                    <label htmlFor="email">Email</label>
                  </div>
                  <input id="email" type="email" value={userData.email} readOnly />
                </div>

                <div className="field">
                  <div className="label-row">
                    <label htmlFor="phone">Số điện thoại</label>
                  </div>
                  <input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    placeholder="Số điện thoại"
                    value={editMode ? formData.editPhone : (userData.phone !== 'Chưa cập nhật' ? userData.phone : '')}
                    onChange={(e) => setFormData({ ...formData, editPhone: e.target.value })}
                    readOnly={!editMode}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={!editMode} aria-disabled={!editMode}>Lưu</button>
                  {editMode && <button type="button" className="secondary" onClick={handleCancelClick}>Hủy</button>}
                </div>

                {message && (
                  <div
                    id="message"
                    className={`alert ${message.includes('thành công') ? 'success' : 'error'}`}
                    role="alert"
                    aria-live="polite"
                  >
                    {message}
                  </div>
                )}
              </form>
            </div>

            <aside className="avatar-column" aria-label="Ảnh đại diện">
              <div className="avatar-card">
                {userData.photoURL ? (
                  <img className="avatar-img" src={userData.photoURL} alt="Ảnh đại diện" />
                ) : (
                  <div className="avatar large" aria-hidden="true">
                    {userData.displayName ? userData.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={handleFileSelected} />
                <button type="button" className="choose-photo" onClick={handleChoosePhoto}>Chọn Ảnh</button>
                <p className="helper">Dung lượng file tối đa 1 MB</p>
                <p className="helper">Định dạng: .JPG, .JPEG, .PNG</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}