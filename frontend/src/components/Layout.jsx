import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Trophy, Shield, Menu,
  LogOut, User, ChevronLeft, BarChart3, ChevronDown, CheckCircle, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Avatar } from './ui/Avatar';

const navItems = [
  { text: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Teams', path: '/teams', icon: Users, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Achievements', path: '/achievements', icon: Trophy, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Admin Panel', path: '/admin', icon: Shield, roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-surface border-r border-border">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-glow">
          A
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight text-text-primary">ACME Inc.</span>
          <span className="text-xs font-medium text-text-muted">Workspace</span>
        </div>
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1.5 text-text-muted hover:bg-surfaceHover md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <button
                key={item.text}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary-500/10 text-primary-400" 
                    : "text-text-muted hover:bg-surfaceHover hover:text-text-primary"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary-500" : "text-text-muted group-hover:text-text-primary")} />
                {item.text}
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-0 mt-[1px] h-5 w-1 rounded-r-full bg-primary-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surfaceHover/50 p-2">
           <Avatar fallback={user?.name?.charAt(0) || 'U'} className="h-8 w-8 text-xs bg-primary-500/20" />
           <div className="flex flex-1 flex-col overflow-hidden">
             <span className="truncate text-sm font-bold text-text-primary">{user?.name}</span>
             <span className="truncate text-xs font-medium text-text-muted capitalize">{user?.role}</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden w-[260px] shrink-0 md:block">
        <div className="fixed inset-y-0 w-[260px]">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 text-text-muted hover:bg-surfaceHover rounded-md mr-1"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-sm font-semibold tracking-tight text-text-primary">
              {visibleItems.find(i => location.pathname === i.path ||
                (i.path !== '/' && location.pathname.startsWith(i.path)))?.text || 'Dashboard'}
            </h1>
            
            <div className="flex items-center gap-3">
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface p-1 pr-3 transition-colors hover:bg-surfaceHover focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Avatar fallback={user?.name?.charAt(0) || 'U'} className="h-7 w-7 text-xs bg-primary-500/20" />
                  <span className="text-sm font-medium text-text-secondary">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                </button>
                
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1 shadow-2xl"
                    >
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      </div>
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surfaceHover hover:text-text-primary transition-colors">
                        <User className="h-4 w-4" /> Profile
                      </button>
                      <button 
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 relative">
          {/* subtle background glow like Linear */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary-500/5 to-transparent mix-blend-screen" />
          <div className="relative z-10 w-full max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
