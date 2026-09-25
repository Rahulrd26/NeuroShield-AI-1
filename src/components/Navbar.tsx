import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Cpu, Activity, Menu, X, ArrowRight,
  Database, User as UserIcon, LogOut, CheckCircle2, Cloud
} from 'lucide-react';
import { SystemHealth } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'manual' | 'batch' | 'explainability' | 'history';
  onNavigate: (view: 'landing' | 'dashboard' | 'manual' | 'batch' | 'explainability' | 'history') => void;
  systemHealth: SystemHealth | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, systemHealth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, userProfile, signInWithGoogle, logout, userScans, userBatchRuns } = useAuth();
  const isOnline = systemHealth?.status === 'healthy';

  interface NavItem {
    id: 'dashboard' | 'manual' | 'batch' | 'explainability' | 'history';
    label: string;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'manual', label: 'Analyze' },
    { id: 'batch', label: 'Batch Analysis' },
    { id: 'explainability', label: 'Explainability' },
    { id: 'history', label: 'Cloud History', badge: userScans.length > 0 ? userScans.length : undefined }
  ];

  const handleNavClick = (view: 'landing' | 'dashboard' | 'manual' | 'batch' | 'explainability' | 'history') => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  // Close user dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Subtitle */}
        <button
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-3 text-left group focus-visible:outline-none"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-cyan-400 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] transition-all">
            <ShieldCheck className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-extrabold tracking-wider text-white">
                NIDS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase font-semibold">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono tracking-tight -mt-0.5">
              AI Network Security
            </p>
          </div>
        </button>

        {/* Center Navigation Links (App context) */}
        {currentView !== 'landing' && (
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-neutral-800 text-cyan-300 shadow-sm border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/70">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Status Indicator, Auth & Action CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Telemetry Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/40 text-[11px] font-mono">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={isOnline ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {isOnline ? 'ENGINE ONLINE' : 'STANDBY'}
            </span>
          </div>

          {/* Google Sign-in / User Profile Section */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1 pl-2 pr-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 transition-all text-left"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Analyst'}
                    className="h-7 w-7 rounded-lg object-cover border border-neutral-700"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
                    {user.email ? user.email.slice(0, 2).toUpperCase() : 'AN'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-medium text-white truncate max-w-[120px]">
                    {user.displayName || 'Analyst'}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 -mt-0.5">
                    SecOps Analyst
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-neutral-800/80">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.displayName || 'Analyst'}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                      <span>Firestore Sync:</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-2 text-xs space-y-1 text-neutral-400">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Scans Stored:</span>
                      <span className="text-white font-bold">{userScans.length}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Batch Audits:</span>
                      <span className="text-white font-bold">{userBatchRuns.length}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavClick('history')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-900 flex items-center gap-2"
                  >
                    <Database className="h-3.5 w-3.5 text-cyan-400" />
                    <span>View Cloud Threat Registry</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg flex items-center gap-2 transition-all shadow-sm group hover:border-neutral-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {currentView === 'landing' ? (
            <button
              onClick={() => handleNavClick('dashboard')}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 border border-cyan-400/30 flex items-center gap-2 transition-all"
            >
              <span>Launch NIDS</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('landing')}
              className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 bg-neutral-900/30 rounded-lg transition-colors"
            >
              Platform
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          {!user && (
            <button
              onClick={() => signInWithGoogle()}
              className="p-2 text-xs text-neutral-200 bg-neutral-900 rounded-lg border border-neutral-800"
              title="Sign in with Google"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 bg-neutral-900/60"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-neutral-800 bg-neutral-950/95 px-4 pt-3 pb-5 space-y-3 backdrop-blur-xl">
          {/* User Profile summary in Mobile Drawer */}
          {user ? (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-300 font-bold text-xs">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-white">{user.displayName || 'Analyst'}</p>
                  <p className="text-[10px] font-mono text-neutral-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-rose-400 hover:bg-rose-950/30 rounded-lg text-xs"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="w-full py-2.5 rounded-lg bg-white text-neutral-900 font-medium text-xs flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('landing')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentView === 'landing' ? 'bg-neutral-800 text-cyan-300' : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              Home / Overview
            </button>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                  currentView === item.id ? 'bg-neutral-800 text-cyan-300' : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-300">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {currentView === 'landing' && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className="w-full mt-2 py-2.5 rounded-lg bg-cyan-600 text-white font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>Launch Security Platform</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
export default Navbar;
