import { motion } from "motion/react";
import { ArrowLeft, Code, Heart, Shield, Cpu } from "lucide-react";

interface KontributorProps {
  setActiveTab: (tab: string) => void;
}

export default function Kontributor({ setActiveTab }: KontributorProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-10"
      >
        <div>
          <button
            onClick={() => setActiveTab("beranda")}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl text-blue-500">
            <Cpu className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Kontributor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Apresiasi dan dedikasi kepada tim pengembang website Teknik Komputer
            Jaringan & Telekomunikasi (TKJT) SMK Ananda Mitra Industri Deltamas.
          </p>
          <div className="h-1 w-20 bg-blue-500 rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-6 sm:p-8 space-y-6 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-400">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Shield className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Pembimbing & Penasihat
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col transition-colors duration-200 hover:border-blue-500/30">
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Andre Ary Sukma, S.Kom.
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  Kepala Jurusan TKJT
                </span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col transition-colors duration-200 hover:border-blue-500/30">
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Retno Ariyanti Nurningtias, S.Pd.
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  Guru Produktif TKJT
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-6 sm:p-8 space-y-6 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-400">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Code className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Tim Pengembang & Kreatif
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1 transition-colors duration-200 hover:border-blue-500/30">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono block">
                  Pengembang Website (Web Developer)
                </span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Favian Zufar Niardi{" "}
                  <span className="text-xs text-slate-400 font-medium">
                    (TKJT 1)
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 transition-colors duration-200 hover:border-blue-500/30">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono block pb-1 border-b border-slate-200 dark:border-slate-900">
                  Peneliti Aset & Data
                </span>
                <ul className="space-y-2">
                  <li className="text-sm font-bold text-slate-800 dark:text-slate-100 flex justify-between items-center">
                    <span>Abhinaya Faiz Bahiscara</span>
                    <span className="text-xs text-slate-400 font-medium">
                      (TKJT 1)
                    </span>
                  </li>
                  <li className="text-sm font-bold text-slate-800 dark:text-slate-100 flex justify-between items-center border-t border-slate-200 dark:border-slate-900 pt-2">
                    <span>Andante Akmal Alvaro</span>
                    <span className="text-xs text-slate-400 font-medium">
                      (TKJT 1)
                    </span>
                  </li>
                  <li className="text-sm font-bold text-slate-800 dark:text-slate-100 flex justify-between items-center border-t border-slate-200 dark:border-slate-900 pt-2">
                    <span>Hisyam Hasbillah Hakim</span>
                    <span className="text-xs text-slate-400 font-medium">
                      (TKJT 1)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-6 sm:p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl">
            <Heart className="h-5 w-5 animate-pulse fill-rose-500/20" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Apresiasi Khusus
          </h3>
          <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
            Terima kasih kepada seluruh siswa-siswi TKJT atas dukungan,
            kontribusi, dan semangat kebersamaan yang diberikan selama jalannya
            proyek ini.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
