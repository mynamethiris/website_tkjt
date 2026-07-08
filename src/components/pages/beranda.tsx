import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code, 
  Network, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Clock, 
  HelpCircle, 
  ChevronDown,
  ArrowRight, 
  Zap, 
  Award,
  Instagram,
  Terminal,
  Globe,
  Smartphone,
  Database,
  GitBranch,
  Sliders,
  Server,
  Wifi,
  Shield,
  Activity,
  FileText,
  TrendingUp,
  Users,
  Key,
  CheckCircle
} from 'lucide-react';
import contentData from '../../../data/content.json';
const { specializations, contacts, faqs } = contentData;
import Modal from '../features/modal';

// [Komponen Animasi Scroll]
function ScrollReveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const getRandomAscii = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,./<>?~';
  return chars[Math.floor(Math.random() * chars.length)];
};

// [Latar Matriks ASCII]
function AsciiFallingBackground() {
  const [columns, setColumns] = useState<{
    id: number;
    left: number;
    chars: string[];
    duration: number;
    delay: number;
    fontSize: number;
  }[]>([]);

  useEffect(() => {
    const colsCount = 8;
    const cols = Array.from({ length: colsCount }).map((_, i) => ({
      id: i,
      left: (i * (100 / colsCount)) + Math.random() * 2, 
      chars: Array.from({ length: 4 }).map(() => getRandomAscii()), 
      duration: 4.0 + Math.random() * 4.0, 
      delay: Math.random() * -8, 
      fontSize: 10 + Math.random() * 2, 
    }));
    setColumns(cols);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <style>{`
        @keyframes ascii-fall-perf {
          0% {
            transform: translate3d(0, -100%, 0);
            opacity: 0;
          }
          8% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translate3d(0, 120%, 0);
            opacity: 0;
          }
        }
      `}</style>
      {columns.map(col => (
        <div
          key={col.id}
          style={{
            position: 'absolute',
            left: `${col.left}%`,
            fontSize: `${col.fontSize}px`,
            fontFamily: 'monospace',
            whiteSpace: 'pre-line',
            lineHeight: 1.1,
            animation: `ascii-fall-perf ${col.duration}s linear infinite`,
            animationDelay: `${col.delay}s`,
            willChange: 'transform',
            transform: 'translate3d(0, -100%, 0)',
            backfaceVisibility: 'hidden',
          }}
          className="text-blue-500/10 dark:text-blue-400/15 font-mono tracking-widest text-center"
        >
          {col.chars.map((char, index) => {
            const opacity = (index + 1) / col.chars.length;
            const isLead = index === col.chars.length - 1;
            return (
              <div 
                key={index} 
                style={{ opacity }}
                className={isLead ? "text-blue-500 dark:text-cyan-400 font-extrabold" : ""}
              >
                {char}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// [Data Tahapan Diagnostik]
const DIAGNOSTIC_STEPS = [
  {
    title: "Kompetensi Dasar",
    url: "https://forms.gle/Jk5DaVDyBsLjwNVN8",
    description: "Evaluasi akademis bidang dasar TKJT",
    longDesc: "Formulir ini bertujuan untuk mengukur pemahaman akademis dasar Anda dalam cakupan Teknologi Jaringan Komputer dan Telekomunikasi. Selesaikan formulir ini sebelum melangkah ke tahap minat dan bakat."
  },
  {
    title: "Evaluasi Minat & Bakat",
    url: "https://forms.gle/rSCkCZLbxmiJNCMg8",
    description: "Pemetaan potensi & bakat bawaan Anda",
    longDesc: "Temukan area bakat alamiah dan ketertarikan teknis Anda untuk membantu tim mengidentifikasi spesialisasi yang paling sinergis dengan cara kerja dan cara berpikir Anda."
  }
];

interface BerandaProps {
  isLoggedIn?: boolean;
  onLoginRequest?: () => void;
  triggerToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  setActiveTab?: (tab: string) => void;
  userSession?: {
    username: string;
    role: 'admin' | 'piket' | 'tamu';
    kelas?: string;
    angkatan?: number;
  } | null;
}

// [Komponen Beranda]
export default function Beranda({ isLoggedIn, onLoginRequest, triggerToast, setActiveTab, userSession }: BerandaProps) {
  // [State Modal Diagnostik]
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [currentDiagnosticStep, setCurrentDiagnosticStep] = useState(0);
  const [hasOpenedCurrentForm, setHasOpenedCurrentForm] = useState(false);
  const [isDiagnosticCompleted, setIsDiagnosticCompleted] = useState(false);

  // [State Gulir Kartu]
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollAt, setScrollAt] = useState<'left' | 'right' | 'middle'>('left');

  const handleContactScroll = (e: any) => {
    const target = e.currentTarget;
    const tolerance = 15;
    const maxScroll = target.scrollWidth - target.clientWidth;
    if (target.scrollLeft <= tolerance) {
      setScrollAt('left');
    } else if (target.scrollLeft >= maxScroll - tolerance) {
      setScrollAt('right');
    } else {
      setScrollAt('middle');
    }
  };

  const handleScrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  const handleScrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // [Efek Ketik Judul]
  const fullText = "Merajut Jaringan Menyatukan Peradaban";
  const [typedTitle, setTypedTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const typingSpeed = isDeleting ? 30 : 60; 
    
    const handleTyping = () => {
      if (!isDeleting) {
        if (typingIndex < fullText.length) {
          setTypedTitle(fullText.substring(0, typingIndex + 1));
          setTypingIndex(prev => prev + 1);
        } else {
          timer = setTimeout(() => {
            setIsDeleting(true);
          }, 3000);
          return;
        }
      } else {
        if (typingIndex > 0) {
          setTypedTitle(fullText.substring(0, typingIndex - 1));
          setTypingIndex(prev => prev - 1);
        } else {
          timer = setTimeout(() => {
            setIsDeleting(false);
          }, 1200);
          return;
        }
      }
      
      timer = setTimeout(handleTyping, typingSpeed);
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [typingIndex, isDeleting]);

  // [State FAQ]
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const getContactIcon = (name: string) => {
    switch (name) {
      case 'MapPin': return <MapPin className="h-6 w-6 text-blue-500" />;
      case 'PhoneCall': return <PhoneCall className="h-6 w-6 text-emerald-500" />;
      case 'Instagram': return <Instagram className="h-6 w-6 text-pink-500" />;
      case 'Mail': return <Mail className="h-6 w-6 text-pink-500" />;
      case 'Clock': return <Clock className="h-6 w-6 text-amber-500" />;
      default: return <MapPin className="h-6 w-6 text-blue-500" />;
    }
  };

  const getContactBgImage = (id: string) => {
    switch (id) {
      case 'alamat':
        return "https://miro.medium.com/v2/resize:fit:1100/format:webp/1*gNC4Dq44wVL-EV_6g-3TnQ.jpeg";
      case 'kontak':
        return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400";
      case 'email':
        return "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=400";
      case 'operasional':
        return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=400";
      default:
        return "";
    }
  };

  // [Handler Diagnostik]
  const handleStartDiagnostic = () => {
    if (!isLoggedIn) {
      if (triggerToast) {
        triggerToast("Silakan login terlebih dahulu untuk mengakses pengujian diagnostik spesialisasi.", "error");
      }
      if (onLoginRequest) {
        onLoginRequest();
      }
    } else {
      setCurrentDiagnosticStep(0);
      setHasOpenedCurrentForm(false);
      setIsDiagnosticCompleted(false);
      setIsDiagnosticModalOpen(true);
    }
  };


  const handleContactClick = (id: string) => {
    if (id === 'alamat') {
      window.open("https://maps.app.goo.gl/56ohv8E1Bg14XpRo7", "_blank");
    } else if (id === 'kontak') {
      window.open("https://www.instagram.com/tkjtamideltamas15", "_blank");
    } else if (id === 'email') {
      window.open("mailto:realtkjt.ami@gmail.com", "_blank");
    } else if (id === 'operasional') {
      if (setActiveTab) {
        setActiveTab('laporan-piket');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (triggerToast) {
          triggerToast("Membuka Konsol Aktivitas & Piket Laboratorium...", "info");
        }
      } else {
        if (triggerToast) {
          triggerToast("Silakan ke Menu Aktivitas untuk melihat laporan piket harian.", "info");
        }
      }
    }
  };

  return (
    <div className="space-y-24 pb-16 font-sans relative">
      <div 
        className="absolute -top-28 -left-4 sm:-left-6 lg:-left-8 -right-4 sm:-right-6 lg:-right-8 h-[740px] pointer-events-none overflow-hidden z-0"
        style={{
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)'
        }}
      >
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.14)_1.5px,transparent_1.5px),linear-gradient(to_bottom,rgba(59,130,246,0.14)_1.5px,transparent_1.5px)] bg-[size:48px_48px] dark:bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1.5px,transparent_1.5px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1.5px,transparent_1.5px)]"
        />

        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <motion.line x1="12%" y1="18%" x2="20%" y2="12%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="20%" y1="12%" x2="26%" y2="25%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="26%" y1="25%" x2="10%" y2="30%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="10%" y1="30%" x2="12%" y2="18%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />

          <motion.line x1="72%" y1="10%" x2="80%" y2="20%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="80%" y1="20%" x2="86%" y2="14%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="86%" y1="14%" x2="78%" y2="32%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="78%" y1="32%" x2="68%" y2="28%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="68%" y1="28%" x2="72%" y2="10%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />

          <motion.line x1="40%" y1="48%" x2="46%" y2="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="46%" y1="42%" x2="52%" y2="54%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="52%" y1="54%" x2="36%" y2="56%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <motion.line x1="36%" y1="56%" x2="40%" y2="48%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />

          <motion.circle cx="12%" cy="18%" r="2.5" fill="#ffffff" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }} />
          <motion.circle cx="20%" cy="12%" r="3.5" fill="#ffffff" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" animate={{ opacity: [1, 0.4, 1], scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 4.1, ease: "easeInOut" }} />
          <motion.circle cx="26%" cy="25%" r="2" fill="#ffffff" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }} />
          <motion.circle cx="10%" cy="30%" r="3" fill="#ffffff" animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 3.7, ease: "easeInOut" }} />

          <motion.circle cx="72%" cy="10%" r="3.5" fill="#ffffff" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" animate={{ opacity: [0.9, 0.3, 0.9], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }} />
          <motion.circle cx="80%" cy="20%" r="2" fill="#ffffff" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2.3, ease: "easeInOut" }} />
          <motion.circle cx="86%" cy="14%" r="3" fill="#ffffff" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 3.3, ease: "easeInOut" }} />
          <motion.circle cx="78%" cy="32%" r="2.5" fill="#ffffff" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2.9, ease: "easeInOut" }} />
          <motion.circle cx="68%" cy="28%" r="3" fill="#ffffff" animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 3.9, ease: "easeInOut" }} />

          <motion.circle cx="40%" cy="48%" r="2" fill="#ffffff" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ repeat: Infinity, duration: 3.0, ease: "easeInOut" }} />
          <motion.circle cx="46%" cy="42%" r="3.5" fill="#ffffff" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" animate={{ opacity: [0.8, 0.3, 0.8], scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 4.3, ease: "easeInOut" }} />
          <motion.circle cx="52%" cy="54%" r="2.5" fill="#ffffff" animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 3.1, ease: "easeInOut" }} />
          <motion.circle cx="36%" cy="56%" r="3" fill="#ffffff" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} />

          <motion.circle cx="35%" cy="12%" r="1.5" fill="#ffffff" animate={{ opacity: [0.1, 0.8, 0.1] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }} />
          <motion.circle cx="60%" cy="18%" r="1" fill="#ffffff" animate={{ opacity: [0.8, 0.2, 0.8] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }} />
          <motion.circle cx="45%" cy="22%" r="1.8" fill="#ffffff" animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} />
          <motion.circle cx="90%" cy="38%" r="1.2" fill="#ffffff" animate={{ opacity: [0.1, 0.7, 0.1] }} transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }} />
          <motion.circle cx="6%" cy="24%" r="1.5" fill="#ffffff" animate={{ opacity: [0.6, 0.2, 0.6] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }} />
        </svg>

        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-blue-500/[0.08] dark:bg-blue-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-cyan-500/[0.08] dark:bg-cyan-500/[0.04] rounded-full blur-3xl" />
      </div>
      
      {/* [Seksi Hero] */}
      <section className="relative overflow-hidden py-16 px-4 md:px-8 rounded-3xl bg-white/75 dark:bg-slate-950/75 backdrop-blur-md border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-305 z-10">
        <AsciiFallingBackground />

        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-white/40 to-cyan-500/10 dark:opacity-0 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950/50 to-cyan-950/20 opacity-0 dark:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none transition-colors duration-500" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
            <Zap className="h-4 w-4 animate-bounce" />
            Jurusan Masa Depan Digital Anda
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center justify-center relative">
            <span className="invisible pointer-events-none select-none">
              {fullText}
              <span className="inline-block w-[3px] h-[0.9em] ml-1.5" />
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-slate-900 dark:text-white">
              <span>
                {typedTitle}
                <span className="inline-block w-[3px] h-[0.9em] ml-1.5 bg-blue-600 dark:bg-blue-400 animate-pulse align-middle" />
              </span>
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Website interaktif untuk jurusan Teknik Komputer Jaringan dan Telekomunikasi (TKJT) SMK Ananda Mitra Industri Deltamas. Persiapkan diri Anda menjadi profesional IT handal di era Industri 4.0 dan AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a 
              href="#kuis-spesialisasi"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Coba Tes Spesialisasi
              <ArrowRight className="h-4 w-4" />
            </a>
            <a 
              href="#spesialisasi-jurusan"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm px-6 py-3 font-semibold transition-all cursor-pointer"
            >
              Pelajari Kurikulum
            </a>
          </div>
        </div>
      </section>

      {/* [Seksi Spesialisasi] */}
      <section id="spesialisasi-jurusan" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Spesialisasi Unggulan Jurusan
          </h2>
          <div className="h-1.5 w-16 bg-blue-500 rounded-full mx-auto" />
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Pembelajaran kami bagi menjadi dua pilar kuat yang dirancang matang searah kebutuhan ekosistem manufaktur teknologi regional Deltamas.
          </p>
        </div>

        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 sm:p-8 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 flex flex-col justify-between">
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <img 
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600" 
                  alt="Software Engineering Visual illustration" 
                  className="w-full h-full object-cover opacity-15 dark:opacity-10 transition-transform duration-500 group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/90 to-white dark:via-slate-950/90 dark:to-slate-950" />
              </div>
              
              <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
                <div className="inline-flex rounded-xl bg-blue-500/5 p-3 text-blue-500 dark:text-blue-400 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-700 shadow-sm transition-all duration-300 group-hover:border-blue-500 dark:group-hover:border-blue-400">
                  <Code className="h-8 w-8" />
                </div>
                
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {specializations[0]?.name}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 inline-block font-sans">
                    {specializations[0]?.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                      <Terminal className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Logika Pemrograman</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                      <Globe className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Platform Web</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                      <Smartphone className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aplikasi Mobile</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                      <Database className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Basis Data Relasional</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 w-full">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-left">
                    Mata Pelajaran Kunci:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 w-full">
                    {specializations[0].features.map((feature, i) => {
                      const icons = [
                        <Terminal className="h-4 w-4 text-blue-500 shrink-0" key={0} />,
                        <Globe className="h-4 w-4 text-blue-500 shrink-0" key={1} />,
                        <Smartphone className="h-4 w-4 text-blue-500 shrink-0" key={2} />,
                        <Database className="h-4 w-4 text-blue-500 shrink-0" key={3} />,
                        <GitBranch className="h-4 w-4 text-blue-500 shrink-0" key={4} />
                      ];
                      return (
                        <li key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 hover:border-blue-500/20 hover:bg-blue-500/[0.02] transition-colors">
                          {icons[i] || <Code className="h-4 w-4 text-blue-500 shrink-0" />}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex items-center justify-between relative z-10 w-full">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Pilar Rekayasa Lunak & Web</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 sm:p-8 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all duration-300 flex flex-col justify-between">
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <img 
                  src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600" 
                  alt="Computer Network Visual illustration" 
                  className="w-full h-full object-cover opacity-15 dark:opacity-10 transition-transform duration-500 group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/90 to-white dark:via-slate-950/90 dark:to-slate-950" />
              </div>
              
              <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
                <div className="inline-flex rounded-xl bg-cyan-500/5 p-3 text-cyan-500 dark:text-cyan-400 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-700 shadow-sm transition-all duration-300 group-hover:border-cyan-500 dark:group-hover:border-cyan-400">
                  <Network className="h-8 w-8" />
                </div>
                
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                    {specializations[1]?.name}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 inline-block font-sans">
                    {specializations[1]?.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                      <Network className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Kabel & Serat Optik</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                      <Sliders className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Perangkat Router</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                      <Server className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Server Linux</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                      <Shield className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Kontrol Akses</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 w-full">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-left">
                    Mata Pelajaran Kunci:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 w-full">
                    {specializations[1].features.map((feature, i) => {
                      const icons = [
                        <Activity className="h-4 w-4 text-cyan-500 shrink-0" key={0} />,
                        <Sliders className="h-4 w-4 text-cyan-500 shrink-0" key={1} />,
                        <Server className="h-4 w-4 text-cyan-500 shrink-0" key={2} />,
                        <Wifi className="h-4 w-4 text-cyan-500 shrink-0" key={3} />,
                        <Shield className="h-4 w-4 text-cyan-500 shrink-0" key={4} />
                      ];
                      return (
                        <li key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-colors">
                          {icons[i] || <Code className="h-4 w-4 text-cyan-500 shrink-0" />}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex items-center justify-between relative z-10 w-full">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Pilar Infrastruktur & Cisco</span>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* [Seksi Kuis] */}
      <section id="kuis-spesialisasi" className="scroll-mt-24 space-y-8">
        <ScrollReveal>
          <div className="relative group overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 sm:p-10 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300">
            <div className="space-y-8 relative">
              
              <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                <div className="inline-flex rounded-xl bg-blue-500/5 p-3 text-blue-600 dark:text-blue-400 border-2 border-slate-300 dark:border-slate-700 transition-all duration-300">
                  <Award className="h-8 w-8" />
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Uji Karakter Diagnostik Spesialisasi Anda
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 relative z-10 w-full">
                
                <a 
                  href="https://forms.gle/DPwiqncxS8qsoymw8"
                  target="_blank"
                  rel="noreferrer"
                  className="group/card rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 flex flex-col items-center justify-between text-center space-y-3 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/5 dark:hover:bg-blue-950/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col items-center space-y-2.5">
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover/card:scale-105 transition-transform duration-300">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tracking-wide">Minat Masa Depan</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Aspirasi karir dan pilihan teknologi masa depan Anda
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 group-hover/card:translate-x-0.5 transition-transform">
                    Isi Formulir <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                <a 
                  href="https://forms.gle/TaNzaAUJsoZSimAJ9"
                  target="_blank"
                  rel="noreferrer"
                  className="group/card rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 flex flex-col items-center justify-between text-center space-y-3 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/5 dark:hover:bg-blue-950/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col items-center space-y-2.5">
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover/card:scale-105 transition-transform duration-300">
                      <Sliders className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tracking-wide">Kecenderungan Adaptif</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Pengukuran tingkat fleksibilitas adaptasi teknologi baru
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 group-hover/card:translate-x-0.5 transition-transform">
                    Isi Formulir <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

                <a 
                  href="https://forms.gle/5u8gE3Ezoaw6NjC18"
                  target="_blank"
                  rel="noreferrer"
                  className="group/card rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 flex flex-col items-center justify-between text-center space-y-3 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/5 dark:hover:bg-blue-950/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col items-center space-y-2.5">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-500/10 p-2 sm:p-2.5 px-3 sm:px-4 rounded-xl group-hover/card:scale-105 transition-transform duration-300">
                      <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">vs</span>
                      <Network className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tracking-wide">SE vs NE</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Perbandingan rekayasa perangkat lunak vs infrastruktur jaringan
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 group-hover/card:translate-x-0.5 transition-transform">
                    Isi Formulir <ArrowRight className="h-3 w-3" />
                  </span>
                </a>

              </div>

              <div className="relative border-2 border-slate-300 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 rounded-2xl p-5 sm:p-8 pt-8 relative z-10 w-full">
                <span className="absolute -top-3 left-6 sm:left-8 px-3 py-1 text-[9px] sm:text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-md uppercase">
                  KETENTUAN PENGUJIAN:
                </span>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-6 relative">
                  
                  <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className="flex items-center gap-2 relative">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                        1
                      </div>
                      <div className="p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Gunakan Tautan Resmi</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">(TKJT AMI)</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className="flex items-center gap-2 relative">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400">
                        2
                      </div>
                      <div className="p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Key className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Login Form</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Murid / Orang Tua</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className="flex items-center gap-2 relative">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400">
                        3
                      </div>
                      <div className="p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Selesai Evaluasi</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">(Otomatis Sistem)</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400">
                        4
                      </div>
                      <div className="p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Sinkronisasi Tim Kurikulum</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sistem Integrasi Lab</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-4 flex justify-center relative z-10">
                <button
                  onClick={handleStartDiagnostic}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  Mulai Diagnostik Sekarang
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* [Seksi Kontak] */}
      <section id="hubungi-kami" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hubungi Pusat Informasi TKJT
          </h2>
          <div className="h-1.5 w-16 bg-blue-500 rounded-full mx-auto" />
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Mari jalin komunikasi intensif dengan kami untuk seputar penerimaan murid baru, kemitraan industri, maupun kunjungan lab.
          </p>
        </div>

        <ScrollReveal>
          <div className="relative max-w-5xl mx-auto">
            <div 
              ref={scrollContainerRef}
              onScroll={handleContactScroll}
              className="flex md:grid flex-row md:grid-cols-3 overflow-x-auto md:overflow-visible pb-6 md:pb-0 gap-6 snap-x snap-mandatory scrollbar-none justify-start md:justify-center [webkit-overflow-scrolling:touch] overscroll-x-contain px-4 md:px-0"
            >
              {contacts.map((contact) => (
                <motion.div 
                  key={contact.id} 
                  role="button"
                  tabIndex={0}
                  onClick={() => handleContactClick(contact.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleContactClick(contact.id);
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 flex flex-col justify-between space-y-4 snap-center shrink-0 w-[290px] md:w-auto md:shrink cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 isolate"
                >
                  <div 
                    className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[22px]"
                    style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                  >
                    <img 
                      src={getContactBgImage(contact.id)} 
                      alt="" 
                      className="w-full h-full object-cover object-center opacity-20 dark:opacity-10 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:opacity-30 dark:group-hover:opacity-20 rounded-[22px]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/85 to-white dark:from-slate-950/20 dark:via-slate-950/85 dark:to-slate-950 rounded-[22px]" />
                  </div>

                  <div className="space-y-3 w-full relative z-10">
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-3 transition-all duration-300 group-hover:bg-blue-500/15 group-hover:border-blue-500/30 backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
                      <div className="transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-0.5">
                        {getContactIcon(contact.icon)}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      {contact.title}
                    </h3>
                    <p className="text-base font-black text-slate-800 dark:text-slate-100 overflow-hidden text-ellipsis bubble-text">
                      {contact.value}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800 w-full relative z-10">
                    {contact.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* [Seksi FAQ] */}
      <section id="faq-section" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tanya & Jawab (FAQ)
          </h2>
          <div className="h-1.5 w-16 bg-blue-500 rounded-full mx-auto" />
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Segala pertanyaan mendasar tentang status, kurikulum, dan fasilitas TKJT SMK Mitra Industri terjawab secara utuh.
          </p>
        </div>

        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-950 overflow-hidden transition-all duration-310"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between px-6 py-4.5 text-left font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 select-none group cursor-pointer"
                  >
                    <span className="flex items-center gap-3 pr-4">
                      <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown 
                      className={`h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-transform duration-250 flex-shrink-0 ${
                        isOpen ? "rotate-180 text-blue-500" : ""
                      }`} 
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-slate-100 dark:border-slate-900"
                      >
                        <div className="px-6 py-5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                          {faq.answer.map((para, i) => {
                            const trimmed = para.trim();
                            if (trimmed.startsWith('-')) {
                              return (
                                <div key={i} className="flex items-start gap-2 ml-4 text-slate-600 dark:text-slate-300">
                                  <span className="text-blue-500 font-bold select-none">•</span>
                                  <span>{trimmed.substring(1).trim()}</span>
                                </div>
                              );
                            }
                            return (
                              <p key={i} className="text-slate-500 dark:text-slate-400">
                                {para}
                              </p>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* [Modal Diagnostik] */}
      <Modal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        title={isDiagnosticCompleted ? "Diagnostik Selesai!" : "Pengujian Diagnostik Spesialisasi"}
        subtitle={isDiagnosticCompleted ? "Selamat, Anda telah menyelesaikan seluruh rangkaian pengujian" : "Lengkapi semua formulir di bawah ini secara berurutan"}
        icon={isDiagnosticCompleted ? <CheckCircle className="h-6 w-6 text-green-500 animate-bounce" /> : <Award className="h-6 w-6 text-blue-500" />}
        maxWidth="lg"
      >
        {isDiagnosticCompleted ? (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border-2 border-green-500/20 shadow-lg shadow-green-500/10">
                <CheckCircle className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-800 dark:text-white">Rangkaian Pengujian Telah Lengkap!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Terima kasih telah berpartisipasi aktif dalam pengujian diagnostik spesialisasi. Data jawaban Anda telah tersimpan dengan aman pada sistem kurikulum kami.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left text-xs text-slate-500 dark:text-slate-400 space-y-1.5 max-w-md mx-auto">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[10px] block text-center border-b border-slate-200/60 dark:border-slate-800 pb-1.5 mb-1.5">Langkah Sinkronisasi Selanjutnya</span>
              <p>• Data diolah oleh Tim Kurikulum TKJT untuk pemetaan minat belajar.</p>
              <p>• Rekomendasi spesialisasi akan diperbarui di dashboard profil belajar Anda secara berkala.</p>
              <p>• Jika memerlukan konsultasi lebih lanjut, silakan hubungi wali kelas atau pembimbing jurusan di pusat informasi lab.</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDiagnosticModalOpen(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-[0.97]"
              >
                Tutup & Kembali ke Beranda
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px]">
                  Tahap {currentDiagnosticStep + 1} dari {DIAGNOSTIC_STEPS.length}
                </span>
                <span className="font-bold text-slate-400 dark:text-slate-500">
                  {Math.round(((currentDiagnosticStep + 1) / DIAGNOSTIC_STEPS.length) * 100)}% Selesai
                </span>
              </div>
              
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentDiagnosticStep + 1) / DIAGNOSTIC_STEPS.length) * 100}%` }}
                />
              </div>

              <div className="flex justify-between gap-1 pt-1">
                {DIAGNOSTIC_STEPS.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx < currentDiagnosticStep 
                        ? 'bg-blue-500' 
                        : idx === currentDiagnosticStep 
                        ? 'bg-blue-400 animate-pulse' 
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-4">
              <div className="space-y-1">
                <div className="inline-flex px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider">
                  TAHAP {currentDiagnosticStep + 1}: {DIAGNOSTIC_STEPS[currentDiagnosticStep].title}
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  {DIAGNOSTIC_STEPS[currentDiagnosticStep].title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                  {DIAGNOSTIC_STEPS[currentDiagnosticStep].description}
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {DIAGNOSTIC_STEPS[currentDiagnosticStep].longDesc}
              </p>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-500/5 text-amber-800 dark:text-amber-400 text-[11px] leading-normal">
                <span className="font-black text-amber-500 mt-0.5">⚠️</span>
                <span>
                  <strong>Wajib dikerjakan dari awal:</strong> Anda harus membuka tautan formulir di bawah ini agar dapat melanjutkan ke tahap pengujian selanjutnya.
                </span>
              </div>

              <div className="pt-2 flex justify-center">
                <a
                  href={DIAGNOSTIC_STEPS[currentDiagnosticStep].url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setHasOpenedCurrentForm(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  Buka Formulir Google: {DIAGNOSTIC_STEPS[currentDiagnosticStep].title}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 gap-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                disabled={currentDiagnosticStep === 0}
                onClick={() => {
                  if (currentDiagnosticStep > 0) {
                    setCurrentDiagnosticStep(prev => prev - 1);
                    setHasOpenedCurrentForm(true); 
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  currentDiagnosticStep === 0
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed bg-transparent'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 active:scale-[0.97] cursor-pointer'
                }`}
              >
                Kembali
              </button>

              <button
                type="button"
                disabled={!hasOpenedCurrentForm}
                onClick={() => {
                  if (currentDiagnosticStep < DIAGNOSTIC_STEPS.length - 1) {
                    setCurrentDiagnosticStep(prev => prev + 1);
                    setHasOpenedCurrentForm(false);
                  } else {
                    setIsDiagnosticCompleted(true);
                  }
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all ${
                  !hasOpenedCurrentForm
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
                    : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.97] cursor-pointer border border-transparent'
                }`}
              >
                {currentDiagnosticStep === DIAGNOSTIC_STEPS.length - 1 
                  ? "Selesai & Kirim Jawaban" 
                  : "Saya Sudah Mengisi & Lanjut"}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
