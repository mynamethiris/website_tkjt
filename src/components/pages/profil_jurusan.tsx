import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import staticStudents from "../../../data/students.json";
import teachersData from "../../../data/teachers.json";
import LazyImage from "../features/lazy_image";
import { Student } from "../../types";
const teachers = teachersData as any[];

// [Animasi gulir]
function ScrollReveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// [Spesialisasi]
const getSpecialization = (roleText?: string): string | null => {
  if (!roleText || !roleText.trim()) return null;
  return roleText.trim();
};

interface ProfilProps {
  studentsState?: Student[];
}

// [Komponen utama]
export default function Profil({ studentsState }: ProfilProps = {}) {
  const activeStudents = studentsState || staticStudents;

  // [State filter]
  const [selectedAngkatan, setSelectedAngkatan] = useState<number>(8);
  const [selectedKelas, setSelectedKelas] = useState<string>("TKJT 1");
  const [activeTeacherIndex, setActiveTeacherIndex] = useState(0);

  const handleNextTeacher = () => {
    setActiveTeacherIndex((prev) => (prev + 1) % teachers.length);
  };

  const handlePrevTeacher = () => {
    setActiveTeacherIndex(
      (prev) => (prev - 1 + teachers.length) % teachers.length,
    );
  };

  const currentTeacher = teachers[activeTeacherIndex] || teachers[0];

  const availableAngkatans = Array.from(
    new Set(activeStudents.map((s) => s.angkatan)),
  ).sort((a, b) => a - b);

  const availableKelas = Array.from(
    new Set(
      activeStudents
        .filter((s) => s.angkatan === selectedAngkatan)
        .map((s) => s.kelas),
    ),
  ).sort();

  useEffect(() => {
    if (
      availableAngkatans.length > 0 &&
      !availableAngkatans.includes(selectedAngkatan)
    ) {
      setSelectedAngkatan(availableAngkatans[0]);
    }
  }, [activeStudents, availableAngkatans, selectedAngkatan]);

  useEffect(() => {
    if (availableKelas.length > 0 && !availableKelas.includes(selectedKelas)) {
      setSelectedKelas(availableKelas[0]);
    }
  }, [selectedAngkatan, availableKelas, selectedKelas]);

  const filteredStudents = activeStudents.filter(
    (student) =>
      student.angkatan === selectedAngkatan && student.kelas === selectedKelas,
  );

  return (
    <div className="space-y-24 pb-16 font-sans">
      {/* [Profil guru] */}
      <section className="scroll-mt-24">
        <ScrollReveal>
          <div className="rounded-3xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-300 p-6 sm:p-10 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center col-span-12">
              {/* [Foto guru] */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative group max-w-sm w-full">
                  <div className="relative rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden p-3 transition-colors duration-300 group-hover:border-blue-500 dark:group-hover:border-blue-400">
                    <div className="relative h-80 sm:h-96 w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentTeacher.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0 w-full h-full"
                        >
                          <LazyImage
                            src={currentTeacher.photo}
                            alt={currentTeacher.name}
                            className="w-full h-full object-cover rounded-[20px] filter grayscale-[15%] hover:grayscale-0 transition duration-305"
                            containerClassName="w-full h-full rounded-[20px]"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* [Navigasi guru] */}
                    <div className="absolute inset-y-0 left-5 right-5 flex items-center justify-between pointer-events-none z-20">
                      <button
                        type="button"
                        onClick={handlePrevTeacher}
                        className="h-10 w-10 rounded-full bg-slate-900/60 hover:bg-blue-600 backdrop-blur-md text-white flex items-center justify-center border-2 border-white/10 dark:border-slate-800/40 hover:border-blue-500 pointer-events-auto transition-all active:scale-95 duration-200 cursor-pointer shadow-lg"
                        title="Sebelumnya"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextTeacher}
                        className="h-10 w-10 rounded-full bg-slate-900/60 hover:bg-blue-600 backdrop-blur-md text-white flex items-center justify-center border-2 border-white/10 dark:border-slate-800/40 hover:border-blue-500 pointer-events-auto transition-all active:scale-95 duration-200 cursor-pointer shadow-lg"
                        title="Selanjutnya"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* [Indikator slide] */}
                <div className="flex gap-2.5 mt-4">
                  {teachers.map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTeacherIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        activeTeacherIndex === idx
                          ? "w-6 bg-blue-500"
                          : "w-2 bg-slate-300 dark:bg-slate-700"
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* [Info guru] */}
              <div className="lg:col-span-7 space-y-6 flex flex-col justify-center items-center text-center h-full min-h-[220px]">
                <div className="space-y-4 flex flex-col items-center">
                  <div className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-500">
                    <Sparkles className="h-4 w-4 mr-1.5 inline-block text-amber-500" />
                    Profil Guru & Pimpinan Jurusan
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTeacher.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3 relative z-10 text-center"
                    >
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {currentTeacher.name}
                      </h4>
                      <p className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-blue-650 dark:text-blue-400">
                        {currentTeacher.role}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* [Daftar murid] */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-2 text-slate-500">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daftar Murid TKJT
          </h2>
          <div className="h-1.5 w-16 bg-blue-500 rounded-full mx-auto" />
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Gunakan tombol penyaring di bawah untuk memilih angkatan dan kelas
            murid guna menampilkan informasi profil murid.
          </p>
        </div>

        {/* [Filter angkatan & kelas] */}
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 shadow-sm">
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
              Pilih Angkatan:
            </span>
            <div className="relative bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl flex w-full">
              {availableAngkatans.length === 0 ? (
                <span className="text-xs text-slate-400 p-2 w-full text-center">
                  Tidak ada angkatan
                </span>
              ) : (
                availableAngkatans.map((gen) => {
                  const isActive = selectedAngkatan === gen;
                  return (
                    <button
                      key={gen}
                      type="button"
                      onClick={() => setSelectedAngkatan(gen)}
                      className="flex-1 relative py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors duration-200 focus:outline-none cursor-pointer z-10"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-angkatan-bg"
                          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span
                        className={
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        Angkatan {gen}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
              Pilih Kelas:
            </span>
            <div className="relative bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl flex w-full">
              {availableKelas.length === 0 ? (
                <span className="text-xs text-slate-400 p-2 w-full text-center">
                  Tidak ada kelas
                </span>
              ) : (
                availableKelas.map((cls) => {
                  const isActive = selectedKelas === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedKelas(cls)}
                      className="flex-1 relative py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors duration-200 focus:outline-none cursor-pointer z-10"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-kelas-bg"
                          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span
                        className={
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        {cls}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* [Grid murid] */}
        <ScrollReveal>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedAngkatan}-${selectedKelas}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {filteredStudents.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-950/25">
                  Belum ada data murid untuk kelas {selectedKelas} Angkatan{" "}
                  {selectedAngkatan}.
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-hidden">
                  {filteredStudents.map((student, index) => (
                    <motion.div
                      layout
                      key={student.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        ease: "easeOut",
                        delay: index * 0.02,
                      }}
                      className={`group relative flex flex-col rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden ${
                        student.photo ? "aspect-[3/4]" : ""
                      }`}
                    >
                      {student.photo && (
                        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative pt-6">
                          <LazyImage
                            src={student.photo}
                            alt={student.name}
                            className="w-full h-full object-contain object-bottom"
                            containerClassName="w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="p-4 bg-slate-50 dark:bg-slate-900 shrink-0">
                        <p className="font-display text-[15px] sm:text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight break-words">
                          {student.name}
                        </p>
                        {(() => {
                          const spec = getSpecialization(student.role);
                          if (!spec) return null;
                          return (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {spec}
                            </span>
                          );
                        })()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollReveal>
      </section>
    </div>
  );
}
