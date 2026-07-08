// Komponen Halaman Inventaris & Laboratorium
import { useState, useEffect, FormEvent } from 'react';
import { Plus, Package, X, AlertTriangle, Info, Check, RotateCcw, Edit, Trash2, Calendar, UserCheck, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import studentsData from '../../../data/students.json';
import { Student, InventoryItem } from '../../types';
const students = studentsData as Student[];
const initialInventory: InventoryItem[] = [];
import Dropdown from '../features/dropdown';
import Modal from '../features/modal';
import Card from '../features/card';
import Button from '../features/button';
import { deepEqual } from '../../utils';

interface InventarisProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  userSession?: {
    username: string;
    role: 'admin' | 'piket' | 'tamu';
    kelas?: string;
    angkatan?: number;
  } | null;
}

// [Fungsi Pembantu]
const getNowDateTimeString = () => {
  const now = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getTomorrowDateTimeString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
};

const convertToInputDateTimeString = (val: string) => {
  if (!val) return '';
  if (val.includes('T')) return val.slice(0, 16);
  const match = val.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
  return '';
};

const formatDisplayDateTime = (val: string) => {
  if (!val) return '';
  if (val.includes('T')) {
    const [datePart, timePart] = val.split('T');
    const [year, month, day] = datePart.split('-');
    if (year && month && day && timePart) {
      return `${day}-${month}-${year} ${timePart}`;
    }
  }
  return val;
};

