// Komponen Halaman Absensi TKJT
import { useState, useEffect, FormEvent, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  AlertTriangle,
  Lock,
  Calendar,
  Users,
  BarChart3,
  Trash2,
  FileDown,
  FileUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AbsensiTKJT, Student } from '../../types';
import Dropdown from '../features/dropdown';
import DatePicker from '../features/date_picker';
import Modal from '../features/modal';
import Button from '../features/button';
import { authHeaders } from '../../auth_client';
import { deepEqual, formatTanggalIndo, getTodayISO } from '../../utils';

interface AbsensiProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  studentsState?: Student[];
  userSession?: {
    username: string;
    role: 'admin' | 'piket' | 'tamu';
    kelas?: string;
    angkatan?: number;
  } | null;
  absensiList: AbsensiTKJT[];
  setAbsensiList: (list: AbsensiTKJT[]) => void;
  onSave: (data: AbsensiTKJT[]) => Promise<boolean>;
}

const statusOptions = ['Hadir', 'Izin', 'Sakit', 'Alfa'] as const;

const getTodayDateString = () => getTodayISO();

export default function AbsensiTkjt({
  isLoggedIn,
  onLoginRequest,
  triggerToast,
  studentsState,
  userSession,
  absensiList,
  setAbsensiList,
  onSave,
}: AbsensiProps) {
  const students: Student[] = studentsState ?? [];

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteFilteredModalOpen, setIsDeleteFilteredModalOpen] = useState(false);

  const [filterTkjt, setFilterTkjt] = useState('TKJT 1');
  const [filterAngkatan, setFilterAngkatan] = useState<number>(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const [importText, setImportText] = useState('');

  // [Navigasi Awal]
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center font-sans">
        <div className="max-w-md w-full border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-950 rounded-3xl p-8 relative overflow-hidden transition-colors duration-305">
          <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2">
            Halaman Terproteksi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Maaf, halaman absensi TKJT hanya terproteksi bagi pimpinan guru atau piket yang telah login.
          </p>
          <button
            type="button"
            onClick={onLoginRequest}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            Masuk / Login Akun Piket
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = userSession?.role === 'admin';

  const filteredAbsensi = absensiList.filter((item) => {
    const matchesKelas = item.kelas.toUpperCase().includes(filterTkjt.toUpperCase());
    const matchesAngkatan = item.angkatan === filterAngkatan;
    const matchesSearch =
      !searchTerm ||
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || item.date === selectedDate;
    return matchesKelas && matchesAngkatan && matchesSearch && matchesDate;
  });

  const stats = useMemo(() => {
    const all = absensiList.filter((item) => {
      const matchesAngkatan = item.angkatan === filterAngkatan;
      const matchesDate = !selectedDate || item.date === selectedDate;
      return matchesAngkatan && matchesDate;
    });
    return {
      total: all.length,
      hadir: all.filter((a) => a.status === 'Hadir').length,
      izin: all.filter((a) => a.status === 'Izin').length,
      sakit: all.filter((a) => a.status === 'Sakit').length,
      alfa: all.filter((a) => a.status === 'Alfa').length,
    };
  }, [absensiList, filterAngkatan, selectedDate]);

  const kelasOptions = filterAngkatan === 8
    ? [
        { value: 'TKJT 1', label: 'TKJT 1' },
        { value: 'TKJT 2', label: 'TKJT 2' },
      ]
    : [
        { value: 'TKJT 1', label: 'TKJT 1' },
        { value: 'TKJT 2', label: 'TKJT 2' },
        { value: 'TKJT 3', label: 'TKJT 3' },
      ];

  const getFilteredStudents = () => {
    return students.filter((s) => {
      const matchesClass = s.kelas.toUpperCase().includes(filterTkjt.toUpperCase());
      const matchesGen = s.angkatan === filterAngkatan;
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClass && matchesGen && matchesSearch;
    });
  };

  const handleSaveAbsensi = async (items: AbsensiTKJT[]) => {
    const success = await onSave(items);
    if (!success) {
      setAbsensiList(items);
    }
  };

  const handleToggleStatus = (item: AbsensiTKJT, newStatus: string) => {
    const updated = absensiList.map((a) =>
      a.id === item.id ? { ...a, status: newStatus as AbsensiTKJT['status'] } : a,
    );
    setAbsensiList(updated);
    handleSaveAbsensi(updated);
    triggerToast(`Status absensi ${item.studentName} diubah ke ${newStatus}!`, 'success');
  };



  const handleBulkCreate = (e: FormEvent) => {
    e.preventDefault();
    const filtered = getFilteredStudents();
    if (filtered.length === 0) {
      triggerToast('Tidak ada siswa yang cocok dengan filter!', 'error');
      return;
    }

    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newItems: AbsensiTKJT[] = [];
    let maxId = 0;
    absensiList.forEach((a) => {
      const num = parseInt(a.id.replace('abs-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });

    filtered.forEach((student) => {
      const existing = absensiList.find(
        (a) =>
          a.studentId === student.id &&
          a.date === selectedDate,
      );
      if (!existing) {
        newItems.push({
          id: `abs-${maxId + newItems.length + 1}`,
          studentName: student.name,
          studentId: student.id,
          kelas: student.kelas,
          angkatan: student.angkatan,
          date: selectedDate,
          status: 'Hadir',
          notes: '',
          createdAt: Date.now(),
        });
      }
    });

    if (newItems.length === 0) {
      triggerToast('Semua siswa sudah memiliki catatan absensi untuk tanggal ini!', 'info');
      return;
    }

    const merged = [...absensiList, ...newItems];
    setAbsensiList(merged);
    handleSaveAbsensi(merged);
    triggerToast(`${newItems.length} catatan absensi baru berhasil dibuat!`, 'success');
  };

  const exportToCSV = () => {
    const dataToExport = filteredAbsensi.length > 0 ? filteredAbsensi : absensiList;
    if (dataToExport.length === 0) {
      triggerToast('Tidak ada data absensi untuk diekspor!', 'error');
      return;
    }

    const headers = ['No', 'Nama Siswa', 'ID', 'Kelas', 'Angkatan', 'Tanggal', 'Status', 'Catatan'];
    const rows = dataToExport.map((item, idx) => [
      idx + 1,
      `"${item.studentName}"`,
      item.studentId,
      item.kelas,
      `Angkatan ${item.angkatan === 8 ? '1' : '2'}`,
      formatTanggalIndo(item.date),
      item.status,
      `"${item.notes || '-'}"`,
    ]);

    const csvContent =
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `absensi_tkjt_${filterTkjt.replace(/\s/g, '_')}_${selectedDate.replace(/-/g, '')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast(`Data absensi ${dataToExport.length} baris berhasil diekspor ke CSV!`, 'success');
  };

  const handleImportCSV = async (e: FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) {
      triggerToast('Masukkan data CSV terlebih dahulu!', 'error');
      return;
    }

    const bulanMap: Record<string, string> = { januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06', juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12' };
    const normalizeDate = (raw: string): string => {
      const s = raw.trim();
      // already ISO YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // DD-MM-YYYY
      const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
      // DD Bulan YYYY e.g. 28 Agustus 2026
      const indo = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
      if (indo) {
        const d = indo[1].padStart(2, '0');
        const m = bulanMap[indo[2].toLowerCase()] || '01';
        return `${indo[3]}-${m}-${d}`;
      }
      return s;
    };

    const lines = importText.trim().split('\n');
    const imported: AbsensiTKJT[] = [];
    let maxId = 0;
    absensiList.forEach((a) => {
      const num = parseInt(a.id.replace('abs-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('nama')) return;
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 7) {
        triggerToast(`Baris ${idx + 1}: Format tidak valid, dilewati!`, 'error');
        return;
      }
      const [_, name, studentId, kelas, angkatanRaw, dateRaw, status] = cols;
      const validStatus = statusOptions.includes(status.trim() as any)
        ? (status.trim() as AbsensiTKJT['status'])
        : 'Hadir';
      const angkatanNum = angkatanRaw.includes('1') ? 8 : angkatanRaw.includes('2') ? 9 : parseInt(angkatanRaw, 10) || 8;

      imported.push({
        id: `abs-${maxId + imported.length + 1}`,
        studentName: name.trim(),
        studentId: parseInt(studentId.trim(), 10) || 0,
        kelas: kelas.trim(),
        angkatan: angkatanNum,
        date: normalizeDate(dateRaw.trim()),
        status: validStatus,
        notes: '',
        createdAt: Date.now(),
      });
    });

    if (imported.length > 0) {
      const merged = [...absensiList, ...imported];
      setAbsensiList(merged);
      await handleSaveAbsensi(merged);
      triggerToast(`${imported.length} data absensi berhasil diimpor!`, 'success');
    }

    setIsImportModalOpen(false);
    setImportText('');
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white p-6 rounded-3xl overflow-hidden relative">
        <div className="space-y-1 relative z-10 text-left">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            ABSENSI TKJT
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Sistem pencatatan kehadiran harian siswa TKJT beserta fitur ekspor dan impor data.
          </p>
        </div>
        <div className="h-12 w-12 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border-2 border-blue-500/15 dark:border-blue-500/30">
          <ClipboardList className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex gap-3 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
        <Users className="h-5 w-5 flex-shrink-0" />
        <p>
          <strong>SOP Absensi:</strong> Guru atau piket dapat mencatat kehadiran harian siswa per
          kelas dan angkatan. Gunakan tombol ekspor untuk mengunduh data CSV, atau impor untuk
          memasukkan data absensi dari file eksternal.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kelas TKJT:</label>
            <Dropdown
              id="abs-filter-tkjt"
              value={filterTkjt}
              onChange={setFilterTkjt}
              options={kelasOptions}
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Angkatan:</label>
            <Dropdown
              id="abs-filter-angkatan"
              value={filterAngkatan.toString()}
              onChange={(v) => {
                const newGen = Number(v);
                setFilterAngkatan(newGen);
                if (newGen === 8 && filterTkjt === 'TKJT 3') setFilterTkjt('TKJT 1');
              }}
              options={[
                { value: '8', label: 'Angkatan 1' },
                { value: '9', label: 'Angkatan 2' },
              ]}
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tanggal:</label>
            <DatePicker
              id="absensi-filter-tanggal"
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Pilih tanggal..."
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Cari:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                maxLength={50}
                placeholder="Cari nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Ekspor CSV"
          >
            <FileDown className="h-3.5 w-3.5" />
            Ekspor
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Impor CSV"
          >
            <FileUp className="h-3.5 w-3.5" />
            Impor
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 self-center" />
          <button
            type="button"
            onClick={(e) => handleBulkCreate(e)}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Absensi
          </button>
        </div>
      </div>

      {/* Picket History Summary */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Rekap Absensi</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-lg font-black text-slate-800 dark:text-white">{stats.total}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.hadir}</p>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Hadir</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.izin}</p>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Izin</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.sakit}</p>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Sakit</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{stats.alfa}</p>
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Alfa</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 border-b-2 border-slate-300 dark:border-slate-800">
                <th className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">#</th>
                <th className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kelas</th>
                <th className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAbsensi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm font-bold">Belum ada catatan absensi untuk filter ini.</p>
                  </td>
                </tr>
              ) : (
                filteredAbsensi.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{item.studentName}</td>
                    <td className="px-4 py-3">{item.kelas}</td>
                    <td className="px-4 py-3 font-mono">{formatTanggalIndo(item.date)}</td>
                    <td className="px-4 py-3">
                      <Dropdown
                        id={`status-${item.id}`}
                        value={item.status}
                        onChange={(v) => handleToggleStatus(item, v)}
                        options={statusOptions.map((s) => ({ value: s, label: s }))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = absensiList.filter((a) => a.id !== item.id);
                            setAbsensiList(updated);
                            handleSaveAbsensi(updated);
                            triggerToast('Catatan absensi berhasil dihapus!', 'success');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAbsensi.length > 0 && isAdmin && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteFilteredModalOpen(true)}
          >
            Hapus yang Difilter
          </Button>
        </div>
      )}

      <Modal
        isOpen={isDeleteFilteredModalOpen}
        onClose={() => setIsDeleteFilteredModalOpen(false)}
        title="Hapus Semua yang Difilter?"
        subtitle={`Anda akan menghapus ${filteredAbsensi.length} catatan absensi yang sesuai dengan filter saat ini.`}
        icon={<AlertTriangle className="h-6 w-6 text-rose-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500">
            Tindakan ini tidak dapat dibatalkan. Semua data absensi yang difilter akan dihapus secara permanen.
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsDeleteFilteredModalOpen(false)} className="w-1/2">
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const updated = absensiList.filter((a) => !filteredAbsensi.some((f) => f.id === a.id));
                setAbsensiList(updated);
                handleSaveAbsensi(updated);
                setIsDeleteFilteredModalOpen(false);
                triggerToast('Semua catatan absensi yang difilter berhasil dihapus!', 'success');
              }}
              className="w-1/2"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>

    <Modal
      isOpen={isImportModalOpen}
      onClose={() => setIsImportModalOpen(false)}
      title="Impor Absensi CSV"
      subtitle="Paste data CSV (koma-separated) ke dalam kolom di bawah. Format: Nama, ID, Kelas, Angkatan, Tanggal, Status, Catatan."
      icon={<FileUp className="h-6 w-6 text-amber-500" />}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
          <p className="font-bold mb-1">Format CSV:</p>
          <code className="font-mono text-[10px]">"Nama Siswa",12345,TKJT 1,Angkatan 1,28 Agustus 2026,Hadir,"-"</code>
        </div>
        <textarea
          placeholder={'"Nama Siswa",12345,TKJT 1,Angkatan 1,28 Agustus 2026,Hadir,"-"\n"Siswa Lain",67890,TKJT 2,Angkatan 2,28 Agustus 2026,Izin,"Sakit"'}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={10}
          className="w-full text-xs font-mono rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-300 dark:border-slate-800">
          <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} className="w-1/3">
            Batal
          </Button>
          <Button variant="primary" onClick={handleImportCSV} className="w-2/3">
            Impor Data
          </Button>
        </div>
      </div>
    </Modal>
  </div>
  );
}
