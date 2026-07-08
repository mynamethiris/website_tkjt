import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Sun, Moon, LogIn, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  userSession?: {
    username: string;
    role: "admin" | "piket" | "tamu";
    kelas?: string;
    angkatan?: number;
  } | null;
}

export default function Header({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  isLoggedIn,
  onLoginClick,
  onLogoutClick,
  userSession,
}: HeaderProps) {
  // Deklarasi State
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isManajemenOpen, setIsManajemenOpen] = useState(false);
  const [isMobileManajemenOpen, setIsMobileManajemenOpen] = useState(
    activeTab === "laporan-piket" || activeTab === "inventaris",
  );

  // State Logo Tahan
  const [pressStart, setPressStart] = useState<number | null>(null);
  const [pressTimeout, setPressTimeout] = useState<any>(null);
  const [isHolding, setIsHolding] = useState(false);

  // Penangan Logo
  const handleLogoPressStart = (_e: React.MouseEvent | React.TouchEvent) => {
    setIsHolding(true);
    const now = Date.now();
    setPressStart(now);

    const timeout = setTimeout(() => {
      setActiveTab("kontributor");
      setPressStart(null);
      setIsHolding(false);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }, 3000);
    setPressTimeout(timeout);
  };

  const handleLogoPressEnd = (_e: React.MouseEvent | React.TouchEvent) => {
    setIsHolding(false);
    if (pressTimeout) {
      clearTimeout(pressTimeout);
      setPressTimeout(null);
    }

    if (pressStart) {
      const duration = Date.now() - pressStart;
      setPressStart(null);
      if (duration < 3000) {
        handleNavClick("beranda");
      }
    }
  };

  // Efek Submenu
  useEffect(() => {
    if (activeTab === "laporan-piket" || activeTab === "inventaris") {
      setIsMobileManajemenOpen(true);
    }
  }, [activeTab]);

  // Efek Header Gulir
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 80) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handler Navigasi
  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isHeaderVisible ? 0 : -80 }}
      transition={{ type: "spring", stiffness: 380, damping: 35 }}
      className={`fixed top-0 left-0 right-0 z-50 border-b shadow-sm backdrop-blur-md
        ${
          isDarkMode
            ? "bg-slate-950/90 border-slate-900 text-slate-100"
            : "bg-white/90 border-slate-200 text-slate-800"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <motion.div
            onMouseDown={handleLogoPressStart}
            onMouseUp={handleLogoPressEnd}
            onMouseLeave={handleLogoPressEnd}
            onTouchStart={handleLogoPressStart}
            onTouchEnd={handleLogoPressEnd}
            className="flex items-center gap-3 cursor-pointer group select-none transition-all duration-300"
            whileHover={isHolding ? undefined : "hover"}
          >
            <motion.div
              className="relative h-12 w-12"
              variants={
                isHolding
                  ? {}
                  : {
                      hover: {
                        scale: 1.08,
                        rotate: 8,
                      },
                    }
              }
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
              }}
            >
              <img
                src="https://raw.githubusercontent.com/mynamethiris/tkjt_assets/25eb/Website/logo_tkjt.png"
                alt="Logo TKJT"
                className="h-full w-full object-contain pt-1.5"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xl font-black tracking-wider text-blue-600 dark:text-blue-400">
                  TKJT
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold tracking-wider">
                  AMI Deltamas
                </span>
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
                Teknik Komputer Jaringan & Telekomunikasi
              </span>
              <div className="block sm:hidden marquee-container">
                <div className="animate-marquee flex w-max gap-x-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                    Teknik Komputer Jaringan & Telekomunikasi |
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                    Teknik Komputer Jaringan & Telekomunikasi |
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigasi Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => handleNavClick("beranda")}
              className={`text-sm font-semibold tracking-wide transition-all py-2 border-b-2 hover:border-blue-500 cursor-pointer
                ${
                  activeTab === "beranda"
                    ? "text-blue-500 border-blue-500"
                    : "text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              Beranda
            </button>
            <button
              onClick={() => handleNavClick("profil-jurusan")}
              className={`text-sm font-semibold tracking-wide transition-all py-2 border-b-2 hover:border-blue-500 cursor-pointer
                ${
                  activeTab === "profil-jurusan"
                    ? "text-blue-500 border-blue-500"
                    : "text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              Profil Jurusan
            </button>
            <button
              onClick={() => handleNavClick("galeri")}
              className={`text-sm font-semibold tracking-wide transition-all py-2 border-b-2 hover:border-blue-500 cursor-pointer
                ${
                  activeTab === "galeri"
                    ? "text-blue-500 border-blue-500"
                    : "text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              Galeri
            </button>

            {isLoggedIn && userSession?.role !== "tamu" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsManajemenOpen(!isManajemenOpen)}
                  className={`text-sm font-semibold tracking-wide transition-all py-2 border-b-2 flex items-center gap-1 cursor-pointer
                    ${
                      activeTab === "laporan-piket" ||
                      activeTab === "inventaris"
                        ? "text-blue-500 border-blue-500"
                        : "text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  Manajemen
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isManajemenOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isManajemenOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute left-0 mt-2 w-48 rounded-xl border shadow-xl p-1.5 focus:outline-none z-50 animate-in fade-in duration-100 flex flex-col gap-1.5
                        ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-800 text-slate-100"
                            : "bg-white border-slate-200 text-slate-800"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick("laporan-piket");
                          setIsManajemenOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-colors cursor-pointer text-left
                          ${
                            activeTab === "laporan-piket"
                              ? "bg-blue-500/10 text-blue-500"
                              : "hover:bg-slate-100 dark:hover:bg-slate-900"
                          }`}
                      >
                        Laporan Piket
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick("inventaris");
                          setIsManajemenOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-colors cursor-pointer text-left
                          ${
                            activeTab === "inventaris"
                              ? "bg-blue-550/10 text-blue-500 dark:text-blue-400"
                              : "hover:bg-slate-100 dark:hover:bg-slate-900"
                          }`}
                      >
                        Inventaris Lab
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {isLoggedIn && userSession?.role === "admin" && (
              <button
                onClick={() => handleNavClick("admin")}
                className={`text-sm font-semibold tracking-wide transition-all py-2 border-b-2 hover:border-blue-500 cursor-pointer
                  ${
                    activeTab === "admin"
                      ? "text-blue-500 border-blue-500"
                      : "text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                Panel Admin
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={
                isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"
              }
              className="rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center overflow-hidden w-9.5 h-9.5 relative"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDarkMode ? "sun" : "moon"}
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {isLoggedIn ? (
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                Login Guru / Piket
              </button>
            )}
          </nav>

          {/* Navigasi Mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-center overflow-hidden w-9.5 h-9.5 relative"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDarkMode ? "sun-mobile" : "moon-mobile"}
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-center overflow-hidden w-9.5 h-9.5 relative"
              title="Menu Navigasi"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobileMenuOpen ? "close" : "menu"}
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, height: "auto", scaleY: 1 }}
            exit={{ opacity: 0, height: 0, scaleY: 0.95 }}
            transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
            className="lg:hidden border-t border-slate-200 dark:border-slate-900 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md py-4 px-6 space-y-3 origin-top overflow-hidden"
          >
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-2 mt-1">
              Navigasi Halaman
            </div>
            <button
              onClick={() => handleNavClick("beranda")}
              className={`flex w-full items-center px-4 py-3 rounded-lg text-sm font-semibold transition-colors
                ${
                  activeTab === "beranda"
                    ? "bg-blue-50 dark:bg-blue-900/10 text-blue-500"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
            >
              Beranda
            </button>
            <button
              onClick={() => handleNavClick("profil-jurusan")}
              className={`flex w-full items-center px-4 py-3 rounded-lg text-sm font-semibold transition-colors
                ${
                  activeTab === "profil-jurusan"
                    ? "bg-blue-50 dark:bg-blue-900/10 text-blue-500"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
            >
              Profil Jurusan
            </button>
            <button
              onClick={() => handleNavClick("galeri")}
              className={`flex w-full items-center px-4 py-3 rounded-lg text-sm font-semibold transition-colors
                ${
                  activeTab === "galeri"
                    ? "bg-blue-50 dark:bg-blue-900/10 text-blue-500"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
            >
              Galeri
            </button>

            {isLoggedIn && userSession?.role !== "tamu" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setIsMobileManajemenOpen(!isMobileManajemenOpen)
                  }
                  className={`flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer
                    ${
                      activeTab === "laporan-piket" ||
                      activeTab === "inventaris"
                        ? "bg-blue-50 dark:bg-blue-900/10 text-blue-500 font-extrabold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                >
                  <span>Manajemen</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isMobileManajemenOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isMobileManajemenOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-4 space-y-2.5 mt-1 border-l-2 border-slate-100 dark:border-slate-800 ml-4 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => handleNavClick("laporan-piket")}
                        className={`flex w-full items-center px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-colors text-left cursor-pointer
                          ${
                            activeTab === "laporan-piket"
                              ? "bg-blue-500/10 text-blue-500"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                          }`}
                      >
                        Laporan Piket
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick("inventaris")}
                        className={`flex w-full items-center px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-colors text-left cursor-pointer
                          ${
                            activeTab === "inventaris"
                              ? "bg-blue-550/10 text-blue-500 dark:text-blue-400"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                          }`}
                      >
                        Inventaris Lab
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {isLoggedIn && userSession?.role === "admin" && (
              <button
                onClick={() => handleNavClick("admin")}
                className={`flex w-full items-center px-4 py-3 rounded-lg text-sm font-semibold transition-colors
                  ${
                    activeTab === "admin"
                      ? "bg-blue-50 dark:bg-blue-900/10 text-blue-500"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
              >
                Panel Admin
              </button>
            )}

            <div className="h-px bg-slate-200 dark:bg-slate-900 my-2" />

            {isLoggedIn ? (
              <button
                onClick={() => {
                  onLogoutClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white py-3 text-sm font-bold uppercase transition-transform cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Keluar Sesi
              </button>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-bold uppercase transition-transform cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                Login Guru / Piket
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
