// Komponen Halaman Penggunaan Bengkel (Workshop Usage Log)
import { useState, useEffect, FormEvent } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Lock,
  Clock,
  UserCheck,
  Filter,
  X,
  Check,
  Wrench,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BengkelLog, InventoryItem, Student } from '../../types';
import Dropdown from '../features/dropdown';
import Modal from '../features/modal';
import Button from '../features/button';
import { authHeaders } from '../../auth_client';
import { deepEqual } from '../../utils';

interface BengkelProps {
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
  bengkelList: BengkelLog[];
  setBengkelList: (list: BengkelLog[]) => void;
  onSave: (data: BengkelLog[]) => Promise<boolean>;
  inventoryList?: InventoryItem[];
}

const conditionOptions = [
  'Baik - Siap Pakai',
  'Baik - Perlu Perhatian',
  'Rusak Ringan',
  'Rusak Berat',
  'Hilang',
] as const;

const getNowDateTimeString = () => {
  const now = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function Bengkel({
  isLoggedIn,
  onLoginRequest,
  triggerToast,
  studentsState,
  userSession,
  bengkelList,
  setBengkelList,
  onSave,
  inventoryList = [],
}: BengkelProps) {
  const students: Student[] = studentsState ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BengkelLog | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BengkelLog | null>(null);

  const [filterItem, setFilterItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [formItemSelect, setFormItemSelect] = useState('');
  const [formStatusBefore, setFormStatusBefore] = useState('');

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
            Maaf, halaman pencatatan penggunaan bengkel hanya terproteksi bagi
            pimpinan guru atau piket yang telah login.
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

  const getAvailableItems = () => {
    const inventoryItems = inventoryList;
    const loggedItemIds = new Set(
      bengkelList.filter((l) => !l.checkOutTime).map((l) => l.itemId),
    );
    return inventoryItems.filter((item) => !loggedItemIds.has(item.id));
  };

  const filteredLogs = bengkelList.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterItem || log.itemName.includes(filterItem);
    const isActivelyUsed = showActiveOnly ? !log.checkOutTime : true;
    return matchesSearch && matchesStatus && isActivelyUsed;
  });

  const handleSave = async (items: BengkelLog[]) => {
    const success = await onSave(items);
    if (!success) setBengkelList(items);
  };

  const handleCheckIn = (e: FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const newItemName = formData.get('itemName') as string;
    const itemName = formItemSelect;
    const selectedInventoryItem = inventoryList.find((i) => i.itemName === itemName);
    const itemId = selectedInventoryItem ? selectedInventoryItem.id : `item-${Date.now()}`;
    const conditionNotes = formData.get('conditionNotes') as string;
    const statusBefore = formStatusBefore;
    const reporterName = formData.get('reporterName') as string;
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const reportDate = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}}-${now.getFullYear()}`;

    if (!itemName || !conditionNotes || !statusBefore) {
      triggerToast('Nama barang, kondisi awal, dan catatan wajib diisi!', 'error');
      return;
    }

    let maxId = 0;
    bengkelList.forEach((log) => {
      const num = parseInt(log.id.replace('bk-', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });

    const newLog: BengkelLog = {
      id: `bk-${maxId + 1}`,
      itemId,
      itemName: itemName || newItemName,
      checkInTime: getNowDateTimeString(),
      statusBefore,
      conditionNotes,
      reporterName: reporterName || userSession?.username || 'Anonim',
      reportDate,
    };

    const updated = [newLog, ...bengkelList];
    setBengkelList(updated);
    handleSave(updated);
    triggerToast(`Check-in bengkel ${newLog.itemName} berhasil dicatat!`, 'success');
    setIsModalOpen(false);
  };

  const handleCheckOut = (log: BengkelLog) => {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const checkOutTime = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const statusAfter = prompt(
      `Masukkan kondisi ${log.itemName} saat ini:\n${conditionOptions.join('\n')}`,
      conditionOptions[0],
    );

    if (statusAfter === null) return;

    const conditionAfter = prompt(
      `Catatan kondisi ${log.itemName} saat check-out (misal: semua lampu menyala, kabel utuh, dsb.):`,
      'Semua berfungsi normal',
    );

    if (conditionAfter === null) return;

    const damageReport = prompt(
      `Laporan kerusakan/ketidaknormalan (jika ada). Ketik "-" jika tidak ada:`,
      '-',
    );

    if (damageReport === null) return;

    const updated = bengkelList.map((l) =>
      l.id === log.id
        ? {
            ...l,
            checkOutTime,
            statusAfter: statusAfter.trim() || 'Baik - Siap Pakai',
            conditionNotes: `${l.conditionNotes || ''} | Check-out: ${conditionAfter.trim()}`,
            damageReported:
              damageReport.trim() !== '-' ? damageReport.trim() : undefined,
          }
        : l,
    );
    setBengkelList(updated);
    handleSave(updated);
    triggerToast(`Check-out ${log.itemName} berhasil!`, 'success');
  };

  const handleDelete = (id: string) => {
    const log = bengkelList.find((l) => l.id === id);
    if (!log) return;
    setDeleteConfirm(log);
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white p-6 rounded-3xl overflow-hidden relative">
        <div className="space-y-1 relative z-10 text-left">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            PENGGUNAAN BENGKEL TKJT
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Sistem pencatatan check-in & check-out kondisi barang bengkel laboratorium
            oleh siswa TKJT yang sedang piket.
          </p>
        </div>
        <div className="h-12 w-12 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border-2 border-blue-500/15 dark:border-blue-500/30">
          <Wrench className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex gap-3 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
        <FileText className="h-5 w-5 flex-shrink-0" />
        <p>
          <strong>SOP Bengkel:</strong> Siswa piket wajib mencatat kondisi barang
          bengkel saat masuk (check-in) dan keluar (check-out). Laporkan kerusakan
          atau kehilangan segera agar dapat ditindaklanjuti.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Cari Barang:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                maxLength={50}
                placeholder="Cari nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Filter:</label>
            <div className="flex gap-2">
              <div className="relative -mt-1 mb-2">
                <input
                  type="checkbox"
                  id="showActiveOnly"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="peer sr-only"
                />
                <label
                  htmlFor="showActiveOnly"
                  className="flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <div
                    className={`h-4 w-4 rounded border-2 border-blue-500 flex items-center justify-center transition-colors ${
                      showActiveOnly ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {showActiveOnly && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className="text-slate-600 dark:text-slate-350">Hanya Aktif</span>
                </label>
              </div>
            </div>
          </div>

          {getAvailableItems().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setFormItemSelect('');
                setFormStatusBefore('');
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 border-2 border-transparent h-fit"
            >
              <Plus className="h-4 w-4" />
              Check-in Barang
            </button>
          )}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
          <Clock className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">
            {showActiveOnly
              ? 'Belum ada barang yang sedang dipinjam dari bengkel. Klik "Check-in Barang" untuk mencatat penggunaan.'
              : 'Belum ada riwayat penggunaan bengkel.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">
                    {log.checkOutTime ? 'SELESAI' : 'SEDANG DIPAKAI'}
                  </span>
                  {!log.checkOutTime ? (
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[9px] font-bold">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-bold">
                      Selesai
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                  {log.itemName}
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Check-in:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {log.checkInTime}
                    </span>
                  </div>
                  {log.checkOutTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Check-out:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {log.checkOutTime}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kondisi Awal:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 max-w-[180px] text-right">
                      {log.statusBefore}
                    </span>
                  </div>
                  {log.statusAfter && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kondisi Akhir:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 max-w-[180px] text-right">
                        {log.statusAfter}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pelapor:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {log.reporterName || '-'}
                    </span>
                  </div>
                </div>

                {log.damageReported && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/5 border-2 border-rose-500/20 text-xs">
                    <span className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Laporan Kerusakan:
                    </span>
                    <p className="mt-1 text-slate-600 dark:text-slate-400 break-words">
                      {log.damageReported}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-4 flex justify-between items-center">
                {!log.checkOutTime && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleCheckOut(log)}
                    className="text-[10px]"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Check-out
                  </Button>
                )}
                {userSession?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(log.id)}
                    className="ml-2 text-rose-500 hover:text-rose-600 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title="Check-in Barang Bengkel"
        subtitle="Catat kondisi barang bengkel saat akan digunakan."
        icon={<Package className="h-6 w-6 text-blue-500" />}
        maxWidth="lg"
      >
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Pilih Barang dari Inventaris:
            </label>
            <Dropdown
              id="bengkel-form-item"
              value={formItemSelect}
              onChange={setFormItemSelect}
              options={inventoryList.map((item) => ({ value: item.itemName, label: `${item.itemName} (${item.description})` }))}
              placeholder="-- Pilih Barang --"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Atau Ketik Nama Barang Baru:
            </label>
            <input
              type="text"
              name="itemName"
              maxLength={100}
              placeholder="Ketik nama barang jika tidak ada di daftar..."
              className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Kondisi Awal Barang:
            </label>
            <Dropdown
              id="bengkel-form-kondisi"
              value={formStatusBefore}
              onChange={setFormStatusBefore}
              options={conditionOptions.map((opt) => ({ value: opt, label: opt }))}
              placeholder="-- Pilih Kondisi --"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Catatan Kondisi:
            </label>
            <textarea
              name="conditionNotes"
              required
              rows={3}
              maxLength={500}
              placeholder="Deskripsikan kondisi barang secara detail (warna, kabel, lampu, klem, dsb.)..."
              className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Nama Pelapor (Opsional):
            </label>
            <input
              type="text"
              name="reporterName"
              maxLength={100}
              defaultValue={userSession?.username || ''}
              className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="w-1/2">
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              Simpan Check-in
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Konfirmasi Hapus"
        subtitle="Apakah Anda yakin ingin menghapus catatan ini?"
        icon={<AlertTriangle className="h-6 w-6 text-rose-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500">
            Catatan penggunaan barang <strong className="text-slate-800 dark:text-white font-bold">{deleteConfirm?.itemName}</strong>{' '}
            akan dihapus permanen.
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-300 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="w-1/2">
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirm) {
                  const updated = bengkelList.filter((l) => l.id !== deleteConfirm.id);
                  setBengkelList(updated);
                  handleSave(updated);
                  triggerToast(`Catatan ${deleteConfirm.itemName} berhasil dihapus!`, 'success');
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
