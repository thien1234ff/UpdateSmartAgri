'use client'

import { TrendingUp, Cloud, Users, MessageCircle, BarChart3 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import Link from 'next/link';

const features = [
  {
    icon: <TrendingUp className="w-12 h-12" />,
    title: "Dự đoán năng suất",
    description: "Sử dụng AI để dự báo năng suất cây trồng, giúp bạn lập kế hoạch hiệu quả hơn.",
    link: "/crop-prediction",
  },
  {
    icon: <Cloud className="w-12 h-12" />,
    title: "Dự báo thời tiết",
    description: "Cung cấp thông tin thời tiết chính xác, cảnh báo sớm các điều kiện bất lợi.",
    link: "/weather",
  },
  {
    icon: <Users className="w-12 h-12" />,
    title: "Quản lý nông trại",
    description: "Công cụ toàn diện để quản lý đất đai, cây trồng, và tài nguyên nông trại.",
    link: "/farm-management",
  },
  {
    icon: <MessageCircle className="w-12 h-12" />,
    title: "Hỗ trợ Chatbot",
    description: "Trợ lý ảo 24/7 giải đáp thắc mắc và cung cấp lời khuyên nông nghiệp.",
    link: "/ai-chat",
  },
]

export default function FeaturesSection() {
  const sectionRef = useRef(null)

  const scrollToProductsSection = () => {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  // Animation khi scroll vào view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
          }
        })
      },
      { threshold: 0.1 }
    )

    const cards = document.querySelectorAll('.feature-card')
    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id="features" 
      ref={sectionRef}
      className="relative py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 overflow-hidden"
    >
      {/* Background hiệu ứng */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-100 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 mb-16 animate-text-shimmer leading-tight md:leading-snug">
            Tiện ích chính
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá các công cụ hiện đại giúp tối ưu hóa hoạt động nông nghiệp của bạn
          </p>
        </div>

        {/* Grid features - ĐÃ CẢI TIẾN FOCUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group focus-within:ring-4 focus-within:ring-emerald-500/30 rounded-3xl outline-none"
              tabIndex={0}                    // ← THÊM: Cho phép focus bằng Tab
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="group [perspective:1000px] w-full h-[320px]">
                <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">

                  {/* Front side */}
                  <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center border border-transparent hover:border-emerald-200">
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-200 to-emerald-300 text-green-800 shadow mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-center">{feature.description}</p>
                  </div>

                  {/* Back side */}
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-green-800">
                    <h3 className="text-2xl font-bold mb-4 text-center">{feature.title}</h3>
                    <p className="mb-6 text-center">Khám phá chi tiết tính năng này để tối ưu nông nghiệp!</p>
                    
                    <Link href={feature.link} className="no-underline w-full">
                      <button 
                        className="w-full sparkle-btn py-3.5 text-base font-semibold"
                        tabIndex={0}
                      >
                        Xem chi tiết
                      </button>
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 px-8 py-5 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-green-200">
            <span className="text-xl font-semibold text-gray-800">Sẵn sàng trải nghiệm?</span>
            <button 
              onClick={scrollToProductsSection}
              className="bg-gradient-to-r from-green-300 to-emerald-400 hover:from-green-400 hover:to-emerald-500 text-green-900 px-8 py-3 rounded-xl text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
              tabIndex={0}
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </div>

      {/* Animations + Sparkle Button CSS */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feature-card {
          transition: all 0.3s ease;
        }
        .feature-card:focus {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }

        /* Sparkle Button */
        .sparkle-btn {
          border: none;
          width: 100%;
          border-radius: 9999px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          background: #ffffffcc;
          cursor: pointer;
          transition: all 400ms ease-in-out;
          box-shadow: inset 0px 1px 0px 0px rgba(0, 0, 0, 0.05),
                      0px 2px 6px rgba(0, 0, 0, 0.1);
        }
        .sparkle-btn:hover {
          background: linear-gradient(90deg, #34d399, #059669);
          box-shadow: 0px 0px 14px 3px rgba(16, 185, 129, 0.5);
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  )
}