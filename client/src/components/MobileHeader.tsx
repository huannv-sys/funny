import { Bell } from "lucide-react";
import useThemeToggle from "@/hooks/useThemeToggle";
import { Button } from "./ui/button";
import { AlertsContext } from "@/hooks/useMikrotikData";
import { useContext } from "react";

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export default function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const { alerts } = useContext(AlertsContext);
  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="mr-2 text-gray-600 dark:text-gray-300"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" className="text-primary dark:text-blue-400 h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <span className="text-lg font-semibold">MikroTik Monitor</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-1 relative text-gray-600 dark:text-gray-300"
            aria-label="Alerts"
          >
            <Bell className="h-5 w-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {unreadAlertsCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
