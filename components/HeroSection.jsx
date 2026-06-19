'use client'

import { Button } from "./ui/button"

export default function HeroSection() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  return (
    <section id="home" className="hero-section-style">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 text-center max-w-4xl px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-8 text-shadow">
          Chuyển đổi số nông nghiệp <br /> Tối ưu hóa canh tác
        </h1>
        <button 
          onClick={scrollToFeatures}
          className="relative group/btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl shadow-green-500/30 animate-button-bounce"
        >
          <span className="relative z-10">Bắt đầu ngay</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-300 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
          <div className="absolute inset-0 rounded-2xl border-2 border-green-400/50 group-hover/btn:border-green-300/70 transition-all duration-500"></div>
        </button>
      </div>
    </section>
  )
}
