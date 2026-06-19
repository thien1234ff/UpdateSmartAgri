'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  Leaf, Search, Plus, X, Clock, MessageSquare, ChevronLeft, ChevronRight,
  ThumbsUp, Reply, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
// New Post Modal Component
// New Post Modal Component - ĐÃ THÊM FOCUS TRAP
const NewPostModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: ''
  });

  const categories = [
    { value: 'lúa', label: 'Cây lúa' },
    { value: 'cây ăn quả', label: 'Cây ăn quả' },
    { value: 'rau màu', label: 'Rau màu' },
    { value: 'thủy canh', label: 'Thủy canh' },
    { value: 'phân bón', label: 'Phân bón' },
    { value: 'tưới tiêu', label: 'Tưới tiêu' },
    { value: 'khác', label: 'Khác' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category || !formData.content.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    onSubmit(formData);
  };

  // ==================== FOCUS TRAP + ESC ====================
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Tự động focus vào ô Tiêu đề khi mở modal
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current.focus();
      }, 150);
    }
  }, [isOpen]);
  // =========================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[90svh] sm:h-auto sm:max-h-[90vh] max-h-[100svh] flex flex-col focus:outline-none"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 overflow-y-auto grow pb-28">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-green-800">Đăng bài viết mới</h3>
            <button 
              ref={closeButtonRef}
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="postTitle" className="block text-gray-700 font-medium mb-2">Tiêu đề bài viết</label>
              <input
                ref={firstInputRef}   // ← Tự động focus vào đây
                type="text"
                id="postTitle"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nhập tiêu đề bài viết của bạn"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="postCategory" className="block text-gray-700 font-medium mb-2">Chọn chủ đề</label>
              <select
                id="postCategory"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">-- Chọn chủ đề --</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="postContent" className="block text-gray-700 font-medium mb-2">Nội dung bài viết</label>
              <textarea
                id="postContent"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Chia sẻ kinh nghiệm, thắc mắc của bạn với cộng đồng..."
                required
              />
            </div>
            <div className="flex justify-end space-x-3 sticky bottom-0 mt-6 pt-3 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang đăng...
                  </>
                ) : (
                  'Đăng bài'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Comment System Component
  const CommentSystem = ({ postId, user, authorAvatarMap = {}, authorNameAvatarMap = {} }) => {
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const textareaRef = useRef(null);
  const replyTextareaRefs = useRef({});

  useEffect(() => {
    if (!postId) return;
    const postRef = doc(db, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const post = docSnap.data();
        const sortedComments = (post.comments || []).sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate() || new Date();
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate() || new Date();
          return dateB - dateA; // Sắp xếp từ mới đến cũ
        });
        setComments(sortedComments);
      }
    }, (error) => {
      console.error('Lỗi khi tải bình luận:', error);
      showToast('Lỗi khi tải bình luận!', 'error');
    });
    return () => unsubscribe();
  }, [postId]);

  const autoResizeTextarea = (ref) => {
    const textarea = ref.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const sanitizeContent = (content) => {
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const formatTimeAgo = (date) => {
    const parsedDate = date instanceof Date ? date : date?.toDate() || new Date();
    const now = new Date();
    const diffInSeconds = Math.floor((now - parsedDate) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return parsedDate.toLocaleDateString('vi-VN');
  };

  const handleCommentSubmit = async () => {
    if (isSubmitting || !user) {
      showToast('Vui lòng đăng nhập trước khi bình luận!', 'error');
      return;
    }

    const content = commentContent.trim();
    if (content.length < 5 || content.length > 1000) {
      showToast('Bình luận phải từ 5 đến 1000 ký tự!', 'error');
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) throw new Error('Bài viết không tồn tại!');

      const currentComments = postSnap.data().comments || [];
      const newComment = {
        id: uuidv4(),
        content: sanitizeContent(content),
        author: user.displayName || user.email,
        authorId: user.uid,
        authorAvatar: user.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg',
        createdAt: new Date(),
        likes: 0,
        likedBy: [],
        replies: []
      };

      await updateDoc(postRef, {
        comments: [...currentComments, newComment],
        commentsCount: currentComments.length + 1,
        lastActivity: serverTimestamp()
      });

      showToast('Bình luận đã được đăng!', 'success');
      setCommentContent('');
      autoResizeTextarea(textareaRef);
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi đăng bình luận: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleReplySubmit = async (commentId) => {
    if (isSubmitting || !user) {
      showToast('Vui lòng đăng nhập trước khi trả lời!', 'error');
      return;
    }

    const content = replyContent[commentId]?.trim();
    if (content.length < 5 || content.length > 1000) {
      showToast('Trả lời phải từ 5 đến 1000 ký tự!', 'error');
      replyTextareaRefs.current[commentId]?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) throw new Error('Bài viết không tồn tại!');

      const currentComments = postSnap.data().comments || [];
      const commentIndex = currentComments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) throw new Error('Không tìm thấy bình luận để trả lời!');

      const replyData = {
        id: uuidv4(),
        content: sanitizeContent(content),
        author: user.displayName || user.email,
        authorId: user.uid,
        authorAvatar: user.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg',
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      };

      const replies = Array.isArray(currentComments[commentIndex].replies)
        ? currentComments[commentIndex].replies
        : [];

      currentComments[commentIndex].replies = [...replies, replyData];

      const totalCount = currentComments.reduce(
        (sum, c) => sum + 1 + (c.replies?.length || 0),
        0
      );

      await updateDoc(postRef, {
        comments: currentComments,
        commentsCount: totalCount,
        lastActivity: serverTimestamp()
      });

      showToast('Trả lời đã được đăng!', 'success');
      setReplyContent(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
      autoResizeTextarea(replyTextareaRefs.current[commentId]);
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi đăng trả lời: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLikeComment = async ({ commentId, replyId = null }) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để thích bình luận!', 'error');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) throw new Error('Bài viết không tồn tại!');

      const currentComments = postSnap.data().comments || [];
      const commentIndex = currentComments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) throw new Error('Không tìm thấy bình luận!');

      let target = currentComments[commentIndex];
      if (replyId) {
        const replyIndex = target.replies.findIndex(r => r.id === replyId);
        if (replyIndex === -1) throw new Error('Không tìm thấy phản hồi!');
        target = target.replies[replyIndex];
      }

      const userId = user.uid;
      const hasLiked = target.likedBy?.includes(userId);
      target.likes = hasLiked ? target.likes - 1 : target.likes + 1;
      target.likedBy = hasLiked
        ? target.likedBy.filter(id => id !== userId)
        : [...(target.likedBy || []), userId];

      // Gắn lại dữ liệu
      if (replyId) {
        currentComments[commentIndex].replies = currentComments[commentIndex].replies.map(r =>
          r.id === replyId ? target : r
        );
      } else {
        currentComments[commentIndex] = target;
      }

      await updateDoc(postRef, {
        comments: currentComments,
        lastActivity: serverTimestamp()
      });

      showToast(hasLiked ? 'Đã bỏ thích bình luận!' : 'Đã thích bình luận!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi thích bình luận!', 'error');
    }
  };


  const handleDeleteComment = async ({ commentId, replyId = null }) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để xóa bình luận!', 'error');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) throw new Error('Bài viết không tồn tại!');

      let updatedComments = postSnap.data().comments || [];
      const commentIndex = updatedComments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) throw new Error('Không tìm thấy bình luận!');

      if (replyId) {
        updatedComments[commentIndex].replies = updatedComments[commentIndex].replies.filter(
          r => r.id !== replyId
        );
      } else {
        updatedComments = updatedComments.filter(c => c.id !== commentId);
      }

      const totalCount = updatedComments.reduce(
        (sum, c) => sum + 1 + (c.replies?.length || 0),
        0
      );

      await updateDoc(postRef, {
        comments: updatedComments,
        commentsCount: totalCount,
        lastActivity: serverTimestamp()
      });

      showToast('Bình luận đã được xóa!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi xóa bình luận!', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? '✔️' : '⚠️';

    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${icon}</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };


  return (
    <div className="mb-6">
      <h4 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2" /> Bình luận
        <span className="text-gray-500 text-base ml-2">({comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)})</span>
      </h4>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-start mb-4">
          <img
            src={user?.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg'}
            alt="User avatar"
            className="w-10 h-10 rounded-full mr-3 border-2 border-green-200"
          />
          <div className="flex-grow">
            <textarea
              id="commentContent"
              ref={textareaRef}
              value={commentContent}
              onChange={(e) => {
                setCommentContent(e.target.value);
                autoResizeTextarea(textareaRef);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Viết bình luận của bạn..."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleCommentSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang đăng...
              </>
            ) : (
              'Đăng bình luận'
            )}
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="text-gray-400 text-4xl mb-4 mx-auto" />
            <p className="text-gray-500">Chưa có bình luận nào.</p>
            <p className="text-gray-400 text-sm">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div
              key={index}
              className="comment-item bg-white rounded-lg p-4 border border-gray-200 shadow-sm opacity-0 animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-3">
                <img
                  src={(comment.authorId && authorAvatarMap[comment.authorId]) || authorNameAvatarMap[comment.author] || comment.authorAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border-2 border-green-200 flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-semibold text-green-700 text-sm">{comment.author}</h5>
                      {user && comment.authorId === user.uid && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Bạn</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                      {user && comment.authorId === user.uid && (
                        <button
                          onClick={() => handleDeleteComment({ commentId: comment.id })}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className="mt-2 text-gray-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: comment.content
                        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
                        .replace(/\n/g, '<br>')
                    }}
                  />
                  <div className="mt-3 flex items-center space-x-4">
                    <button
                      onClick={() => handleLikeComment({ commentId: comment.id })}
                      className={`flex items-center space-x-1 text-xs ${
                        user && comment.likedBy?.includes(user.uid) ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{comment.likes || 0}</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-gray-500 hover:text-green-600 text-xs"
                    >
                      <Reply className="w-4 h-4 inline mr-1" /> Trả lời
                    </button>
                  </div>
                  {replyingTo === comment.id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start mb-4">
                        <img
                          src={user?.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                          alt="User"
                          className="w-8 h-8 rounded-full mr-3 border-2 border-green-200"
                        />
                        <div className="flex-grow">
                          <textarea
                            ref={el => (replyTextareaRefs.current[comment.id] = el)}
                            value={replyContent[comment.id] || ''}
                            onChange={(e) => {
                              setReplyContent(prev => ({ ...prev, [comment.id]: e.target.value }));
                              autoResizeTextarea(replyTextareaRefs.current[comment.id]);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                handleReplySubmit(comment.id);
                              }
                            }}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            placeholder="Viết trả lời của bạn..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                          disabled={isSubmitting}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Đang đăng...
                            </>
                          ) : (
                            'Gửi trả lời'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {(comment.replies || []).length > 0 && (
                    <div className="mt-4 ml-8 space-y-3">
                      {comment.replies.map((reply, replyIndex) => (
                        <div
                          key={reply.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start space-x-2">
                            <img
                              src={(reply.authorId && authorAvatarMap[reply.authorId]) || authorNameAvatarMap[reply.author] || reply.authorAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                              alt="User Avatar"
                              className="w-8 h-8 rounded-full border-2 border-green-200 flex-shrink-0"
                            />
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-semibold text-green-700 text-xs">{reply.author}</h5>
                                  {user && reply.authorId === user.uid && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Bạn</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500 text-xs">{formatTimeAgo(reply.createdAt)}</span>
                                  {user && reply.authorId === user.uid && (
                                    <button
                                      onClick={() => handleDeleteComment({ commentId: comment.id, replyId: reply.id })}
                                      className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div
                                className="mt-1 text-gray-700 text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: reply.content
                                    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
                                    .replace(/\n/g, '<br>')
                                }}
                              />
                              <div className="mt-2 flex items-center space-x-4">
                                <button
                                  onClick={() => handleLikeComment({ commentId: comment.id, replyId: reply.id })}
                                  className={`flex items-center space-x-1 text-xs ${
                                    user && reply.likedBy?.includes(user.uid) ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                                  }`}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>{reply.likes || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Post Detail Modal Component
// Post Detail Modal Component - ĐÃ SỬA HOOKS
const PostDetailModal = ({ isOpen, onClose, post, postId, user, authorAvatarMap = {}, authorNameAvatarMap = {} }) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Tất cả hooks phải luôn được gọi ở mức cao nhất
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
          if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const formatTimeAgo = (date) => {
    const parsedDate = date instanceof Date ? date : date?.toDate() || new Date();
    const now = new Date();
    const diffInSeconds = Math.floor((now - parsedDate) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return parsedDate.toLocaleDateString('vi-VN');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto focus:outline-none"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-green-800">{post.title}</h3>
            <button 
              ref={closeButtonRef}
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-start mb-4">
            <img
              src={(post.authorId && authorAvatarMap[post.authorId]) || authorNameAvatarMap[post.author] || post.authorAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
              alt="User"
              className="w-12 h-12 rounded-full mr-4 border-2 border-green-200"
            />
            <div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span className="mr-3">Bởi <span className="text-green-600">{post.author}</span></span>
                <span><Clock className="w-4 h-4 inline mr-1" /> {formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="text-gray-700 mb-6 border-b border-gray-200 pb-6">{post.content}</div>
          <CommentSystem postId={postId} user={user} authorAvatarMap={authorAvatarMap} authorNameAvatarMap={authorNameAvatarMap} />
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, id, onViewDetails, authorAvatar, fallbackNameAvatar }) => {
  const categoryColorMap = {
    'lúa': 'green',
    'cây ăn quả': 'blue',
    'rau màu': 'yellow',
    'thủy canh': 'purple',
    'phân bón': 'red',
    'tưới tiêu': 'indigo',
    'khác': 'gray'
  };

  const formatTimeAgo = (date) => {
    const parsedDate = date instanceof Date ? date : date?.toDate() || new Date();
    const now = new Date();
    const diffInSeconds = Math.floor((now - parsedDate) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return parsedDate.toLocaleDateString('vi-VN');
  };

  const color = categoryColorMap[post.category] || 'gray';

  return (
    <article className="post-card bg-white rounded-xl shadow-md p-6 transition duration-300" data-id={id}>
      <div className="flex items-start mb-4">
        <img
          src={authorAvatar || fallbackNameAvatar || post.authorAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
          alt="User"
          className="avatar w-12 h-12 rounded-full mr-4 border-2 border-green-200"
        />
        <div className="flex-grow">
          <h4 className="font-bold text-lg text-green-800">{post.title}</h4>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="mr-3">Bởi <a href="#" className="text-green-600 hover:underline">{post.author}</a></span>
            <span className="mr-3"><Clock className="w-4 h-4 inline mr-1" /> {formatTimeAgo(post.createdAt)}</span>
            <span><MessageSquare className="w-4 h-4 inline mr-1" /> <span className="comment-count">{post.commentsCount || 0}</span> bình luận</span>
          </div>
        </div>
      </div>
      <p className="text-gray-700 mb-4">{post.content}</p>
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <span className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm`}>{post.category}</span>
        </div>
        <button
          onClick={() => onViewDetails(id)}
          className="text-green-600 hover:text-green-800 font-medium"
        >
          Đọc tiếp →
        </button>
      </div>
    </article>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="mt-8 flex justify-center">
      <nav className="flex items-center space-x-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg border border-gray-300 ${
            currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-lg border border-gray-300 ${
              currentPage === page ? 'bg-green-600 text-white' : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
        {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-2">...</span>}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg border border-gray-300 ${
            currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};

// Main App Component
const App = () => {
  const [posts, setPosts] = useState([]);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Mới nhất');
  const [activeCategory, setActiveCategory] = useState(null); // null đại diện cho "Tất cả"
  const [popularTopics, setPopularTopics] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [stats, setStats] = useState({ posts: 0, comments: 0, members: 0, topics: 0 });
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [authorAvatarMap, setAuthorAvatarMap] = useState({});
  const [authorNameAvatarMap, setAuthorNameAvatarMap] = useState({});
  const router = useRouter();
  const POSTS_PER_PAGE = 6;

  const categories = [
    { value: 'lúa', label: 'Cây lúa' },
    { value: 'cây ăn quả', label: 'Cây ăn quả' },
    { value: 'rau màu', label: 'Rau màu' },
    { value: 'thủy canh', label: 'Thủy canh' },
    { value: 'phân bón', label: 'Phân bón' },
    { value: 'tưới tiêu', label: 'Tưới tiêu' },
    { value: 'khác', label: 'Khác' }
  ];

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = [];
      snapshot.forEach(doc => {
        fetchedPosts.push({ id: doc.id, ...doc.data() });
      });
      setPosts(fetchedPosts);
    }, (error) => {
      console.error('Lỗi khi tải bài viết:', error);
      alert('Lỗi khi tải bài viết!');
    });
    return () => unsubscribe();
  }, []);

  // Load current user's profile (to get latest avatar from Firestore)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setCurrentUserProfile(snap.data());
          } else {
            setCurrentUserProfile(null);
          }
        } catch (e) {
          console.error('Không thể tải hồ sơ người dùng:', e);
          setCurrentUserProfile(null);
        }
      } else {
        setCurrentUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // Fetch avatars for authors appearing in current posts (fallback when post lacks authorAvatar or is outdated)
  useEffect(() => {
    const loadAuthorAvatars = async () => {
      const ids = Array.from(new Set(posts.map(p => p.authorId).filter(Boolean)));
      const names = Array.from(new Set(posts.map(p => p.author).filter(Boolean)));
      if (ids.length === 0 && names.length === 0) return;
      try {
        // Fetch by UID
        if (ids.length > 0) {
          const entries = await Promise.all(ids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'users', uid));
              const url = snap.exists() ? (snap.data().photoURL || '') : '';
              return [uid, url];
            } catch {
              return [uid, ''];
            }
          }));
          const map = entries.reduce((acc, [uid, url]) => {
            acc[uid] = url;
            return acc;
          }, {});
          setAuthorAvatarMap(map);
        }

        // Fetch by displayName or email (best-effort for legacy posts)
        const nameEntries = await Promise.all(names.map(async (name) => {
          try {
            let avatarUrl = '';
            const q1 = query(collection(db, 'users'), where('displayName', '==', name), limit(1));
            const snap1 = await getDocs(q1);
            if (!snap1.empty) {
              avatarUrl = snap1.docs[0].data().photoURL || '';
            } else {
              const q2 = query(collection(db, 'users'), where('email', '==', name), limit(1));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                avatarUrl = snap2.docs[0].data().photoURL || '';
              }
            }
            return [name, avatarUrl];
          } catch {
            return [name, ''];
          }
        }));
        const nameMap = nameEntries.reduce((acc, [name, url]) => {
          acc[name] = url;
          return acc;
        }, {});
        setAuthorNameAvatarMap(nameMap);
      } catch (e) {
        console.error('Không thể tải avatar tác giả:', e);
      }
    };
    loadAuthorAvatars();
  }, [posts]);

  useEffect(() => {
    if (posts.length === 0) return;

    // Tính toán chủ đề nổi bật
    const topicCounts = posts.reduce((acc, post) => {
      const cat = post.category;
      if (cat) {
        acc[cat] = (acc[cat] || 0) + 1;
      }
      return acc;
    }, {});
    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        label: categories.find(c => c.value === category)?.label || category
      }));
    setPopularTopics([{ category: null, label: 'Tất cả', count: posts.length }, ...sortedTopics]);

    // Tính toán thành viên tích cực
    const memberCounts = posts.reduce((acc, post) => {
      const author = post.author;
      if (author) {
        if (!acc[author]) {
          acc[author] = { count: 0, avatar: post.authorAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg' };
        }
        acc[author].count += 1;
      }
      return acc;
    }, {});
    const sortedMembers = Object.entries(memberCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([name, { count, avatar }]) => ({ name, posts: count, img: avatar }));
    setActiveMembers(sortedMembers);

    // Tính toán thống kê
    const totalPosts = posts.length;
    const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
    const uniqueMembers = new Set(posts.map(p => p.author)).size;
    const uniqueTopics = new Set(posts.map(p => p.category)).size;
    setStats({ posts: totalPosts, comments: totalComments, members: uniqueMembers, topics: uniqueTopics });
  }, [posts]);

  const handleAddPost = async (formData) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Vui lòng đăng nhập trước khi đăng bài!');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        ...formData,
        createdAt: serverTimestamp(),
        author: user.displayName || user.email,
        authorId: user.uid,
        authorAvatar: (currentUserProfile?.photoURL) || user.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg',
        comments: [],
        commentsCount: 0,
        lastActivity: serverTimestamp()
      });
      alert('Bài viết đã được lưu!');
      setNewPostModalOpen(false);
      setCurrentPage(1);
    } catch (error) {
      console.error('Lỗi khi đăng bài:', error);
      alert('Lỗi khi lưu bài viết!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPostDetail = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        setSelectedPost({ id: postSnap.id, ...postSnap.data() });
        setPostDetailModalOpen(true);
      } else {
        alert('Bài viết không tồn tại!');
      }
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
      alert('Lỗi khi tải bài viết!');
    }
  };

  // Search and Sort Logic
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeCategory ? post.category === activeCategory : true)
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'Mới nhất') {
      return (b.createdAt?.toDate() || new Date()) - (a.createdAt?.toDate() || new Date());
    } else if (sortBy === 'Phổ biến') {
      return (b.commentsCount || 0) - (a.commentsCount || 0);
    } else if (sortBy === 'Nhiều bình luận') {
      return (b.commentsCount || 0) - (a.commentsCount || 0);
    }
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  return (
    <div className="gradient-bg min-h-screen">
      <style>{`
        .gradient-bg {
          background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
        }
        .post-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .category-tag {
          transition: all 0.3s ease;
        }
        .category-tag:hover {
          transform: scale(1.05);
        }
        .avatar {
          transition: transform 0.3s ease;
        }
        .avatar:hover {
          transform: scale(1.1);
        }
        .comment-item {
          transition: all 0.3s ease;
        }
        .comment-item:hover {
          border-color: #10b981;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-green-800 mb-4">Diễn đàn Cộng đồng Nông dân</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Chia sẻ kinh nghiệm, học hỏi phương pháp canh tác mới và kết nối với cộng đồng nông dân thông minh
          </p>
        </section>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết theo tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          </div>
          <button
            onClick={() => {
              if (!auth.currentUser) {
                alert('Vui lòng đăng nhập trước khi đăng bài!');
                router.push('/login');
                return;
              }
              setNewPostModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" /> Đăng bài mới
          </button>
        </div>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-green-800">Chủ đề phổ biến</h3>
          <div className="flex flex-wrap gap-3">
            {popularTopics.map(topic => (
              <button
                key={topic.category || 'all'}
                onClick={() => setActiveCategory(topic.category === activeCategory ? null : topic.category)}
                className={`category-tag px-4 py-2 rounded-full hover:bg-green-200 transition ${
                  activeCategory === topic.category ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-green-800">Bài viết mới nhất</h3>
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Mới nhất</option>
                  <option>Phổ biến</option>
                  <option>Nhiều bình luận</option>
                </select>
              </div>
            </div>
            <div className="space-y-6">
              {paginatedPosts.length === 0 ? (
                <p className="text-gray-600">Chưa có bài viết nào.</p>
              ) : (
                paginatedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    id={post.id}
                    onViewDetails={openPostDetail}
                    authorAvatar={authorAvatarMap[post.authorId] || null}
                    fallbackNameAvatar={authorNameAvatarMap[post.author] || null}
                  />
                ))
              )}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            )}
          </div>
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-800">Chủ đề nổi bật</h3>
              <div className="space-y-3">
                {popularTopics.map(topic => (
                  <button
                    key={topic.category || 'all'}
                    onClick={() => setActiveCategory(topic.category === activeCategory ? null : topic.category)}
                    className={`flex items-center justify-between w-full hover:text-green-600 transition ${
                      activeCategory === topic.category ? 'text-green-600 font-medium' : ''
                    }`}
                  >
                    <span>{topic.label}</span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{topic.count} bài</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-800">Thành viên tích cực</h3>
              <div className="space-y-4">
                {activeMembers.map(member => (
                  <div key={member.name} className="flex items-center">
                    <img src={member.img} alt="User" className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-500">{member.posts} bài viết</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-800">Thống kê diễn đàn</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{stats.posts}</div>
                  <div className="text-sm text-gray-600">Bài viết</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{stats.comments}</div>
                  <div className="text-sm text-gray-600">Bình luận</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-700">{stats.members}</div>
                  <div className="text-sm text-gray-600">Thành viên</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.topics}</div>
                  <div className="text-sm text-gray-600">Chủ đề</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <NewPostModal
        isOpen={newPostModalOpen}
        onClose={() => {
          setNewPostModalOpen(false);
          document.body.style.overflow = 'auto';
        }}
        onSubmit={handleAddPost}
        isSubmitting={isSubmitting}
      />
      <PostDetailModal
        isOpen={postDetailModalOpen}
        onClose={() => {
          setPostDetailModalOpen(false);
          document.body.style.overflow = 'auto';
        }}
        post={selectedPost}
        postId={selectedPost?.id}
        user={auth.currentUser
          ? {
              ...auth.currentUser,
              photoURL: (currentUserProfile?.photoURL) || auth.currentUser?.photoURL || null
            }
          : null}
        authorAvatarMap={authorAvatarMap}
        authorNameAvatarMap={authorNameAvatarMap}
      />
      <Footer />
    </div>
  );
};

export default App;