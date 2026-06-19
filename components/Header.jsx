'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search, User, ChevronDown, Menu, ShoppingCart } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from './ui/sheet'

export default function Header({ setIsCartOpen, cartCount }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/`);
    }
  };
  // Lấy thông tin user & role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || '')
          }
        } catch (error) {
          console.error('Lỗi khi lấy role:', error)
        }
      } else {
        setUserRole('')
      }
    })
    return () => unsubscribe()
  }, [user])

  // Đăng xuất
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Đăng xuất thất bại:', error)
    }
  }

  // Điều hướng cuộn
  const handleNavigate = (e, href) => {
    e.preventDefault()
    if (href.startsWith('#')) {
      if (pathname !== '/') {
        router.push('/' + href)
      } else {
        const targetId = href.substring(1)
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } else {
      router.push(href)
    }
    if (isSheetOpen) setIsSheetOpen(false)
  }

  // Component menu điều hướng
  const NavLinks = ({ isMobile = false }) => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={isMobile ? 'w-full text-left text-gray-800' : 'bg-header-green-dark text-white'}>
            Trang chủ <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={isMobile ? 'bg-white text-gray-800' : 'bg-header-green-dark text-white'}>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '#home')} className="w-full text-left cursor-pointer">
            Trang chủ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={isMobile ? 'w-full text-left text-gray-800' : 'bg-header-green-dark text-white'}>
            Tiện ích chính <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={isMobile ? 'bg-white text-gray-800' : 'bg-header-green-dark text-white'}>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/crop-prediction')} className="cursor-pointer">Dự đoán năng suất</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/weather')} className="cursor-pointer">Dự báo thời tiết</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/farm-management')} className="cursor-pointer">Quản lý nông trại</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/ai-chat')} className="cursor-pointer">Hỗ trợ Chatbot</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={isMobile ? 'w-full text-left text-gray-800' : 'text-white'}>
            Diễn đàn <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={isMobile ? 'bg-white text-gray-800' : 'bg-header-green-dark text-white'}>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/forum')} className="cursor-pointer">Xem diễn đàn</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={isMobile ? 'w-full text-left text-gray-800' : 'text-white'}>
            Mua hàng <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={isMobile ? 'bg-white text-gray-800' : 'bg-header-green-dark text-white'}>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/products')} className="cursor-pointer">Sản phẩm</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={isMobile ? 'w-full text-left text-gray-800' : 'text-white'}>
            Thông tin <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={isMobile ? 'bg-white text-gray-800' : 'bg-header-green-dark text-white'}>
          <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/knowledge')} className="cursor-pointer">Tin tức / Hướng dẫn</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <header className="header-style">
      <div className="header-top-row">
    {/* Logo - Click để về trang chủ */}
    <button 
      onClick={() => router.push('/')}
      className="flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-xl p-1"
      aria-label="Về trang chủ Smart Agriculture"
    >
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="w-8 h-8" 
      />
      <span className="text-xl font-bold text-white">
        SMART AGRICULTURE
      </span>
    </button>

        {/* Desktop search */}
        <div className="search-input-container hidden md:flex">
          <Input
            type="text"
            placeholder="Nhập nội dung tìm kiếm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-black placeholder-gray-500"
          />
          <button
            type="button"
            aria-label="Tìm kiếm"
            className="search-icon w-5 h-5 cursor-pointer"
            onClick={handleSearch}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        {/* Cart desktop */}
        {['/products', '/store','/'].includes(pathname) && (
          <button
            type="button"
            aria-label="Mở giỏ hàng"
            className="relative hidden md:flex items-center cursor-pointer"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* User desktop */}
        <div className="user-auth-section hidden md:flex">
          <User className="w-6 h-6" />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white" aria-label="Tài khoản của tôi">
                  {user.displayName || (userRole === 'admin' ? 'Admin Panel' : 'Tài khoản')} <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-header-green-dark text-white">
                {userRole === 'admin' && (
                  <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/admin-dashboard')} className="cursor-pointer">
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={(e) => handleNavigate(e, '/profile')} className="cursor-pointer">
                  Tài khoản của tôi
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span>
              <button onClick={(e) => handleNavigate(e, '/login')}>Đăng nhập</button> / <button onClick={(e) => handleNavigate(e, '/register')}>Đăng ký</button>
            </span>
          )}
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white text-gray-800 w-3/4 sm:max-w-sm">
              <div className="flex flex-col gap-4 py-6">
                {/* Mobile search */}
                <div className="relative flex items-center w-full">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-black placeholder-gray-500"
                  />
                  <button
                    type="button"
                    aria-label="Tìm kiếm"
                    className="absolute right-3 text-gray-500 w-5 h-5 cursor-pointer"
                    onClick={handleSearch}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {/* Cart mobile */}
                {['/products', '/store'].includes(pathname) && (
                  <button
                    type="button"
                    aria-label="Mở giỏ hàng"
                    className="relative flex items-center cursor-pointer"
                    onClick={() => { setIsCartOpen(true); setIsSheetOpen(false) }}
                  >
                    <ShoppingCart className="w-6 h-6 text-gray-800" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* User mobile */}
                <div className="flex items-center gap-2 border-b pb-4 mb-4">
                  <User className="w-6 h-6" />
                  {user ? (
                    <span className="font-medium">
                      {user.displayName || (userRole === 'admin' ? 'Admin Panel' : 'Tài khoản')}
                      <SheetClose asChild>
                        <button onClick={handleLogout} className="ml-2 text-sm text-green-600">(Đăng xuất)</button>
                      </SheetClose>
                    </span>
                  ) : (
                    <span>
                      <SheetClose asChild><button onClick={(e) => handleNavigate(e, '/login')}>Đăng nhập</button></SheetClose> / <SheetClose asChild><button onClick={(e) => handleNavigate(e, '/register')}>Đăng ký</button></SheetClose>
                    </span>
                  )}
                </div>

                <NavLinks isMobile={true} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom nav desktop */}
      <div className="header-bottom-row hidden md:block">
        <nav>
          <ul className="flex justify-center gap-8">
            <NavLinks />
          </ul>
        </nav>
      </div>
    </header>
  )
}
