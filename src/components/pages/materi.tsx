// Komponen Halaman Materi TKJT
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  FileText,
  Play,
  ExternalLink,
  FileText as FileTextIcon,
  Video,
  Link2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TKJTMateri } from '../../types';
import Modal from '../features/modal';
import Button from '../features/button';
import Dropdown from '../features/dropdown';

interface MateriProps {
  isLoggedIn: boolean;
  userSession?: {
    username: string;
    role: 'admin' | 'piket' | 'tamu';
  } | null;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  materiList: TKJTMateri[];
  setMateriList: (list: TKJTMateri[]) => void;
  onSave: (data: TKJTMateri[]) => Promise<boolean>;
  onLoginRequest: () => void;
}

const contentTypes = [
  { value: 'html', label: 'Teks/Markdown', icon: FileTextIcon, desc: 'Konten teks dengan tautan' },
] as const;

const defaultCategories = [
  'Jaringan Dasar',
  'Administrasi Server',
  'Pemrograman Web',
  'Hardware/Troubleshooting',
  'Keamanan Jaringan',
  'Instalasi LAN/WAN',
  'Serat Optik',
];

export default function Materi({
  isLoggedIn,
  userSession,
  triggerToast,
  materiList,
  setMateriList,
  onSave,
  onLoginRequest,
}: MateriProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TKJTMateri | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TKJTMateri | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContentType, setFormContentType] = useState<'html' | 'pdf' | 'video' | 'link'>('html');
  const [formContent, setFormContent] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');

  const isAdmin = userSession?.role === 'admin';

  const availableCategories = Array.from(
    new Set(materiList.map((m) => m.category)),
  );

  const allCategories = Array.from(new Set([...defaultCategories, ...availableCategories]));

  const filteredMateri = materiList
    .filter((m) => {
      const matchesSearch =
        !searchTerm ||
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.order - b.order);

  const handleSave = async (items: TKJTMateri[]) => {
    const success = await onSave(items);
    if (!success) setMateriList(items);
  };

  const handleOpenModal = (item?: TKJTMateri) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormCategory(item.category);
      setFormDescription(item.description || '');
      setFormContentType(item.contentType);
      setFormContent(item.content || '');
      setFormFileUrl(item.fileUrl || '');
      setFormVideoUrl(item.videoEmbedUrl || '');
      setFormLinkUrl(item.contentType === 'link' ? (item.fileUrl || item.content || '') : '');
    } else {
      setEditingItem(null);
      setFormTitle('');
      setFormCategory('');
      setFormDescription('');
      setFormContentType('html');
      setFormContent('');
      setFormFileUrl('');
      setFormVideoUrl('');
      setFormLinkUrl('');
    }
    setIsModalOpen(true);
  };

  const handleDelete = (item: TKJTMateri) => {
    setDeleteConfirm(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCategory) {
      triggerToast('Judul dan kategori wajib diisi!', 'error');
      return;
    }

    const order = editingItem ? editingItem.order : materiList.length;

    const itemData: TKJTMateri = {
      id: editingItem ? editingItem.id : `mat-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      description: formDescription.trim(),
      contentType: formContentType,
      content: formContentType === 'html' ? formContent : undefined,
      fileUrl:
        formContentType === 'pdf' ? formFileUrl : undefined,
      videoEmbedUrl:
        formContentType === 'video' ? formVideoUrl : undefined,
      order,
      createdAt: Date.now(),
    };

    if (editingItem) {
      const updated = materiList.map((m) =>
        m.id === editingItem.id ? itemData : m,
      );
      setMateriList(updated);
      handleSave(updated);
      triggerToast(`Materi "${formTitle}" berhasil diperbarui!`, 'success');
    } else {
      const newItems = [itemData, ...materiList];
      setMateriList(newItems);
      handleSave(newItems);
      triggerToast(`Materi "${formTitle}" berhasil ditambahkan!`, 'success');
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    );
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return url;
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Cari Materi:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                maxLength={50}
                placeholder="Cari judul atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kategori:</label>
            <Dropdown
              id="materi-filter-kategori"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: 'Semua', label: 'Semua Kategori' },
                ...allCategories.map((cat) => ({ value: cat, label: cat })),
              ]}
              placeholder="Semua Kategori"
            />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMateri.length === 0 ? (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">
              Belum ada materi untuk filter ini.
            </p>
          </div>
        ) : (
          filteredMateri.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500">
                  Teks/Markdown
                </span>

                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="p-1 rounded text-slate-400 hover:text-blue-500 cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                {item.title}
              </h3>

              {item.category && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded mr-auto mb-3">
                  {item.category}
                </span>
              )}

              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3 flex-1">
                  {item.description}
                </p>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-4 flex gap-2 flex-wrap">
                {item.contentType === 'html' && item.content && (
                  <button
                    type="button"
                    onClick={() => {
                      const contentWindow = window.open('', '_blank');
                      if (contentWindow) {
                        contentWindow.document.write(item.content || '');
                        contentWindow.document.close();
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-blue-500 hover:text-white cursor-pointer transition-all font-semibold"
                  >
                    Baca Materi
                  </button>
                )}

                {item.contentType === 'pdf' && item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white cursor-pointer transition-all font-semibold flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Buka PDF
                  </a>
                )}

                {item.contentType === 'video' && item.videoEmbedUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4';
                      modal.innerHTML = `
                        <div class="relative max-w-4xl w-full">
                          <iframe
                            class="w-full aspect-video rounded-2xl"
                            src="${getEmbedUrl(item.videoEmbedUrl || '')}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                          ></iframe>
                          <button class="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      `;
                      modal.onclick = () => modal.remove();
                      document.body.appendChild(modal);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white cursor-pointer transition-all font-semibold flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Tonton Video
                  </button>
                )}

                {item.contentType === 'link' && (item.fileUrl || item.content) && (
                  <a
                    href={item.fileUrl || item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-white cursor-pointer transition-all font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Buka Tautan
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Materi' : 'Tambah Materi Baru'}
        subtitle={editingItem ? 'Perbarui rincian modul belajar.' : 'Buat modul belajar baru untuk siswa TKJT.'}
        icon={<Plus className="h-6 w-6 text-blue-500" />}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Judul Materi:
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kategori:
              </label>
              <Dropdown
                id="materi-form-kategori"
                value={formCategory}
                onChange={setFormCategory}
                options={allCategories.map((cat) => ({ value: cat, label: cat }))}
                placeholder="Pilih kategori..."
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Deskripsi Singkat:
            </label>
            <textarea
              maxLength={300}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Ringkasan singkat materi ini..."
              className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Konten Materi (Markdown):
            </label>
            <textarea
              maxLength={5000}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={8}
              placeholder="Tulis materi di sini. Mendukung tautan gambar, video, dan markdown..."
              className="w-full text-xs font-mono rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="w-1/2">
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              {editingItem ? 'Simpan Perubahan' : 'Tambah Materi'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Konfirmasi Hapus"
        subtitle="Hapus materi ini secara permanen?"
        icon={<AlertTriangle className="h-6 w-6 text-rose-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500">
            Materi <strong className="text-slate-800 dark:text-white">"{deleteConfirm?.title}"</strong>{' '}
            akan dihapus.
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="w-1/2">
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirm) {
                  const updated = materiList.filter((m) => m.id !== deleteConfirm.id);
                  setMateriList(updated);
                  handleSave(updated);
                  triggerToast(`Materi "${deleteConfirm.title}" berhasil dihapus!`, 'success');
                  setDeleteConfirm(null);
                }
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
