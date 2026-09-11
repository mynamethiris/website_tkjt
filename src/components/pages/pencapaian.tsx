// Komponen Halaman Pencapaian TKJT
import React, { useState, useEffect } from 'react';
import {
  Award,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  Calendar,
  Target,
  BookOpen,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PencapaianTKJT, Student } from '../../types';
import Modal from '../features/modal';
import Button from '../features/button';
import Dropdown from '../features/dropdown';
import DatePicker from '../features/date_picker';
import { getKelasOptionsForAngkatan, formatTanggalIndo, getTodayISO } from '../../utils';

interface PencapaianProps {
  isLoggedIn: boolean;
  userSession?: {
    username: string;
    role: 'admin' | 'piket' | 'tamu';
    kelas?: string;
    angkatan?: number;
  } | null;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  pencapaianList: PencapaianTKJT[];
  setPencapaianList: (list: PencapaianTKJT[]) => void;
  onSave: (data: PencapaianTKJT[]) => Promise<boolean>;
  onLoginRequest: () => void;
  studentsState?: Student[];
}

const kategoriPencapaian = [
  { value: 'sertifikasi', label: 'Sertifikasi', icon: Award, color: 'text-amber-500' },
  { value: 'kompetensi', label: 'Kompetensi', icon: Target, color: 'text-blue-500' },
  { value: 'proyek', label: 'Proyek', icon: BookOpen, color: 'text-emerald-500' },
] as const;

