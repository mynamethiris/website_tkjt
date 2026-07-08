// Komponen Halaman Pelaporan & Jadwal Piket Laboratorium TKJT
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Calendar, 
  ClipboardList, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Clock, 
  UserX,
  Info,
  Edit,
  Trash2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Upload,
  Lock,
  Search,
  XCircle,
  MapPin,
  Compass,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import studentsData from '../../../data/students.json';
import { PicketReport, PicketAccount, PicketGroup, Student } from '../../types';
const students = studentsData as Student[];
import Dropdown from '../features/dropdown';
import Modal from '../features/modal';
import Button from '../features/button';
import { deepEqual } from '../../utils';

// Koordinat resmi lokasi sekolah untuk verifikasi GPS
const SCHOOL_COORDS = { lat: -6.352959, lng: 107.181648 }; 

// Helper penjelas jarak dua titik koordinat GPS
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

interface AktivitasProps {
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

export default function Aktivitas({
  isLoggedIn,
  onLoginRequest,
  triggerToast,
  userSession,
}: AktivitasProps) {
  // Status tab internal
  const [activeInternalTab, setActiveInternalTab] = useState<'jadwal' | 'laporan'>('jadwal');
  
  const tabsConfig = [
    { id: 'jadwal', label: 'Jadwal Piket', icon: Calendar },
    { id: 'laporan', label: 'Laporan Piket', icon: ClipboardList }
  ];

  const visibleTabs = tabsConfig;

  const [showMobileNav, setShowMobileNav] = useState(true);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const [now, setNow] = useState(new Date());

  // Status data laporan piket, kelompok, dan akun
  const [picketGroupsList, setPicketGroupsList] = useState<PicketGroup[]>([]);
  const [picketAccountsList, setPicketAccountsList] = useState<PicketAccount[]>([]);
  const [picketReportsList, setPicketReportsList] = useState<PicketReport[]>([]);

  const rotationRan = useRef(false);
  const needsRotation = useRef(false);
  const picketGroupsListRef = useRef(picketGroupsList);
  const picketAccountsListRef = useRef(picketAccountsList);
  picketGroupsListRef.current = picketGroupsList;
  picketAccountsListRef.current = picketAccountsList;

  // Memuat data piket dari API backend
  useEffect(() => {
    let mounted = true;

    fetch('/api/picket')
      .then(res => res.json())
      .then(data => {
        if (data && mounted) {
          if (Array.isArray(data.picketGroups)) setPicketGroupsList(data.picketGroups);
          if (Array.isArray(data.picketAccounts)) {
            setPicketAccountsList(data.picketAccounts);
            localStorage.setItem('tkjt_picket_accounts', JSON.stringify(data.picketAccounts));
          }
          if (Array.isArray(data.picketReports)) setPicketReportsList(data.picketReports);
        }
      })
      .catch(err => console.error("Gagal mengambil data piket backend:", err));

    const poll = setInterval(() => {
      fetch('/api/picket')
        .then(res => res.json())
        .then(data => {
          if (data && mounted) {
            if (Array.isArray(data.picketGroups)) {
              setPicketGroupsList(prev => {
                if (!deepEqual(prev, data.picketGroups)) {
                  return data.picketGroups;
                }
                return prev;
              });
            }
            if (Array.isArray(data.picketAccounts)) {
              setPicketAccountsList(prev => {
                if (!deepEqual(prev, data.picketAccounts)) {
                  localStorage.setItem('tkjt_picket_accounts', JSON.stringify(data.picketAccounts));
                  return data.picketAccounts;
                }
                return prev;
              });
            }
            if (Array.isArray(data.picketReports)) {
              setPicketReportsList(prev => {
                if (!deepEqual(prev, data.picketReports)) {
                  return data.picketReports;
                }
                return prev;
              });
            }
          }
        })
        .catch(err => console.error("Error polling picket data:", err));
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(() => {
    const saved = localStorage.getItem('tkjt_has_checked_in_today');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return false;
      }
    }
    return false;
  });

  const [checkInTime, setCheckInTime] = useState<string>(() => {
    return localStorage.getItem('tkjt_check_in_time') || '';
  });

  const [currentWeekConfig, setCurrentWeekConfig] = useState<'Minggu 1' | 'Minggu 2'>(() => {
    const saved = localStorage.getItem('tkjt_current_week_config');
    if (saved === 'Minggu 1' || saved === 'Minggu 2') return saved;
    return 'Minggu 1';
  });

  const [groupWeekFilter, setGroupWeekFilter] = useState<'Semua' | 'Minggu 1' | 'Minggu 2'>('Semua');

  useEffect(() => {
    localStorage.setItem('tkjt_current_week_config', currentWeekConfig);
  }, [currentWeekConfig]);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (!needsRotation.current) return;
    if (rotationRan.current) return;
    if (picketGroupsList.length === 0 && picketAccountsList.length === 0) return;
    rotationRan.current = true;

    const nowMs = Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    const updated = picketAccountsList.map(acc => {
      const group = picketGroupsList.find(g => g.name === acc.groupName);
      if (!group || !group.members || group.members.length === 0) return acc;

      const currentLeader = acc.ketuaPiket || group.members[0];
      const assignedTime = acc.leaderAssignedAt || nowMs;
      let history = acc.leaderHistory || [currentLeader];

      let actualLeader = currentLeader;
      if (!group.members.includes(actualLeader)) {
        actualLeader = group.members[0];
        history = [actualLeader];
      }

      if (!history.includes(actualLeader)) {
        history = [...history, actualLeader];
      }

      if (nowMs - assignedTime >= twoWeeksMs) {
        const remaining = group.members.filter(m => !history.includes(m));
        let nextLeader = '';
        let newHistory = [...history];

        if (remaining.length > 0) {
          nextLeader = remaining[0];
          newHistory.push(nextLeader);
        } else {
          const randomIndex = Math.floor(Math.random() * group.members.length);
          nextLeader = group.members[randomIndex];
          newHistory = [nextLeader];
        }

        return {
          ...acc,
          ketuaPiket: nextLeader,
          leaderAssignedAt: nowMs,
          leaderHistory: newHistory
        };
      }

      if (!acc.leaderAssignedAt || !acc.leaderHistory || acc.ketuaPiket !== actualLeader) {
        return {
          ...acc,
          ketuaPiket: actualLeader,
          leaderAssignedAt: assignedTime,
          leaderHistory: history
        };
      }

      return acc;
    });

    if (!deepEqual(picketAccountsList, updated)) {
      setPicketAccountsList(updated);
      savePicketData(picketGroupsList, updated, picketReportsList);
    }
  }, [picketGroupsList]);

  useEffect(() => {
    localStorage.setItem('tkjt_has_checked_in_today', JSON.stringify(hasCheckedInToday));
    localStorage.setItem('tkjt_check_in_time', checkInTime);
  }, [hasCheckedInToday, checkInTime]);

  useEffect(() => {
    if (!visibleTabs.some(t => t.id === activeInternalTab) && visibleTabs.length > 0) {
      setActiveInternalTab(visibleTabs[0].id as any);
    }
  }, [activeInternalTab, visibleTabs]);

  const indonesianDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const currentIndonesianDay = indonesianDays[now.getDay()];

  
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editReportForm, setEditReportForm] = useState<{
    description: string;
    type: 'Datang' | 'Pulang';
    cleanedRooms: string;
    arrivalTime: string;
    departureTime: string;
    reporter: string;
    absentMembers: string[];
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'report';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  
  const [schedulerWeekView, setSchedulerWeekView] = useState<'Minggu 1' | 'Minggu 2' | 'Semua'>('Minggu 1');
  const [picketSorePinInput, setPicketSorePinInput] = useState('');
  const [currentReportStep, setCurrentReportStep] = useState(1);


  
  const todayGroup = picketGroupsList.find(g => 
    g.day.toLowerCase() === currentIndonesianDay.toLowerCase() &&
    (!g.weekType || g.weekType === 'Semua' || g.weekType === currentWeekConfig)
  );
  const todayAccount = todayGroup ? picketAccountsList.find(acc => acc.groupName === todayGroup.name) : undefined;

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInPinInput, setCheckInPinInput] = useState('');

  
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  
  const [absentFilterTkjt, setAbsentFilterTkjt] = useState('TKJT 1');
  const [absentFilterAngkatan, setAbsentFilterAngkatan] = useState<number>(8);
  const [absentSearch, setAbsentSearch] = useState('');

