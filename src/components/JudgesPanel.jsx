import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  Crown,
  Shield,
  Scale,
  Users,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import {
  JUDGE_DOMAINS,
  JUDGE_ROLES,
  JUDGE_SLOTS,
  loadJudgesFromStorage,
  saveJudgesToStorage,
  normalizeJudgeData,
  fetchJudgesFromSupabase,
  saveJudgeToSupabase,
  deleteJudgeFromSupabase,
  getJuryPanelStats,
  exportJudgesToExcel,
  exportJudgesToCsv,
  exportJuryAttendanceToExcel,
  generateVectorJuryAttendancePdf,
  createEmptyJudge
} from '../lib/judgesUtils';
import { EVENT_DETAILS } from '../lib/attendanceUtils';
import {
  LOGO_PUNJAB_GOVT,
  LOGO_TECH_ED,
  LOGO_GPC_BATHINDA
} from '../lib/logos';

// Custom SVG Bulb with gear innovation icon matching AttendanceSheet
const InnovationBulbIcon = () => (
  <svg className="w-9 h-9 flex-shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="22" r="14" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2.5" />
    {/* Sun rays */}
    <path d="M24 3V6M24 38V41M7 22H4M44 22H41M10 8L12.5 10.5M35.5 33.5L38 36M10 36L12.5 33.5M35.5 10.5L38 8" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    {/* Inner Gear */}
    <circle cx="24" cy="22" r="5.5" fill="#0E3868" stroke="#1E40AF" strokeWidth="1.5" />
    <path d="M24 14V17M24 27V30M16 22H19M29 22H32" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    {/* Bulb Base */}
    <path d="M19 36H29V39C29 40.5 27.5 42 26 42H22C20.5 42 19 40.5 19 39V36Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
    <line x1="20" y1="39" x2="28" y2="39" stroke="#64748B" strokeWidth="1.5" />
  </svg>
);

