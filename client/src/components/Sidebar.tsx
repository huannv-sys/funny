import { Link, useLocation } from "wouter";
import useThemeToggle from "@/hooks/useThemeToggle";
import DeviceSelector from "./dashboard/DeviceSelector";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { DeviceContext, AlertsContext } from "@/hooks/useMikrotikData";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [location] = useLocation();
  const { selectedDevice } = useContext(DeviceContext);
  const { alerts } = useContext(AlertsContext);
  
  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  // Dashboard section items
  const dashboardItems = [
    { href: "/", icon: "home", label: "Trang chủ" },
    { href: "/multi-dashboard", icon: "th-large", label: "Đa thiết bị" },
    { href: "/#dashboard", icon: "tachometer-alt", label: "Dashboard" },
    { href: "/#traffic", icon: "chart-line", label: "Traffic Monitor" },
    { href: "/#wifi", icon: "wifi", label: "WiFi Clients" },
    { href: "/#system", icon: "server", label: "System Resources" },
    { href: "/#logs", icon: "list-alt", label: "Logs" },
    { href: "/#alerts", icon: "bell", label: "Alerts", badge: unreadAlertsCount },
  ];
  
  // Additional pages
  const networkItems = [
    { href: "/firewall", icon: "shield-alt", label: "Firewall & NAT" },
    { href: "/dhcp", icon: "network-wired", label: "DHCP" },
    { href: "/routing", icon: "route", label: "Routing" },
    { href: "/vpn", icon: "lock", label: "VPN" },
  ];
  
  const systemItems = [
    { href: "/qos", icon: "tachometer-alt", label: "QoS & Queues" },
    { href: "/services", icon: "cogs", label: "Services & Users" },
  ];

  // Để tương thích với mã hiện tại, tạo một bản sao của dashboardItems
  const navigationItems = [...dashboardItems];
  
  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg h-full overflow-hidden">
      {/* Header fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-primary dark:text-blue-400 h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <span className="text-lg font-semibold">MikroTik Monitor</span>
        </div>
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
      </div>
      
      {/* Scrollable area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Devices
          </h3>
          <div className="mt-2">
            <DeviceSelector />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
              Connected
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedDevice?.version || "RouterOS v7"}
            </span>
          </div>
        </div>
        
        <nav className="px-2 py-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
              Dashboard
            </h3>
            <div className="space-y-1">
              {dashboardItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href || (location === "/" && item.href === "/#dashboard")
                      ? "bg-primary bg-opacity-10 text-primary dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon === "home" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    )}
                    {item.icon === "tachometer-alt" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    )}
                    {item.icon === "chart-line" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    )}
                    {item.icon === "wifi" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    )}
                    {item.icon === "server" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    )}
                    {item.icon === "list-alt" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    )}
                    {item.icon === "bell" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    )}
                    {item.icon === "th-large" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    )}
                  </svg>
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
              Network
            </h3>
            <div className="space-y-1">
              {networkItems.map((item: { href: string; icon: string; label: string }) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href
                      ? "bg-primary bg-opacity-10 text-primary dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon === "shield-alt" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    )}
                    {item.icon === "network-wired" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-5-3v1m0 9v1" />
                    )}
                    {item.icon === "route" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    )}
                    {item.icon === "lock" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
              System
            </h3>
            <div className="space-y-1">
              {systemItems.map((item: { href: string; icon: string; label: string }) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href
                      ? "bg-primary bg-opacity-10 text-primary dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon === "tachometer-alt" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                    {item.icon === "cogs" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    )}
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        
        <div className="px-4 py-4 mt-auto border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-500 dark:text-gray-400 h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last login: 2 hours ago</p>
            </div>
          </div>
          <Button 
            variant="secondary"
            className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
