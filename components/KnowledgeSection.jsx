'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { X, Calendar, User } from 'lucide-react'

export default function KnowledgeSection() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    fetchKnowledgeArticles()
  }, [])

  const fetchKnowledgeArticles = async () => {
    try {
      const articlesCol = collection(db, 'articles')
      const q = query(articlesCol, orderBy('date', 'desc'), limit(3))
      const articleSnapshot = await getDocs(q)
      
      const articleList = []
      articleSnapshot.forEach((doc) => {
        const data = doc.data()
        articleList.push({
          id: doc.id,
          title: data.title || 'Không có tiêu đề',
          excerpt: data.excerpt || '',
          content: data.content || data.excerpt || '',
          date: data.date?.toDate?.() || null,
          author: data.author || 'Admin',
          category: data.category
        })
      })
      
      setArticles(articleList)
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error)
    } finally {
      setLoading(false)
    }
  }

  const openArticle = (article) => {
    setSelectedArticle(article)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedArticle(null)
  }

  // ==================== FOCUS TRAP + ESC ====================
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Tự động focus khi mở modal
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  return (
    <section id="knowledge" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 mb-16 animate-text-shimmer leading-tight md:leading-snug">
          Bài viết Kiến thức
        </h2>

        {loading ? (
          <p className="text-center text-gray-600">Đang tải bài viết...</p>
        ) : articles.length === 0 ? (
          <p className="text-center text-gray-600">Không có bài viết nào để hiển thị.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="card relative group cursor-pointer"
                tabIndex={0}
                onClick={() => openArticle(article)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openArticle(article)
                }}
              >
                <div className="card__body">
                  <div className="card__icon">
                    <svg height="32" width="32" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
                      <path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" strokeLinejoin="round" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="card__title">{article.title}</p>
                  <p className="card__paragraph">{article.excerpt}</p>
                </div>
                <div className="card__ribbon">
                  <label className="card__ribbon-label">
                    {article.index ?? '-'}
                  </label>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    Đọc bài
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center">
          <a href="/knowledge" className="cta">
            <span>Xem tất cả bài viết</span>
            <svg width="18px" height="12px" viewBox="0 0 13 10">
              <path d="M1,5 L11,5"></path>
              <polyline points="8 1 12 5 8 9"></polyline>
            </svg>
          </a>
        </div>
      </div>

      {/* ==================== MODAL ĐỌC BÀI - CÓ FOCUS TRAP ==================== */}
      {isModalOpen && selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            ref={modalRef}
            className="bg-white w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col focus:outline-none"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 pr-8">{selectedArticle.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <span>{selectedArticle.date?.toLocaleDateString('vi-VN')}</span>
                  {selectedArticle.author && <span>• Bởi {selectedArticle.author}</span>}
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={closeModal}
                className="p-3 hover:bg-gray-200 rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <X size={28} />
              </button>
            </div>

            {/* Nội dung bài viết */}
            <div className="flex-1 overflow-y-auto p-8 prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedArticle.content || selectedArticle.excerpt}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          width: min(300px, 100%);
          margin: auto;
          background-color: #f4f5f2;
          text-align: center;
          border-top-left-radius: 4rem;
          border: 2px solid #fff;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }
        .card__body { padding: 2rem 1.5rem; max-width: 25ch; margin: auto; }
        .card__title { font-weight: 800; color: #121513; font-size: 1.25rem; margin-block: 1.5rem 0.75rem; }
        .card__paragraph { color: #303830; font-size: 0.875rem; }
        .card__ribbon {
          margin-top: 1.5rem;
          display: grid;
          place-items: center;
          height: 50px;
          background-color: #2f855a;
          position: relative;
          width: 110%;
          left: -5%;
          top: 10px;
          border-radius: 0 0 2rem 2rem;
        }
        .card__ribbon-label {
          display: block;
          width: 84px;
          aspect-ratio: 1/1;
          background-color: #fff;
          position: relative;
          transform: translateY(-50%);
          border-radius: 50%;
          border: 8px solid #2f855a;
          display: grid;
          place-items: center;
          font-weight: 900;
          line-height: 1;
          font-size: 1.5rem;
        }

        .cta {
          position: relative;
          margin: auto;
          padding: 12px 24px;
          transition: all 0.2s ease;
          border: none;
          background: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          overflow: hidden;
          border-radius: 50px;
        }
      `}</style>
    </section>
  )
}