export default function Inventaris({
  isLoggedIn,
  onLoginRequest,
  triggerToast,
  userSession,
}: InventarisProps) {
  // [State Komponen]
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingItemIdOnCard, setEditingItemIdOnCard] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [rentTime, setRentTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [borrowerName, setBorrowerName] = useState('');

  const [isManualBorrower, setIsManualBorrower] = useState(false);
  const [borrowerTkjt, setBorrowerTkjt] = useState('TKJT 1');
  const [borrowerAngkatan, setBorrowerAngkatan] = useState<number>(8);
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [selectedStudentBorrower, setSelectedStudentBorrower] = useState<string | null>(null);
  const [manualBorrowerName, setManualBorrowerName] = useState('');
  const [manualBorrowerClass, setManualBorrowerClass] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveInventoryData = async (items: InventoryItem[]) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      if (res.ok) {
        triggerToast("Data inventaris berhasil disimpan!", "success");
      } else {
        triggerToast("Gagal menyimpan data inventaris", "error");
      }
    } catch {
      triggerToast("Gagal menyimpan: koneksi terputus", "error");
    }
  };

  // [Efek Samping]
  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInventoryList(data);
        }
      })
      .catch(err => console.error("Gagal mengambil data inventaris:", err));

    const poll = setInterval(() => {
      fetch('/api/inventory')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setInventoryList(prev => {
              if (!deepEqual(prev, data)) {
                return data;
              }
              return prev;
            });
          }
        })
        .catch(err => console.error("Error polling data inventaris:", err));
    }, 5000);

    return () => clearInterval(poll);
  }, []);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

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
            Maaf, halaman peminjaman & pencatatan alat laboratorium hanya terproteksi bagi pimpinan guru atau piket yang telah login.
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

  // [Submit Peminjaman]
  const onSubmitInventory = (e: FormEvent) => {
    e.preventDefault();

    let resolvedBorrowerName = '';
    if (isManualBorrower) {
      if (!manualBorrowerName) {
        triggerToast("Mohon lengkapi nama peminjam luar TKJT!", "error");
        return;
      }
      resolvedBorrowerName = manualBorrowerClass
        ? `${manualBorrowerName} (${manualBorrowerClass})`
        : manualBorrowerName;
    } else {
      if (!selectedStudentBorrower) {
        triggerToast("Mohon pilih salah satu murid TKJT dari daftar di bawah!", "error");
        return;
      }
      const matched = students.find(s => s.name === selectedStudentBorrower);
      resolvedBorrowerName = matched
        ? `${matched.name} (${matched.kelas})`
        : selectedStudentBorrower;
    }

    if (!itemName || !itemDesc || !rentTime || !returnTime) {
      triggerToast("Mohon lengkapi semua baris input inventaris!", "error");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingItem) {
        const newList = inventoryList.map(item => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              itemName,
              description: itemDesc,
              rentTime,
              returnTime,
              borrowerName: resolvedBorrowerName
            };
          }
          return item;
        });
        setInventoryList(newList);
        saveInventoryData(newList);
        triggerToast(`Sukses memperbarui peminjaman ${itemName}!`, "success");
        setEditingItem(null);
      } else {
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          itemName,
          description: itemDesc,
          rentTime,
          returnTime,
          borrowerName: resolvedBorrowerName,
          status: 'Dipinjam'
        };

        const newList = [newItem, ...inventoryList];
        setInventoryList(newList);
        saveInventoryData(newList);
        triggerToast(`Sukses mencatatkan peminjaman ${newItem.itemName}!`, "success");
      }

      setIsInventoryModalOpen(false);
      handleCloseModal();
      setIsSubmitting(false);
    }, 1000);
  };

  // [Edit Inventaris]
  const handleOpenEditInventory = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.itemName);
    setItemDesc(item.description);
    setRentTime(convertToInputDateTimeString(item.rentTime) || getNowDateTimeString());
    setReturnTime(convertToInputDateTimeString(item.returnTime) || getTomorrowDateTimeString());
    setBorrowerName(item.borrowerName);

    const matched = students.find(s => item.borrowerName.startsWith(s.name) || s.name === item.borrowerName);
    if (matched) {
      setIsManualBorrower(false);
      setSelectedStudentBorrower(matched.name);
      setBorrowerTkjt(matched.kelas.toUpperCase().includes('TKJT 2') ? 'TKJT 2' : matched.kelas.toUpperCase().includes('TKJT 3') ? 'TKJT 3' : 'TKJT 1');
      setBorrowerAngkatan(matched.angkatan || 8);
    } else {
      setIsManualBorrower(true);
      const matchP = item.borrowerName.match(/(.+?)\s*\((.+?)\)/);
      if (matchP) {
        setManualBorrowerName(matchP[1].trim());
        setManualBorrowerClass(matchP[2].trim());
      } else {
        setManualBorrowerName(item.borrowerName);
        setManualBorrowerClass('');
      }
    }
    setIsInventoryModalOpen(true);
  };

  // [Hapus Inventaris]
  const handleDeleteInventory = (id: string) => {
    const targetItem = inventoryList.find(item => item.id === id);
    if (!targetItem) return;
    setDeleteConfirmId(id);
    setDeleteConfirmName(targetItem.itemName);
  };

  // [Tutup Modal]
  const handleCloseModal = () => {
    setIsInventoryModalOpen(false);
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setRentTime('');
    setReturnTime('');
    setBorrowerName('');
    setIsManualBorrower(false);
    setBorrowerTkjt('TKJT 1');
    setBorrowerAngkatan(8);
    setBorrowerSearch('');
    setSelectedStudentBorrower(null);
    setManualBorrowerName('');
    setManualBorrowerClass('');
    setIsSubmitting(false);
  };

  // [Ganti Status]
  const handleToggleInventoryStatus = (id: string, currentStatus: 'Dipinjam' | 'Kembali') => {
    if (userSession?.role === 'piket' && currentStatus === 'Kembali') {
      triggerToast("Maaf, Akun Piket tidak diizinkan mengubah status barang dari 'Kembali' menjadi 'Dipinjam'!", "error");
      return;
    }

    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const formattedTime = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const targetItem = inventoryList.find(item => item.id === id);
    if (targetItem) {
      const nextStatus = currentStatus === 'Dipinjam' ? 'Kembali' : 'Dipinjam';
      triggerToast(`Status ${targetItem.itemName} diubah ke ${nextStatus}!`, "success");
    }

    const nextStatus = currentStatus === 'Dipinjam' ? 'Kembali' : 'Dipinjam';
    const newList = inventoryList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: nextStatus,
          returnTime: nextStatus === 'Kembali' ? `${formattedTime} (Aktual)` : item.returnTime
        };
      }
      return item;
    });
    setInventoryList(newList);
    saveInventoryData(newList);
  };

  // [Edit Inline]
  const handleOpenInlineEdit = (item: InventoryItem) => {
    setEditingItemIdOnCard(item.id);
    setItemName(item.itemName);
    setItemDesc(item.description);
    setRentTime(convertToInputDateTimeString(item.rentTime) || getNowDateTimeString());
    setReturnTime(convertToInputDateTimeString(item.returnTime) || getTomorrowDateTimeString());
    setBorrowerName(item.borrowerName);

    const matched = students.find(s => item.borrowerName.startsWith(s.name) || s.name === item.borrowerName);
    if (matched) {
      setIsManualBorrower(false);
      setSelectedStudentBorrower(matched.name);
      setBorrowerTkjt(matched.kelas.toUpperCase().includes('TKJT 2') ? 'TKJT 2' : matched.kelas.toUpperCase().includes('TKJT 3') ? 'TKJT 3' : 'TKJT 1');
      setBorrowerAngkatan(matched.angkatan || 8);
    } else {
      setIsManualBorrower(true);
      const matchP = item.borrowerName.match(/(.+?)\s*\((.+?)\)/);
      if (matchP) {
        setManualBorrowerName(matchP[1].trim());
        setManualBorrowerClass(matchP[2].trim());
      } else {
        setManualBorrowerName(item.borrowerName);
        setManualBorrowerClass('');
      }
    }
  };

  const handleSaveInlineEdit = (id: string) => {
    let resolvedBorrowerName = '';
    if (isManualBorrower) {
      if (!manualBorrowerName) {
        triggerToast("Mohon isi nama lengkap peminjam manual!", "error");
        return;
      }
      resolvedBorrowerName = manualBorrowerClass
        ? `${manualBorrowerName} (${manualBorrowerClass})`
        : manualBorrowerName;
    } else {
      if (!selectedStudentBorrower) {
        triggerToast("Mohon pilih salah satu murid dari daftar kelas!", "error");
        return;
      }
      const matched = students.find(s => s.name === selectedStudentBorrower);
      resolvedBorrowerName = matched
        ? `${matched.name} (${matched.kelas})`
        : selectedStudentBorrower;
    }

    if (!itemName || !itemDesc || !rentTime || !returnTime) {
      triggerToast("Mohon lengkapi semua baris input inventaris!", "error");
      return;
    }

    const newList = inventoryList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          itemName,
          description: itemDesc,
          rentTime,
          returnTime,
          borrowerName: resolvedBorrowerName
        };
      }
      return item;
    });
    setInventoryList(newList);
    saveInventoryData(newList);

    triggerToast(`Sukses mengubah peminjaman ${itemName} langsung di kartu!`, "success");
    setEditingItemIdOnCard(null);
    handleCloseModal();
  };

  // [Pilih Peminjam]
  const renderStudentBorrowerSelector = (isOnCard: boolean = false) => {
    const filtered = students.filter(student => {
      const matchesClass = student.kelas.toUpperCase().includes(borrowerTkjt.toUpperCase());
      const matchesGen = student.angkatan === Number(borrowerAngkatan);
      const matchesSearch = student.name.toLowerCase().includes(borrowerSearch.toLowerCase());
      return matchesClass && matchesGen && matchesSearch;
    });

    return (
      <div className="space-y-4 p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-slate-300 dark:border-slate-800 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Identitas Murid Peminjam</span>
          <label className="flex items-center gap-2 cursor-pointer select-none group text-left">
            <div className="relative">
              <input 
                type="checkbox"
                checked={isManualBorrower}
                onChange={(e) => {
                  setIsManualBorrower(e.target.checked);
                  setSelectedStudentBorrower(null);
                  setManualBorrowerName('');
                  setManualBorrowerClass('');
                }}
                className="peer sr-only"
              />
              <div className="h-4.5 w-4.5 rounded-md border-2 border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all duration-200 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                <Check className="h-3 w-3 text-white scale-0 transition-transform duration-200 peer-checked:scale-100" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-605 dark:text-blue-400 group-hover:underline">Luar TKJT (Input Manual)?</span>
          </label>
        </div>

        {isManualBorrower ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nama Lengkap:</label>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{manualBorrowerName.length}/20</span>
              </div>
              <input 
                type="text"
                maxLength={20}
                placeholder="Contoh: Budi Santoso"
                value={manualBorrowerName}
                onChange={(e) => setManualBorrowerName(e.target.value.slice(0, 20))}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-850 dark:text-white placeholder:text-slate-450 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kelas / Instansi:</label>
              <input 
                type="text"
                maxLength={30}
                placeholder="Contoh: XI RPL 1 / Guru"
                value={manualBorrowerClass}
                onChange={(e) => setManualBorrowerClass(e.target.value)}
                className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-850 dark:text-white placeholder:text-slate-450 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`grid gap-3 ${isOnCard ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kelas TKJT:</label>
                <Dropdown 
                  id={`${isOnCard ? 'inline-card' : 'pop-modal'}-borrower-tkjt`}
                  value={borrowerTkjt}
                  onChange={(v) => {
                    setBorrowerTkjt(v);
                    setSelectedStudentBorrower(null);
                  }}
                  options={
                    borrowerAngkatan === 8
                      ? [
                          { value: 'TKJT 1', label: 'TKJT 1 (Kelas Utama)' },
                          { value: 'TKJT 2', label: 'TKJT 2 (Kelas Jaringan)' },
                        ]
                      : [
                          { value: 'TKJT 1', label: 'TKJT 1 (Kelas Utama)' },
                          { value: 'TKJT 2', label: 'TKJT 2 (Kelas Jaringan)' },
                          { value: 'TKJT 3', label: 'TKJT 3 (Kelas Optik)' },
                        ]
                  }
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Angkatan:</label>
                <Dropdown 
                  id={`${isOnCard ? 'inline-card' : 'pop-modal'}-borrower-gen`}
                  value={borrowerAngkatan.toString()}
                  onChange={(v) => {
                    const newGen = Number(v);
                    setBorrowerAngkatan(newGen);
                    setSelectedStudentBorrower(null);
                    if (newGen === 8 && borrowerTkjt === 'TKJT 3') {
                      setBorrowerTkjt('TKJT 1');
                    }
                  }}
                  options={[{ value: '8', label: 'Angkatan 8' }, { value: '9', label: 'Angkatan 9' },]}
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Cari Murid:</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input 
                  type="text"
                  maxLength={50}
                  placeholder="Ketik nama untuk mencari..."
                  value={borrowerSearch}
                  onChange={(e) => setBorrowerSearch(e.target.value)}
                  className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Pilih Anggota Kelas ({filtered.length}):
              </label>
              <div className="border-2 border-slate-300 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white/70 dark:bg-slate-900/50 p-2">
                <div 
                  className={`max-h-40 overflow-y-auto pr-1 grid gap-2 scrollbar-style ${
                    isOnCard ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {filtered.length === 0 ? (
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 italic text-center py-6 col-span-2">
                      Murid tidak ditemukan dalam filter ini...
                    </div>
                  ) : (
                    filtered.map(stud => {
                      const isSelected = selectedStudentBorrower === stud.name;
                      return (
                        <button
                          key={stud.id}
                          type="button"
                          onClick={() => setSelectedStudentBorrower(stud.name)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-left text-xs cursor-pointer select-none transition-all duration-200 ${
                            isSelected 
                              ? 'border-blue-500 dark:border-blue-450 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' 
                              : 'border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-350 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/40 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-transparent'
                          }`}>
                            <UserCheck className="h-3 w-3" />
                          </div>
                          <span className="truncate pr-1 font-bold">{stud.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // [Tampilan Utama]
  return (
    <div className="space-y-12 pb-16 font-sans">

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white p-6 rounded-3xl overflow-hidden relative">
        <div className="space-y-1 relative z-10 text-left">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">INVENTARIS LAB</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Sistem pencatatan terpusat untuk peminjaman perangkat router, switch, serat optik, dan perangkat lab TKJT milik sekolah.
          </p>
        </div>
        <div className="h-12 w-12 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border-2 border-blue-500/15 dark:border-blue-500/30">
          <Package className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex gap-3 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
        <Info className="h-5 w-5 flex-shrink-0" />
        <p>
          <strong>SOP Peminjaman:</strong> Setiap penyerahan alat keluar lab wajib dicatatkan identitas murid peminjam serta estimasi durasi peminjaman. Klik tombol <strong>Tandai Kembali</strong> ketika perangkat telah diletakkan kembali ke dalam rak penyimpanan orisinal dalam keadaan lengkap dan baik.
        </p>
      </div>

      {/* [Daftar Inventaris] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <button
          onClick={() => {
            setItemName('');
            setItemDesc('');
            setRentTime(getNowDateTimeString());
            setReturnTime(getTomorrowDateTimeString());
            setIsManualBorrower(false);
            setManualBorrowerName('');
            setManualBorrowerClass('');
            setSelectedStudentBorrower(null);
            setIsInventoryModalOpen(true);
          }}
          type="button"
          className="group rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-500 hover:border-blue-400 hover:bg-blue-500/[0.02] p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all duration-300 active:scale-[0.99]"
        >
          <div className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-500 transition-colors mb-4">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Catat Peminjaman Baru
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-relaxed">
            Daftarkan peminjaman modul Cisco, switch layer 3, dan perangkat lab praktek TKJT hari ini.
          </p>
        </button>

        {inventoryList.map((item) => {
          const isInlineEditing = editingItemIdOnCard === item.id;
          
          if (isInlineEditing) {
            return (
              <Card 
                key={item.id}
                hoverEffect={false}
                className="p-5 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col justify-between space-y-4 shadow-none text-left"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-black text-blue-500 tracking-wider">Edit Langsung di Kartu</span>
                    <span className="font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[10px] font-bold">INLINE</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Nama Alat:</label>
                    <input 
                      type="text"
                      className="w-full text-xs rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Keperluan Peminjaman / Deskripsi:</label>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{itemDesc.length}/500</span>
                    </div>
                    <textarea 
                      rows={2}
                      maxLength={500}
                      className="w-full text-xs rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value.slice(0, 500))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Tgl Pinjam:</label>
                      <input 
                        type="datetime-local"
                        required
                        className="w-full text-xs rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none"
                        value={rentTime}
                        onChange={(e) => setRentTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Estimasi Kembali:</label>
                      <input 
                        type="datetime-local"
                        required
                        className="w-full text-xs rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {renderStudentBorrowerSelector(true)}

                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-900 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemIdOnCard(null);
                      handleCloseModal();
                    }}
                    className="w-1/2 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-800 text-slate-500 hover:text-slate-650 bg-transparent text-xs font-bold transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInlineEdit(item.id)}
                    className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </Card>
            );
          }

          return (
            <Card 
              key={item.id}
              className="group p-6 flex flex-col justify-between space-y-4 text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border
                    ${item.status === 'Dipinjam'
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-555 dark:text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                

                <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                  {item.itemName}
                </h4>
                <div>
                  <p className={`text-xs text-slate-500 dark:text-slate-400 leading-relaxed ${expandedItems[item.id] ? '' : 'line-clamp-2'}`}>
                    {item.description}
                  </p>
                  {item.description.length > 100 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 mt-1 hover:underline cursor-pointer focus:outline-none block"
                    >
                      {expandedItems[item.id] ? 'Sembunyikan' : 'Baca Selengkapnya'}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-4 space-y-3 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Peminjam:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.borrowerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Rentang Pinjam:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDisplayDateTime(item.rentTime)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimasi Kembali:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDisplayDateTime(item.returnTime)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-900/40 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleToggleInventoryStatus(item.id, item.status)}
                    className={`w-full rounded-xl py-2 px-3 text-[11px] font-bold transition-all duration-300 border-2 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      item.status === 'Dipinjam'
                        ? 'border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {item.status === 'Dipinjam' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Kembalikan Alat (Aktual)
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Tandai Dipinjam
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-900/10">
                    <button
                      type="button"
                      onClick={() => handleOpenInlineEdit(item)}
                      className="text-xs text-blue-550 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit langsung
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteInventory(item.id)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* [Modal Form Peminjaman] */}
      <Modal
        isOpen={isInventoryModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Catatan Peminjaman' : 'Catat Peminjaman Alat'}
        subtitle={editingItem ? 'Perbarui rincian log transaksi perangkat laboratorium.' : 'Pencatatan sirkulasi unit praktek murid TKJT SMK AMI.'}
        icon={<Package className="h-6 w-6 text-blue-500" />}
        maxWidth="4xl"
      >
        <form onSubmit={onSubmitInventory} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            <div className="space-y-4 rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 p-4">
              <div className="border-b-2 border-slate-300 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Rincian Perangkat & Durasi</span>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Nama Perangkat / Item Alat:
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Package className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Contoh: Routerboard Mikrotik 951Ui"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-450 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Keterangan / Keperluan Peminjaman:
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{itemDesc.length}/500</span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Keterangan kondisi peminjaman, jumlah klem/kabel, orid, kelas praktek, dll."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value.slice(0, 500))}
                  className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-450 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Tanggal Keluar:
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="datetime-local"
                      required
                      value={rentTime}
                      onChange={(e) => setRentTime(e.target.value)}
                      className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-slate-855 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Estimasi Kembali:
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="datetime-local"
                      required
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-slate-855 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {renderStudentBorrowerSelector(false)}
            </div>

          </div>

          <div className="flex gap-4 pt-5 border-t-2 border-slate-300 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="w-1/2 py-3 rounded-2xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-[0.99]"
            >
              {editingItem ? 'Simpan Perubahan' : 'Catat Peminjaman Baru'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* [Modal Konfirmasi Hapus] */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Konfirmasi Hapus"
        subtitle="Apakah Anda yakin ingin menghapus catatan peminjaman alat ini?"
        icon={<AlertTriangle className="h-6 w-6 text-rose-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
            Tindakan ini tidak dapat dibatalkan. Catatan peminjaman untuk perangkat <strong className="text-slate-800 dark:text-white font-bold">{deleteConfirmName}</strong> akan dihapus permanen dari memori sistem.
          </p>
          <div className="flex gap-3 pt-4 border-t-2 border-slate-300 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
              className="w-1/2 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirmId) {
                  const newList = inventoryList.filter(item => item.id !== deleteConfirmId);
                  setInventoryList(newList);
                  saveInventoryData(newList);
                  triggerToast(`Sukses menghapus peminjaman ${deleteConfirmName}!`, "success");
                  setDeleteConfirmId(null);
                }
              }}
              className="w-1/2 font-bold cursor-pointer"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
