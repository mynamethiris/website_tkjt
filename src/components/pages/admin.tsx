// Komponen Halaman Admin Kredensial & Penjadwalan Piket Laboratorium
import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Users,
  Key,
  Plus,
  Trash2,
  Edit,
  UserCheck,
  Shuffle,
  Eye,
  EyeOff,
  Search,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { PicketAccount, PicketGroup, Student } from "../../types";
import Dropdown from "../features/dropdown";
import Modal from "../features/modal";
import Button from "../features/button";
import studentsData from "../../../data/students.json";
const students = studentsData as Student[];

import { deepEqual } from '../../utils';

interface AdminPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
  userSession?: {
    username: string;
    role: "admin" | "piket" | "tamu";
    kelas?: string;
    angkatan?: number;
  } | null;
}

export default function AdminPage({
  isLoggedIn,
  onLoginRequest,
  triggerToast,
  userSession,
}: AdminPageProps) {
  // [State]
  const [activeAdminTab, setActiveAdminTab] = useState<
    "kredensial" | "kelompok"
  >("kredensial");

  const [picketGroupsList, setPicketGroupsList] =
    useState<PicketGroup[]>([]);
  const [picketAccountsList, setPicketAccountsList] =
    useState<PicketAccount[]>([]);
  const rotationRan = useRef(false);

  const savePicketData = async (
    groups: PicketGroup[],
    accounts: PicketAccount[],
  ) => {
    localStorage.setItem("tkjt_picket_accounts", JSON.stringify(accounts));
    try {
      const res = await fetch("/api/picket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picketGroups: groups,
          picketAccounts: accounts,
        }),
      });
      if (res.ok) {
        triggerToast("Data berhasil disimpan ke server!", "success");
      } else {
        triggerToast("Gagal menyimpan data ke server", "error");
      }
    } catch {
      triggerToast("Gagal menyimpan: koneksi terputus", "error");
    }
  };

  // [Efek Muat Data] - Manual save pattern - keep polling for remote sync
  useEffect(() => {
    let mounted = true;

    fetch("/api/picket")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data) {
          if (Array.isArray(data.picketGroups) && data.picketGroups.length > 0)
            setPicketGroupsList(data.picketGroups);
          if (
            Array.isArray(data.picketAccounts) &&
            data.picketAccounts.length > 0
          ) {
            setPicketAccountsList(data.picketAccounts);
            localStorage.setItem(
              "tkjt_picket_accounts",
              JSON.stringify(data.picketAccounts),
            );
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching picket data in admin:", err);
      });

    const poll = setInterval(() => {
      fetch("/api/picket")
        .then((res) => res.json())
        .then((data) => {
          if (mounted && data) {
            if (Array.isArray(data.picketGroups)) {
              setPicketGroupsList((prev) => {
                if (!deepEqual(prev, data.picketGroups)) {
                  return data.picketGroups;
                }
                return prev;
              });
            }
            if (Array.isArray(data.picketAccounts)) {
              setPicketAccountsList((prev) => {
                if (!deepEqual(prev, data.picketAccounts)) {
                  localStorage.setItem(
                    "tkjt_picket_accounts",
                    JSON.stringify(data.picketAccounts),
                  );
                  return data.picketAccounts;
                }
                return prev;
              });
            }
          }
        })
        .catch((err) =>
          console.error("Error polling picket data in admin:", err),
        );
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  // [Efek Rotasi Ketua - sekali saat data dimuat & butuh rotasi]
  useEffect(() => {
    if (rotationRan.current) return;
    if (picketGroupsList.length === 0 && picketAccountsList.length === 0)
      return;

    const needsRotation = picketAccountsList.some(
      (acc) => !acc.leaderAssignedAt || !acc.leaderHistory,
    );
    if (!needsRotation) {
      rotationRan.current = true;
      return;
    }

    rotationRan.current = true;
    const nowMs = Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    const updated = picketAccountsList.map((acc) => {
      const group = picketGroupsList.find((g) => g.name === acc.groupName);
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
        const remaining = group.members.filter((m) => !history.includes(m));
        let nextLeader = "";
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
          leaderHistory: newHistory,
        };
      }

      if (
        !acc.leaderAssignedAt ||
        !acc.leaderHistory ||
        acc.ketuaPiket !== actualLeader
      ) {
        return {
          ...acc,
          ketuaPiket: actualLeader,
          leaderAssignedAt: assignedTime,
          leaderHistory: history,
        };
      }

      return acc;
    });

    setPicketAccountsList(updated);
  }, [picketGroupsList]);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PicketAccount | null>(
    null,
  );

  const [accountGroupName, setAccountGroupName] = useState("");
  const [accountPin, setAccountPin] = useState("");
  const [accountKetua, setAccountKetua] = useState("");

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountGroupName, setEditAccountGroupName] = useState("");
  const [editAccountPin, setEditAccountPin] = useState("");
  const [editAccountKetua, setEditAccountKetua] = useState("");

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupTkjt, setEditGroupTkjt] = useState("TKJT 1");
  const [editGroupAngkatan, setEditGroupAngkatan] = useState<number>(8);
  const [editGroupDay, setEditGroupDay] = useState("Senin");
  const [editGroupMembers, setEditGroupMembers] = useState<string[]>([]);
  const [editGroupStudentSearch, setEditGroupStudentSearch] = useState("");
  const [editGroupWeekType, setEditGroupWeekType] = useState<
    "Minggu 1" | "Minggu 2"
  >("Minggu 1");

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PicketGroup | null>(null);
  const [groupTkjtField, setGroupTkjtField] = useState("TKJT 1");
  const [groupAngkatanField, setGroupAngkatanField] = useState<number>(8);
  const [groupDayField, setGroupDayField] = useState("Senin");
  const [groupMembersField, setGroupMembersField] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [groupWeekTypeField, setGroupWeekTypeField] = useState<
    "Minggu 1" | "Minggu 2"
  >("Minggu 1");

  const allDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const allWeeks: ("Minggu 1" | "Minggu 2")[] = ["Minggu 1", "Minggu 2"];

  const availableDaysForGroupModal = allDays.filter(
    (day) =>
      !picketGroupsList.some(
        (g) =>
          g.tkjt === groupTkjtField &&
          g.angkatan === Number(groupAngkatanField) &&
          g.id !== editingGroup?.id &&
          g.day === day &&
          g.weekType === groupWeekTypeField,
      ),
  );

  const availableWeeksForGroupModal = allWeeks.filter((week) =>
    allDays.some(
      (day) =>
        !picketGroupsList.some(
          (g) =>
            g.tkjt === groupTkjtField &&
            g.angkatan === Number(groupAngkatanField) &&
            g.id !== editingGroup?.id &&
            g.day === day &&
            g.weekType === week,
        ),
    ),
  );

  const availableDaysForInlineEdit = allDays.filter(
    (day) =>
      !picketGroupsList.some(
        (g) =>
          g.tkjt === editGroupTkjt &&
          g.angkatan === Number(editGroupAngkatan) &&
          g.id !== editingGroupId &&
          g.day === day &&
          g.weekType === editGroupWeekType,
      ),
  );

  const availableWeeksForInlineEdit = allWeeks.filter((week) =>
    allDays.some(
      (day) =>
        !picketGroupsList.some(
          (g) =>
            g.tkjt === editGroupTkjt &&
            g.angkatan === Number(editGroupAngkatan) &&
            g.id !== editingGroupId &&
            g.day === day &&
            g.weekType === week,
        ),
    ),
  );

  const availableGroupsForAccountModal = picketGroupsList.filter(
    (g) =>
      !picketAccountsList.some(
        (acc) => acc.groupName === g.name && acc.id !== editingAccount?.id,
      ),
  );

  const availableGroupsForInlineAccountEdit = picketGroupsList.filter(
    (g) =>
      !picketAccountsList.some(
        (acc) => acc.groupName === g.name && acc.id !== editingAccountId,
      ),
  );

  const studentsInOtherGroups = picketGroupsList
    .filter((g) => g.id !== editingGroup?.id)
    .flatMap((g) => g.members);

  const filteredStudentsForDropdown = students.filter((student) => {
    const matchesClass = student.kelas
      .toLowerCase()
      .includes(groupTkjtField.toLowerCase());
    const matchesGeneration = student.angkatan === Number(groupAngkatanField);
    const matchesSearch = student.name
      .toLowerCase()
      .includes(studentSearch.toLowerCase());
    const notInOtherGroup = !studentsInOtherGroups.includes(student.name);
    return (
      matchesClass && matchesGeneration && matchesSearch && notInOtherGroup
    );
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
    message: string;
    type: "account" | "group";
  } | null>(null);

  const [showPicketPins, setShowPicketPins] = useState<Record<string, boolean>>(
    {},
  );

  const [groupModalError, setGroupModalError] = useState<string | null>(null);
  const [accountModalError, setAccountModalError] = useState<string | null>(
    null,
  );
  const [inlineGroupEditError, setInlineGroupEditError] = useState<{
    [key: string]: string;
  }>({});
  const [inlineAccountEditError, setInlineAccountEditError] = useState<{
    [key: string]: string;
  }>({});

  // [Efek Reset Error]
  useEffect(() => {
    if (!isGroupModalOpen) setGroupModalError(null);
  }, [isGroupModalOpen]);

  useEffect(() => {
    if (!isAccountModalOpen) setAccountModalError(null);
  }, [isAccountModalOpen]);

  const generateRandomPIN = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const generateUsername = (group: PicketGroup | undefined): string => {
    if (!group) return "pilih_kelompok";
    const dayMap: Record<string, string> = {
      Senin: "SN",
      Selasa: "SL",
      Rabu: "RB",
      Kamis: "KM",
      Jumat: "JM",
    };
    const dayAbbr = dayMap[group.day] || group.day.charAt(0).toUpperCase();
    const kelas = (group.tkjt || "TKJT 1").replace("TKJT ", "");
    const angkatan = group.angkatan || 8;
    const minggu = group.weekType === "Minggu 2" ? "M2" : "M1";
    return `${dayAbbr}${kelas}-TKJT${kelas}-${angkatan}-${minggu}`;
  };

  // [Akun]
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountGroupName(picketGroupsList[0]?.name || "");
    setAccountPin(generateRandomPIN());
    setAccountKetua("");
    setIsAccountModalOpen(true);
  };

  const activeGroupForAccount = picketGroupsList.find(
    (g) => g.name === accountGroupName,
  );

  const handleSubmitAccount = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    setAccountModalError(null);

    if (!accountGroupName) {
      setAccountModalError("Pilih Kelompok Piket Mitra terlebih dahulu!");
      return;
    }
    if (!accountPin) {
      setAccountModalError("PIN Password wajib diisi!");
      return;
    }
    if (accountPin.length < 8) {
      setAccountModalError("PIN Password harus bernilai tepat 8 digit angka!");
      return;
    }
    if (!accountKetua) {
      setAccountModalError(
        "Tentukan Ketua Piket penanggung jawab dari kelompok tersebut!",
      );
      return;
    }

    const matchedGroup = picketGroupsList.find(
      (g) => g.name === accountGroupName,
    );
    const generatedUsername = generateUsername(matchedGroup);

    const newAccount: PicketAccount = {
      id: `acc-${Date.now()}`,
      groupName: accountGroupName,
      day: matchedGroup?.day || "Senin",
      username: generatedUsername,
      pin: accountPin,
      ketuaPiket: accountKetua,
    };

    const newAccounts = [...picketAccountsList, newAccount];
    setPicketAccountsList(newAccounts);
    savePicketData(picketGroupsList, newAccounts);

    triggerToast(
      `Kredensial tim piket ${accountGroupName} berhasil dibuat!`,
      "success",
    );
    setIsAccountModalOpen(false);
  };

  const handleStartEditAccountInline = (acc: PicketAccount) => {
    setEditingAccountId(acc.id);
    setEditAccountGroupName(acc.groupName);
    setEditAccountPin(acc.pin);
    setEditAccountKetua(acc.ketuaPiket);
  };

  const handleSaveAccountInline = () => {
    if (!editingAccountId) return;
    if (editAccountPin.length < 8) {
      triggerToast("PIN Password harus bernilai tepat 8 digit angka!", "error");
      return;
    }
    if (!editAccountKetua) {
      triggerToast("Tentukan Ketua Piket penanggung jawab!", "error");
      return;
    }

    const matchedGroup = picketGroupsList.find(
      (g) => g.name === editAccountGroupName,
    );
    const generatedUsername = generateUsername(matchedGroup);

    const newAccounts = picketAccountsList.map((acc) => {
      if (acc.id === editingAccountId) {
        return {
          ...acc,
          groupName: editAccountGroupName,
          day: matchedGroup?.day || acc.day,
          username: generatedUsername,
          pin: editAccountPin,
          ketuaPiket: editAccountKetua,
        };
      }
      return acc;
    });

    setPicketAccountsList(newAccounts);
    savePicketData(picketGroupsList, newAccounts);

    triggerToast("Kredensial akun piket berhasil diperbarui!", "success");
    setEditingAccountId(null);
  };

  const handleDeleteAccount = (id: string) => {
    setDeleteConfirm({
      id,
      title: "Hapus Akun Kredensial Piket",
      message:
        "Apakah Anda yakin ingin menghapus akun ketua piket ini? Pengguna bersangkutan tidak akan bisa login.",
      type: "account",
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "group") {
      const newGroups = picketGroupsList.filter(
        (g) => g.id !== deleteConfirm.id,
      );
      setPicketGroupsList(newGroups);
      savePicketData(newGroups, picketAccountsList);
      triggerToast("Kelompok piket berhasil dihapus!", "success");
    } else {
      const newAccounts = picketAccountsList.filter(
        (acc) => acc.id !== deleteConfirm.id,
      );
      setPicketAccountsList(newAccounts);
      savePicketData(picketGroupsList, newAccounts);
      triggerToast("Akun ketua piket berhasil dihapus!", "success");
    }
    setDeleteConfirm(null);
  };

  const togglePinVisibility = (id: string) => {
    setShowPicketPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // [Kelompok]
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupTkjtField("TKJT 1");
    setGroupAngkatanField(8);
    setGroupDayField("Senin");
    setGroupMembersField([]);
    setStudentSearch("");
    setGroupWeekTypeField("Minggu 1");
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: PicketGroup) => {
    setEditingGroup(group);
    setGroupTkjtField(group.tkjt || "TKJT 1");
    setGroupAngkatanField(group.angkatan || 8);
    setGroupDayField(group.day);
    setGroupMembersField([...group.members]);
    setStudentSearch("");
    setGroupWeekTypeField(
      group.weekType === "Minggu 2" ? "Minggu 2" : "Minggu 1",
    );
    setIsGroupModalOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    setDeleteConfirm({
      id,
      title: "Hapus Kelompok Piket",
      message:
        "Apakah Anda yakin ingin menghapus kelompok piket ini secara permanen? Semua data absen terkait kelompok ini tidak akan bisa dipulihkan.",
      type: "group",
    });
  };

  const handleStartEditGroupInline = (group: PicketGroup) => {
    setEditingGroupId(group.id);
    setEditGroupTkjt(group.tkjt || "TKJT 1");
    setEditGroupAngkatan(group.angkatan || 8);
    setEditGroupDay(group.day);
    setEditGroupMembers([...group.members]);
    setEditGroupStudentSearch("");
    setEditGroupWeekType(
      group.weekType === "Minggu 2" ? "Minggu 2" : "Minggu 1",
    );
  };

  const handleSaveGroupInline = () => {
    if (!editingGroupId) return;

    const derivedName = `TKJT ${editGroupTkjt.replace("TKJT ", "")} Angkatan ${editGroupAngkatan} (${editGroupDay})`;

    if (editGroupMembers.length === 0) {
      triggerToast(
        "Pilih minimal satu anggota piket untuk kelompok ini!",
        "error",
      );
      return;
    }

    const isDayTaken = picketGroupsList.some(
      (g) =>
        g.id !== editingGroupId &&
        g.tkjt === editGroupTkjt &&
        g.angkatan === editGroupAngkatan &&
        g.weekType === editGroupWeekType &&
        g.day === editGroupDay,
    );
    if (isDayTaken) {
      triggerToast(
        `Hari ${editGroupDay} sudah digunakan untuk ${editGroupTkjt} Angkatan ${editGroupAngkatan} pada ${editGroupWeekType}!`,
        "error",
      );
      return;
    }

    const newGroups = picketGroupsList.map((g) => {
      if (g.id === editingGroupId) {
        return {
          ...g,
          name: derivedName,
          day: editGroupDay,
          tkjt: editGroupTkjt,
          angkatan: editGroupAngkatan,
          members: editGroupMembers,
          weekType: editGroupWeekType,
        };
      }
      return g;
    });

    setPicketGroupsList(newGroups);
    savePicketData(newGroups, picketAccountsList);

    triggerToast("Kelompok piket berhasil diperbarui langsung!", "success");
    setEditingGroupId(null);
  };

  const handleSubmitGroup = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    setGroupModalError(null);

    if (!groupDayField) {
      setGroupModalError("Hari penugasan piket wajib dipilih!");
      return;
    }
    if (!groupTkjtField) {
      setGroupModalError("Kelas TKJT wajib dipilih!");
      return;
    }
    if (!groupAngkatanField || Number(groupAngkatanField) <= 0) {
      setGroupModalError("Angkatan wajib diisi dengan angka positif!");
      return;
    }
    if (groupMembersField.length === 0) {
      setGroupModalError(
        "Pilih minimal satu anggota piket untuk kelompok ini!",
      );
      return;
    }

    const isDayTaken = picketGroupsList.some(
      (g) =>
        g.id !== editingGroup?.id &&
        g.tkjt === groupTkjtField &&
        g.angkatan === Number(groupAngkatanField) &&
        g.weekType === groupWeekTypeField &&
        g.day === groupDayField,
    );
    if (isDayTaken) {
      setGroupModalError(
        `Hari ${groupDayField} sudah digunakan untuk ${groupTkjtField} Angkatan ${groupAngkatanField} pada ${groupWeekTypeField}. Pilih hari, kelas, angkatan, atau minggu yang lain!`,
      );
      return;
    }

    const derivedName = `TKJT ${groupTkjtField.replace("TKJT ", "")} Angkatan ${groupAngkatanField} (${groupDayField})`;

    if (editingGroup) {
      const newGroups = picketGroupsList.map((g) => {
        if (g.id === editingGroup.id) {
          return {
            ...g,
            name: derivedName,
            day: groupDayField,
            tkjt: groupTkjtField,
            angkatan: groupAngkatanField,
            members: groupMembersField,
            weekType: groupWeekTypeField,
          };
        }
        return g;
      });
      setPicketGroupsList(newGroups);
      savePicketData(newGroups, picketAccountsList);
      triggerToast("Kelompok piket berhasil diperbarui!", "success");
    } else {
      const newGroup: PicketGroup = {
        id: `g-${Date.now()}`,
        name: derivedName,
        day: groupDayField,
        tkjt: groupTkjtField,
        angkatan: groupAngkatanField,
        members: groupMembersField,
        weekType: groupWeekTypeField,
      };
      const newGroups = [...picketGroupsList, newGroup];
      setPicketGroupsList(newGroups);
      savePicketData(newGroups, picketAccountsList);
      triggerToast("Kelompok piket baru berhasil disimpan!", "success");
    }

    setIsGroupModalOpen(false);
  };

  // [Akses]
  if (!isLoggedIn || userSession?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-3xl text-center space-y-4 font-sans">
        <Lock className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wide">
          Akses Terbatas
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Halaman ini hanya dapat diakses oleh Admin Guru Resmi. Silakan login
          menggunakan akun Guru untuk mengonfigurasi kredensial.
        </p>
        <Button variant="primary" onClick={onLoginRequest} className="w-full">
          Buka Pintu Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16 text-left">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white p-6 rounded-3xl overflow-hidden relative">
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            DASHBOARD ADMIN
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Kelola akun kredensial tim piket harian dan tinjau seluruh akun
            sistem dalam satu panel kendali terpusat.
          </p>
        </div>
        <div className="h-12 w-12 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border-2 border-blue-500/15 dark:border-blue-500/30">
          <Shield className="h-6 w-6" />
        </div>
      </div>

      {/* [Tab] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 bg-slate-100/50 dark:bg-slate-900/10 p-1.5 rounded-2xl gap-2 select-none">
        <button
          onClick={() => setActiveAdminTab("kredensial")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
            activeAdminTab === "kredensial"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-slate-950 text-slate-500 border-slate-300 dark:border-slate-800 hover:text-blue-600"
          }`}
        >
          <Key className="h-4 w-4" />
          <span>Kelola Akun Piket</span>
        </button>
        <button
          onClick={() => setActiveAdminTab("kelompok")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
            activeAdminTab === "kelompok"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-slate-950 text-slate-500 border-slate-300 dark:border-slate-800 hover:text-blue-600"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Kelompok Piket</span>
        </button>
      </div>

      {/* [Tab Kredensial] */}
      {activeAdminTab === "kredensial" ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                Kredensial & Ketua Piket Harian
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lines-relaxed">
                Buat akun autentikasi untuk masing-masing kelompok piket,
                tentukan ketua bertanggung jawab, dan kelola sandi PIN 8-digit.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAccount}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black p-3 sm:p-3.5 lg:px-5 lg:py-3.5 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto border-2 border-blue-600"
              title="Tambah Akun Baru"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tambah Akun Baru</span>
            </button>
          </div>

          {picketAccountsList.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
              <Key className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">
                Belum ada akun piket didaftarkan. Pilih 'Tambah Akun Baru'.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {picketAccountsList.map((acc) => {
                const isEditing = editingAccountId === acc.id;
                if (isEditing) {
                  const activeGroupForEditAccount = picketGroupsList.find(
                    (g) => g.name === editAccountGroupName,
                  );
                  return (
                    <div
                      key={acc.id}
                      className="rounded-2xl border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 relative overflow-visible"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-black text-blue-500 tracking-wider">
                            Mode Edit Kredensial
                          </span>
                          <span className="font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[10px] font-bold">
                            INLINE
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kelompok Piket Mitra:
                          </label>
                          <Dropdown
                            id={`edit-inline-accbound-${acc.id}`}
                            value={editAccountGroupName}
                            onChange={(val) => {
                              setEditAccountGroupName(val);
                              setEditAccountKetua("");
                            }}
                            options={availableGroupsForInlineAccountEdit.map(
                              (g) => ({ value: g.name, label: g.name }),
                            )}
                            placeholder={
                              availableGroupsForInlineAccountEdit.length === 0
                                ? "Semua kelompok sudah memiliki akun"
                                : "-- Pilih Kelompok Piket --"
                            }
                            disabled={
                              availableGroupsForInlineAccountEdit.length === 0
                            }
                          />
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-800 rounded-xl space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                            Username Terbuat Otomatis:
                          </span>
                          <div className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                            {editAccountGroupName
                              ? generateUsername(
                                  picketGroupsList.find(
                                    (g) => g.name === editAccountGroupName,
                                  ),
                                )
                              : "pilih_kelompok_terlebih_dahulu"}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <label className="uppercase tracking-wider">
                              8 PIN Password (Otorisasi):
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setEditAccountPin(generateRandomPIN())
                              }
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-extrabold cursor-pointer text-[10px]"
                            >
                              <Shuffle className="h-3 w-3" />
                              Acak PIN
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            placeholder="8-digit PIN..."
                            value={editAccountPin}
                            onChange={(e) =>
                              setEditAccountPin(
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                            className="w-full text-xs font-mono font-bold rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-rose-500 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Tunjuk Ketua Piket:
                          </label>
                          <Dropdown
                            id={`edit-inline-acclead-${acc.id}`}
                            value={editAccountKetua}
                            onChange={(val) => setEditAccountKetua(val)}
                            disabled={!editAccountGroupName}
                            options={
                              activeGroupForEditAccount
                                ? activeGroupForEditAccount.members.map(
                                    (m) => ({ value: m, label: m }),
                                  )
                                : []
                            }
                            placeholder="-- Pilih Pemimpin --"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                        <button
                          type="button"
                          onClick={() => setEditingAccountId(null)}
                          className="w-1/2 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-800 text-slate-500 hover:text-slate-600 bg-transparent text-xs font-bold transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAccountInline}
                          className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={acc.id}
                    className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] uppercase font-black text-blue-500 tracking-wider">
                            HARI {acc.day}
                          </span>
                          <h4 className="text-xs font-black text-slate-400 mt-0.5">
                            {acc.groupName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditAccountInline(acc)}
                            className="p-1 rounded text-slate-400 hover:text-blue-500 cursor-pointer"
                            title="Edit Akun"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Username Autentikasi:
                        </p>
                        <p className="p-2 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-xs font-mono font-black text-slate-700 dark:text-slate-300">
                          {acc.username}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          8-Digit Password PIN:
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 p-2 border border-rose-500/10 bg-rose-500/5 rounded-xl text-xs font-mono font-black tracking-widest text-rose-500">
                            {showPicketPins[acc.id] ? acc.pin : "••••••••"}
                          </p>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(acc.id)}
                            className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg cursor-pointer hover:text-blue-500"
                            title={
                              showPicketPins[acc.id]
                                ? "Sembunyikan PIN"
                                : "Tampilkan PIN"
                            }
                          >
                            {showPicketPins[acc.id] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Ketua Kelompok (Pemimpin):
                        </p>
                        <div className="flex flex-col gap-2 p-2 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
                          <div className="flex items-center justify-between text-slate-800 dark:text-white">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-emerald-500" />
                              <span className="text-xs font-black">
                                {acc.ketuaPiket}
                              </span>
                            </div>
                            {(() => {
                              const assignedTime =
                                acc.leaderAssignedAt || Date.now();
                              const daysLeft = Math.max(
                                0,
                                Math.ceil(
                                  (14 * 24 * 60 * 60 * 1000 -
                                    (Date.now() - assignedTime)) /
                                    (24 * 60 * 60 * 1000),
                                ),
                              );
                              return (
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                                  {daysLeft} Hari Lagi
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // [Tab Kelompok]
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                Kelompok Piket TKJT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Buat dan kelola kelompok piket harian untuk murid TKJT. Setiap
                kelompok diasosiasikan dengan hari tertentu.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddGroup}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black p-3 sm:p-3.5 lg:px-5 lg:py-3.5 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto border-2 border-blue-600"
              title="Tambah Kelompok Baru"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tambah Kelompok Baru</span>
            </button>
          </div>

          {picketGroupsList.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
              <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">
                Belum ada kelompok piket tersimpan. Silakan tap tombol di atas
                untuk membuat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {picketGroupsList.map((group) => {
                const isEditing = editingGroupId === group.id;
                if (isEditing) {
                  const studentsInOtherGroupsInline = picketGroupsList
                    .filter((g) => g.id !== group.id)
                    .flatMap((g) => g.members);
                  const filteredStudentsInline = students.filter((student) => {
                    const matchesClass = student.kelas
                      .toLowerCase()
                      .includes(editGroupTkjt.toLowerCase());
                    const matchesGeneration =
                      student.angkatan === Number(editGroupAngkatan);
                    const matchesSearch = student.name
                      .toLowerCase()
                      .includes(editGroupStudentSearch.toLowerCase());
                    const notInOtherGroup =
                      !studentsInOtherGroupsInline.includes(student.name);
                    return (
                      matchesClass &&
                      matchesGeneration &&
                      matchesSearch &&
                      notInOtherGroup
                    );
                  });

                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border-2 border-amber-500 dark:border-amber-400 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 relative overflow-visible shadow-lg shadow-amber-500/5"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                            <Edit className="h-3.5 w-3.5 text-amber-500" /> Mode
                            Edit Kelompok
                          </span>
                          <span className="font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                            INLINE
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Hari Penugasan Piket:
                            </label>
                            <Dropdown
                              id={`edit-inline-day-${group.id}`}
                              value={editGroupDay}
                              onChange={(val) => setEditGroupDay(val)}
                              options={availableDaysForInlineEdit.map((d) => ({
                                value: d,
                                label: d,
                              }))}
                              placeholder={
                                availableDaysForInlineEdit.length === 0
                                  ? "Semua hari sudah terjadwal"
                                  : "Pilih Hari..."
                              }
                              disabled={availableDaysForInlineEdit.length === 0}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Minggu Bertugas:
                            </label>
                            <Dropdown
                              id={`edit-inline-weektype-${group.id}`}
                              value={editGroupWeekType}
                              onChange={(val) =>
                                setEditGroupWeekType(
                                  val as "Minggu 1" | "Minggu 2",
                                )
                              }
                              options={availableWeeksForInlineEdit.map((w) => ({
                                value: w,
                                label: w,
                              }))}
                              placeholder={
                                availableWeeksForInlineEdit.length === 0
                                  ? "Semua minggu sudah terjadwal"
                                  : "Pilih Minggu..."
                              }
                              disabled={
                                availableWeeksForInlineEdit.length === 0
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Kelas TKJT:
                            </label>
                            <Dropdown
                              id={`edit-inline-kelas-${group.id}`}
                              value={editGroupTkjt}
                              onChange={(val) => {
                                setEditGroupTkjt(val);
                                setEditGroupMembers([]);
                              }}
                              options={
                                editGroupAngkatan === 8
                                  ? [
                                      { value: "TKJT 1", label: "TKJT 1" },
                                      { value: "TKJT 2", label: "TKJT 2" },
                                    ]
                                  : [
                                      { value: "TKJT 1", label: "TKJT 1" },
                                      { value: "TKJT 2", label: "TKJT 2" },
                                      { value: "TKJT 3", label: "TKJT 3" },
                                    ]
                              }
                              placeholder="Pilih Kelas..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Angkatan:
                            </label>
                            <Dropdown
                              id={`edit-inline-angkatan-${group.id}`}
                              value={editGroupAngkatan.toString()}
                              onChange={(val) => {
                                const newGen = Number(val);
                                setEditGroupAngkatan(newGen);
                                setEditGroupMembers([]);
                                if (
                                  newGen === 8 &&
                                  editGroupTkjt === "TKJT 3"
                                ) {
                                  setEditGroupTkjt("TKJT 1");
                                }
                              }}
                              options={[
                                { value: "8", label: "Angkatan 8" },
                                { value: "9", label: "Angkatan 9" },
                              ]}
                              placeholder="Pilih Angkatan..."
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-xl space-y-0.5 text-left">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                            Nama Kelompok Terbuat Otomatis:
                          </span>
                          <div className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                            TKJT {editGroupTkjt.replace("TKJT ", "")} Angkatan{" "}
                            {editGroupAngkatan} ({editGroupDay})
                          </div>
                        </div>

                        <div className="space-y-2 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                            <label className="font-bold text-slate-600 dark:text-slate-350">
                              Pilih Murid ({editGroupMembers.length} Terpilih):
                            </label>
                            <div className="relative w-full sm:w-1/2">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari murid..."
                                value={editGroupStudentSearch}
                                onChange={(e) =>
                                  setEditGroupStudentSearch(e.target.value)
                                }
                                className="border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 w-full transition-all duration-150"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border-2 border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/40">
                            {filteredStudentsInline.length === 0 ? (
                              <span className="text-[11px] text-slate-400 font-bold italic col-span-2 text-center py-6">
                                Tidak ada murid terdeteksi untuk klasifikasi
                                pencarian ini.
                              </span>
                            ) : (
                              filteredStudentsInline.map((stud) => {
                                const isChecked = editGroupMembers.includes(
                                  stud.name,
                                );
                                return (
                                  <label
                                    key={stud.id}
                                    className={`flex items-center gap-2 p-2 rounded-xl border-2 text-xs cursor-pointer select-none transition-all duration-150 ${
                                      isChecked
                                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
                                        : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setEditGroupMembers((prev) =>
                                            prev.filter((m) => m !== stud.name),
                                          );
                                        } else {
                                          setEditGroupMembers((prev) => [
                                            ...prev,
                                            stud.name,
                                          ]);
                                        }
                                      }}
                                      className="rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-0 h-3.5 w-3.5"
                                    />
                                    <span className="truncate">
                                      {stud.name}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-3 border-t-2 border-slate-300 dark:border-slate-800 mt-4 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGroupId(null);
                          }}
                          className="w-1/2 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-800 bg-transparent text-xs font-bold transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGroupInline}
                          className="w-1/2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-900">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-black text-blue-500">
                            HARI {group.day}
                          </span>
                          <h4 className="text-base font-black text-slate-800 dark:text-white mt-0.5">
                            {group.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditGroupInline(group)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-blue-500 cursor-pointer"
                            title="Edit Kelompok"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:rose-500/5 rounded-lg text-slate-500 hover:text-rose-500 cursor-pointer"
                            title="Hapus Kelompok"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-bold">
                          Daftar Anggota Kelompok ({group.members.length}{" "}
                          Murid):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.members.map((memSum, idxNum) => (
                            <div
                              key={idxNum}
                              className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between"
                            >
                              <span className="text-xs text-slate-700 dark:text-slate-300 font-extrabold truncate">
                                {memSum}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* [Modal Tambah/Edit Kelompok] */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={
          editingGroup ? "Edit Kelompok Piket" : "Buat Kelompok Piket Baru"
        }
        subtitle="Formulir klasifikasi siswa harian berdasarkan kelas, angkatan, dan hari penugasan."
        icon={<Users className="h-6 w-6" />}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitGroup} className="space-y-4">
          {groupModalError && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 text-left">
                <span className="font-extrabold uppercase tracking-wider block text-[10px] text-rose-500 mb-0.5">
                  Peringatan:
                </span>
                <p className="leading-relaxed">{groupModalError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
                Hari Penugasan Piket:
              </label>
              <Dropdown
                id="admin-group-day"
                value={groupDayField}
                onChange={(val) => setGroupDayField(val)}
                options={availableDaysForGroupModal.map((d) => ({
                  value: d,
                  label: d,
                }))}
                placeholder={
                  availableDaysForGroupModal.length === 0
                    ? "Semua hari sudah terjadwal"
                    : "Pilih Hari..."
                }
                disabled={availableDaysForGroupModal.length === 0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
                Minggu Bertugas:
              </label>
              <Dropdown
                id="admin-group-week"
                value={groupWeekTypeField}
                onChange={(val) =>
                  setGroupWeekTypeField(val as "Minggu 1" | "Minggu 2")
                }
                options={availableWeeksForGroupModal.map((w) => ({
                  value: w,
                  label: w,
                }))}
                placeholder={
                  availableWeeksForGroupModal.length === 0
                    ? "Semua minggu sudah terjadwal"
                    : "Pilih Minggu..."
                }
                disabled={availableWeeksForGroupModal.length === 0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
                Kelas TKJT:
              </label>
              <Dropdown
                id="admin-group-class"
                value={groupTkjtField}
                onChange={(val) => {
                  setGroupTkjtField(val);
                  setGroupMembersField([]);
                }}
                options={
                  groupAngkatanField === 8
                    ? [
                        { value: "TKJT 1", label: "TKJT 1" },
                        { value: "TKJT 2", label: "TKJT 2" },
                      ]
                    : [
                        { value: "TKJT 1", label: "TKJT 1" },
                        { value: "TKJT 2", label: "TKJT 2" },
                        { value: "TKJT 3", label: "TKJT 3" },
                      ]
                }
                placeholder="Pilih Kelas..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
                Angkatan:
              </label>
              <Dropdown
                id="admin-group-gen"
                value={groupAngkatanField.toString()}
                onChange={(val) => {
                  const newGen = Number(val);
                  setGroupAngkatanField(newGen);
                  setGroupMembersField([]);
                  if (newGen === 8 && groupTkjtField === "TKJT 3") {
                    setGroupTkjtField("TKJT 1");
                  }
                }}
                options={[
                  { value: "8", label: "Angkatan 8" },
                  { value: "9", label: "Angkatan 9" },
                ]}
                placeholder="Pilih Angkatan..."
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-xl space-y-0.5">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
              Nama Kelompok Otomatis:
            </span>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
              TKJT {groupTkjtField.replace("TKJT ", "")} Angkatan{" "}
              {groupAngkatanField} ({groupDayField})
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs">
              <label className="font-bold text-slate-650 dark:text-slate-350">
                Pilih Siswa ({groupMembersField.length} Terpilih):
              </label>
              <div className="relative w-1/2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Cari nama siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full transition-all duration-150"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2.5 border-2 border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40">
              {filteredStudentsForDropdown.length === 0 ? (
                <span className="text-[11px] text-slate-400 font-bold italic p-2 col-span-2 text-center">
                  Tidak ada siswa ditemukan untuk filter ini.
                </span>
              ) : (
                filteredStudentsForDropdown.map((stud) => {
                  const isChecked = groupMembersField.includes(stud.name);
                  return (
                    <label
                      key={stud.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? "border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold"
                          : "border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setGroupMembersField((prev) =>
                              prev.filter((m) => m !== stud.name),
                            );
                          } else {
                            setGroupMembersField((prev) => [
                              ...prev,
                              stud.name,
                            ]);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span className="truncate">{stud.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t-2 border-slate-300 dark:border-slate-800 mt-6 select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGroupModalOpen(false)}
              className="w-1/2"
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              {editingGroup ? "Simpan Perubahan" : "Simpan Kelompok"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* [Modal Tambah/Edit Akun] */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={
          editingAccount
            ? "Edit Akun Ketua Piket"
            : "Daftarkan Akun Ketua Piket Baru"
        }
        subtitle="Koneksikan PIN harian dan pilih pemimpin yang ditunjuk menanggungjawabi tugas piket."
        icon={<UserCheck className="h-6 w-6" />}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitAccount} className="space-y-4">
          {accountModalError && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 text-left">
                <span className="font-extrabold uppercase tracking-wider block text-[10px] text-rose-500 mb-0.5">
                  Peringatan:
                </span>
                <p className="leading-relaxed">{accountModalError}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
              Pilih Kelompok Piket Mitra:
            </label>
            <Dropdown
              id="admin-account-group"
              value={accountGroupName}
              onChange={(val) => {
                setAccountGroupName(val);
                setAccountKetua("");
              }}
              options={availableGroupsForAccountModal.map((g) => ({
                value: g.name,
                label: g.name,
              }))}
              placeholder={
                availableGroupsForAccountModal.length === 0
                  ? "Semua kelompok sudah memiliki akun"
                  : "-- Pilih Kelompok Piket --"
              }
              disabled={availableGroupsForAccountModal.length === 0}
            />
          </div>

          <div className="p-3 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-0.5">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
              Username Terbuat Otomatis:
            </span>
            <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              {accountGroupName
                ? generateUsername(
                    picketGroupsList.find((g) => g.name === accountGroupName),
                  )
                : "pilih_kelompok_terlebih_dahulu"}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-650 dark:text-slate-350">
                8 PIN Password (Otorisasi):
              </label>
              <button
                type="button"
                onClick={() => setAccountPin(generateRandomPIN())}
                className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer font-bold hover:underline"
              >
                <Shuffle className="h-3 w-3" />
                Acak PIN Baru
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="Masukkan 8-digit PIN..."
              style={{ letterSpacing: "0.2em" }}
              value={accountPin}
              onChange={(e) => setAccountPin(e.target.value.replace(/\D/g, ""))}
              className="w-full text-xs font-mono font-bold rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-rose-500 focus:outline-none focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="p-4 bg-blue-500/[0.012] border-2 border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-300 block">
              Tunjuk Ketua Piket (Pemimpin):
            </label>
            <Dropdown
              id="admin-account-leader"
              value={accountKetua}
              onChange={(val) => setAccountKetua(val)}
              disabled={!accountGroupName}
              options={
                activeGroupForAccount
                  ? activeGroupForAccount.members.map((m) => ({
                      value: m,
                      label: m,
                    }))
                  : []
              }
              placeholder="-- Pilih Siswa Pemimpin --"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Pilihan ketua dibatasi bagi siswa yang terdaftar di kelompok mitra
              terpilih.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t-2 border-slate-300 dark:border-slate-800 mt-6 select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAccountModalOpen(false)}
              className="w-1/2"
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              {editingAccount ? "Simpan Perubahan" : "Simpan Akun"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* [Modal Konfirmasi Hapus] */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={deleteConfirm?.title || ""}
        subtitle={deleteConfirm?.message || ""}
        icon={<Trash2 className="h-6 w-6" />}
        maxWidth="md"
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