export default function Pencapaian({
  isLoggedIn,
  userSession,
  triggerToast,
  pencapaianList,
  setPencapaianList,
  onSave,
  onLoginRequest,
  studentsState,
}: PencapaianProps) {
  const students: Student[] = studentsState ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [selectedAngkatan, setSelectedAngkatan] = useState<number | 'Semua'>('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PencapaianTKJT | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PencapaianTKJT | null>(null);

  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formKelas, setFormKelas] = useState('TKJT 1');
  const [, setFormAngkatan] = useState<number>(8);
  const [formCategory, setFormCategory] = useState<'sertifikasi' | 'kompetensi' | 'proyek'>('kompetensi');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');

  const isAdmin = userSession?.role === 'admin';

  const filteredPencapaian = pencapaianList.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKelas = selectedKelas === 'Semua' || item.kelas === selectedKelas;
    const matchesAngkatan = selectedAngkatan === 'Semua' || item.angkatan === selectedAngkatan;
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesKelas && matchesAngkatan && matchesCategory;
  });

  const handleSave = async (items: PencapaianTKJT[]) => {
    const success = await onSave(items);
    if (!success) setPencapaianList(items);
  };

  const handleOpenModal = (item?: PencapaianTKJT) => {
    if (item) {
      setEditingItem(item);
      setFormStudentName(item.studentName);
      setFormStudentId(item.studentId?.toString() || '');
      setFormKelas(item.kelas);
      setFormAngkatan(item.angkatan || 8);
      setFormCategory(item.category);
      setFormTitle(item.title);
      setFormDescription(item.description);
      setFormDate(item.date);
    } else {
      setEditingItem(null);
      setFormStudentName('');
      setFormStudentId('');
      setFormKelas(userSession?.kelas || 'TKJT 1');
      setFormAngkatan(userSession?.angkatan || 8);
      setFormCategory('kompetensi');
      setFormTitle('');
      setFormDescription('');
      setFormDate(getTodayISO());
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim() || !formTitle.trim() || !formCategory) {
      triggerToast('Nama, judul, dan kategori wajib diisi!', 'error');
      return;
    }

    const dateStr = formDate || getTodayISO();

    const now = Date.now();

    const itemData: PencapaianTKJT = {
      id: editingItem ? editingItem.id : `pca-${now}`,
      studentName: formStudentName.trim(),
      studentId: formStudentId ? parseInt(formStudentId, 10) : undefined,
      kelas: formKelas,
      angkatan: userSession?.angkatan || 8,
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      date: dateStr,
      createdAt: now,
    };

    if (editingItem) {
      const updated = pencapaianList.map((p) =>
        p.id === editingItem.id ? { ...itemData, createdAt: editingItem.createdAt } : p,
      );
      setPencapaianList(updated);
      handleSave(updated);
      triggerToast(`Pencapaian "${formTitle}" berhasil diperbarui!`, 'success');
    } else {
      const newItems = [itemData, ...pencapaianList];
      setPencapaianList(newItems);
      handleSave(newItems);
      triggerToast(`Pencapaian "${formTitle}" berhasil ditambahkan!`, 'success');
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item: PencapaianTKJT) => {
    setDeleteConfirm(item);
  };

  const getCategoryIcon = (category: string) => {
    const found = kategoriPencapaian.find((k) => k.value === category);
    if (found) {
      const Icon = found.icon;
      return <Icon className={`h-4 w-4 ${found.color}`} />;
    }
    return <Award className="h-4 w-4 text-slate-400" />;
  };

  const getCategoryColor = (category: string) => {
    const found = kategoriPencapaian.find((k) => k.value === category);
    if (found) {
      const colorMap: Record<string, string> = {
        sertifikasi: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
        kompetensi: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
        proyek: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
      };
      return colorMap[found.value] || 'border-slate-400/30 bg-slate-400/10 text-slate-400';
    }
    return 'border-slate-400/30 bg-slate-400/10 text-slate-400';
  };

  const getKelasList = () => {
    if (selectedAngkatan === 'Semua') {
      return ['Semua', 'TKJT 1', 'TKJT 2', 'TKJT 3'];
    }
    const options = getKelasOptionsForAngkatan(selectedAngkatan as number);
    return ['Semua', ...options.map((o) => o.value)];
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Cari:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                maxLength={50}
                placeholder="Nama siswa / judul..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Kelas:
            </label>
            <Dropdown
              id="pencapaian-filter-kelas"
              value={selectedKelas}
              onChange={setSelectedKelas}
              options={getKelasList().map((kelas) => ({ value: kelas, label: kelas }))}
              placeholder="Pilih Kelas"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Angkatan:
            </label>
            <Dropdown
              id="pencapaian-filter-angkatan"
              value={selectedAngkatan.toString()}
              onChange={(v) => {
                const next = v === 'Semua' ? 'Semua' as const : Number(v);
                setSelectedAngkatan(next);
                if (next !== 'Semua') {
                  const allowed = getKelasOptionsForAngkatan(next as number).map((o) => o.value);
                  if (selectedKelas !== 'Semua' && !allowed.includes(selectedKelas)) {
                    setSelectedKelas('Semua');
                  }
                }
              }}
              options={[
                { value: 'Semua', label: 'Semua Angkatan' },
                { value: '8', label: 'Angkatan 1' },
                { value: '9', label: 'Angkatan 2' },
              ]}
              placeholder="Semua Angkatan"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Kategori:
            </label>
            <Dropdown
              id="pencapaian-filter-kategori"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: 'Semua', label: 'Semua Kategori' },
                ...kategoriPencapaian.map((kat) => ({ value: kat.value, label: kat.label })),
              ]}
              placeholder="Semua Kategori"
            />
          </div>
      </div>

      {filteredPencapaian.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
          <Award className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">
            Belum ada pencapaian untuk filter ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPencapaian.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(item.category)}`}
                >
                  {getCategoryIcon(item.category)}
                  <span className="ml-1">{item.category}</span>
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

              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {item.studentName} ({item.kelas})
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3 flex-1">
                {item.description}
              </p>

              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <Calendar className="h-3 w-3" />
                <span>{formatTanggalIndo(item.date)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        title={editingItem ? 'Edit Pencapaian' : 'Tambah Pencapaian Baru'}
        subtitle={editingItem ? 'Perbarui data pencapaian siswa.' : 'Catat pencapaian baru siswa TKJT.'}
        icon={<Award className="h-6 w-6 text-blue-500" />}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Nama Siswa:
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formStudentName}
                onChange={(e) => setFormStudentName(e.target.value)}
                list="student-names"
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <datalist id="student-names">
                {students.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                ID Siswa (Opsional):
              </label>
              <input
                type="number"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kelas TKJT:
              </label>
              <Dropdown
                id="pencapaian-form-kelas"
                value={formKelas}
                onChange={setFormKelas}
                options={[
                  { value: 'TKJT 1', label: 'TKJT 1' },
                  { value: 'TKJT 2', label: 'TKJT 2' },
                  { value: 'TKJT 3', label: 'TKJT 3' },
                ]}
                placeholder="Pilih Kelas"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Tanggal:
              </label>
              <DatePicker
                id="pencapaian-form-tanggal"
                value={formDate}
                onChange={setFormDate}
                placeholder="Pilih tanggal..."
              />
            </div>

            <div className="md:col-span-2 space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kategori Pencapaian:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {kategoriPencapaian.map((kat) => {
                  const Icon = kat.icon;
                  const isSelected = formCategory === kat.value;
                  return (
                    <button
                      key={kat.value}
                      type="button"
                      onClick={() => setFormCategory(kat.value as any)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-slate-300 dark:border-slate-800 text-slate-500 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{kat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Judul Pencapaian:
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Sertifikasi CCNA, Proyek Jaringan Fiber, ..."
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="md:col-span-2 space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Deskripsi:
              </label>
              <textarea
                maxLength={500}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                placeholder="Deskripsi singkat tentang pencapaian ini..."
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>


          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="w-1/2">
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              {editingItem ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Konfirmasi Hapus"
        subtitle="Hapus pencapaian ini secara permanen?"
        icon={<AlertTriangle className="h-6 w-6 text-rose-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500">
            Pencapaian <strong className="text-slate-800 dark:text-white">"{deleteConfirm?.title}"</strong>{' '}
            milik <strong>{deleteConfirm?.studentName}</strong> akan dihapus.
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="w-1/2">
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirm) {
                  const updated = pencapaianList.filter((p) => p.id !== deleteConfirm.id);
                  setPencapaianList(updated);
                  handleSave(updated);
                  triggerToast(`Pencapaian "${deleteConfirm.title}" berhasil dihapus!`, 'success');
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
