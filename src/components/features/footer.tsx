import { Globe, Instagram, ShieldCheck } from "lucide-react";

interface FooterProps {
  id?: string;
  isDarkMode: boolean;
}

export default function Footer({ id, isDarkMode }: FooterProps) {
  return (
    <footer
      id={id}
      className={`border-t-2 font-sans transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8
        ${
          isDarkMode
            ? "bg-slate-950 border-slate-700 text-slate-400"
            : "bg-slate-50 border-slate-300 text-slate-600"
        }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="flex flex-col space-y-4 max-w-xl text-left">
            <div>
              <span className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-wider">
                TKJT SMK AMI
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Mendidik Tenaga Profesional Bidang Sistem Jaringan &
                Perekayasaan Perangkat Lunak.
              </p>
            </div>

            <div className="font-mono text-xs font-semibold text-blue-500">
              SMK Ananda Mitra Industri Deltamas, Luar Biasa.
            </div>

            <div className="flex flex-wrap gap-4 pt-1 items-center">
              <a
                href="https://smkind-deltamas.sch.id"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:scale-105"
              >
                <Globe className="h-3.5 w-3.5" />
                Website SMK
              </a>
              <a
                href="https://www.instagram.com/smkami_deltamas"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 hover:border-pink-500 hover:text-pink-500 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:scale-105"
              >
                <Instagram className="h-3.5 w-3.5" />
                Instagram SMK
              </a>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Kurikulum Industri Terverifikasi</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              &copy; {new Date().getFullYear()} TKJT SMK AMI. Hak Cipta
              Dilindungi.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
