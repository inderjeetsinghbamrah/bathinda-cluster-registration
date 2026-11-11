import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  RefreshCw,
  Search,
  LogOut,
  Building2,
  Users,
  FolderKanban,
  FileSpreadsheet,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  Layers,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  ArrowUpDown,
  Pencil,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceSheet } from './AttendanceSheet';
import { ReorderTableView } from './ReorderTableView';
import { EditSubmissionModal } from './EditSubmissionModal';
import { JudgesPanel } from './JudgesPanel';

export const AdminPortal = () => {
  const [token, setToken] = useState(() => localStorage.getItem('cluster_admin_token') || '');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Submissions Data
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [viewMode, setViewMode] = useState('institutes'); // 'institutes' or 'roster'

  // Deletion States
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    submissionId: null,
    submissionCode: '',
    instituteName: '',
    isBulk: false,
    count: 1
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState(new Set());
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [editingSubmission, setEditingSubmission] = useState(null);

  const FROZEN_EMAIL = 'inderjeetsinghit@gmail.com';

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (actionSuccessMessage) {
      const timer = setTimeout(() => setActionSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMessage]);

  useEffect(() => {
    if (token) {
      fetchSubmissions(token);
    }
  }, [token]);

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setErrorMessage('');
    setOtpSentMessage('');

    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP.');
      }

      setOtpSentMessage(`A 6-digit verification code was emailed to ${FROZEN_EMAIL}.`);
      setCountdown(60);
    } catch (err) {
      setErrorMessage(err.message || 'Could not send verification email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      setToken(data.token);
      localStorage.setItem('cluster_admin_token', data.token);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to verify OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('cluster_admin_token');
    setSubmissions([]);
    setOtp('');
    setOtpSentMessage('');
    setSelectedSubmissionIds(new Set());
  };

  const fetchSubmissions = async (authToken) => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: { 'Authorization': `Bearer ${authToken || token}` }
      });
      const data = await res.json();

      if (res.status === 401) {
        handleLogout();
        setErrorMessage('Session expired. Please request a new OTP.');
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        setSubmissions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin submissions:', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Open single delete confirmation
  const openDeleteSingleModal = (sub) => {
    setDeleteModal({
      isOpen: true,
      submissionId: sub.id,
      submissionCode: sub.submission_code,
      instituteName: sub.institute_name,
      isBulk: false,
      count: 1
    });
  };

  // Open bulk delete confirmation
  const openDeleteBulkModal = () => {
    if (selectedSubmissionIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      submissionId: null,
      submissionCode: '',
      instituteName: `${selectedSubmissionIds.size} Selected Institutes`,
      isBulk: true,
      count: selectedSubmissionIds.size
    });
  };

  // Execute deletion
  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      const payload = deleteModal.isBulk
        ? { ids: Array.from(selectedSubmissionIds) }
        : { id: deleteModal.submissionId };

      const res = await fetch('/api/admin/delete-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete record.');
      }

      // Update local state
      if (deleteModal.isBulk) {
        setSubmissions((prev) => prev.filter((s) => !selectedSubmissionIds.has(s.id)));
        setSelectedSubmissionIds(new Set());
        setActionSuccessMessage(`Successfully deleted ${deleteModal.count} submission(s) and their teams.`);
      } else {
        setSubmissions((prev) => prev.filter((s) => s.id !== deleteModal.submissionId));
        setSelectedSubmissionIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteModal.submissionId);
          return next;
        });
        setActionSuccessMessage(`Deleted entry for ${deleteModal.instituteName} (${deleteModal.submissionCode})`);
      }

      setDeleteModal({ isOpen: false, submissionId: null, submissionCode: '', instituteName: '', isBulk: false, count: 1 });
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle selection for bulk actions
  const toggleSelectSubmission = (id) => {
    setSelectedSubmissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSubmissionIds.size === submissions.length) {
      setSelectedSubmissionIds(new Set());
    } else {
      setSelectedSubmissionIds(new Set(submissions.map((s) => s.id)));
    }
  };

  // Build flattened joined records for table and Excel export
  const buildJoinedRecords = () => {
    const records = [];

    submissions.forEach((sub) => {
      const teams = sub.competition_teams || [];
      const rawTeams = sub.raw_payload?.teams || [];

      teams.forEach((t) => {
        const rawTeam = rawTeams.find((rt) => rt.teamNumber === t.team_number) || rawTeams[t.team_number ? t.team_number - 1 : 0];
        const rawStudents = rawTeam?.students || [];

        const students = t.competition_students || [];
        students.forEach((s, sIdx) => {
          const rawStudent = rawStudents.find(
            (rs) => (rs.registrationNo && rs.registrationNo === s.registration_no) ||
                    (rs.name && rs.name.trim().toLowerCase() === s.student_name?.trim().toLowerCase())
          ) || rawStudents[s.student_order ? s.student_order - 1 : sIdx];

          const semVal = s.semester || rawStudent?.semester || '-';
          const emailVal = s.email || rawStudent?.email || '-';

          records.push({
            submissionId: sub.id,
            code: sub.submission_code,
            date: new Date(sub.created_at).toLocaleDateString('en-IN'),
            time: new Date(sub.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            instituteName: sub.institute_name,
            principalName: sub.principal_name,
            principalContact: sub.principal_contact,
            totalTeams: sub.teams_count,
            teamNumber: t.team_number,
            projectTitle: t.project_title,
            theme: t.project_theme === 'Others' ? `${t.project_theme} (${t.project_theme_other || ''})` : t.project_theme,
            projectDescription: t.project_description,
            mentorName: t.mentor_name,
            mentorContact: t.mentor_contact,
            studentOrder: s.student_order,
            studentName: s.student_name,
            studentRole: s.student_order === 1 ? 'Leader' : 'Member',
            registrationNo: s.registration_no,
            department: s.department === 'Others' ? `${s.department} (${s.department_other || ''})` : s.department,
            semester: semVal,
            studentEmail: emailVal,
            studentContact: s.contact_number
          });
        });
      });
    });

    return records;
  };

  const joinedRecords = buildJoinedRecords();

  // Filtered records
  const filteredRecords = joinedRecords.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      rec.instituteName.toLowerCase().includes(q) ||
      rec.code.toLowerCase().includes(q) ||
      rec.principalName.toLowerCase().includes(q) ||
      rec.mentorName.toLowerCase().includes(q) ||
      rec.studentName.toLowerCase().includes(q) ||
      rec.studentEmail.toLowerCase().includes(q) ||
      rec.registrationNo.toLowerCase().includes(q) ||
      rec.projectTitle.toLowerCase().includes(q);

    const matchesTheme = selectedTheme === 'All' || rec.theme.includes(selectedTheme);
    return matchesSearch && matchesTheme;
  });

  // Filtered submissions (for institutes view)
  const filteredSubmissions = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    return (
      sub.institute_name.toLowerCase().includes(q) ||
      sub.submission_code.toLowerCase().includes(q) ||
      sub.principal_name.toLowerCase().includes(q) ||
      sub.principal_contact.toLowerCase().includes(q)
    );
  });

  // Export to Excel (.xlsx)
  const exportToExcel = () => {
    if (joinedRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    const excelData = filteredRecords.map((r, i) => ({
      'S.No': i + 1,
      'Ack Code': r.code,
      'Date': r.date,
      'Time': r.time,
      'Institute Name': r.instituteName,
      'Principal Name': r.principalName,
      'Principal Contact': r.principalContact,
      'Team No': `Team ${r.teamNumber}`,
      'Project Title': r.projectTitle,
      'Theme': r.theme,
      'Faculty Mentor': r.mentorName,
      'Mentor Contact': r.mentorContact,
      'Student Name': r.studentName,
      'Role': r.studentRole,
      'Reg / Roll No': r.registrationNo,
      'Department / Branch': r.department,
      'Sem / Year': r.semester,
      'Student Email': r.studentEmail,
      'Student Contact': r.studentContact,
      'Project Brief': r.projectDescription
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Project Roster');

    const maxProps = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...excelData.map((d) => String(d[key] || '').length).slice(0, 50)) + 2
    }));
    worksheet['!cols'] = maxProps;

    XLSX.writeFile(workbook, `Bathinda_Cluster_Master_Roster_${Date.now()}.xlsx`);
  };

  // Export to CSV
  const exportToCsv = () => {
    if (joinedRecords.length === 0) return;

    const headers = [
      'Ack Code', 'Date', 'Institute Name', 'Principal', 'Principal Contact',
      'Team #', 'Project Title', 'Theme', 'Mentor Name', 'Mentor Contact',
      'Student Name', 'Role', 'Roll No', 'Branch', 'Sem / Year', 'Student Email', 'Student Contact'
    ];

    const rows = filteredRecords.map((r) => [
      r.code,
      r.date,
      `"${r.instituteName.replace(/"/g, '""')}"`,
      `"${r.principalName.replace(/"/g, '""')}"`,
      `"${r.principalContact.replace(/"/g, '""')}"`,
      `Team ${r.teamNumber}`,
      `"${r.projectTitle.replace(/"/g, '""')}"`,
      `"${r.theme.replace(/"/g, '""')}"`,
      `"${r.mentorName.replace(/"/g, '""')}"`,
      `"${r.mentorContact.replace(/"/g, '""')}"`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      r.studentRole,
      `"${r.registrationNo.replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${(r.semester || '-').replace(/"/g, '""')}"`,
      `"${(r.studentEmail || '-').replace(/"/g, '""')}"`,
      `"${r.studentContact.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(',')).join('\n')];
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bathinda_Cluster_Master_Roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalInstitutes = submissions.length;
  const totalTeams = submissions.reduce((acc, s) => acc + (s.competition_teams?.length || 0), 0);
  const totalStudents = joinedRecords.length;

  // 1. OTP AUTHENTICATION SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-blue-950 mx-auto mb-4 shadow-lg ring-4 ring-slate-700/50">
              <img src="/institute-logo.svg" alt="GPC Bathinda" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full">
              Confidential Organizer Access
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-3">
              Bathinda Cluster Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify your identity via One-Time Password to manage and delete submissions.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Designated Administrator Email (Frozen)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="text"
                readOnly
                value={FROZEN_EMAIL}
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 font-mono text-xs sm:text-sm cursor-not-allowed select-none outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold px-2 py-0.5 rounded-md">
                  Locked
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp || countdown > 0}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending Verification Code via Brevo...
                </>
              ) : countdown > 0 ? (
                <>
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Resend Code in {countdown}s
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-blue-400" />
                  Send Verification Code (OTP)
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono tracking-widest text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {otpSentMessage && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{otpSentMessage}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
                  📌 <strong>Gmail users:</strong> If not in Primary Inbox, check your <strong>Spam / Junk</strong> folder (from <code>noreply@eduobal.com</code>).
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingOtp || !otp.trim()}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying OTP...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirm OTP & Enter Registry
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Registration Form
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED MASTER DASHBOARD
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md sticky top-0 z-30 no-print">
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/institute-logo.svg" alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full bg-white p-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full">
                  Admin Authority Portal
                </span>
                <span className="text-xs text-slate-300 hidden sm:inline">Bathinda Cluster 2026</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white">
                Project Entries &amp; Database Administration
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 hidden md:inline font-mono bg-white/10 px-2.5 py-1 rounded-lg">
              {FROZEN_EMAIL}
            </span>
            <button
              onClick={handleLogout}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Success Action Notification Banner */}
        {actionSuccessMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Printable Official Document Header */}
        <div className="hidden print:block mb-6 p-4 border-b-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Bathinda Cluster Polytechnic Project Competition 2026</h1>
              <p className="text-sm">Department of Technical Education & Industrial Training, Punjab</p>
              <p className="text-xs mt-1">Official Master Roster • Printed on {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold block">Total Teams: {totalTeams}</span>
              <span className="text-sm font-bold block">Total Students: {totalStudents}</span>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards - Responsive 2x2 on mobile, 4-in-a-row on desktop */}
        {viewMode !== 'attendance' && viewMode !== 'reorder' && viewMode !== 'judges' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5 no-print">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block uppercase tracking-wider truncate">Institutes</span>
                <span className="text-xl sm:text-3xl font-black text-slate-800">{totalInstitutes}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block uppercase tracking-wider truncate">Project Teams</span>
                <span className="text-xl sm:text-3xl font-black text-slate-800">{totalTeams}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block uppercase tracking-wider truncate">Students</span>
                <span className="text-xl sm:text-3xl font-black text-slate-800">{totalStudents}</span>
              </div>
            </div>

            <div
              onClick={() => setViewMode('judges')}
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-amber-200 hover:border-amber-400 shadow-2xs flex items-center justify-between gap-2 sm:gap-4 cursor-pointer transition hover:bg-amber-50/40 group"
              title="Click to configure Evaluation Jury Panel & Judges"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block uppercase tracking-wider truncate">Jury Board</span>
                  <span className="text-xl sm:text-3xl font-black text-slate-800">7 Slots</span>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-100 group-hover:bg-amber-200 px-2.5 py-1 rounded-xl hidden sm:inline flex-shrink-0 transition">
                Open &rarr;
              </span>
            </div>
          </div>
        )}

        {/* 1. PRIMARY VIEW NAVIGATION TABS (Institutes & Roster Mode) */}
        {viewMode !== 'attendance' && viewMode !== 'reorder' && viewMode !== 'judges' && (
          <div className="bg-white rounded-2xl p-1.5 sm:p-2 border border-slate-200 shadow-2xs mb-4 no-print">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              {/* Tab 1: By Institutes */}
              <button
                type="button"
                onClick={() => setViewMode('institutes')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                  viewMode === 'institutes'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>By Institutes</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    viewMode === 'institutes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {submissions.length}
                </span>
              </button>

              {/* Tab 2: Master Joined Roster */}
              <button
                type="button"
                onClick={() => setViewMode('roster')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                  viewMode === 'roster'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Joined Roster</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    viewMode === 'roster' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {joinedRecords.length}
                </span>
              </button>

              {/* Tab 3: Reorder Sequence (Workspace) */}
              <button
                type="button"
                onClick={() => setViewMode('reorder')}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 flex-shrink-0 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50"
              >
                <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                <span>Reorder Sequence</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-800">
                  {totalTeams}
                </span>
              </button>

              {/* Tab 4: Attendance Sheet (PDF) */}
              <button
                type="button"
                onClick={() => setViewMode('attendance')}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 flex-shrink-0 text-blue-700 hover:text-blue-900 hover:bg-blue-50"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Attendance Sheet</span>
              </button>

              {/* Tab 5: Jury Panel */}
              <button
                type="button"
                onClick={() => setViewMode('judges')}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 flex-shrink-0 text-amber-800 hover:text-amber-950 hover:bg-amber-50"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Jury Panel</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-900">
                  7 Slots
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ACTION TOOLBAR: SEARCH + EXPORTS (No duplicate buttons) */}
        {viewMode !== 'attendance' && viewMode !== 'reorder' && viewMode !== 'judges' && (
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
            {/* Search box - full width on mobile, max 400px on desktop */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by institute, code, mentor, student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right side Actions: Refresh, Bulk Delete (if items selected), Excel, CSV, Print */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Delete Button if items selected */}
              {selectedSubmissionIds.size > 0 && (
                <button
                  type="button"
                  onClick={openDeleteBulkModal}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedSubmissionIds.size})</span>
                </button>
              )}

              {/* Refresh Registry */}
              <button
                type="button"
                onClick={() => fetchSubmissions()}
                disabled={isLoadingSubmissions}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Refresh Registry from Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Export to Excel (.xlsx) */}
              <button
                type="button"
                onClick={exportToExcel}
                disabled={joinedRecords.length === 0}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                title="Export Master Roster to Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Export Excel</span>
              </button>

              {/* Export to CSV */}
              <button
                type="button"
                onClick={exportToCsv}
                disabled={joinedRecords.length === 0}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                title="Download as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>CSV</span>
              </button>

              {/* Print / Save to PDF */}
              <button
                type="button"
                onClick={() => window.print()}
                disabled={joinedRecords.length === 0}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                title="Print Master Roster"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW MODES: ATTENDANCE SHEET, REORDER TABLE, JURY PANEL, INSTITUTES GROUPED VIEW, OR MASTER ROSTER */}
        {viewMode === 'attendance' ? (
          <AttendanceSheet
            submissions={submissions}
            onBack={() => setViewMode('institutes')}
            onOpenReorder={() => setViewMode('reorder')}
            onEditSubmission={(subId) => {
              const sub = submissions.find((s) => s.id === subId);
              if (sub) setEditingSubmission(sub);
            }}
          />
        ) : viewMode === 'reorder' ? (
          <ReorderTableView
            submissions={submissions}
            onOpenAttendance={() => setViewMode('attendance')}
            onBack={() => setViewMode('institutes')}
            onEditSubmission={(subId) => {
              const sub = submissions.find((s) => s.id === subId);
              if (sub) setEditingSubmission(sub);
            }}
          />
        ) : viewMode === 'judges' ? (
          <JudgesPanel onBack={() => setViewMode('institutes')} />
        ) : viewMode === 'institutes' ? (
          <div className="space-y-4">
            {/* Select all header */}
            {submissions.length > 0 && (
              <div className="flex items-center justify-between px-2 text-xs text-slate-500 no-print">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 font-semibold hover:text-slate-800 cursor-pointer"
                >
                  {selectedSubmissionIds.size === submissions.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedSubmissionIds.size === submissions.length
                      ? 'Deselect All'
                      : `Select All (${submissions.length}) for Bulk Actions`}
                  </span>
                </button>

                <span>Showing {filteredSubmissions.length} of {submissions.length} Institute Submissions</span>
              </div>
            )}

            {isLoadingSubmissions ? (
              <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                <p className="text-sm font-medium">Loading entries from Supabase...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-medium">No institute submissions match your query.</p>
              </div>
            ) : (
              filteredSubmissions.map((sub, idx) => {
                const teams = sub.competition_teams || [];
                const totalSubStudents = teams.reduce((acc, t) => acc + (t.competition_students?.length || 0), 0);
                const isSelected = selectedSubmissionIds.has(sub.id);

                return (
                  <div
                    key={sub.id}
                    className={`bg-white rounded-2xl border transition-all shadow-xs p-4 sm:p-5 ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Institute + Actions */}
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectSubmission(sub.id)}
                          className="mt-1 cursor-pointer no-print"
                          title="Select for bulk action"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                              {sub.submission_code}
                            </span>
                            <span className="text-xs text-slate-400">
                              Registered: {new Date(sub.created_at).toLocaleDateString('en-IN')} &bull; {new Date(sub.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} &bull; {totalSubStudents} Students
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                            {sub.institute_name}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Principal: <span className="font-semibold">{sub.principal_name}</span> &bull; Contact: <span className="font-mono">{sub.principal_contact}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Reorder Table Shortcut */}
                        <button
                          type="button"
                          onClick={() => setViewMode('reorder')}
                          className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer no-print"
                          title="Open Reorderable Projects Table"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reorder</span>
                        </button>

                        {/* Attendance Sheet Button */}
                        <button
                          type="button"
                          onClick={() => setViewMode('attendance')}
                          className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer no-print"
                          title="Open official Attendance Sheet"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Attendance</span>
                        </button>

                        {/* Edit Submission Button */}
                        <button
                          type="button"
                          onClick={() => setEditingSubmission(sub)}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer no-print shadow-2xs"
                          title="Edit institute, project, mentor, and student entries"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit Entry</span>
                        </button>

                        {/* Delete Authority Button */}
                        <button
                          type="button"
                          onClick={() => openDeleteSingleModal(sub)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer no-print"
                          title="Delete this entire institute submission"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Teams Breakdown */}
                    <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {teams.map((t, tIdx) => (
                        <div key={t.id || tIdx} className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60">
                            <span className={`font-black px-2 py-0.5 rounded text-[11px] ${t.team_number === 1 ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'}`}>
                              Team {t.team_number}
                            </span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {t.project_theme === 'Others' ? `${t.project_theme} (${t.project_theme_other})` : t.project_theme}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mb-1">{t.project_title}</h4>
                          <p className="text-slate-500 text-[11px] mb-2.5">
                            Mentor: <span className="font-semibold text-slate-700">{t.mentor_name}</span> ({t.mentor_contact})
                          </p>

                          {/* Students List in Team */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Students:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {(t.competition_students || []).map((st, sIdx) => {
                                const rawTeam = sub.raw_payload?.teams?.find((rt) => rt.teamNumber === t.team_number) || sub.raw_payload?.teams?.[t.team_number ? t.team_number - 1 : 0];
                                const rawSt = rawTeam?.students?.find(
                                  (rs) => (rs.registrationNo && rs.registrationNo === st.registration_no) ||
                                          (rs.name && rs.name.trim().toLowerCase() === st.student_name?.trim().toLowerCase())
                                ) || rawTeam?.students?.[st.student_order ? st.student_order - 1 : sIdx];

                                const stSem = st.semester || rawSt?.semester || '';
                                const stEmail = st.email || rawSt?.email || '';

                                return (
                                  <div key={st.id || sIdx} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                                    <span className="font-bold text-slate-900 block truncate">
                                      {sIdx + 1}. {st.student_name} {st.student_order === 1 ? '(Leader)' : ''}
                                    </span>
                                    <span className="text-slate-500 text-[10px] block">
                                      {st.registration_no} &bull; {st.department} {stSem ? `• ${stSem}` : ''}
                                    </span>
                                    <span className="font-mono text-slate-500 text-[10px] block truncate" title={stEmail}>
                                      {st.contact_number} {stEmail ? `• ${stEmail}` : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* VIEW MODE 2: MASTER JOINED STUDENT ROSTER TABLE */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Ack Code</th>
                    <th className="p-3">Institute Name</th>
                    <th className="p-3">Principal &amp; Contact</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Project Title &amp; Theme</th>
                    <th className="p-3">Mentor &amp; Contact</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll / Reg No.</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Sem / Year</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {isLoadingSubmissions ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Loading master submissions from Supabase...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center text-slate-400">
                        {searchQuery ? 'No records match your search filter.' : 'No competition project submissions recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/60 hover:bg-blue-50/30'}>
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">{r.code}</td>
                        <td className="p-3 font-bold text-slate-900 max-w-[200px]">{r.instituteName}</td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          <span className="font-semibold block text-slate-800">{r.principalName}</span>
                          <span className="text-[11px] font-mono text-slate-500">{r.principalContact}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${r.teamNumber === 1 ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            Team {r.teamNumber}
                          </span>
                        </td>
                        <td className="p-3 max-w-[260px]">
                          <span className="font-bold text-slate-900 block leading-tight">{r.projectTitle}</span>
                          <span className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {r.theme}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold block text-slate-800">{r.mentorName}</span>
                          <span className="text-[11px] font-mono text-slate-500">{r.mentorContact}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                          {r.studentName}
                          {r.studentRole === 'Leader' && (
                            <span className="ml-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1 rounded">
                              Leader
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-700 whitespace-nowrap">{r.registrationNo}</td>
                        <td className="p-3 text-slate-700 max-w-[180px]">{r.department}</td>
                        <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{r.semester}</td>
                        <td className="p-3 text-slate-600 text-xs truncate max-w-[170px]" title={r.studentEmail}>{r.studentEmail}</td>
                        <td className="p-3 font-mono text-xs text-slate-700 whitespace-nowrap">{r.studentContact}</td>
                        <td className="p-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const sub = submissions.find((s) => s.id === r.submissionId);
                                if (sub) setEditingSubmission(sub);
                              }}
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition cursor-pointer"
                              title="Edit this submission entry"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const sub = submissions.find((s) => s.id === r.submissionId);
                                if (sub) openDeleteSingleModal(sub);
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                              title="Delete this entire institute submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CONFIRMATION DELETION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Confirm Permanent Deletion
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{deleteModal.instituteName}</strong>
              {deleteModal.submissionCode ? ` (${deleteModal.submissionCode})` : ''} from the database?
            </p>

            <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              ⚠️ <strong>Warning:</strong> This will cascade and permanently remove all associated project teams, mentor details, and student rosters. This action cannot be reversed.
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, submissionId: null, submissionCode: '', instituteName: '', isBulk: false, count: 1 })}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EDIT SUBMISSION MODAL */}
      <EditSubmissionModal
        isOpen={Boolean(editingSubmission)}
        submission={editingSubmission}
        authToken={token}
        onClose={() => setEditingSubmission(null)}
        onSave={(updatedSub) => {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === updatedSub.id ? updatedSub : s))
          );
          setActionSuccessMessage(`Successfully updated entry for ${updatedSub.institute_name}`);
        }}
      />
    </div>
  );
};
