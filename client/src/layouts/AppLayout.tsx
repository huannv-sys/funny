import { PropsWithChildren, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { useMediaQuery } from "@/hooks/use-mobile";
import Footer from "@/components/dashboard/Footer";

interface AppLayoutProps extends PropsWithChildren {
  showSidebar?: boolean;
}

const SIDEBAR_STATE_KEY = "sidebar_collapsed";

export default function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  // Giá trị mặc định là sidebar thu gọn (true = thu gọn)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Kiểm tra localStorage khi component được khởi tạo
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    return savedState ? JSON.parse(savedState) : true;
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Lưu trạng thái vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100">
      {/* Sidebar - auto collapsible on desktop, hidden on mobile unless toggled */}
      {showSidebar && (
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isMobile 
              ? isSidebarOpen 
                ? "fixed inset-0 z-40 overflow-hidden" 
                : "hidden" 
              : isCollapsed
                ? "w-16 flex-shrink-0 h-screen overflow-hidden"
                : "w-64 flex-shrink-0 h-screen"
          }`}
        >
          <div className={`h-full ${isCollapsed && !isMobile ? "overflow-hidden" : ""}`}>
            <Sidebar onClose={() => isMobile ? setIsSidebarOpen(false) : setIsCollapsed(true)} />
          </div>
          
          {/* Toggle button for desktop */}
          {!isMobile && (
            <button 
              className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md z-10 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 text-gray-600 dark:text-gray-300 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Mobile Header - visible on small screens when sidebar is enabled */}
      {isMobile && showSidebar && (
        <MobileHeader onMenuToggle={toggleSidebar} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-4 md:pt-0 mt-16 md:mt-0">
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
          <Footer />
        </div>
      </main>
    </div>
  );
}
