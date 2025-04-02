import { PropsWithChildren, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { useMediaQuery } from "@/hooks/use-mobile";
import Footer from "@/components/dashboard/Footer";

export default function AppLayout({ children }: PropsWithChildren) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100">
      {/* Sidebar - hidden on mobile unless toggled */}
      <div 
        className={`${
          isMobile 
            ? isSidebarOpen 
              ? "fixed inset-0 z-40 overflow-hidden" 
              : "hidden" 
            : "flex flex-shrink-0 h-screen"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Mobile Header - visible on small screens */}
      {isMobile && (
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