  const [editAbsentFilterTkjt, setEditAbsentFilterTkjt] = useState('TKJT 1');
  const [editAbsentFilterAngkatan, setEditAbsentFilterAngkatan] = useState<number>(8);
  const [editAbsentSearch, setEditAbsentSearch] = useState('');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotoCount, setReportPhotoCount] = useState<number>(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [reportAbsentField, setReportAbsentField] = useState<string[]>([]);
  const [selectedAbsentDropdownVal, setSelectedAbsentDropdownVal] = useState('');

  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Modal and inline error states
  const [checkInModalError, setCheckInModalError] = useState<string | null>(null);
  const [reportModalError, setReportModalError] = useState<string | null>(null);

  const savePicketData = async (groups: PicketGroup[], accounts: PicketAccount[], reports: PicketReport[]) => {
    localStorage.setItem('tkjt_picket_accounts', JSON.stringify(accounts));
    try {
      const res = await fetch('/api/picket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picketGroups: groups, picketAccounts: accounts, picketReports: reports })
      });
      if (res.ok) {
        triggerToast("Data berhasil disimpan!", "success");
      } else {
        triggerToast("Gagal menyimpan data", "error");
      }
    } catch {
      triggerToast("Gagal menyimpan: koneksi terputus", "error");
    }
  };

  useEffect(() => {
    if (!isCheckInModalOpen) setCheckInModalError(null);
  }, [isCheckInModalOpen]);

  useEffect(() => {
    if (!isReportModalOpen) setReportModalError(null);
  }, [isReportModalOpen]);

  
  useEffect(() => {
    if (!todayGroup || !todayAccount) return;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;
    const closeTime = 7 * 60 + 30; 

    if (totalMinutes >= closeTime && !hasCheckedInToday) {
      const todayDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      
      const hasSystemReportToday = picketReportsList.some(r => 
        r.groupName === todayGroup.name && 
        r.type === 'Datang' && 
        r.date.startsWith(todayDateStr)
      );

      if (!hasSystemReportToday) {
        const leaderName = todayAccount.ketuaPiket || 'Ketua Piket';
        
        const systemReport: PicketReport = {
          id: `rep-sys-late-${Date.now()}`,
          groupName: todayGroup.name,
          absentMembers: [],
          reporter: 'Sistem Laporan Otomatis',
          date: todayDateStr + " 07:30 WIB",
          description: `[SISTEM - ABSEN DATANG DITUTUP] Batas waktu absensi pagi hari (07:30 WIB) terlampaui. Sesi ditutup secara otomatis dan Pemimpin/Ketua Piket (${leaderName}) secara otomatis ditulis TELAT dalam sistem laporan piket pagi.`,
          type: 'Datang',
          arrivalTime: '07:30 WIB (Dinyatakan Telat)',
          createdAt: Date.now()
        };

        const newReports = [systemReport, ...picketReportsList];
        setPicketReportsList(newReports);
        savePicketData(picketGroupsListRef.current, picketAccountsListRef.current, newReports);
        setHasCheckedInToday(true);
        setCheckInTime('07:30 WIB (Otomatis Telat)');
        triggerToast(`Absen pagi ditutup! Ketua Piket (${leaderName}) otomatis ditulis telat.`, "info");
      }
    }
  }, [now, todayGroup, todayAccount, hasCheckedInToday, picketReportsList]);

  const handleStartLocationCheck = () => {
    setGpsLoading(true);
    setGpsError(null);
    setGpsCoordinates(null);

    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung Geolocation API.");
      setGpsLoading(false);
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (error) => {
        console.warn("High accuracy geolocation failed, falling back to low accuracy...", error);
        
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            setGpsCoordinates({
              lat: fallbackPos.coords.latitude,
              lng: fallbackPos.coords.longitude
            });
            setGpsLoading(false);
          },
          (fallbackError) => {
            console.error("Fallback geolocation failed", fallbackError);
            let msg = "Gagal mendeteksi lokasi GPS Anda.";
            if (fallbackError.code === 1) {
              msg = "Akses lokasi ditolak browser. Pastikan izin lokasi (GPS) diaktifkan.";
            } else if (fallbackError.code === 2) {
              msg = "Sinyal GPS atau koneksi lokasi tidak tersedia.";
            } else if (fallbackError.code === 3) {
              msg = "Waktu deteksi lokasi habis (timeout). Silakan coba lagi.";
            }
            setGpsError(msg);
            setGpsLoading(false);
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
        );
      },
      options
    );
  };

  useEffect(() => {
    if (isCheckInModalOpen) {
      handleStartLocationCheck();
    } else {
      setGpsCoordinates(null);
      setGpsError(null);
      setGpsLoading(false);
    }
  }, [isCheckInModalOpen]);

  const handleLocationCheckInSubmit = () => {
    setCheckInModalError(null);

    if (!todayAccount || !todayGroup) {
      setCheckInModalError("Data akun piket hari ini belum dikonfigurasi pimpinan!");
      return;
    }

    if (!gpsCoordinates) {
      setCheckInModalError("Mohon deteksi lokasi GPS terlebih dahulu!");
      return;
    }

    const dist = getDistanceInMeters(
      gpsCoordinates.lat,
      gpsCoordinates.lng,
      SCHOOL_COORDS.lat,
      SCHOOL_COORDS.lng
    );

    if (dist > 500) {
      setCheckInModalError(`Gagal: Lokasi Anda berjarak ${Math.round(dist)}m dari sekolah (Batas maks: 500m).`);
      return;
    }

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;
    
    const openTime = 5 * 60 + 30; 
    const lateTime = 6 * 60 + 30; 
    const closeTime = 7 * 60 + 30; 
    
    if (totalMinutes < openTime) {
      setCheckInModalError("Absensi pagi belum dibuka! Pembukaan absensi dimulai pukul 05:30 WIB.");
      return;
    }
    
    if (totalMinutes >= closeTime) {
      setCheckInModalError("Absensi pagi sudah ditutup karena telah melebihi pukul 07:30 WIB!");
      return;
    }

    setIsSubmittingCheckIn(true);

    setTimeout(() => {
      const isLate = totalMinutes >= lateTime;
      const leaderName = todayAccount.ketuaPiket || 'Ketua Piket';
      let timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";
      
      setHasCheckedInToday(true);
      setCheckInTime(timeStr + (isLate ? " (Terlambat)" : ""));

      const noteText = isLate 
          ? `[ABSEN DATANG - TERLAMBAT] Ketua piket (${leaderName}) melakukan absensi kedatangan via Geolocation GPS pada pukul ${timeStr} (melebihi batas jam 06:30 WIB) dan dinyatakan TERLAMBAT.` 
          : `[ABSEN DATANG] Ketua piket (${leaderName}) melakukan absensi kedatangan tepat waktu via Geolocation GPS pada pukul ${timeStr}.`;

      const arrivalReport: PicketReport = {
        id: `rep-arr-${Date.now()}`,
        groupName: todayGroup.name,
        absentMembers: [],
        reporter: leaderName,
        date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + " " + timeStr,
        description: noteText,
        type: 'Datang',
        arrivalTime: timeStr + (isLate ? " (Terlambat)" : ""),
        createdAt: Date.now()
      };

      const newReports = [arrivalReport, ...picketReportsList];
      setPicketReportsList(newReports);
      savePicketData(picketGroupsListRef.current, picketAccountsListRef.current, newReports);
      if (isLate) {
        triggerToast(`Absen datang tercatat! Ketua Piket (${leaderName}) dinyatakan Terlambat.`, "info");
      } else {
        triggerToast(`Absen datang tepat waktu berhasil dicatat untuk ${leaderName}!`, "success");
      }
      setIsCheckInModalOpen(false);
      setIsSubmittingCheckIn(false);
    }, 1000);
  };

  const handleFileChange = (index: number, e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedPhotos(prev => {
          const updated = [...prev];
          updated[index] = result;
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAbsentToReport = (nameWithReason: string) => {
    if (!nameWithReason) return;
    const baseName = nameWithReason.includes(" (") ? nameWithReason.split(" (")[0] : nameWithReason;
    const formatted = nameWithReason.includes(" (") ? nameWithReason : `${baseName} (Alfa)`;
    
    if (!reportAbsentField.some(item => item.startsWith(baseName + " (") || item === baseName)) {
      setReportAbsentField(prev => [...prev, formatted]);
    }
    setSelectedAbsentDropdownVal('');
  };

  const handleRemoveAbsentFromReport = (name: string) => {
    const baseName = name.includes(" (") ? name.split(" (")[0] : name;
    setReportAbsentField(prev => prev.filter(item => !(item.startsWith(baseName + " (") || item === baseName)));
  };

  const handleOpenReportModal = () => {
    if (!todayGroup) {
      triggerToast("Tidak ada kelompok piket yang bertugas hari ini!", "error");
      return;
    }
    if (!hasCheckedInToday) {
      triggerToast("Anda harus absen pagi terlebih dahulu sebelum mengirim laporan piket sore!", "error");
      return;
    }
    setReportDescription('');
    setReportPhotoCount(1);
    setUploadedPhotos([]);
    setReportAbsentField([]);
    setSelectedAbsentDropdownVal('');
    setPicketSorePinInput('');
    setAbsentFilterTkjt(todayGroup.tkjt || 'TKJT 1');
    setAbsentFilterAngkatan(todayGroup.angkatan || 8);
    setAbsentSearch('');
    setCurrentReportStep(1);
    setIsReportModalOpen(true);
  };

  const handleSubmissionReport = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    setReportModalError(null);

    if (!todayAccount) {
      setReportModalError("Konfigurasi akun piket ketua hari ini belum disetting oleh pimpinan!");
      return;
    }

    if (!picketSorePinInput) {
      setReportModalError("PIN Otorisasi wajib diisi!");
      return;
    }

    if (picketSorePinInput !== todayAccount.pin) {
      setReportModalError("PIN Otorisasi Ketua Piket Aktif salah! Hanya ketua yang bertugas aktif yang diizinkan mengirim laporan.");
      return;
    }

    if (!reportDescription) {
      setReportModalError("Rincian pengerjaan laporan piket harus diisi!");
      return;
    }

    const reporterName = todayAccount?.ketuaPiket || todayGroup?.members[0] || 'Ketua Piket';
    const departureTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";

    const photosFilled = uploadedPhotos.filter(Boolean);

    setIsSubmittingReport(true);

    setTimeout(() => {
      const completeReport: PicketReport = {
        id: `rep-dep-${Date.now()}`,
        groupName: todayGroup.name,
        absentMembers: reportAbsentField,
        reporter: reporterName,
        date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + " " + departureTimeStr,
        description: reportDescription,
        type: 'Pulang',
        photos: photosFilled.length > 0 ? photosFilled : ["https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600&h=450"],
        arrivalTime: checkInTime || "Lupa Absen Pagi",
        departureTime: departureTimeStr,
        createdAt: Date.now()
      };

      const newReports = [completeReport, ...picketReportsList];
      setPicketReportsList(newReports);
      savePicketData(picketGroupsListRef.current, picketAccountsListRef.current, newReports);
      triggerToast("Laporan piket sore berhasil dikirimkan ke server!", "success");
      setIsReportModalOpen(false);

      setHasCheckedInToday(false);
      setCheckInTime('');
      setIsSubmittingReport(false);
    }, 1200);
  };

  const canEditOrDeleteReport = (report: PicketReport) => {
    if (!isLoggedIn) return false;
    if (!userSession) return false;
    if (userSession.role === 'admin') return true;
    if (userSession.role === 'piket') {
      const userClass = userSession.kelas || '';
      const isOwnClass = report.groupName.toLowerCase().includes(userClass.toLowerCase());
      const createdTime = report.createdAt || 0;
      const isWithin3Hours = (Date.now() - createdTime) < 3 * 60 * 60 * 1000;
      return isOwnClass && isWithin3Hours;
    }
    return false;
  };

  const handleDeleteReport = (id: string) => {
    const report = picketReportsList.find(r => r.id === id);
    if (!report) return;

    if (userSession?.role === 'piket' && !canEditOrDeleteReport(report)) {
      triggerToast("Maaf, Akun Piket hanya bisa menghapus laporan kelasnya sendiri dalam waktu 3 jam setelah pembuatan!", "error");
      return;
    }

    setDeleteConfirm({
      type: 'report',
      id,
      title: "Hapus Riwayat Laporan Piket",
      message: "Apakah Anda yakin ingin menghapus laporan piket ini dari riwayat?"
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    const newReports = picketReportsList.filter(rep => rep.id !== id);
    setPicketReportsList(newReports);
    triggerToast("Laporan berhasil dihapus!", "success");
    savePicketData(picketGroupsList, picketAccountsList, newReports);
    setDeleteConfirm(null);
  };

  const handleStartEditReport = (report: PicketReport) => {
    if (userSession?.role === 'piket' && !canEditOrDeleteReport(report)) {
      triggerToast("Maaf, Akun Piket hanya bisa mengedit laporan kelasnya sendiri dalam waktu 3 jam setelah pembuatan!", "error");
      return;
    }

    setEditingReportId(report.id);
    setEditReportForm({
      description: report.description,
      type: report.type || 'Datang',
      cleanedRooms: report.cleanedRooms || '',
      arrivalTime: report.arrivalTime || '',
      departureTime: report.departureTime || '',
      reporter: report.reporter,
      absentMembers: report.absentMembers || [],
    });

    const groupForThisReport = picketGroupsList.find(g => g.name === report.groupName);
    const defaultTkjt = userSession?.kelas || groupForThisReport?.tkjt || 'TKJT 1';
    const defaultAngkatan = userSession?.angkatan || groupForThisReport?.angkatan || 8;
    setEditAbsentFilterTkjt(defaultTkjt);
    setEditAbsentFilterAngkatan(defaultAngkatan);
    setEditAbsentSearch('');
  };

  const handleSaveReportEdit = () => {
    if (!editingReportId || !editReportForm) return;
    const newReports = picketReportsList.map(rep => {
      if (rep.id === editingReportId) {
        return {
          ...rep,
          description: editReportForm.description,
          type: editReportForm.type,
          cleanedRooms: editReportForm.cleanedRooms,
          arrivalTime: editReportForm.arrivalTime,
          departureTime: editReportForm.departureTime,
          reporter: editReportForm.reporter,
          absentMembers: editReportForm.absentMembers,
        };
      }
      return rep;
    });
    setPicketReportsList(newReports);
    savePicketData(picketGroupsList, picketAccountsList, newReports);
    triggerToast("Laporan berhasil diperbarui langsung dari halaman!", "success");
    setEditingReportId(null);
    setEditReportForm(null);
  };

  
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center font-sans">
        <div className="max-w-md w-full border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all shadow-xl">
          <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2 font-sans">
            Akses Terproteksi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Maaf, menu pelaporan piket, konfigurasi kelompok belajar, dan PIN harian ketua piket memerlukan login pimpinan guru atau ketua yang terdaftar.
          </p>
          <button
            type="button"
            onClick={onLoginRequest}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer font-sans"
          >
            Masuk / Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  
  return (
    <div className="space-y-8 font-sans pb-16 text-left">
      
      {}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white p-6 rounded-3xl overflow-hidden relative">
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">MANAJEMEN PIKET</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Akses operasional harian, presensi pagi-sore, serta sinkronisasi penugasan laboratorium.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700 px-5 py-3 rounded-2xl relative z-10 self-stretch sm:self-auto justify-between lg:justify-start">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{currentIndonesianDay}, {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-widest">{now.toLocaleTimeString('id-ID')}</p>
          </div>
          <div className="h-9 w-9 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border-2 border-blue-500/15 dark:border-blue-500/30">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 sm:flex sm:flex-row bg-slate-100/50 dark:bg-slate-900/10 p-1.5 rounded-2xl gap-2 select-none">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeInternalTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveInternalTab(tab.id as any)}
              className={`sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 active:border-blue-700 dark:active:border-blue-500'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeInternalTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {}
          {activeInternalTab === 'jadwal' && (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50/20 dark:from-sky-950/20 dark:to-slate-950 border border-blue-100 dark:border-sky-950 rounded-2xl">
                <h3 className="text-sm font-black text-blue-800 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Info className="h-4 w-4" />
                  Informasi Jadwal Piket
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 lines-relaxed">
                  Semua penjadwalan piket didasarkan pada pengaturan Kelompok Piket di tab sebelah. Halaman ini menampilkan ringkasan operasional dwi-pekan yang berlaku bagi seluruh siswa TKJT.
                </p>
              </div>

              {}
              <div className={isLoggedIn && userSession?.role === 'admin' ? "grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6 border-b border-slate-200 dark:border-slate-800/80" : "grid grid-cols-1 gap-5 pb-6 border-b border-slate-200 dark:border-slate-800/80"}>
                
                {}
                <div className="flex flex-col justify-between p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/20">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Filter Tampilan Jadwal
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Pilih rotasi pekan yang ingin ditampilkan pada papan informasi di bawah
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
                    {([
                      { id: 'Minggu 1', label: 'Minggu 1', desc: 'Pekan Ganjil' },
                      { id: 'Minggu 2', label: 'Minggu 2', desc: 'Pekan Genap' }
                    ] as const).map((wk) => {
                      const isSelected = schedulerWeekView === wk.id;
                      return (
                        <button
                          key={wk.id}
                          type="button"
                          onClick={() => setSchedulerWeekView(wk.id)}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 cursor-pointer select-none text-center ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md font-black scale-[1.02]'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="text-[11.5px] font-black">{wk.label}</span>
                          <span className={`text-[8.5px] font-bold mt-0.5 pointer-events-none ${
                            isSelected ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {wk.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {}
                {isLoggedIn && userSession?.role === 'admin' && (
                  <div className="flex flex-col justify-between p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            Pekan Aktif Sekarang
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Alat untuk mengatur siklus piket kelas
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
                      {([
                        { id: 'Minggu 1', label: 'Minggu 1', desc: 'Aktif Saat Ini', inactiveDesc: 'Berlaku Bergilir' },
                        { id: 'Minggu 2', label: 'Minggu 2', desc: 'Aktif Saat Ini', inactiveDesc: 'Berlaku Bergilir' }
                      ] as const).map((wk) => {
                        const isActive = currentWeekConfig === wk.id;
                        return (
                          <button
                            key={wk.id}
                            type="button"
                            onClick={() => {
                              if (!isActive) {
                                setCurrentWeekConfig(wk.id);
                                triggerToast(`Siklus operasional aktif berhasil diubah ke ${wk.id}!`, "success");
                              }
                            }}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 cursor-pointer select-none text-center ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md font-black scale-[1.02]'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-[11.5px] font-black">{wk.id}</span>
                            <span className={`text-[8.5px] font-bold mt-0.5 pointer-events-none ${
                              isActive ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {isActive ? wk.desc : wk.inactiveDesc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {picketGroupsList.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
                  <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Belum ada kelompok yang terdaftar untuk jadwal piket harian.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {picketGroupsList
                    .filter((group) => schedulerWeekView === 'Semua' || !group.weekType || group.weekType === 'Semua' || group.weekType === schedulerWeekView)
                    .filter((group) => {
                      if (userSession?.role === 'piket' && userSession.kelas) {
                        return group.tkjt === userSession.kelas;
                      }
                      return true;
                    })
                    .map((group) => {
                      const groupAcc = picketAccountsList.find(acc => acc.groupName === group.name);
                      return (
                        <div 
                          key={group.id} 
                          className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-900">
                              <div>
                                <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">HARIAN {group.weekType && group.weekType !== 'Semua' ? `· ${group.weekType.toUpperCase()}` : ''}</span>
                                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase">{group.day}</h3>
                              </div>
                              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800">
                                {group.tkjt || 'TKJT'} {group.weekType && group.weekType !== 'Semua' ? `(${group.weekType})` : ''}
                              </span>
                            </div>

                          <div className="space-y-1">
                            <p className="text-xs text-slate-400">Kelompok Piket:</p>
                            <h4 className="text-sm font-black text-slate-700 dark:text-slate-100">{group.name}</h4>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400">Daftar Personel Bertugas:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {group.members.map((mem, i) => (
                                <span key={i} className="text-[10.5px] font-semibold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-100 dark:border-slate-900">
                                  {mem}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-6 border-t border-slate-200/50 dark:border-slate-800/85 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-slate-400">Ketua:</span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-300">
                              {groupAcc?.ketuaPiket || 'Belum diatur'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {}
          {activeInternalTab === 'laporan' && (
            <div className="space-y-8">
              
              {}
              {todayGroup ? (
                <div className="rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 md:p-8 space-y-6 shadow-sm">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                      Pencatatan Piket Hari Ini
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Silakan lakukan absensi ketika tiba di pagi hari, dan daftarkan laporan pembuktian piket sore beserta foto sebelum lab dikonfirmasi terkunci.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {}
                    <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-left">
                      <div>
                        <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded text-[9px] uppercase tracking-wider font-mono font-black">
                          Aktif Bertugas
                        </span>
                        <h4 className="text-base font-black text-slate-800 dark:text-white mt-1.5">{todayGroup.name}</h4>
                        <p className="text-xs text-slate-500">{todayGroup.day} - Kelas Terdistribusi</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pemimpin / Ketua Piket:</p>
                        <p className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <UserCheck className="h-4 w-4" />
                          {todayAccount?.ketuaPiket || 'Belum diatur Admin'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jumlah Anggota Piket:</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-350">{todayGroup.members.length} Orang Personel</p>
                      </div>
                    </div>

                    {}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-1 text-left">
                          <h5 className="text-sm font-black text-slate-800 dark:text-white">Piket Pagi (Kedatangan)</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">Persiapan piket kedatangan, verifikasi lokasi koordinat ketua kelompok bertugas pagi ini.</p>
                        </div>

                        {hasCheckedInToday ? (
                          <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border ${
                            (checkInTime.toLowerCase().includes('terlambat') || checkInTime.toLowerCase().includes('telat'))
                              ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-500'
                          }`}>
                            {(checkInTime.toLowerCase().includes('terlambat') || checkInTime.toLowerCase().includes('telat')) ? (
                              <XCircle className="h-4 w-4 shrink-0 animate-pulse text-rose-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 shrink-0 animate-bounce" />
                            )}
                            <span>Sudah Absen Datang ({checkInTime})</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsCheckInModalOpen(true)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide cursor-pointer transition-colors"
                          >
                            Absen Datang
                          </button>
                        )}
                      </div>

                      {}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-1 text-left">
                          <h5 className="text-sm font-black text-slate-800 dark:text-white">Piket Sore (Foto Bukti)</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">Unggah file bukti foto pengerjaan kebersihan ruangan sesuai jumlah penugasan sore ini.</p>
                        </div>

                        {hasCheckedInToday ? (
                          <button
                            type="button"
                            onClick={handleOpenReportModal}
                            className="w-full py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs tracking-wide cursor-pointer"
                          >
                            Laporan Pulang & Foto
                          </button>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs tracking-wide text-center cursor-not-allowed flex items-center justify-center gap-2">
                            <Lock className="h-3 w-3" />
                            Absen Pagi Terlebih Dahulu
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
                    <AlertTriangle className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-lg">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Tidak Ada Jadwal Piket Hari Ini
                    </h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                      Sistem mendeteksi bahwa tidak ada kelompok piket yang dijadwalkan aktif bertugas khusus untuk hari {currentIndonesianDay}. Silakan hubungi Guru atau daftarkan kelompok belajar baru di tab Kelompok untuk menjadwalkan tugas.
                    </p>
                  </div>
                </div>
              )}

              {}
              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Riwayat & Bukti Aktivitas Piket
                </h3>

                {picketReportsList.length === 0 ? (
                  <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
                    <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Belum ada laporan piket harian terekam di sistem.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {(() => {
                      const reportsByGroupDate = picketReportsList.reduce((acc, r) => {
                        const key = `${r.groupName}_${r.date}`;
                        if (!acc[key]) acc[key] = { groupName: r.groupName, date: r.date, datang: null, pulang: null };
                        if (r.type === 'Datang') acc[key].datang = r;
                        if (r.type === 'Pulang') acc[key].pulang = r;
                        return acc;
                      }, {} as Record<string, { groupName: string, date: string, datang: PicketReport | null, pulang: PicketReport | null }>);
                      
                      return Object.values(reportsByGroupDate).map((merged: { groupName: string, date: string, datang: PicketReport | null, pulang: PicketReport | null }) => {
                        const isEditingDatang = editingReportId === merged.datang?.id;
                        const isEditingPulang = editingReportId === merged.pulang?.id;

                        if (isEditingDatang || isEditingPulang) {
                          const editingReport = isEditingDatang ? merged.datang! : merged.pulang!;
                          const groupForThisReport = picketGroupsList.find(g => g.name === merged.groupName);
                          const membersList = groupForThisReport ? groupForThisReport.members : [];
                          return (
                            <div 
                              key={`${merged.groupName}-${merged.date}`} 
                              className="col-span-1 md:col-span-2 rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden transition-all duration-300"
                            >
                              {/* Header */}
                              <div className="flex items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 text-left">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border-2 border-blue-500/20">
                                  <ClipboardList className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="text-left space-y-1">
                                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                                    Formulir Edit {isEditingDatang ? 'Absen Datang (Pagi)' : 'Laporan Piket Harian (Sore)'}
                                  </h3>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Perbarui rincian kegiatan kebersihan serta presensi kehadiran piket harian kelompok secara akurat.
                                  </p>
                                </div>
                              </div>

                              {/* Group & Date Info Block */}
                              <div className="p-4 rounded-xl bg-blue-500/5 border-2 border-blue-500/15 space-y-1 text-left">
                                <span className="text-[9px] uppercase tracking-widest font-black text-blue-500 block">Identitas Kelompok & Tanggal:</span>
                                <p className="text-sm font-black text-slate-850 dark:text-white">{merged.groupName}</p>
                                <p className="text-[10px] text-slate-400 font-bold">Laporan Terdaftar Pada: {merged.date}</p>
                              </div>

                              <div className="space-y-6">
                                {/* Detail/Keterangan */}
                                <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 space-y-1.5 text-left bg-white dark:bg-slate-950">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Detail Kegiatan & Temuan Kebersihan:</label>
                                  <textarea
                                    required
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Tuliskan detail pengerjaan kebersihan, kendala kabel klem, atau penataan lab harian..."
                                    value={editReportForm?.description || ''}
                                    onChange={(e) => setEditReportForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none transition-all duration-200 leading-relaxed placeholder:text-slate-400"
                                  />
                                </div>

                                {/* Absent Members List Redesign - Presensi Murid */}
                                <div className="space-y-1.5 text-left bg-white dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block mb-1">
                                    Presensi Murid:
                                  </label>
                                  
                                  {/* Filters for Class and Generation */}
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="space-y-1 text-left">
                                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Filter Kelas:</label>
                                      <Dropdown 
                                        id="edit-absent-filter-tkjt"
                                        value={editAbsentFilterTkjt}
                                        onChange={(v) => setEditAbsentFilterTkjt(v)}
                                        options={
                                          editAbsentFilterAngkatan === 8
                                            ? [
                                                { value: 'TKJT 1', label: 'TKJT 1' },
                                                { value: 'TKJT 2', label: 'TKJT 2' },
                                              ]
                                            : [
                                                { value: 'TKJT 1', label: 'TKJT 1' },
                                                { value: 'TKJT 2', label: 'TKJT 2' },
                                                { value: 'TKJT 3', label: 'TKJT 3' },
                                              ]
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1 text-left">
                                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Filter Angkatan:</label>
                                      <Dropdown 
                                        id="edit-absent-filter-gen"
                                        value={editAbsentFilterAngkatan.toString()}
                                        onChange={(v) => {
                                          const newGen = Number(v);
                                          setEditAbsentFilterAngkatan(newGen);
                                          if (newGen === 8 && editAbsentFilterTkjt === 'TKJT 3') {
                                            setEditAbsentFilterTkjt('TKJT 1');
                                          }
                                        }}
                                        options={[
                                          { value: '8', label: 'Angkatan 8' },
                                          { value: '9', label: 'Angkatan 9' },
                                        ]}
                                      />
                                    </div>
                                  </div>

                                  <div className="relative mb-3">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                    <input 
                                      type="text"
                                      maxLength={50}
                                      placeholder="Cari nama murid..."
                                      value={editAbsentSearch}
                                      onChange={(e) => setEditAbsentSearch(e.target.value)}
                                      className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 text-slate-850 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                                    />
                                  </div>

                                  <div className="border-2 border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/75 dark:bg-slate-900/50 p-2">
                                    <div 
                                      className="max-h-52 overflow-y-auto pr-1 grid grid-cols-1 gap-2 scrollbar-style"
                                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                      {(() => {
                                        const filteredStudents = students.filter(student => {
                                          const matchesClass = student.kelas.toUpperCase().includes(editAbsentFilterTkjt.toUpperCase());
                                          const matchesGen = student.angkatan === Number(editAbsentFilterAngkatan);
                                          const matchesSearch = student.name.toLowerCase().includes(editAbsentSearch.toLowerCase());
                                          return matchesClass && matchesGen && matchesSearch;
                                        });

                                        if (filteredStudents.length === 0) {
                                          return (
                                            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 italic text-center py-6">
                                              Tidak ada murid yang cocok dengan pencarian...
                                            </div>
                                          );
                                        }

                                        return filteredStudents.map((stud, idx) => {
                                          const foundItem = editReportForm?.absentMembers.find(ab => ab.startsWith(stud.name + " (") || ab === stud.name);
                                          const isAbsent = !!foundItem;
                                          const currentReason = foundItem 
                                            ? (foundItem.includes("Sakit") ? "Sakit" : foundItem.includes("Izin") ? "Izin" : "Alfa") 
                                            : "Hadir";

                                          return (
                                            <div
                                              key={stud.id}
                                              className={`flex items-center justify-between p-2 rounded-xl border-2 text-xs transition-all duration-200 ${
                                                isAbsent 
                                                  ? currentReason === 'Alfa'
                                                    ? 'border-rose-500 bg-rose-500/10 text-rose-850 dark:text-rose-400 font-bold'
                                                    : currentReason === 'Sakit'
                                                      ? 'border-amber-500 bg-amber-500/10 text-amber-750 dark:text-amber-450 font-bold'
                                                      : 'border-blue-500 bg-blue-500/10 text-blue-750 dark:text-blue-450 font-bold'
                                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                                              }`}
                                            >
                                              <div 
                                                className="flex items-center gap-2 cursor-pointer select-none flex-1 truncate mr-2 font-bold text-left"
                                                onClick={() => {
                                                  if (isAbsent) {
                                                    setEditReportForm(prev => {
                                                      if (!prev) return null;
                                                      return {
                                                        ...prev,
                                                        absentMembers: prev.absentMembers.filter(ab => !(ab.startsWith(stud.name + " (") || ab === stud.name))
                                                      };
                                                    });
                                                  } else {
                                                    setEditReportForm(prev => {
                                                      if (!prev) return null;
                                                      return {
                                                        ...prev,
                                                        absentMembers: [...prev.absentMembers, `${stud.name} (Alfa)`]
                                                      };
                                                    });
                                                  }
                                                }}
                                              >
                                                {!isAbsent && (
                                                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0" />
                                                )}
                                                {isAbsent && (
                                                  <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                                                    currentReason === 'Alfa' ? 'bg-rose-500 text-white' : currentReason === 'Sakit' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                                  }`}>
                                                    <Check className="h-2.5 w-2.5" />
                                                  </span>
                                                )}
                                                <span className="truncate pr-1 font-bold">{stud.name}</span>
                                              </div>

                                              {isAbsent ? (
                                                <div className="flex gap-1 shrink-0 min-w-[70px] justify-end">
                                                  {(['Alfa', 'Sakit', 'Izin'] as const).map(reasonType => (
                                                    <button
                                                      key={reasonType}
                                                      type="button"
                                                      onClick={() => {
                                                        setEditReportForm(prev => {
                                                          if (!prev) return null;
                                                          const filtered = prev.absentMembers.filter(item => !(item.startsWith(stud.name + " (") || item === stud.name));
                                                          return {
                                                            ...prev,
                                                            absentMembers: [...filtered, `${stud.name} (${reasonType})`]
                                                          };
                                                        });
                                                      }}
                                                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer border border-transparent ${
                                                        currentReason === reasonType
                                                          ? reasonType === 'Alfa'
                                                            ? 'bg-rose-500 text-white dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700 shadow-sm'
                                                            : reasonType === 'Sakit'
                                                              ? 'bg-amber-500 text-white dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 shadow-sm'
                                                              : 'bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 shadow-sm'
                                                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                                      }`}
                                                    >
                                                      {reasonType[0]}
                                                    </button>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="min-w-[70px] flex justify-end">
                                                  <span className="text-[8px] text-slate-400 font-black bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-transparent">Hadir</span>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Footer */}
                              <div className="flex gap-3 justify-end pt-5 border-t border-slate-200 dark:border-slate-800">
                                <button 
                                  type="button" 
                                  onClick={() => {setEditingReportId(null); setEditReportForm(null);}} 
                                  className="px-5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button 
                                  type="button" 
                                  onClick={handleSaveReportEdit} 
                                  className="px-5 py-2.5 rounded-xl bg-blue-600 border-2 border-blue-600 text-white text-xs font-black hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                                >
                                  Simpan Perubahan
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={`${merged.groupName}-${merged.date}`}
                            className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-400 font-bold">{merged.date}</span>
                                <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-black">
                                  Hasil Laporan
                                </span>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{merged.groupName}</h4>
                                
                                {merged.datang && (
                                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <p className="font-bold text-blue-600 dark:text-blue-400 mb-1">Absen Datang</p>
                                    <p className="break-words">{merged.datang.description}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Pelapor: {merged.datang.reporter}</p>
                                    {merged.datang.absentMembers && merged.datang.absentMembers.length > 0 && (
                                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Anggota Tidak Hadir (Datang):</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                          {merged.datang.absentMembers.map((ab, i) => <li key={i} className="text-[10px]">{ab}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {merged.pulang && (
                                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Hasil Laporan</p>
                                    <p className="break-words">{merged.pulang.description}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-slate-500">
                                      <p>{merged.pulang.arrivalTime} - {merged.pulang.departureTime}</p>
                                      <p>{merged.pulang.cleanedRooms}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Pelapor: {merged.pulang.reporter}</p>
                                    {merged.pulang.absentMembers && merged.pulang.absentMembers.length > 0 && (
                                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Anggota Tidak Hadir (Hasil):</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                          {merged.pulang.absentMembers.map((ab, i) => <li key={i} className="text-[10px]">{ab}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6 flex items-center justify-end gap-3 text-xs font-semibold text-slate-500">
                                {isLoggedIn && userSession && (userSession.role === 'admin' || userSession.role === 'piket') && (
                                  <div className="flex items-center gap-3">
                                    {merged.datang && (
                                        <button type="button" onClick={() => handleStartEditReport(merged.datang!)} className="text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-bold">
                                            <Edit className="h-3.5 w-3.5" /> Edit Datang
                                        </button>
                                    )}
                                    {merged.pulang && (
                                        <button type="button" onClick={() => handleStartEditReport(merged.pulang!)} className="text-emerald-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer font-bold">
                                            <Edit className="h-3.5 w-3.5" /> Edit Hasil
                                        </button>
                                    )}
                                    <span className="text-slate-300 dark:text-slate-700">|</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (merged.datang) handleDeleteReport(merged.datang.id);
                                            if (merged.pulang) handleDeleteReport(merged.pulang.id);
                                        }}
                                        className="text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer font-bold"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                  </div>
                )}
              </div>

            </div>
          )}


        </motion.div>
      </AnimatePresence>

      {}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Verifikasi Lokasi Presensi"
        subtitle={`Sistem mendeteksi koordinat GPS secara otomatis untuk memverifikasi bahwa Anda bertugas pagi ini bertempat di SMK Ananda Mitra Industri Deltamas.`}
        icon={<MapPin className="h-6 w-6 text-blue-500" />}
        maxWidth="sm"
      >
        <div className="space-y-5 text-left">
          
          {checkInModalError && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 text-left">
                <span className="font-extrabold uppercase tracking-wider block text-[10px] text-rose-500 mb-0.5">Peringatan:</span>
                <p className="leading-relaxed">{checkInModalError}</p>
              </div>
            </div>
          )}
          
          {gpsLoading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Compass className="h-10 w-10 text-blue-500 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 animate-pulse">Menghubungkan ke Satelit GPS...</p>
                <p className="text-[10px] text-slate-400">Sedang menyinkronkan koordinat letak lintang dan bujur...</p>
              </div>
            </div>
          )}

          {gpsError && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-rose-500/5 rounded-2xl border-2 border-dashed border-rose-500/20">
              <AlertTriangle className="h-10 w-10 text-rose-500 animate-pulse" />
              <div className="text-center space-y-1">
                <p className="text-xs font-extrabold text-rose-600 dark:text-rose-450">{gpsError}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">Pastikan izin lokasi GPS diaktifkan di browser Anda dan Anda berada di area sekolah.</p>
              </div>
              <button
                type="button"
                onClick={handleStartLocationCheck}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Coba Deteksi Ulang
              </button>
            </div>
          )}

          {gpsCoordinates && (() => {
            const distance = Math.round(getDistanceInMeters(gpsCoordinates.lat, gpsCoordinates.lng, SCHOOL_COORDS.lat, SCHOOL_COORDS.lng));
            const isNearSchool = distance <= 500;
            return (
              <div className="space-y-4">
                <div className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center text-center space-y-4 ${
                  isNearSchool ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                }`}>
                  {isNearSchool ? (
                    <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border-2 border-rose-500/20">
                      <XCircle className="h-6 w-6" />
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <h5 className={`text-sm font-bold uppercase tracking-wider ${isNearSchool ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isNearSchool ? 'Lokasi Terverifikasi' : 'Di Luar Area Presensi'}
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      {isNearSchool 
                        ? `Berhasil dideteksi! Jarak Anda adalah ${distance} meter dari SMK Ananda Mitra Industri Deltamas.` 
                        : `Jarak Anda saat ini adalah ${distance} meter. Batas toleransi presensi di sekolah adalah maksimal 500 meter.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t-2 border-slate-300 dark:border-slate-800 text-left font-mono text-[11px] text-slate-500">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border-2 border-transparent">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Garis Lintang</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{gpsCoordinates.lat.toFixed(6)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border-2 border-transparent">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Garis Bujur</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{gpsCoordinates.lng.toFixed(6)}</span>
                    </div>
                    <div className="col-span-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center border-2 border-transparent">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Estimasi Akurasi Jarak:</span>
                      <span className={`font-bold ${isNearSchool ? 'text-emerald-500' : 'text-rose-500'}`}>{distance} Meter</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-4 border-t-2 border-slate-300 dark:border-slate-800 mt-6 select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCheckInModalOpen(false)}
              className="w-1/2"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={isSubmittingCheckIn}
              disabled={gpsLoading || !gpsCoordinates}
              onClick={handleLocationCheckInSubmit}
              className="w-1/2"
            >
              Kirim Absen Datang
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Formulir Laporan Piket Harian (Sore)"
        subtitle="Unggah foto pembuktian piket harian laboratorium komputer dan telekomunikasi sebelum meninggalkan ruangan."
        icon={<ClipboardList className="h-6 w-6" />}
        maxWidth="lg"
      >

              <div className="p-4 rounded-xl bg-blue-500/5 border-2 border-blue-500/15 space-y-1 mb-6">
                <span className="text-[9px] uppercase tracking-widest font-black text-blue-500 block">Deteksi Kelompok Otomatis:</span>
                <p className="text-sm font-black text-slate-850 dark:text-white">{todayGroup?.name || "Tidak Terdeteksi"}</p>
                <p className="text-[10px] text-slate-400 font-bold">Terdeteksi bertugas hari ini pada {currentIndonesianDay}.</p>
              </div>
              
              <form onSubmit={handleSubmissionReport} className="space-y-5 mt-2">
                
                {reportModalError && (
                  <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    <div className="flex-1 text-left">
                      <span className="font-extrabold uppercase tracking-wider block text-[10px] text-rose-500 mb-0.5">Peringatan:</span>
                      <p className="leading-relaxed">{reportModalError}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between px-2.5 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 mb-6 select-none">
                  {[
                    { step: 1, label: 'Kondisi Lab', icon: <ClipboardList className="h-3.5 w-3.5" /> },
                    { step: 2, label: 'Absensi Siswa', icon: <UserX className="h-3.5 w-3.5" /> },
                    { step: 3, label: 'Bukti & PIN', icon: <Lock className="h-3.5 w-3.5" /> },
                  ].map((item, idx) => (
                    <div key={item.step} className="flex items-center flex-1 last:flex-none">
                      <button
                        type="button"
                        onClick={() => {
                          
                          if (item.step > 1 && !reportDescription) {
                            setReportModalError("Rincian pengerjaan laporan piket harus diisi terlebih dahulu!");
                            return;
                          }
                          setReportModalError(null);
                          setCurrentReportStep(item.step);
                        }}
                        className="flex items-center gap-1.5 focus:outline-none transition-all"
                      >
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          currentReportStep === item.step
                            ? 'bg-blue-600 text-white'
                            : currentReportStep > item.step
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {currentReportStep > item.step ? <Check className="h-3.5 w-3.5" /> : item.step}
                        </span>
                        <span className={`text-[10px] sm:text-xs font-semibold hidden xs:inline ${
                          currentReportStep === item.step
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                      {idx < 2 && (
                        <div className={`flex-1 h-[2px] mx-3 rounded ${
                          currentReportStep > item.step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {}
                <AnimatePresence mode="wait">
                  {currentReportStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {}
                      <div className="p-3.5 rounded-xl bg-blue-500/5 border-2 border-blue-500/20 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <span className="text-[9px] uppercase tracking-widest font-bold text-blue-500 block">Deteksi Kelompok Hari Ini:</span>
                          <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                            {todayGroup?.name || "Tidak Terdeteksi"}
                          </p>
                        </div>
                      </div>

                      {}
                      <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 space-y-1.5 text-left">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Detail Kegiatan & Temuan Kebersihan:</label>
                        <textarea
                          required
                          rows={4}
                          maxLength={500}
                          placeholder="Tuliskan detail pengerjaan kebersihan, kendala kabel klem, atau penataan lab harian..."
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none transition-all duration-200 leading-relaxed placeholder:text-slate-400"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentReportStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {}
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2.5 text-left text-xs text-amber-800 dark:text-amber-400">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="font-medium leading-normal">
                          Gunakan menu pencarian & filter di bawah untuk melaporkan anggota kelas yang tidak hadir/absen hari ini.
                        </p>
                      </div>

                      {}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Filter Kelas:</label>
                          <Dropdown 
                            id="absent-filter-tkjt"
                            value={absentFilterTkjt}
                            onChange={(v) => setAbsentFilterTkjt(v)}
                            options={
                              absentFilterAngkatan === 8
                                ? [
                                    { value: 'TKJT 1', label: 'TKJT 1' },
                                    { value: 'TKJT 2', label: 'TKJT 2' },
                                  ]
                                : [
                                    { value: 'TKJT 1', label: 'TKJT 1' },
                                    { value: 'TKJT 2', label: 'TKJT 2' },
                                    { value: 'TKJT 3', label: 'TKJT 3' },
                                  ]
                            }
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Filter Angkatan:</label>
                          <Dropdown 
                            id="absent-filter-gen"
                            value={absentFilterAngkatan.toString()}
                            onChange={(v) => {
                              const newGen = Number(v);
                              setAbsentFilterAngkatan(newGen);
                              if (newGen === 8 && absentFilterTkjt === 'TKJT 3') {
                                setAbsentFilterTkjt('TKJT 1');
                              }
                            }}
                            options={[
                              { value: '8', label: 'Angkatan 8' },
                              { value: '9', label: 'Angkatan 9' },
                            ]}
                          />
                        </div>
                      </div>

                      {}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Cari Nama Siswa:</label>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                          <input 
                            type="text"
                            maxLength={50}
                            placeholder="Cari nama siswa..."
                            value={absentSearch}
                            onChange={(e) => setAbsentSearch(e.target.value)}
                            className="w-full text-xs rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 text-slate-850 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Pilih Siswa & Tentukan Alasan:
                        </label>
                        <div className="border-2 border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/75 dark:bg-slate-900/50 p-2">
                          <div 
                            className="max-h-40 overflow-y-auto pr-1 grid grid-cols-1 gap-2 scrollbar-style"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {(() => {
                              const activeGroupMembersSet = new Set(todayGroup ? todayGroup.members : []);
                              const filteredAbsentStudents = students.filter(student => {
                                const matchesClass = student.kelas.toUpperCase().includes(absentFilterTkjt.toUpperCase());
                                const matchesGen = student.angkatan === Number(absentFilterAngkatan);
                                const matchesSearch = student.name.toLowerCase().includes(absentSearch.toLowerCase());
                                const isNotGroupMember = !activeGroupMembersSet.has(student.name);
                                return matchesClass && matchesGen && matchesSearch && isNotGroupMember;
                              });

                              if (filteredAbsentStudents.length === 0) {
                                return (
                                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 italic text-center py-6">
                                    Tidak ada siswa yang cocok atau semua sudah masuk kelompok piket...
                                  </div>
                                );
                              }

                              return filteredAbsentStudents.map(stud => {
                                const foundItem = reportAbsentField.find(item => item.startsWith(stud.name + " (") || item === stud.name);
                                const isSelected = !!foundItem;
                                const currentReason = foundItem 
                                  ? (foundItem.includes("Sakit") ? "Sakit" : foundItem.includes("Izin") ? "Izin" : "Alfa") 
                                  : "Alfa";

                                return (
                                  <div
                                    key={stud.id}
                                    className={`flex items-center justify-between p-2 rounded-xl border-2 text-xs transition-all duration-200 ${
                                      isSelected 
                                        ? currentReason === 'Alfa'
                                          ? 'border-rose-500 bg-rose-500/10 text-rose-850 dark:text-rose-400 font-bold'
                                          : currentReason === 'Sakit'
                                            ? 'border-amber-500 bg-amber-500/10 text-amber-750 dark:text-amber-450 font-bold'
                                            : 'border-blue-500 bg-blue-500/10 text-blue-750 dark:text-blue-450 font-bold'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                  >
                                    <div 
                                      className="flex items-center gap-2 cursor-pointer select-none flex-1 truncate mr-2"
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveAbsentFromReport(stud.name);
                                        } else {
                                          setReportAbsentField(prev => [...prev, `${stud.name} (Alfa)`]);
                                        }
                                      }}
                                    >
                                      {!isSelected && (
                                        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0" />
                                      )}
                                      {isSelected && (
                                        <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                          currentReason === 'Alfa' ? 'bg-rose-500 text-white' : currentReason === 'Sakit' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                        }`}>
                                          <Check className="h-2.5 w-2.5" />
                                        </span>
                                      )}
                                      <span className="truncate pr-1 font-bold">{stud.name}</span>
                                    </div>

                                    {isSelected ? (
                                      <div className="flex gap-1 shrink-0 min-w-[60px] justify-end">
                                        {(['Alfa', 'Sakit', 'Izin'] as const).map(reasonType => (
                                          <button
                                            key={reasonType}
                                            type="button"
                                            onClick={() => {
                                              setReportAbsentField(prev => {
                                                const filtered = prev.filter(item => !(item.startsWith(stud.name + " (") || item === stud.name));
                                                return [...filtered, `${stud.name} (${reasonType})`];
                                              });
                                            }}
                                            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer border border-transparent ${
                                              currentReason === reasonType
                                                ? reasonType === 'Alfa'
                                                  ? 'bg-rose-500 text-white dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700 shadow-sm'
                                                  : reasonType === 'Sakit'
                                                    ? 'bg-amber-500 text-white dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 shadow-sm'
                                                    : 'bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                          >
                                            {reasonType[0]}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="min-w-[60px] flex justify-end">
                                        <span className="text-[8px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-transparent">Hadir</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      {}
                      {reportAbsentField.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t-2 border-slate-300 dark:border-slate-800 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Daftar Terlapor Tidak Hadir:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {reportAbsentField.map((n, idx) => {
                              const baseName = n.includes(" (") ? n.split(" (")[0] : n;
                              const reason = n.includes(" (") ? (n.includes("Sakit") ? "Sakit" : n.includes("Izin") ? "Izin" : "Alfa") : "Alfa";
                              return (
                                <div key={idx} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-black ${
                                  reason === 'Alfa'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                    : reason === 'Sakit'
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                      : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                                }`}>
                                  <span>{baseName} ({reason})</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAbsentFromReport(baseName)}
                                    className={`rounded-full p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 ${
                                      reason === 'Alfa' ? 'text-rose-500' : reason === 'Sakit' ? 'text-amber-500' : 'text-blue-500'
                                    }`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {currentReportStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-semibold text-slate-500">Berapa foto bukti dikirimkan?</label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  setReportPhotoCount(num);
                                  setUploadedPhotos(prev => prev.slice(0, num));
                                }}
                                className={`h-7.5 w-7.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                                  reportPhotoCount === num 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-300 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        {}
                        <div className={`grid gap-3 ${
                          reportPhotoCount === 1 
                            ? 'grid-cols-1 max-w-xs mx-auto w-full' 
                            : reportPhotoCount === 2 
                              ? 'grid-cols-1 sm:grid-cols-2' 
                              : 'grid-cols-1 sm:grid-cols-3'
                        }`}>
                          {Array.from({ length: reportPhotoCount }).map((_, i) => (
                            <div key={i} className="space-y-1.5 text-xs text-left flex flex-col justify-between">
                              <span className="text-[9px] text-slate-450 font-semibold uppercase">BUKTI FOTO {i + 1}:</span>
                              <div className="h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 overflow-hidden relative flex flex-col items-center justify-center p-3 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200">
                                {uploadedPhotos[i] ? (
                                  <div className="absolute inset-0 group">
                                    <img src={uploadedPhotos[i]} alt="Upload Preview" className="w-full h-full object-cover animate-none animate-none" referrerPolicy="no-referrer" />
                                    <button
                                      type="button"
                                      onClick={() => setUploadedPhotos(prev => {
                                        const updated = [...prev];
                                        updated[i] = '';
                                        return updated;
                                      })}
                                      className="absolute top-1.5 right-1.5 bg-slate-950/80 hover:bg-rose-600 text-white p-1 rounded-full opacity-90 transition-opacity"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center space-y-1 cursor-pointer w-full h-full text-center select-none">
                                    <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Klik / Pilih</span>
                                    <span className="text-[8px] text-slate-400 font-bold">Atau gunakan sampel di bawah</span>
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={(e) => handleFileChange(i, e)}
                                      className="hidden" 
                                    />
                                  </label>
                                )}
                              </div>

                                                          </div>
                          ))}
                        </div>
                      </div>

                      {}
                      <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-4 rounded-2xl text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">PIN Otorisasi Ketua Piket:</label>
                          <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase">Pemberi Izin</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-bold">
                          Ketik PIN 8-digit ketua aktif (<span className="text-blue-500 font-bold">{todayAccount?.ketuaPiket || 'Ketua Piket'}</span>) untuk konfirmasi pengiriman laporan.
                        </p>
                        <input
                          type="password"
                          required
                          maxLength={8}
                          value={picketSorePinInput}
                          onChange={(e) => setPicketSorePinInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••••"
                          className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-rose-500 focus:outline-none focus:border-blue-500 disabled:opacity-55"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-slate-300 dark:border-slate-800 mt-5 select-none">
                  {currentReportStep > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCurrentReportStep(prev => Math.max(1, prev - 1))}
                      className="w-1/2 flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Kembali
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsReportModalOpen(false)}
                      className="w-1/2"
                    >
                      Batal
                    </Button>
                  )}

                  {currentReportStep < 3 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        if (!reportDescription) {
                          triggerToast("Rincian pengerjaan laporan piket harus diisi!", "error");
                          return;
                        }
                        setCurrentReportStep(prev => Math.min(3, prev + 1));
                      }}
                      className="w-1/2 flex items-center justify-center gap-1"
                    >
                      Lanjut <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmittingReport}
                      onClick={handleSubmissionReport}
                      className="w-1/2"
                    >
                      Kirim Laporan Pulang
                    </Button>
                  )}
                </div>
              </form>
      </Modal>

      {}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={deleteConfirm?.title || 'Konfirmasi Hapus'}
        subtitle={deleteConfirm?.message || ""}
        icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
      >

          <div className="flex gap-3 pt-5 border-t-2 border-slate-300 dark:border-slate-800 mt-6 select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
              className="w-1/2"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              className="w-1/2"
            >
              Ya, Hapus
            </Button>
          </div>
      </Modal>

    </div>
  );
}
