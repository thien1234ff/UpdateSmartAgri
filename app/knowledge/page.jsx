'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    getFirestore,
    collection,
    orderBy,
    query,
    onSnapshot,
    addDoc,
    serverTimestamp,
    where,
    Timestamp
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from "../../lib/firebase";
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
    Search, Filter, Calendar, Heart, Share2, BookOpen, Sparkles, 
    Clock, User, Grid, List, Plus, X, Save, FileText,
    AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Bookmark, MessageCircle, 
    ChevronDown, Info, Reply, Loader2 // Thêm Reply và Loader2, bỏ Eye và TrendingUp nếu không dùng
} from 'lucide-react';

// Loading Skeleton Component
const ArticleSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
        <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
    </div>
);

// Add Article Modal Component
// Add Article Modal Component - ĐÃ THÊM FOCUS TRAP
const AddArticleModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const modalRef = useRef(null);
    const closeButtonRef = useRef(null);
    const firstInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: 'cay-trong',
        author: '',
        tags: ''
    });
    const [errors, setErrors] = useState({});

    const categories = [
        { value: 'cay-trong', label: '🌾 Cây trồng' },
        { value: 'sau-benh', label: '🐛 Sâu bệnh' },
        { value: 'dat-dai', label: '🌍 Đất đai' },
        { value: 'ky-thuat', label: '⚙️ Kỹ thuật' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
        if (!formData.excerpt.trim()) newErrors.excerpt = 'Mô tả ngắn là bắt buộc';
        if (!formData.content.trim()) newErrors.content = 'Nội dung là bắt buộc';
        if (!formData.author.trim()) newErrors.author = 'Tác giả là bắt buộc';
        if (formData.title.length < 10) newErrors.title = 'Tiêu đề phải có ít nhất 10 ký tự';
        if (formData.excerpt.length < 20) newErrors.excerpt = 'Mô tả ngắn phải có ít nhất 20 ký tự';
        if (formData.content.length < 50) newErrors.content = 'Nội dung phải có ít nhất 50 ký tự';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        const articleData = {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            date: serverTimestamp(),
            views: 0,
            likes: 0
        };
        try {
            await onSubmit(articleData);
            setFormData({
                title: '',
                excerpt: '',
                content: '',
                category: 'cay-trong',
                author: '',
                tags: ''
            });
            setErrors({});
            onClose();
        } catch (error) {
            console.error('Error submitting article:', error);
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            excerpt: '',
            content: '',
            category: 'cay-trong',
            author: '',
            tags: ''
        });
        setErrors({});
        onClose();
    };

    // ==================== FOCUS TRAP ====================
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleClose();
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
    }, [isOpen]);

    // Tự động focus vào ô Tiêu đề khi mở modal
    useEffect(() => {
        if (isOpen && firstInputRef.current) {
            setTimeout(() => {
                firstInputRef.current.focus();
            }, 150);
        }
    }, [isOpen]);
    // ====================================================

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90svh] sm:h-auto sm:max-h-[90vh] max-h-[100svh] flex flex-col focus:outline-none"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Thêm bài viết mới</h2>
                        </div>
                        <button
                            ref={closeButtonRef}
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={isSubmitting}
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto grow pb-24">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề *</label>
                        <input
                            ref={firstInputRef}
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Nhập tiêu đề bài viết..."
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-colors ${
                                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            disabled={isSubmitting}
                        />
                        {errors.title && (
                            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.title}</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-colors"
                                disabled={isSubmitting}
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tác giả *</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                placeholder="Tên tác giả..."
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-colors ${
                                    errors.author ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                disabled={isSubmitting}
                            />
                            {errors.author && (
                                <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errors.author}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả ngắn *</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-colors resize-none ${
                                errors.excerpt ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            disabled={isSubmitting}
                        />
                        <div className="flex items-center justify-between mt-1">
                            {errors.excerpt ? (
                                <div className="flex items-center gap-1 text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errors.excerpt}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">{formData.excerpt.length}/200 ký tự</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung *</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Nội dung chi tiết của bài viết..."
                            rows={8}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-colors resize-none ${
                                errors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            disabled={isSubmitting}
                        />
                        {errors.content && (
                            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.content}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (tùy chọn)</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="Nhập các tag, cách nhau bởi dấu phẩy (vd: lúa, bền vững, khí hậu)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-colors"
                            disabled={isSubmitting}
                        />
                        <div className="text-sm text-gray-500 mt-1">Sử dụng dấu phẩy để phân tách các tag</div>
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-md ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu bài viết</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Success Toast Component
const SuccessToast = ({ show, message, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span>{message}</span>
                <button onClick={onClose} className="ml-2">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
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
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-green-100'
                }`}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            {getPageNumbers().map((page) => (
                <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                            ? 'bg-green-500 text-white'
                            : 'text-gray-600 hover:bg-green-100'
                    }`}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-green-100'
                }`}
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
};

// Enhanced Search and Filter Controls
const Controls = ({ 
    setSearchTerm, 
    setActiveCategory, 
    activeCategory, 
    setSortBy, 
    sortBy, 
    setViewMode, 
    viewMode,
    totalArticles,
    filteredCount,
    onAddArticle
}) => {
    const categories = [
        { name: '🌱 Tất cả', value: 'all', icon: '🌱' },
        { name: '🌾 Cây trồng', value: 'cay-trong', icon: '🌾' },
        { name: '🐛 Sâu bệnh', value: 'sau-benh', icon: '🐛' },
        { name: '🌍 Đất đai', value: 'dat-dai', icon: '🌍' },
        { name: '⚙️ Kỹ thuật', value: 'ky-thuat', icon: '⚙️' }
    ];

    const sortOptions = [
        { name: 'Mới nhất', value: 'date-desc' },
        { name: 'Cũ nhất', value: 'date-asc' },
        { name: 'A-Z', value: 'title-asc' },
        { name: 'Z-A', value: 'title-desc' }
    ];

    return (
        <section className="bg-gradient-to-r from-green-50 to-blue-50 p-6 sm:p-8 rounded-2xl shadow-lg mb-8 border border-green-100">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm bài viết, từ khóa..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-300 text-lg shadow-sm"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={onAddArticle}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Thêm bài viết</span>
                </button>
            </div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-green-600">{filteredCount}</span> / <span className="font-semibold">{totalArticles}</span> bài viết
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                            viewMode === 'grid' ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                            viewMode === 'list' ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6">
                {categories.map((category) => (
                    <button
                        key={category.value}
                        className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md ${
                            activeCategory === category.value 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                                : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => setActiveCategory(category.value)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 outline-none bg-white w-full sm:w-auto"
                >
                    {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.name}</option>
                    ))}
                </select>
            </div>
        </section>
    );
};

// Enhanced Article Card
const ArticleCard = ({ article, viewMode, user }) => {
    const [showModal, setShowModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleReadMore = (e) => {
        e.preventDefault();
        setShowModal(true);
        setIsClosing(false);
    };

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowModal(false);
            setIsClosing(false);
        }, 300);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleCloseModal();
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(`${article.title}\n${article.excerpt}\n${window.location.href}`);
            alert('Đã copy link bài viết!');
        }
    };

    // ===================== CommentSection =====================
    const CommentSection = ({ article, user }) => {
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    // Load comments khi mở modal và có articleId
    React.useEffect(() => {
        if (!article?.id) return;

        const commentsRef = collection(db, "comments");
        const q = query(
        commentsRef,
        where("articleId", "==", article.id),
        orderBy("serverTime", "desc")
        );

        const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const commentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            }));
            setComments(commentsData);
        },
        (error) => {
            console.error("❌ Lỗi khi tải bình luận:", error);
        }
        );

        return () => unsubscribe();
    }, [article?.id]);

    // Thêm bình luận
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setLoading(true);
        try {
        await addDoc(collection(db, "comments"), {
            articleId: article.id,
            author: user.displayName || user.email || "Người dùng ẩn danh",
            authorId: user.uid,
            avatar: user.displayName
            ? user.displayName.charAt(0).toUpperCase()
            : "U",
            content: newComment.trim(),
            clientTime: new Date(), // để hiển thị ngay
            serverTime: serverTimestamp(), // để sort chính xác
            likes: 0,
        });

        setNewComment("");
        } catch (error) {
        console.error("❌ Lỗi khi thêm bình luận:", error);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">
            Bình luận ({comments.length})
        </h3>

        {/* Danh sách bình luận */}
        {comments.length === 0 ? (
            <p className="text-gray-500">Chưa có bình luận nào.</p>
        ) : (
            <div className="space-y-4">
            {comments.map((comment) => (
                <div
                key={comment.id}
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-bold text-white">
                    {comment.avatar}
                    </div>
                    <div>
                    <p className="font-medium">{comment.author}</p>
                    <p className="text-gray-700">{comment.content}</p>
                    <span className="text-xs text-gray-400">
                        {comment.serverTime?.toDate?.().toLocaleString("vi-VN") ||
                        (comment.clientTime
                            ? new Date(comment.clientTime).toLocaleString("vi-VN")
                            : "Vừa xong")}
                    </span>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}

        {/* Form nhập bình luận */}
        {user ? (
            <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
            <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 border rounded-lg px-3 py-2"
                disabled={loading}
            />
            <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
                {loading ? "Đang gửi..." : "Gửi"}
            </button>
            </form>
        ) : (
            <p className="mt-4 text-sm text-gray-500">Vui lòng đăng nhập để bình luận.</p>
        )}
        </div>
    );
    };

    const ReadMoreModal = () => {
        if (!showModal) return null;

        return (
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
                    isClosing ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={handleBackdropClick}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
            >
                <div 
                    className={`bg-white rounded-2xl max-w-4xl w-full h-[90svh] sm:h-auto sm:max-h-[90vh] max-h-[100svh] overflow-hidden flex flex-col transform transition-all duration-300 ${
                        isClosing 
                            ? 'scale-95 opacity-0 translate-y-4' 
                            : 'scale-100 opacity-100 translate-y-0'
                    }`}
                >
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200 relative">
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-all duration-200 transform hover:rotate-90 hover:scale-110"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="pr-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-3 animate-fade-in">
                                {article.title}
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                                    <Calendar className="w-4 h-4 text-green-500" />
                                    <span>{article.dateFormatted}</span>
                                </div>
                                
                                {article.author && (
                                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span>{article.author}</span>
                                    </div>
                                )}
                                
                                {article.category && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        article.category === 'cay-trong' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        article.category === 'sau-benh' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        article.category === 'dat-dai' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                        'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                        {article.category === 'cay-trong' && 'Cây trồng'}
                                        {article.category === 'sau-benh' && 'Sâu bệnh'}
                                        {article.category === 'dat-dai' && 'Đất đai'}
                                        {article.category === 'ky-thuat' && 'Kỹ thuật'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pb-32 overscroll-contain" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
                        <div className="prose prose-lg max-w-none animate-slide-up">
                            <div className="mb-6">
                                <div className="h-2 w-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mb-4 animate-pulse"></div>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed text-lg mb-6 animate-fade-in delay-100">
                                {article.content || article.excerpt}
                            </p>
                            
                            <div className="flex items-center gap-4 my-8 animate-fade-in delay-200">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                            </div>

                            <CommentSection article={article} user={user} />
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md group"
                            >
                                <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                <span className="font-medium">Chia sẻ bài viết</span>
                            </button>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    @keyframes slideInRight {
                        from { opacity: 0; transform: translateX(20px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    
                    .animate-fade-in {
                        animation: fadeIn 0.6s ease-out forwards;
                    }
                    
                    .animate-slide-up {
                        animation: slideUp 0.8s ease-out forwards;
                    }
                    
                    .animate-slide-in-right {
                        animation: slideInRight 0.6s ease-out forwards;
                    }
                    
                    .delay-100 { animation-delay: 0.1s; }
                    .delay-200 { animation-delay: 0.2s; }
                    .delay-300 { animation-delay: 0.3s; }
                `}</style>
            </div>
        );
    };

    if (viewMode === 'list') {
        return (
            <>
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex gap-6 items-start group">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">{article.dateFormatted}</span>
                            {article.author && (
                                <>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{article.author}</span>
                                </>
                            )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors leading-tight">
                            {article.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {article.category && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        article.category === 'cay-trong' ? 'bg-green-100 text-green-700' :
                                        article.category === 'sau-benh' ? 'bg-red-100 text-red-700' :
                                        article.category === 'dat-dai' ? 'bg-gray-100 text-gray-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {article.category === 'cay-trong' && 'Cây trồng'}
                                        {article.category === 'sau-benh' && 'Sâu bệnh'}
                                        {article.category === 'dat-dai' && 'Đất đai'}
                                        {article.category === 'ky-thuat' && 'Kỹ thuật'}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                                    title="Chia sẻ bài viết"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleReadMore}
                                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md font-semibold"
                                >
                                    Đọc thêm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <ReadMoreModal />
            </>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden group">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <Calendar className="w-4 h-4" />
                            <span>{article.dateFormatted}</span>
                        </div>
                        
                        {article.category && (
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                                article.category === 'cay-trong' ? 'bg-green-100 text-green-700' :
                                article.category === 'sau-benh' ? 'bg-red-100 text-red-700' :
                                article.category === 'dat-dai' ? 'bg-gray-100 text-gray-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {article.category === 'cay-trong' && 'Cây trồng'}
                                {article.category === 'sau-benh' && 'Sâu bệnh'}
                                {article.category === 'dat-dai' && 'Đất đai'}
                                {article.category === 'ky-thuat' && 'Kỹ thuật'}
                            </span>
                        )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                        {article.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{article.excerpt}</p>
                    
                    {article.author && (
                        <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {article.author.charAt(0).toUpperCase()}
                            </div>
                            <span>Bởi {article.author}</span>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 transform hover:scale-105"
                            title="Chia sẻ bài viết"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Chia sẻ</span>
                        </button>
                        
                        <button
                            onClick={handleReadMore}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md font-semibold"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Đọc thêm</span>
                        </button>
                    </div>
                </div>
            </div>
            <ReadMoreModal />
        </>
    );
};


// Articles List Component
const Articles = ({ articles, loading, viewMode, user }) => {
    if (loading) {
        return (
            <section className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
            }>
                {[...Array(6)].map((_, index) => (
                    <ArticleSkeleton key={index} />
                ))}
            </section>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy bài viết</h3>
                <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
        );
    }

    return (
        <section className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
            : "space-y-4"
        }>
            {articles.map((article) => (
                <ArticleCard key={article.id} article={article} viewMode={viewMode} user={user} />
            ))}
        </section>
    );
};

// Main App Component
const App = () => {
    const [articles, setArticles] = useState([]);
    const [allArticles, setAllArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ARTICLES_PER_PAGE = 6;
    const [user, setUser] = useState(null);
    // Initialize Firebase Auth
    const auth = getAuth();

        // Listen for authentication state changes
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
            });
            return () => unsubscribe();
        }, [auth]);
    // Load articles from Firebase
useEffect(() => {
    const articlesRef = collection(db, 'articles');
    const q = query(articlesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedArticles = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Kiểm tra và gán date, sử dụng Timestamp nếu hợp lệ
            const date = data.date instanceof Timestamp ? data.date : serverTimestamp();
            // Định nghĩa dateFormatted dựa trên date hợp lệ
            const dateFormatted = date.toDate ? date.toDate().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A';
            fetchedArticles.push({ 
                id: doc.id, 
                ...data, 
                date, // Lưu Timestamp gốc
                dateFormatted // Lưu chuỗi định dạng để hiển thị
            });
        });
        setAllArticles(fetchedArticles);
        setLoading(false);
    }, (error) => {
        console.error("Lỗi khi tải tài liệu từ Firestore: ", error);
        setArticles([]);
        setLoading(false);
    });

    return () => unsubscribe();
}, []);

    // Handle adding new article
    const handleAddArticle = async (articleData) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'articles'), articleData);
            setShowSuccessToast(true);
            setCurrentPage(1); // Reset to first page after adding a new article
        } catch (error) {
            console.error('Error adding article: ', error);
            alert('Có lỗi xảy ra khi thêm bài viết. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

// Trong useMemo để lọc và sắp xếp bài viết
const filteredAndSortedArticles = useMemo(() => {
    let filtered = allArticles;

    if (activeCategory !== 'all') {
        filtered = filtered.filter(article => article.category === activeCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    filtered.sort((a, b) => {
        const aDate = a.date?.toDate?.() || new Date(0); // Sử dụng Date(0) làm giá trị mặc định (thời gian nhỏ nhất)
        const bDate = b.date?.toDate?.() || new Date(0); // Sử dụng Date(0) làm giá trị mặc định
        switch (sortBy) {
            case 'date-desc':
                return bDate - aDate;
            case 'date-asc':
                return aDate - bDate;
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            default:
                return 0;
        }
    });

    console.log("Sorted articles:", filtered); // Thêm log để kiểm tra thứ tự
    return filtered;
}, [allArticles, activeCategory, searchTerm, sortBy]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedArticles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = filteredAndSortedArticles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE
    );

    useEffect(() => {
        setArticles(paginatedArticles);
    }, [filteredAndSortedArticles, currentPage]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            <Header user={user} />
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">       
                <main>
                    <section className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
                            <Sparkles className="w-10 h-10 text-green-500" />
                            Kiến thức Nông nghiệp
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Khám phá những kiến thức và kỹ thuật mới nhất trong lĩnh vực nông nghiệp
                        </p>
                    </section>

                    <Controls
                        setSearchTerm={setSearchTerm}
                        setActiveCategory={setActiveCategory}
                        activeCategory={activeCategory}
                        setSortBy={setSortBy}
                        sortBy={sortBy}
                        setViewMode={setViewMode}
                        viewMode={viewMode}
                        totalArticles={allArticles.length}
                        filteredCount={filteredAndSortedArticles.length}
                        onAddArticle={() => setShowAddModal(true)}
                    />
                    
                    <Articles 
                    articles={paginatedArticles} 
                    loading={loading}
                    viewMode={viewMode}
                    user={user}
                    />
                    
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            setCurrentPage={setCurrentPage}
                        />
                    )}
                </main>   
            </div>

            <AddArticleModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddArticle} 
                isSubmitting={isSubmitting}
            />

            <SuccessToast
                show={showSuccessToast}
                message="Bài viết đã được thêm thành công!"
                onClose={() => setShowSuccessToast(false)}
            />

            <Footer />
        </div>
    );
};

export default App;