export const JudgesPanel = ({ onBack = null }) => {
  const [judges, setJudges] = useState(() => loadJudgesFromStorage());
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'table' | 'attendance'
  const [attendanceSheetMode, setAttendanceSheetMode] = useState('split'); // 'split' | 'combined' | 'core_only' | 'reserve_only'
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJudge, setCurrentJudge] = useState(null);
  const [modalErrors, setModalErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [deleteConfirmSlotKey, setDeleteConfirmSlotKey] = useState(null);

  const printAreaRef = useRef(null);

  // Load from Supabase on mount and merge with local storage
  useEffect(() => {
    let isMounted = true;
    const fetchSupabase = async () => {
      setIsSyncing(true);
      const res = await fetchJudgesFromSupabase();
      if (isMounted) {
        setIsSyncing(false);
        if (res.data && res.data.length > 0) {
          setJudges(res.data);
          saveJudgesToStorage(res.data);
          setSyncMessage('Synchronized with database');
        }
      }
    };
    fetchSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Clear sync message timeout
  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => setSyncMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage]);

  // Create quick slot map
  const judgesMap = useMemo(() => {
    const map = new Map();
    judges.forEach((j) => {
      if (j && j.slotKey) {
        map.set(j.slotKey, j);
      }
    });
    return map;
  }, [judges]);

  // Panel completion metrics
  const stats = useMemo(() => getJuryPanelStats(judges), [judges]);

  // Core (Chairperson + 4 Jury Members) and Reserve (2 Members) slots separation
  const coreSlots = useMemo(
    () => JUDGE_SLOTS.filter((s) => s.role !== 'RESERVE_JURY_MEMBER'),
    []
  );
  const reserveSlots = useMemo(
    () => JUDGE_SLOTS.filter((s) => s.role === 'RESERVE_JURY_MEMBER'),
    []
  );

  // Filtered list for table view
  const filteredJudgesList = useMemo(() => {
    return JUDGE_SLOTS.map((slot) => {
      const judge = judgesMap.get(slot.slotKey);
      return { slot, judge };
    }).filter(({ slot, judge }) => {
      if (!judge) return !searchQuery && selectedDomainFilter === 'All';
      const matchesDomain =
        selectedDomainFilter === 'All' || judge.domain === selectedDomainFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        judge.name?.toLowerCase().includes(q) ||
        judge.organisation?.toLowerCase().includes(q) ||
        judge.designation?.toLowerCase().includes(q) ||
        judge.organisationLocation?.toLowerCase().includes(q) ||
        slot.label.toLowerCase().includes(q) ||
        judge.relevantBackground?.toLowerCase().includes(q);
      return matchesDomain && matchesSearch;
    });
  }, [judgesMap, searchQuery, selectedDomainFilter]);

  // Open modal for a specific slot or general add
  const handleOpenAddOrEdit = (slotKey = null) => {
    setModalErrors({});
    if (slotKey && judgesMap.has(slotKey)) {
      // Editing existing judge
      setCurrentJudge({ ...judgesMap.get(slotKey) });
    } else if (slotKey) {
      // New judge for specific slot
      setCurrentJudge(createEmptyJudge(slotKey));
    } else {
      // Auto-pick first available vacant slot
      const firstVacant = JUDGE_SLOTS.find((s) => !judgesMap.has(s.slotKey));
      setCurrentJudge(createEmptyJudge(firstVacant ? firstVacant.slotKey : 'chairperson_1'));
    }
    setIsModalOpen(true);
  };

  // Validate and save judge
  const handleSaveJudge = async (e) => {
    e.preventDefault();
    if (!currentJudge) return;

    const errors = {};
    if (!currentJudge.name?.trim()) errors.name = 'Full Name is required';
    if (!currentJudge.contact?.trim()) errors.contact = 'Contact number is required';
    if (!currentJudge.email?.trim()) {
      errors.email = 'Email ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentJudge.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!currentJudge.designation?.trim()) errors.designation = 'Designation is required';
    if (!currentJudge.organisation?.trim()) errors.organisation = 'Organisation name is required';
    if (!currentJudge.organisationLocation?.trim()) errors.organisationLocation = 'Organisation location is required';
    if (!currentJudge.domain?.trim()) errors.domain = 'Domain specialization is required';

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    const slotInfo = JUDGE_SLOTS.find((s) => s.slotKey === currentJudge.slotKey) || JUDGE_SLOTS[0];
    const normalized = normalizeJudgeData({
      ...currentJudge,
      role: slotInfo.role,
      slotNumber: slotInfo.slotNumber
    });

    // Update local state and storage
    const updatedJudges = judges.filter((j) => j.slotKey !== normalized.slotKey);
    updatedJudges.push(normalized);
    setJudges(updatedJudges);
    saveJudgesToStorage(updatedJudges);

    setIsModalOpen(false);
    setCurrentJudge(null);
    setSyncMessage(`Saved details for ${normalized.name} (${slotInfo.shortLabel})`);

    // Sync to Supabase in background
    saveJudgeToSupabase(normalized);
  };

  // Remove judge from slot
  const handleConfirmDelete = async (slotKey) => {
    const targetJudge = judgesMap.get(slotKey);
    const updated = judges.filter((j) => j.slotKey !== slotKey);
    setJudges(updated);
    saveJudgesToStorage(updated);
    setDeleteConfirmSlotKey(null);
    setSyncMessage(`Cleared slot: ${slotKey}`);

    // Sync deletion to Supabase
    deleteJudgeFromSupabase(slotKey);
  };

  // Download True Vector PDF matching AttendanceSheet
  const handleDownloadPdf = async (mode = attendanceSheetMode) => {
    setIsExportingPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      generateVectorJuryAttendancePdf(judges, mode);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Attendance to Excel
  const handleExportExcel = () => {
    exportJuryAttendanceToExcel(judges);
  };

  // Browser print / PDF export
  const handlePrint = () => {
    if (activeTab !== 'attendance') {
      setActiveTab('attendance');
      setTimeout(() => {
        window.print();
      }, 250);
    } else {
      window.print();
    }
  };

  // Helper to render an official attendance sheet card matching AttendanceSheet.jsx
  const renderAttendanceSheetCard = ({
    slots,
    bannerTitle,
    subfooterTag,
    pageNumberLabel,
    showStandbyNotice = false,
    isPageBreak = false
  }) => (
    <div
      key={bannerTitle}
      className={`attendance-page-sheet print-board-sheet jury-attendance-sheet ${
        isPageBreak ? 'page-break mb-8' : 'mb-6'
      } bg-white text-slate-900 shadow-xl rounded-2xl border-2 border-[#0e3868] p-4 sm:p-5 relative mx-auto`}
      style={{
        width: '1120px',
        minWidth: '1000px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}
    >
      {/* HEADER SECTION MATCHING AttendanceSheet.jsx */}
      <div className="pb-3 border-b-2 border-[#0e3868]">
        <div className="flex items-center justify-between" style={{ gap: '12px' }}>
          {/* LEFT: Punjab Govt & Tech Ed & Board */}
          <div style={{ width: '255px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={LOGO_PUNJAB_GOVT}
              alt="Govt of Punjab"
              style={{ height: '52px', width: 'auto', maxHeight: '52px', objectFit: 'contain' }}
            />
            <img
              src={LOGO_TECH_ED}
              alt="Tech Ed"
              style={{ height: '42px', width: '42px', maxHeight: '42px', objectFit: 'contain' }}
              className="rounded-md"
            />
            <div className="flex flex-col">
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#0e3868', lineHeight: 1, letterSpacing: '-0.3px' }}>
                {EVENT_DETAILS.boardName}
              </span>
              <span style={{ fontSize: '8px', fontWeight: 600, color: '#334155', lineHeight: 1.15, marginTop: '3px' }}>
                {EVENT_DETAILS.boardFullName}
              </span>
            </div>
          </div>

          {/* CENTER: Innovation Bulb + Challenge Title + Pill Banner + Meta Bar */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="flex items-center justify-center gap-2">
              <InnovationBulbIcon />
              <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#0e3868', lineHeight: 1, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                {EVENT_DETAILS.eventName}
              </h1>
            </div>

            {/* Dark Blue Pill Banner */}
            <div style={{ margin: '5px 0', backgroundColor: '#0e3868', color: '#ffffff', fontWeight: 800, fontSize: '12px', letterSpacing: '0.3px', padding: '3px 22px', borderRadius: '9999px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {bannerTitle}
            </div>

            {/* Meta Bar Pill */}
            <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '9999px', padding: '2px 16px', fontSize: '10px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
              <span>
                <span style={{ color: '#64748b' }}>Cluster:</span> Bathinda
              </span>
              <span style={{ color: '#94a3b8' }}>|</span>
              <span>
                <span style={{ color: '#64748b' }}>Venue / Host:</span> {EVENT_DETAILS.hostInstitute}
              </span>
              <span style={{ color: '#94a3b8' }}>|</span>
              <span>
                <span style={{ color: '#64748b' }}>Date:</span> {EVENT_DETAILS.eventDate}
              </span>
            </div>
          </div>

          {/* RIGHT: Host Institute Logo & Official Tag */}
          <div style={{ width: '255px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', textAlign: 'right' }}>
            <div className="flex flex-col items-end">
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#0e3868', lineHeight: 1.2, maxWidth: '180px' }}>
                {EVENT_DETAILS.hostInstitute}
              </span>
              <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                Host Institute &amp; Nodal Center
              </span>
            </div>
            <img
              src={LOGO_GPC_BATHINDA}
              alt="GPC Bathinda"
              style={{ height: '52px', width: '52px', maxHeight: '52px', objectFit: 'contain' }}
              className="rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Standby Protocol Notice (shown on reserve panel) */}
      {showStandbyNotice && (
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-semibold flex items-center justify-between">
          <span>
            <strong>Reserve / Alternate Jury Protocol:</strong> Standby jury members evaluate projects upon requirement to resolve domain-specific ties or in the absence of an assigned core member.
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
            Standby Roster
          </span>
        </div>
      )}

      {/* OFFICIAL TABLE */}
      <div className="mt-3">
        <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-[#0e3868] text-white text-[9.5px] font-bold uppercase tracking-wider">
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle" style={{ width: '3.5%' }}>
                Sr. No.
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle" style={{ width: '14.5%' }}>
                Jury Designation / Role
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle" style={{ width: '18%' }}>
                Judge Full Name &amp; Contact No.
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle" style={{ width: '21%' }}>
                Designation, Organisation &amp; Location
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle" style={{ width: '15%' }}>
                Domain Specialization
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle bg-[#0b2d54]" style={{ width: '7%' }}>
                Reporting<br />In-Time
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle bg-[#0b2d54]" style={{ width: '14%' }}>
                Attendance / Physical Signature
              </th>
              <th className="p-1.5 text-center border border-[#94a3b8] align-middle" style={{ width: '7%' }}>
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, idx) => {
              const judge = judgesMap.get(slot.slotKey);
              const isChair = slot.role === 'CHAIRPERSON';
              const isReserve = slot.role === 'RESERVE_JURY_MEMBER';
              const rowBg = isChair ? '#fffdf0' : isReserve ? '#faf5ff' : idx % 2 === 0 ? '#ffffff' : '#f0f7ff';
              const minCellHeight = slots.length <= 2 ? '56px' : slots.length <= 5 ? '48px' : '44px';

              return (
                <tr
                  key={slot.slotKey}
                  style={{ backgroundColor: rowBg }}
                  className="text-slate-900 border-b border-[#cbd5e1] text-[10px]"
                >
                  {/* Sr. No. */}
                  <td className="p-1.5 text-center font-black text-slate-800 text-[11px] border border-[#cbd5e1] align-middle">
                    {idx + 1}
                  </td>

                  {/* Jury Role */}
                  <td className="p-1.5 border border-[#cbd5e1] align-middle">
                    <div className="font-extrabold text-slate-900 uppercase text-[10px] leading-tight">
                      {slot.label}
                    </div>
                    <span className="text-[8.5px] text-slate-500 font-semibold block mt-0.5 uppercase">
                      {slot.roleTitle}
                    </span>
                  </td>

                  {/* Judge Full Name & Contact */}
                  <td className="p-1.5 border border-[#cbd5e1] align-middle uppercase">
                    {judge?.name ? (
                      <>
                        <div className="font-black text-slate-900 text-[10.5px] uppercase leading-tight">
                          {judge.name}
                        </div>
                        <div className="text-[9px] text-slate-700 font-mono mt-0.5 font-bold">
                          PH: {judge.contact || '-'}
                        </div>
                        {judge.email && (
                          <div className="text-[8.5px] text-slate-500 font-mono lowercase">
                            {judge.email}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 italic text-[9.5px]">
                        [VACANT / UNASSIGNED]
                      </span>
                    )}
                  </td>

                  {/* Designation, Organisation & Location */}
                  <td className="p-1.5 border border-[#cbd5e1] align-middle uppercase">
                    {judge?.organisation ? (
                      <>
                        <div className="font-bold text-slate-900 text-[10px] leading-tight uppercase">
                          {judge.designation}
                        </div>
                        <div className="text-[9.5px] text-slate-700 font-semibold mt-0.5 uppercase leading-tight">
                          {judge.organisation}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium uppercase mt-0.5">
                          ({judge.organisationLocation || '-'})
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Domain Specialization */}
                  <td className="p-1.5 text-center border border-[#cbd5e1] align-middle uppercase">
                    {judge?.domain ? (
                      <span className="inline-block px-2 py-0.5 rounded-full font-black text-[8.5px] bg-blue-100 text-blue-900 border border-blue-200 uppercase leading-snug">
                        {judge.domain}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Reporting In-Time Physical Blank Box */}
                  <td
                    className="p-1 border border-[#cbd5e1] align-middle bg-white"
                    style={{ minHeight: minCellHeight, height: minCellHeight }}
                  >
                    <div className="w-full h-full min-h-[40px]"></div>
                  </td>

                  {/* Attendance / Physical Signature Blank Box */}
                  <td
                    className="p-1 border border-[#cbd5e1] align-middle bg-white"
                    style={{ minHeight: minCellHeight, height: minCellHeight }}
                  >
                    <div className="w-full h-full min-h-[40px]"></div>
                  </td>

                  {/* Remarks Physical Blank Box */}
                  <td
                    className="p-1 border border-[#cbd5e1] align-middle bg-white"
                    style={{ minHeight: minCellHeight, height: minCellHeight }}
                  >
                    <div className="w-full h-full min-h-[40px]"></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER & OFFICIAL SIGN-OFF SECTION */}
      <div className="mt-6 pt-4 border-t-2 border-[#0e3868]/40">
        <div className="flex items-start justify-between text-xs text-slate-700 px-4 pb-2">
          {/* Left Sign: Chairperson */}
          <div className="text-center w-64">
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <span className="font-bold text-[11px] text-slate-900 block mt-1.5 uppercase">
              Chairperson, Jury Board
            </span>
            <span className="text-[9.5px] text-slate-600 font-medium block leading-tight mt-0.5">
              Evaluation Jury Board &bull; Bathinda Cluster
            </span>
          </div>

          {/* Center Sign: Nodal Officer */}
          <div className="text-center w-64">
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <span className="font-bold text-[11px] text-slate-900 block mt-1.5 uppercase">
              Nodal Officer
            </span>
            <span className="text-[9.5px] text-slate-600 font-medium block leading-tight mt-0.5">
              Bathinda Cluster &bull; Polytechnic Innovation Challenge 2026-27
            </span>
          </div>

          {/* Right Sign: Principal */}
          <div className="text-center w-72">
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <span className="font-bold text-[11px] text-slate-900 block mt-1.5 uppercase">
              Principal
            </span>
            <span className="text-[9.5px] text-slate-600 font-medium block leading-tight mt-0.5">
              Host Institute, Bathinda Cluster
            </span>
            <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
              Government Polytechnic College, Bathinda
            </span>
          </div>
        </div>

        {/* Sub-footer line */}
        <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500 px-1">
          <span>
            <strong>{EVENT_DETAILS.eventName}</strong> &bull; {EVENT_DETAILS.cluster} &bull; Host: {EVENT_DETAILS.hostInstitute} &bull; {subfooterTag}
          </span>
          <div className="flex items-center gap-3">
            {pageNumberLabel && (
              <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {pageNumberLabel}
              </span>
            )}
            <span>
              Date: <strong>{EVENT_DETAILS.eventDate}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="judges-panel-wrapper min-h-screen bg-slate-100 py-6 px-3 sm:px-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER & NAVIGATION BAR (Hidden in print) */}
      <div className="max-w-[1400px] mx-auto mb-6 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Return to Master Admin Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <Award className="w-3 h-3 text-amber-600" />
                  Official Evaluation Board
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {stats.totalAssigned} of 7 Positions Configured
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                <span>Evaluation Jury Panel &amp; Judges</span>
                <span className="text-xs sm:text-sm font-normal text-slate-400">
                  &bull; {EVENT_DETAILS.cluster}
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Vector PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Download Official Vector PDF Attendance Sheet (Landscape A4)"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Download className="w-4 h-4 text-amber-300" />
              )}
              <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            {/* Print / Official Sheet Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Print official Jury Attendance Sheet (Landscape A4)"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Print Sheet</span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Export official Jury Attendance Sheet to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Excel</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={() => exportJudgesToCsv(judges)}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Export Jury Roster as CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV</span>
            </button>

            {/* Add / Assign Judge Button */}
            <button
              type="button"
              onClick={() => handleOpenAddOrEdit()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300 font-bold" />
              <span>Add / Assign Judge</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs & Live Status Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('slots')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'slots'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Visual Jury Slots (7)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Table Roster</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Attendance Sheet (PDF)</span>
            </button>
          </div>

          {/* Sync notification message */}
          {syncMessage && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{syncMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. JURY PANEL READINESS DASHBOARD SUMMARY CARDS (Hidden in print) */}
      <div className="max-w-[1400px] mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        {/* Card 1: Chairperson */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border transition shadow-sm ${
            stats.isChairpersonAssigned
              ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border-amber-300'
              : 'bg-white border-dashed border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-600" />
              Position 1: Chairperson
            </span>
            {stats.isChairpersonAssigned ? (
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Assigned
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-700">1 Needed</span>
            )}
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black text-slate-900">
              {stats.chairperson ? stats.chairperson.name : 'Chairperson Vacant'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {stats.chairperson
                ? `${stats.chairperson.designation} • ${stats.chairperson.organisation}`
                : 'Lead Evaluator & Head of Evaluation Jury'}
            </p>
          </div>
        </div>

        {/* Card 2: 4 Jury Members */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border transition shadow-sm ${
            stats.juryMembersCount === 4
              ? 'bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white border-blue-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-600" />
              Positions 2–5: Jury Members
            </span>
            <span
              className={`text-xs font-black ${
                stats.juryMembersCount === 4 ? 'text-emerald-700' : 'text-blue-700'
              }`}
            >
              {stats.juryMembersCount} of 4 Assigned
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.juryMembersCount / 4) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {stats.juryMembersCount === 4
                ? 'Full technical jury quorum established.'
                : `${4 - stats.juryMembersCount} jury member slot(s) pending assignment.`}
            </p>
          </div>
        </div>

        {/* Card 3: 2 Reserve Jury Members */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border transition shadow-sm ${
            stats.reserveMembersCount === 2
              ? 'bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white border-purple-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-600" />
              Positions 6–7: Reserve Members
            </span>
            <span
              className={`text-xs font-black ${
                stats.reserveMembersCount === 2 ? 'text-emerald-700' : 'text-purple-700'
              }`}
            >
              {stats.reserveMembersCount} of 2 Standby
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.reserveMembersCount / 2) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Alternate / standby evaluators in case of unforeseen scheduling conflicts.
            </p>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT BASED ON SELECTED TAB */}
      <div className="max-w-[1400px] mx-auto">
        {/* TAB 1: VISUAL JURY SLOTS GRID (7 SLOTS) */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            {/* GROUP 1: CHAIRPERSON SECTION */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Jury Board Leadership &bull; Chairperson
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chief judge presiding over cluster evaluations &amp; result validation
                    </p>
                  </div>
                </div>
              </div>

              {/* Render Chairperson Slot */}
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const slot = JUDGE_SLOTS[0];
                  const judge = judgesMap.get(slot.slotKey);
                  return (
                    <JudgeSlotCard
                      key={slot.slotKey}
                      slot={slot}
                      judge={judge}
                      onEdit={() => handleOpenAddOrEdit(slot.slotKey)}
                      onDelete={() => setDeleteConfirmSlotKey(slot.slotKey)}
                      onAssign={() => handleOpenAddOrEdit(slot.slotKey)}
                      isChairperson={true}
                    />
                  );
                })()}
              </div>
            </div>

            {/* GROUP 2: CORE JURY MEMBERS (4 SLOTS) */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                    <Scale className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Core Jury Members &bull; 4 Technical Evaluators
                    </h2>
                    <p className="text-xs text-slate-500">
                      Primary evaluation panel across technical, industry, prototyping, and academic domains
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
                  {stats.juryMembersCount} / 4 Filled
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {JUDGE_SLOTS.slice(1, 5).map((slot) => {
                  const judge = judgesMap.get(slot.slotKey);
                  return (
                    <JudgeSlotCard
                      key={slot.slotKey}
                      slot={slot}
                      judge={judge}
                      onEdit={() => handleOpenAddOrEdit(slot.slotKey)}
                      onDelete={() => setDeleteConfirmSlotKey(slot.slotKey)}
                      onAssign={() => handleOpenAddOrEdit(slot.slotKey)}
                      isChairperson={false}
                    />
                  );
                })}
              </div>
            </div>

            {/* GROUP 3: RESERVE JURY MEMBERS (2 SLOTS) */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Reserve Jury Members &bull; 2 Alternate Evaluators
                    </h2>
                    <p className="text-xs text-slate-500">
                      Standby domain experts for cluster evaluation contingencies
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                  {stats.reserveMembersCount} / 2 Filled
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {JUDGE_SLOTS.slice(5, 7).map((slot) => {
                  const judge = judgesMap.get(slot.slotKey);
                  return (
                    <JudgeSlotCard
                      key={slot.slotKey}
                      slot={slot}
                      judge={judge}
                      onEdit={() => handleOpenAddOrEdit(slot.slotKey)}
                      onDelete={() => setDeleteConfirmSlotKey(slot.slotKey)}
                      onAssign={() => handleOpenAddOrEdit(slot.slotKey)}
                      isChairperson={false}
                      isReserve={true}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TABLE ROSTER VIEW */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, designation, organisation, domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Domain:</span>
                <select
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                >
                  <option value="All">All Domains (6)</option>
                  {JUDGE_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0e3868] text-white font-bold border-b border-blue-950">
                  <tr className="uppercase text-[9.5px] tracking-wider">
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5">Jury Role / Position</th>
                    <th className="p-2.5">Judge Name</th>
                    <th className="p-2.5">Contact &amp; Email</th>
                    <th className="p-2.5">Designation &amp; Organisation</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Domain Specialization</th>
                    <th className="p-2.5">Relevant Background (1-Liner)</th>
                    <th className="p-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJudgesList.map(({ slot, judge }, idx) => {
                    const isVacant = !judge;
                    return (
                      <tr
                        key={slot.slotKey}
                        className={
                          idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/60 hover:bg-slate-100/60'
                        }
                      >
                        <td className="p-2.5 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              slot.role === 'CHAIRPERSON'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : slot.role === 'JURY_MEMBER'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {slot.label}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap uppercase">
                          {isVacant ? (
                            <span className="text-slate-400 font-normal italic">
                              [Vacant / Unassigned]
                            </span>
                          ) : (
                            judge.name
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {isVacant ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <div className="font-mono text-[11px] text-slate-600">
                              <div>{judge.contact}</div>
                              <div className="text-slate-400 text-[10px] lowercase font-sans">
                                {judge.email}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 uppercase">
                          {isVacant ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <div>
                              <div className="font-bold text-slate-900">{judge.designation}</div>
                              <div className="text-[11px] text-slate-600 font-medium">
                                {judge.organisation}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 uppercase whitespace-nowrap">
                          {isVacant ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <span className="text-slate-700 font-semibold">
                              {judge.organisationLocation}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {isVacant ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 leading-tight">
                              {judge.domain}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 max-w-[280px]">
                          {isVacant ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <p className="text-[11px] text-slate-600 italic line-clamp-2">
                              &ldquo;{judge.relevantBackground || 'No background note added.'}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {isVacant ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAddOrEdit(slot.slotKey)}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition cursor-pointer"
                            >
                              Assign
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenAddOrEdit(slot.slotKey)}
                                className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                title="Edit Judge Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmSlotKey(slot.slotKey)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Clear Judge Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OFFICIAL EVALUATION BOARD ATTENDANCE SHEET */}
        {activeTab === 'attendance' && (
          <div className="w-full flex flex-col items-center">
            {/* Control & Info Bar above Attendance Sheet (Hidden in print) */}
            <div className="w-full max-w-[1120px] mb-4 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3 no-print">
              {/* Row 1: Title, Tag & Export Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Official Evaluation Jury Board Attendance Sheets</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300">
                        Landscape A4
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Choose between separate sheets (Main Board &amp; Reserve Members on separate pages) or a combined single sheet.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Download 2-Page Separate PDF */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf('split')}
                    disabled={isExportingPdf}
                    className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                    title="Download 2-Page Vector PDF (Page 1: Core Board, Page 2: Reserve Panel)"
                  >
                    {isExportingPdf ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>Download Separate (2 Pages)</span>
                  </button>

                  {/* Download Combined 1-Page PDF */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf('combined')}
                    disabled={isExportingPdf}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    title="Download 1-Page Combined Vector PDF (All 7 on 1 Sheet)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Combined (1 Page)</span>
                  </button>

                  {/* Print Sheet(s) */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Print current sheet layout via browser (Landscape A4)"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-300" />
                    <span>Print Sheet(s)</span>
                  </button>

                  {/* Excel (3 Tabs) */}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Export to Excel with 3 tabs: Core Board, Reserve Panel, and Combined"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Excel (3 Tabs)</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Sheet Layout View Selector Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wide mr-1">
                    Sheet Layout View:
                  </span>
                  <div className="inline-flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
                    <button
                      type="button"
                      onClick={() => setAttendanceSheetMode('split')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        attendanceSheetMode === 'split'
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Separate Sheets (2 Pages: Core &amp; Reserve)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceSheetMode('combined')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        attendanceSheetMode === 'combined'
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Combined Sheet (All 7 on 1 Page)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceSheetMode('core_only')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        attendanceSheetMode === 'core_only'
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Core Jury Only (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceSheetMode('reserve_only')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        attendanceSheetMode === 'reserve_only'
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Reserve Panel Only (2)
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  {attendanceSheetMode === 'split'
                    ? 'Viewing 2 separate printable sheets • Page 1: Core Board (5) | Page 2: Reserve Panel (2)'
                    : attendanceSheetMode === 'combined'
                    ? 'Viewing 1 combined printable sheet with all 7 positions'
                    : attendanceSheetMode === 'core_only'
                    ? 'Viewing Core Evaluation Jury Board attendance sheet only'
                    : 'Viewing Standby / Reserve Jury Panel attendance sheet only'}
                </span>
              </div>
            </div>

            {/* Attendance Sheet Scroll Wrapper */}
            <div ref={printAreaRef} className="w-full overflow-x-auto pb-6 flex flex-col items-center">
              {attendanceSheetMode === 'split' && (
                <>
                  {/* Sheet 1: Core Evaluation Jury Board (1 Chairperson + 4 Jury Members) */}
                  {renderAttendanceSheetCard({
                    slots: coreSlots,
                    bannerTitle: 'Cluster-Level Competition – Core Evaluation Jury Board Attendance Sheet',
                    subfooterTag: 'Official Core Evaluation Jury Board Attendance Record',
                    pageNumberLabel: 'Page 1 of 2',
                    showStandbyNotice: false,
                    isPageBreak: true
                  })}

                  {/* Sheet 2: Standby / Reserve Jury Panel (2 Reserve Members) */}
                  {renderAttendanceSheetCard({
                    slots: reserveSlots,
                    bannerTitle: 'Cluster-Level Competition – Standby / Reserve Jury Panel Attendance Sheet',
                    subfooterTag: 'Official Standby / Reserve Jury Attendance Record',
                    pageNumberLabel: 'Page 2 of 2',
                    showStandbyNotice: true,
                    isPageBreak: false
                  })}
                </>
              )}

              {attendanceSheetMode === 'combined' &&
                renderAttendanceSheetCard({
                  slots: JUDGE_SLOTS,
                  bannerTitle: 'Cluster-Level Competition – Jury Evaluation Board Attendance Sheet (Combined)',
                  subfooterTag: 'Official Evaluation Jury Board Attendance Record (Combined)',
                  pageNumberLabel: 'Single Sheet',
                  showStandbyNotice: false,
                  isPageBreak: false
                })}

              {attendanceSheetMode === 'core_only' &&
                renderAttendanceSheetCard({
                  slots: coreSlots,
                  bannerTitle: 'Cluster-Level Competition – Core Evaluation Jury Board Attendance Sheet',
                  subfooterTag: 'Official Core Evaluation Jury Board Attendance Record',
                  pageNumberLabel: 'Core Board (5 Positions)',
                  showStandbyNotice: false,
                  isPageBreak: false
                })}

              {attendanceSheetMode === 'reserve_only' &&
                renderAttendanceSheetCard({
                  slots: reserveSlots,
                  bannerTitle: 'Cluster-Level Competition – Standby / Reserve Jury Panel Attendance Sheet',
                  subfooterTag: 'Official Standby / Reserve Jury Attendance Record',
                  pageNumberLabel: 'Reserve Panel (2 Positions)',
                  showStandbyNotice: true,
                  isPageBreak: false
                })}
            </div>
          </div>
        )}
      </div>

      {/* 4. ADD / EDIT JUDGE MODAL */}
      {isModalOpen && currentJudge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0e3868] to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">
                    {judgesMap.has(currentJudge.slotKey) ? 'Edit Judge Details' : 'Assign New Judge'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Official Evaluation Jury &bull; Bathinda Cluster
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveJudge} className="p-5 sm:p-6 space-y-4">
              {/* Position / Slot Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Jury Position / Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={currentJudge.slotKey}
                  onChange={(e) => {
                    const newSlotKey = e.target.value;
                    const slotInfo = JUDGE_SLOTS.find((s) => s.slotKey === newSlotKey);
                    setCurrentJudge({
                      ...currentJudge,
                      slotKey: newSlotKey,
                      role: slotInfo?.role || 'JURY_MEMBER',
                      slotNumber: slotInfo?.slotNumber || 1
                    });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {JUDGE_SLOTS.map((slot) => {
                    const isOccupied = judgesMap.has(slot.slotKey);
                    const isCurrent = currentJudge.slotKey === slot.slotKey;
                    return (
                      <option key={slot.slotKey} value={slot.slotKey}>
                        {slot.label} {isOccupied && !isCurrent ? `(Occupied: ${judgesMap.get(slot.slotKey)?.name})` : isCurrent ? '(Currently Selected)' : '(Vacant)'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Choose which of the 7 designated jury positions this judge will occupy.
                </p>
              </div>

              {/* Row 1: Full Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Judge Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. (Dr.) Rajesh Sharma"
                    value={currentJudge.name}
                    onChange={(e) => setCurrentJudge({ ...currentJudge, name: e.target.value })}
                    className={`w-full py-2 px-3 rounded-xl border text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold ${
                      modalErrors.name ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-slate-50'
                    }`}
                  />
                  {modalErrors.name && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{modalErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Contact / Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={currentJudge.contact}
                      onChange={(e) => setCurrentJudge({ ...currentJudge, contact: e.target.value })}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 outline-none ${
                        modalErrors.contact ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-slate-50'
                      }`}
                    />
                  </div>
                  {modalErrors.contact && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{modalErrors.contact}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Official / Personal Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. rsharma@iitrpr.ac.in"
                      value={currentJudge.email}
                      onChange={(e) => setCurrentJudge({ ...currentJudge, email: e.target.value })}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none ${
                        modalErrors.email ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-slate-50'
                      }`}
                    />
                  </div>
                  {modalErrors.email && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{modalErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Professor & Dean R&D / Chief Scientist"
                      value={currentJudge.designation}
                      onChange={(e) => setCurrentJudge({ ...currentJudge, designation: e.target.value })}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs text-slate-800 uppercase focus:ring-2 focus:ring-blue-500 outline-none ${
                        modalErrors.designation ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-slate-50'
                      }`}
                    />
                  </div>
                  {modalErrors.designation && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{modalErrors.designation}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Organisation & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Organisation / Institute <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. IIT Ropar / GNDEC / Verka"
                      value={currentJudge.organisation}
                      onChange={(e) => setCurrentJudge({ ...currentJudge, organisation: e.target.value })}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs text-slate-800 uppercase focus:ring-2 focus:ring-blue-500 outline-none ${
                        modalErrors.organisation ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-slate-50'
                      }`}
                    />
                  </div>
                  {modalErrors.organisation && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{modalErrors.organisation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Organisation Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ropar, Punjab / Mohali / Chandigarh"
                      value={currentJudge.organisationLocation}
                      onChange={(e) => setCurrentJudge({ ...currentJudge, organisationLocation: e.target.value })}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs text-slate-800 uppercase focus:ring-2 focus:ring-blue-500 outline-none ${
                        modalErrors.organisationLocation ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-slate-50'
                      }`}
                    />
                  </div>
                  {modalErrors.organisationLocation && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{modalErrors.organisationLocation}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Domain Specialization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Domain Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  value={currentJudge.domain}
                  onChange={(e) => setCurrentJudge({ ...currentJudge, domain: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                >
                  {JUDGE_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selected domain ensures balanced evaluation representation across academic, technical, industrial, and prototyping criteria.
                </p>
              </div>

              {/* Row 5: Relevant Background (One Line) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Relevant Background (One Line)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 20+ years leading IoT and embedded robotics research with 15 published patents and multiple startup incubations."
                  value={currentJudge.relevantBackground}
                  onChange={(e) => setCurrentJudge({ ...currentJudge, relevantBackground: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Concise 1-line summary printed on the official evaluator credential dossier.
                </p>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:scale-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Save Judge Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE / CLEAR SLOT CONFIRMATION MODAL */}
      {deleteConfirmSlotKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Clear Judge from Slot?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to remove the judge from{' '}
              <strong className="text-slate-800">
                {JUDGE_SLOTS.find((s) => s.slotKey === deleteConfirmSlotKey)?.label}
              </strong>
              ? This action will set the position back to vacant.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSlotKey(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmSlotKey)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Yes, Clear Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Visual Judge Slot Card for Grid View
 */
const JudgeSlotCard = ({
  slot,
  judge,
  onEdit,
  onDelete,
  onAssign,
  isChairperson = false,
  isReserve = false
}) => {
  const isVacant = !judge;

  // Empty / Vacant State Card
  if (isVacant) {
    return (
      <div
        className={`p-5 rounded-3xl border-2 border-dashed transition flex flex-col justify-between min-h-[220px] ${
          isChairperson
            ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
            : isReserve
            ? 'bg-purple-50/30 border-purple-200 hover:border-purple-300'
            : 'bg-white border-slate-200 hover:border-blue-300'
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isChairperson
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : isReserve
                  ? 'bg-purple-100 text-purple-900 border-purple-200'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {slot.label}
            </span>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Vacant
            </span>
          </div>

          <div className="mt-4 text-center py-3">
            <div
              className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center mb-2 ${
                isChairperson
                  ? 'bg-amber-100 text-amber-600'
                  : isReserve
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isChairperson ? (
                <Crown className="w-5 h-5" />
              ) : isReserve ? (
                <Shield className="w-5 h-5" />
              ) : (
                <Scale className="w-5 h-5" />
              )}
            </div>
            <h4 className="text-sm font-extrabold text-slate-700">
              {slot.label} Unassigned
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
              {isChairperson
                ? 'Designate a senior academic or industry leader to chair the cluster jury board.'
                : isReserve
                ? 'Assign an alternate domain specialist to guarantee quorum continuity.'
                : 'Select an expert evaluator matching one of the 6 innovation domains.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAssign}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 ${
            isChairperson
              ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-xs'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          <Plus className="w-4 h-4 font-bold" />
          <span>Assign Judge to {slot.shortLabel}</span>
        </button>
      </div>
    );
  }

  // Filled / Assigned State Card
  return (
    <div
      className={`p-5 rounded-3xl border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
        isChairperson
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white border-amber-300'
          : isReserve
          ? 'bg-gradient-to-br from-purple-500/10 via-purple-50/30 to-white border-purple-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${
                isChairperson
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : isReserve
                  ? 'bg-purple-100 text-purple-900 border-purple-200'
                  : 'bg-blue-100 text-blue-900 border-blue-200'
              }`}
            >
              {isChairperson && <Crown className="w-3 h-3 text-amber-600" />}
              {isReserve && <Shield className="w-3 h-3 text-purple-600" />}
              {!isChairperson && !isReserve && <Scale className="w-3 h-3 text-blue-600" />}
              {slot.label}
            </span>
          </div>

          {/* Domain Specialization Badge */}
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
            {judge.domain}
          </span>
        </div>

        {/* Judge Name & Designation */}
        <div className="mt-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase leading-snug">
            {judge.name}
          </h3>
          <div className="text-xs font-bold text-blue-900 uppercase mt-0.5">
            {judge.designation}
          </div>
          <div className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5 mt-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{judge.organisation}</span>
          </div>
          <div className="text-[11px] text-slate-500 uppercase flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{judge.organisationLocation}</span>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            <Phone className="w-3 h-3 text-slate-400" />
            {judge.contact}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 lowercase">
            <Mail className="w-3 h-3 text-slate-400" />
            {judge.email}
          </span>
        </div>

        {/* Relevant Background Quote */}
        {judge.relevantBackground && (
          <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs italic">
            <p className="line-clamp-2 leading-relaxed">
              &ldquo;{judge.relevantBackground}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 text-xs font-bold transition cursor-pointer"
          title="Clear this judge slot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>
      </div>
    </div>
  );
};
