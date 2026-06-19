import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { AccessibilityAnnouncementProvider } from '../components/accessibility/AccessibilityAnnouncementProvider';
import { AccessibilityButton } from '../components/accessibility/AccessibilityButton';
import { AccessibilityPanel } from '../components/accessibility/AccessibilityPanel';
import { ToastContainer } from '../components/ui/ToastContainer';

export const metadata = {
  title: 'Smart Agriculture - Nông nghiệp thông minh',
  description: 'Giải pháp nông nghiệp thông minh hàng đầu Việt Nam',
  icons: {
    icon: '/logo.png', // hoặc .ico
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <AccessibilityAnnouncementProvider>
            <CartProvider>
              <AccessibilityProvider>
                {/* Skip link for keyboard/screen reader users */}
                <a
                  href="#main-content"
                  className="skip-link"
                >
                  Bỏ qua đến nội dung chính
                </a>
                <script dangerouslySetInnerHTML={{ __html: `
                  document.addEventListener('focus', function(e) {
                    if (e.target && e.target.classList && e.target.classList.contains('skip-link')) {
                      e.target.setAttribute('href', window.location.pathname === '/' ? '#products' : '#main-content');
                    }
                  }, true);
                ` }} />

                <main id="main-content" tabIndex={-1}>
                  {children}
                </main>

                {/* Floating Accessibility Assistant */}
                <AccessibilityButton />
                <AccessibilityPanel />

                {/* Visual Toast Notifications */}
                <ToastContainer />
              </AccessibilityProvider>
            </CartProvider>
          </AccessibilityAnnouncementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}