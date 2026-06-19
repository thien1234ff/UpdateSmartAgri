'use client'

import { useState } from 'react'
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function ContactSection() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, SĐT)')
      return
    }

    try {
      await addDoc(collection(db, 'consultations'), {
        ...contactForm,
        timestamp: serverTimestamp(),
        status: 'pending'
      })
      
      alert('Yêu cầu tư vấn đã được gửi thành công! Chúng tôi sẽ liên hệ lại với bạn sớm nhất.')
      setContactForm({ name: '', email: '', phone: '', message: '' })
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu:', error)
      alert('Đã có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.')
    }
  }

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 mb-16 animate-text-shimmer leading-tight md:leading-snug">
          Liên hệ / Đăng ký tư vấn
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-2xl border border-gray-100">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Đăng ký nhận hỗ trợ</h3>
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    required
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    required
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    required
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Nội dung tin nhắn</Label>
                  <Textarea
                    id="message"
                    placeholder="Bạn cần tư vấn về vấn đề gì?"
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 rounded-xl"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="
                    w-full 
                    bg-green-600 
                    text-white 
                    font-semibold 
                    py-3 
                    rounded-2xl 
                    shadow-md 
                    transform 
                    transition 
                    duration-300 
                    ease-in-out
                    hover:scale-105 
                    hover:shadow-xl 
                    hover:bg-gradient-to-r 
                    hover:from-green-500 
                    hover:to-emerald-600
                    focus:outline-none
                    focus:ring-2
                    focus:ring-green-400
                    focus:ring-offset-2
                  "
                >
                  Gửi yêu cầu
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-2xl border border-gray-100">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Thông tin liên hệ</h3>
              <div className="space-y-5 mb-8">
                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">vominhquan17102004@gmail.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">+84 76 265 7225</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">Tầng 81, Tòa nhà LandMark, Quận 1, TP. Hồ Chí Minh</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Mạng xã hội</h4>
                <div className="flex gap-4">
                  <a 
                    href="https://www.facebook.com/thien.777h" 
                    className="text-green-500 hover:text-green-600 transition-colors"
                  >
                    <Facebook className="w-8 h-8" />
                  </a>
                  <a 
                    href="https://www.instagram.com/sunyidd/" 
                    className="text-green-500 hover:text-green-600 transition-colors"
                  >
                    <Instagram className="w-8 h-8" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
      `}</style>
    </section>
  )
}
