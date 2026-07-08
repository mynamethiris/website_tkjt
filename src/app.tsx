import { useState, useEffect, FormEvent } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/features/header';
import Footer from './components/features/footer';
import Beranda from './components/pages/beranda';
import Profil_jurusan from './components/pages/profil_jurusan';
import Laporan_piket from './components/pages/laporan_piket';
import Galeri from './components/pages/galeri';
import Inventaris_lab from './components/pages/inventaris_lab';
import Admin from './components/pages/admin';
import Toast_notification from './components/features/toast_notification';
import Modal from './components/features/modal';
import Button from './components/features/button';
import { PicketAccount, Student, GalleryItem } from './types';
import Kontributor from './components/pages/kontributor';
import defaultStudentsData from '../data/students.json';

const defaultStudents = defaultStudentsData as Student[];
const defaultGallery: GalleryItem[] = [];

import { deepEqual } from './utils';

export default function App() {
  // Deklarasi Status
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('tkjt_active_tab') || 'beranda';
  });
  const [studentsState, setStudentsState] = useState<Student[]>([]);
  const [galleryItemsState, setGalleryItemsState] = useState<GalleryItem[]>([]);

  // Efek Simpan Tab Aktif
  useEffect(() => {
    localStorage.setItem('tkjt_active_tab', activeTab);
  }, [activeTab]);

  // Efek Muat Data
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.students)) {
          setStudentsState(data.students);
        } else {
          setStudentsState(defaultStudents);
        }
        if (data && Array.isArray(data.galleryItems)) {
          setGalleryItemsState(data.galleryItems);
        } else {
          setGalleryItemsState(defaultGallery);
        }
      })
      .catch(err => {
        console.error("Gagal mengambil data dari API:", err);
        setStudentsState(defaultStudents);
        setGalleryItemsState(defaultGallery);
      });

    const poll = setInterval(() => {
      fetch('/api/data')
        .then(res => res.json())
        .then(data => {
          if (data) {
            if (Array.isArray(data.students)) {
              setStudentsState(prev => {
                if (!deepEqual(prev, data.students)) {
                  return data.students;
                }
                return prev;
              });
            }
            if (Array.isArray(data.galleryItems)) {
              setGalleryItemsState(prev => {
                if (!deepEqual(prev, data.galleryItems)) {
                  return data.galleryItems;
                }
                return prev;
              });
            }
          }
        })
        .catch(err => console.error("Error polling data:", err));
    }, 5000);

    return () => clearInterval(poll);
  }, []);

  // Handler Simpan Data (gallery only — students are read-only from data.ts)
  const handleSaveGallery = async (updatedGallery: GalleryItem[]) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ galleryItems: updatedGallery }),
      });
      const resData = await response.json();
      if (resData.success) {
        setGalleryItemsState(updatedGallery);
        triggerToast("Perubahan data tersimpan otomatis!", "success");
        return true;
      } else {
        triggerToast("Gagal menyimpan perubahan ke server", "error");
        return false;
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setGalleryItemsState(updatedGallery);
      triggerToast("Perubahan tersimpan sementara di lokal browser", "info");
      return false;
    }
  };

  // Status Tema
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('tkjt_theme');
    return saved ? saved === 'dark' : false;
  });

  // Status Autentikasi
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('tkjt_auth') === 'true';
  });

  interface UserSession {
    username: string;
    role: 'admin' | 'piket' | 'tamu';
    kelas?: string;
    angkatan?: number;
  }

  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('tkjt_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }

    if (localStorage.getItem('tkjt_auth') === 'true') {
      return { username: 'guru', role: 'admin' };
    }
    return null;
  });

  useEffect(() => {
    if (userSession) {
      localStorage.setItem('tkjt_user_session', JSON.stringify(userSession));
    } else {
      localStorage.removeItem('tkjt_user_session');
    }
  }, [userSession]);

  // Status Form Login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Status Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Efek Terapkan Tema
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('tkjt_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('tkjt_theme', 'light');
    }
  }, [isDarkMode]);

  // Efek Proteksi Gambar
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('img')) {
        e.preventDefault();
      }
    };
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('img')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Helper Toast
  const triggerToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleCloseToast = () => {
    setToast(null);
  };

  // Handler Login
  const handlePerformLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const userLower = usernameInput.trim().toLowerCase();
    const passLower = passwordInput.trim();

    // Coba login admin/guest via server
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim(), password: passLower }),
      });
      const data = await res.json();
      if (data.success && data.role) {
        const session: UserSession = { username: data.username, role: data.role };
        setIsLoggedIn(true);
        setUserSession(session);
        localStorage.setItem('tkjt_auth', 'true');
        localStorage.setItem('tkjt_user_session', JSON.stringify(session));
        setIsLoginModalOpen(false);
        setUsernameInput('');
        setPasswordInput('');
        triggerToast(`Selamat, login berhasil sebagai ${session.role.toUpperCase()}!`, "success");
        return;
      }
    } catch {
      // Jika server down, lanjutkan ke pengecekan piket
    }

    // Cek akun piket dari localStorage
    const savedAccountsStr = localStorage.getItem('tkjt_picket_accounts');
    let registeredAccounts: PicketAccount[] = [];
    if (savedAccountsStr) {
      try {
        registeredAccounts = JSON.parse(savedAccountsStr);
      } catch {}
    }

    const matchedAccount = registeredAccounts.find(
      acc => acc.username.toLowerCase() === userLower && acc.pin === passLower
    );

    if (matchedAccount) {
      const gName = matchedAccount.groupName;
      let kelas = 'TKJT 1';
      if (gName.includes('TKJT 2')) kelas = 'TKJT 2';
      else if (gName.includes('TKJT 3')) kelas = 'TKJT 3';

      let angkatan = 8;
      if (gName.includes('Angkatan 9') || gName.includes('9')) angkatan = 9;

      const session: UserSession = {
        username: matchedAccount.username,
        role: 'piket',
        kelas,
        angkatan
      };
      setIsLoggedIn(true);
      setUserSession(session);
      localStorage.setItem('tkjt_auth', 'true');
      localStorage.setItem('tkjt_user_session', JSON.stringify(session));
      setIsLoginModalOpen(false);
      setUsernameInput('');
      setPasswordInput('');
      triggerToast(`Selamat, login berhasil sebagai ${session.role.toUpperCase()}!`, "success");
      return;
    }

    setLoginError("Kombinasi nama pengguna atau kata sandi tidak valid!");
    triggerToast("Identifikasi gagal! Periksa kembali kredensial Anda.", "error");
  };

  // Handler Logout
  const handlePerformLogout = () => {
    setIsLoggedIn(false);
    setUserSession(null);
    localStorage.removeItem('tkjt_auth');
    localStorage.removeItem('tkjt_user_session');
    setActiveTab('beranda');
    triggerToast("Anda telah keluar sesi.", "info");
  };

  const openAuthGateway = () => {
    setLoginError('');
    setIsLoginModalOpen(true);
  };

  return (
    <>
      {/* Aplikasi Utama */}
      <div
        className={`min-h-screen flex flex-col font-sans transition-colors duration-300
          ${isDarkMode
            ? 'bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-white'
            : 'bg-slate-50 text-slate-800 selection:bg-blue-200 selection:text-slate-900'
          }`}
      >
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isLoggedIn={isLoggedIn}
          onLoginClick={openAuthGateway}
          onLogoutClick={handlePerformLogout}
          userSession={userSession}
        />

        {/* Konten Halaman */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-28 mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            >
              {activeTab === 'beranda' ? (
                <Beranda
                  isLoggedIn={isLoggedIn}
                  onLoginRequest={openAuthGateway}
                  triggerToast={triggerToast}
                  setActiveTab={setActiveTab}
                  userSession={userSession}
                />
              ) : activeTab === 'profil-jurusan' ? (
                <Profil_jurusan
                  studentsState={studentsState}
                />
              ) : activeTab === 'galeri' ? (
                <Galeri
                  galleryItemsState={galleryItemsState}
                  setGalleryItemsState={setGalleryItemsState}
                  isLoggedIn={isLoggedIn}
                  userSession={userSession}
                  onSave={handleSaveGallery}
                  triggerToast={triggerToast}
                />
              ) : activeTab === 'kontributor' ? (
                <Kontributor setActiveTab={setActiveTab} />
              ) : activeTab === 'laporan-piket' ? (
                <Laporan_piket
                  isLoggedIn={isLoggedIn}
                  onLoginRequest={openAuthGateway}
                  triggerToast={triggerToast}
                  userSession={userSession}
                />
              ) : activeTab === 'inventaris' ? (
                <Inventaris_lab
                  isLoggedIn={isLoggedIn}
                  onLoginRequest={openAuthGateway}
                  triggerToast={triggerToast}
                  userSession={userSession}
                />
              ) : (
                <Admin
                  isLoggedIn={isLoggedIn}
                  onLoginRequest={openAuthGateway}
                  triggerToast={triggerToast}
                  userSession={userSession}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer isDarkMode={isDarkMode} />

        {toast && (
          <Toast_notification
            message={toast.message}
            type={toast.type}
            onClose={handleCloseToast}
          />
        )}

        {/* Modal Login */}
        <Modal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          title="Masuk Sesi Administrasi"
          subtitle="Masukkan nama pengguna dan kata sandi pengawas resmi TKJT."
          icon={<Lock className="h-6 w-6" />}
          maxWidth="sm"
        >
          <div className="space-y-6">
            <form onSubmit={handlePerformLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-550 block">
                  Nama Pengguna (Username):
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  placeholder="guru"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-550 block">
                  Kata Sandi (Password):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={30}
                    placeholder="tkjt"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 pl-4 pr-10 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-blue-500 cursor-pointer border-2 border-transparent"
                    title={showPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                  <span className="leading-snug">{loginError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="w-1/3"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-2/3"
                >
                  Masuk Sesi
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
