// components/ArticleCardNew.jsx
'use client'

export default function ArticleCardNew({ articles = [] }) {
  // Nếu articles rỗng hoặc không phải array
  if (!Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Không có bài viết nào
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {articles.map((article, index) => (
        <div key={article.id ?? index} className="card relative">
          {/* Thân card */}
          <div className="card__body">
            <div className="card__icon">
              <svg
                height="32"
                width="32"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="card__title">{article.title || 'Không có tiêu đề'}</p>
            <p className="card__paragraph">
              {article.excerpt || article.content?.slice(0, 100) + '...' || 'Không có nội dung'}
            </p>
          </div>

          {/* Ribbon hiển thị số thứ tự */}
          <div className="card__ribbon">
            <label className="card__ribbon-label">
              {index + 1}
            </label>
          </div>
        </div>
      ))}

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
        }
        .card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0px 6px 16px rgba(0,0,0,0.15);
        }
        .card::before {
          content: "";
          position: absolute;
          height: 30px;
          width: 120px;
          background-color: #2f855a;
          top: 32px;
          right: -2.5px;
          clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
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
        .card__ribbon::after, .card__ribbon::before {
          content: "";
          position: absolute;
          width: 20px;
          aspect-ratio: 1/1;
          bottom: 100%;
          z-index: -2;
          background-color: #22543d;
        }
        .card__ribbon::before { left: 0; transform-origin: left bottom; transform: rotate(45deg); }
        .card__ribbon::after { right: 0; transform-origin: right bottom; transform: rotate(-45deg); }
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
        .card__ribbon-label::before,
        .card__ribbon-label::after {
          content: "";
          position: absolute;
          width: 25px;
          height: 25px;
          bottom: 50%;
        }
        .card__ribbon-label::before {
          right: calc(100% + 4px);
          border-bottom-right-radius: 20px;
          box-shadow: 5px 5px 0 #2f855a;
        }
        .card__ribbon-label::after {
          left: calc(100% + 4px);
          border-bottom-left-radius: 20px;
          box-shadow: -5px 5px 0 #2f855a;
        }
      `}</style>
    </div>
  )
}
