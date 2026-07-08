import React, { useState, useRef, useEffect, ReactNode } from "react";
import { Image as ImageIcon, Plus, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
const staticGallery: GalleryItem[] = [];
const toRawUrl = (url: string) =>
  url.replace(/github\.com\/([^/]+)\/([^/]+)\/blob\//, 'raw.githubusercontent.com/$1/$2/');
import LazyImage from "../features/lazy_image";
import Modal from "../features/modal";
import Button from "../features/button";
import { GalleryItem } from "../../types";

// [Animasi Guliran]
function ScrollReveal({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-95 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}

// [Props]
interface GaleriProps {
  galleryItemsState?: GalleryItem[];
  setGalleryItemsState?: (newGallery: GalleryItem[]) => void;
  isLoggedIn?: boolean;
  userSession?: any;
  onSave?: (updatedGallery: GalleryItem[]) => Promise<boolean>;
  triggerToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function Galeri({
  galleryItemsState,
  setGalleryItemsState,
  isLoggedIn = false,
  userSession = null,
  onSave,
  triggerToast,
}: GaleriProps = {}) {
  const activeGallery = galleryItemsState || staticGallery;

  // [State]
  const [displayCount, setDisplayCount] = useState<number>(6);
  const [focusedItem, setFocusedItem] = useState<GalleryItem | null>(null);

  const visibleItems = activeGallery.slice(0, displayCount);
  const hasMore = activeGallery.length > displayCount;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGalleryForEdit, setSelectedGalleryForEdit] =
    useState<GalleryItem | null>(null);
  const [deleteGalleryItem, setDeleteGalleryItem] =
    useState<GalleryItem | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formPhoto, setFormPhoto] = useState("");

  // [Infinite Scroll]
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => prev + 6);
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.1,
      },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  // [Handler Tambah]
  const openAddModal = () => {
    setFormTitle("");
    setFormPhoto("");
    setIsAddModalOpen(true);
  };

  const isValidPhotoUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPhoto.trim()) return;
    if (!isValidPhotoUrl(formPhoto.trim())) {
      if (triggerToast) triggerToast("URL foto harus berupa link HTTP/HTTPS yang valid!", "error");
      return;
    }

    const newId =
      activeGallery.length > 0
        ? Math.max(...activeGallery.map((g) => g.id)) + 1
        : 1;
    const newGalleryItem: GalleryItem = {
      id: newId,
      title: formTitle.trim(),
      photo: formPhoto.trim(),
    };

    const updatedGallery = [...activeGallery, newGalleryItem];

    try {
      if (onSave) {
        const success = await onSave(updatedGallery);
        if (success) {
          if (setGalleryItemsState) setGalleryItemsState(updatedGallery);
          if (triggerToast)
            triggerToast("Dokumentasi berhasil ditambahkan!", "success");
        } else {
          if (triggerToast)
            triggerToast("Gagal menambahkan dokumentasi.", "error");
        }
      } else if (setGalleryItemsState) {
        setGalleryItemsState(updatedGallery);
        if (triggerToast)
          triggerToast("Dokumentasi berhasil ditambahkan!", "success");
      }
    } catch {
      if (triggerToast) triggerToast("Gagal menambahkan dokumentasi.", "error");
    }

    setIsAddModalOpen(false);
  };

  // [Handler Edit]
  const openEditModal = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGalleryForEdit(item);
    setFormTitle(item.title);
    setFormPhoto(item.photo);
    setIsEditModalOpen(true);
  };

  const handleEditGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGalleryForEdit || !formTitle.trim() || !formPhoto.trim())
      return;
    if (!isValidPhotoUrl(formPhoto.trim())) {
      if (triggerToast) triggerToast("URL foto harus berupa link HTTP/HTTPS yang valid!", "error");
      return;
    }

    const updatedGallery = activeGallery.map((g) => {
      if (g.id === selectedGalleryForEdit.id) {
        return {
          ...g,
          title: formTitle.trim(),
          photo: formPhoto.trim(),
        };
      }
      return g;
    });

    try {
      if (onSave) {
        const success = await onSave(updatedGallery);
        if (success) {
          if (setGalleryItemsState) setGalleryItemsState(updatedGallery);
          if (triggerToast)
            triggerToast("Dokumentasi berhasil diubah!", "success");
        } else {
          if (triggerToast) triggerToast("Gagal mengubah dokumentasi.", "error");
        }
      } else if (setGalleryItemsState) {
        setGalleryItemsState(updatedGallery);
        if (triggerToast) triggerToast("Dokumentasi berhasil diubah!", "success");
      }
    } catch {
      if (triggerToast) triggerToast("Gagal mengubah dokumentasi.", "error");
    }

    setIsEditModalOpen(false);
    setSelectedGalleryForEdit(null);
  };

  // [Handler Hapus]
  const handleDeleteGallery = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteGalleryItem(item);
  };

  const isAdmin = isLoggedIn && userSession?.role === "admin";

  // [Render]
  return (
    <div className="space-y-12 pb-16 font-sans">
      <ScrollReveal>
        <div className="overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-3 sm:space-y-4 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Video Profil Jurusan TKJT
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-black aspect-video w-full shadow-inner">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/utBPuUL7bxU"
              title="Video Dokumentasi & Pengenalan TKJT"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </ScrollReveal>

      <div className="border-b-2 border-slate-300 dark:border-slate-700 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-blue-500" />
            Galeri Dokumentasi Kegiatan TKJT
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sajian visual kegiatan laboratorium perkabelan, perakitan server,
            hackathon rekayasa code, dan kemitraan eksternal.
          </p>
        </div>

        {isAdmin && (
          <div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer active:scale-95 transition-all border-2 border-transparent"
            >
              <Plus className="h-4 w-4" />
              Tambah Foto Galeri
            </button>
          </div>
        )}
      </div>

      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-950/20">
              Belum ada foto dokumentasi yang dimasukkan ke dalam database.
            </div>
          ) : (
            visibleItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setFocusedItem(item)}
                className="group relative overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col space-y-4 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 cursor-pointer"
              >
                {isAdmin && (
                  <div className="absolute top-5 right-5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(item, e)}
                      className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition active:scale-90 border-2 border-transparent"
                      title="Ubah Data"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteGallery(item, e)}
                      className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg cursor-pointer transition active:scale-90 border-2 border-transparent"
                      title="Hapus"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="relative overflow-hidden rounded-2xl h-48 sm:h-56 border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <LazyImage
                    src={toRawUrl(item.photo)}
                    alt={item.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    containerClassName="w-full h-full"
                  />
                </div>

                <div className="px-1 py-1 flex flex-col justify-between flex-1">
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      © {new Date().getFullYear()} TKJT AMI. Hak Cipta
                      Dilindungi.
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-900 mt-3.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold">
                      Arsip Resmi TKJT AMI
                    </span>
                    <span className="text-blue-500 font-black tracking-wider uppercase font-mono">
                      Terverifikasi
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex flex-col items-center justify-center py-10 gap-2.5 border-t border-slate-200 dark:border-slate-800 mt-8"
          >
            <div className="h-6 w-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase animate-pulse">
              Memuat arsip dokumentasi lainnya...
            </span>
          </div>
        )}
      </ScrollReveal>

      <AnimatePresence>
        {focusedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 sm:p-6"
            onClick={() => setFocusedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-4 sm:p-6 overflow-hidden flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 flex-1 max-h-[60vh] flex items-center justify-center">
                <img
                  src={toRawUrl(focusedItem.photo)}
                  alt={focusedItem.title}
                  className="w-full h-full object-contain max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] rounded-xl"
                />
              </div>

              <div className="space-y-4 px-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {focusedItem.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    © {new Date().getFullYear()} TKJT AMI. Hak Cipta Dilindungi.
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed hidden sm:block">
                  Dokumentasi resmi program kompetensi keahlian Teknik Komputer
                  Jaringan dan Telekomunikasi (TKJT) SMK Ananda Mitra Industri
                  Deltamas dalam mempersiapkan talenta unggulan industri
                  berstandar global.
                </p>

                <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Arsip Terverifikasi TKJT AMI
                  </span>

                  <button
                    type="button"
                    onClick={() => setFocusedItem(null)}
                    className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Tutup Gambar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Foto Galeri"
        subtitle="Formulir pencatatan dokumentasi kegiatan TKJT."
        icon={<Plus className="h-6 w-6" />}
      >
        <form onSubmit={handleAddGallery} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Judul Dokumentasi:
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Praktikum Server Linux Debian"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tautan Gambar (URL Unsplash atau Lainnya):
            </label>
            <input
              type="url"
              required
              maxLength={500}
              placeholder="https://images.unsplash.com/photo-..."
              value={formPhoto}
              onChange={(e) => setFormPhoto(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              className="w-1/3"
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-2/3">
              Simpan Dokumentasi
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGalleryForEdit(null);
        }}
        title="Ubah Foto Galeri"
        subtitle="Formulir penyesuaian detail dokumentasi kegiatan."
        icon={<Edit className="h-6 w-6" />}
      >
        <form onSubmit={handleEditGallery} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Judul Dokumentasi:
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Praktikum Server Linux Debian"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tautan Gambar (URL):
            </label>
            <input
              type="url"
              required
              maxLength={500}
              placeholder="https://images.unsplash.com/photo-..."
              value={formPhoto}
              onChange={(e) => setFormPhoto(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedGalleryForEdit(null);
              }}
              className="w-1/3"
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-2/3">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteGalleryItem !== null}
        onClose={() => setDeleteGalleryItem(null)}
        title="Konfirmasi Hapus"
        subtitle="Apakah Anda yakin ingin menghapus dokumentasi ini?"
        icon={<Trash2 className="h-6 w-6 text-rose-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-center">
            Tindakan ini akan menghapus dokumentasi{" "}
            <strong className="text-slate-900 dark:text-white">
              "{deleteGalleryItem?.title}"
            </strong>{" "}
            secara permanen.
          </p>
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteGalleryItem(null)}
              className="w-1/2"
            >
              Batal
            </Button>
<Button
                variant="danger"
                onClick={async () => {
                  if (!deleteGalleryItem) return;
                  const updatedGallery = activeGallery.filter(
                    (g) => g.id !== deleteGalleryItem.id,
                  );
                  try {
                    if (onSave) {
                      const success = await onSave(updatedGallery);
                      if (success) {
                        if (setGalleryItemsState)
                          setGalleryItemsState(updatedGallery);
                        if (triggerToast)
                          triggerToast("Dokumentasi berhasil dihapus!", "success");
                      } else {
                        if (triggerToast)
                          triggerToast("Gagal menghapus dokumentasi.", "error");
                      }
                    } else if (setGalleryItemsState) {
                      setGalleryItemsState(updatedGallery);
                      if (triggerToast)
                        triggerToast("Dokumentasi berhasil dihapus!", "success");
                    }
                  } catch {
                    if (triggerToast) triggerToast("Gagal menghapus dokumentasi.", "error");
                  }
                  setDeleteGalleryItem(null);
                }}
                className="w-1/2"
              >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
