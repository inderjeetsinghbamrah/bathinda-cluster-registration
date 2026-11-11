import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  Filter,
  Layers,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import {
  EVENT_DETAILS,
  formatAttendanceData,
  paginateAttendanceTeams,
  exportAttendanceToExcel,
  downloadAttendancePdf
} from '../lib/attendanceUtils';
import {
  LOGO_PUNJAB_GOVT,
  LOGO_TECH_ED,
  LOGO_GPC_BATHINDA
} from '../lib/logos';

// Custom SVG Bulb with gear innovation icon matching reference
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

export const AttendanceSheet = ({ submissions = [], onBack = null, onOpenReorder = null }) => {
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('custom');
  const [studentsPerPage, setStudentsPerPage] = useState(11);
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'continuous'
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);

  const printContainerRef = useRef(null);

  // Format teams from submissions
  const allFormattedTeams = useMemo(() => {
    return formatAttendanceData(submissions, sortBy);
  }, [submissions, sortBy]);

  // Unique lists for filters
  const institutesList = useMemo(() => {
    const set = new Set(allFormattedTeams.map((t) => t.instituteName));
    return Array.from(set).sort();
  }, [allFormattedTeams]);

  const themesList = useMemo(() => {
    const set = new Set(allFormattedTeams.map((t) => t.theme.name));
    return Array.from(set).sort();
  }, [allFormattedTeams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return allFormattedTeams.filter((t) => {
      const matchesInst = selectedInstitute === 'All' || t.instituteName === selectedInstitute;
      const matchesTheme = selectedTheme === 'All' || t.theme.name.includes(selectedTheme);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.instituteName.toLowerCase().includes(q) ||
        t.projectTitle.toLowerCase().includes(q) ||
        t.mentorName.toLowerCase().includes(q) ||
        t.submissionCode.toLowerCase().includes(q) ||
        t.students.some(
          (s) =>
            s.studentName.toLowerCase().includes(q) ||
            s.registrationNo.toLowerCase().includes(q)
        );
      return matchesInst && matchesTheme && matchesSearch;
    });
  }, [allFormattedTeams, selectedInstitute, selectedTheme, searchQuery]);

  // Paged teams
  const pages = useMemo(() => {
    if (viewMode === 'continuous') {
      return [filteredTeams];
    }
    return paginateAttendanceTeams(filteredTeams, studentsPerPage);
  }, [filteredTeams, studentsPerPage, viewMode]);

  const totalFilteredStudents = useMemo(() => {
    return filteredTeams.reduce((acc, t) => acc + t.students.length, 0);
  }, [filteredTeams]);

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsExportingPdf(true);
    setExportProgress({ current: 0, total: pages.length, status: 'Preparing attendance sheet...' });

    try {
      const filename = `Attendance_Sheet_${EVENT_DETAILS.cluster.replace(/\s+/g, '_')}_${EVENT_DETAILS.eventDate}.pdf`;
      await downloadAttendancePdf(printContainerRef.current, filename, (progress) => {
        setExportProgress(progress);
      });
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    exportAttendanceToExcel(
      filteredTeams,
      `Attendance_Sheet_${EVENT_DETAILS.cluster.replace(/\s+/g, '_')}_${EVENT_DETAILS.eventDate}.xlsx`
    );
  };

  // Handle Browser Native Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP CONTROL TOOLBAR (Hidden in Print) */}
      <div className="max-w-[1400px] mx-auto mb-6 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Return to Master Admin Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
                  Official Attendance Sheet
                </span>
                <span className="text-xs text-slate-500 font-bold">Event Date: {EVENT_DETAILS.eventDate}</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5">
                {EVENT_DETAILS.eventName} &bull; {EVENT_DETAILS.cluster}
              </h2>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Reorder Table Shortcut Button */}
            {onOpenReorder && (
              <button
                type="button"
                onClick={onOpenReorder}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 active:scale-95 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title="Open Reorderable Table View to adjust presentation and print sequence"
              >
                <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                <span>Reorder Sequence</span>
              </button>
            )}

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf || filteredTeams.length === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>{exportProgress?.status || 'Exporting PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print / Save to PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredTeams.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
              title="Open browser print dialog (Landscape A4)"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Print / Vector PDF</span>
            </button>

            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredTeams.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Filters and Layout Customizer */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Institute filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Filter by Institute:
            </label>
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Institutes ({institutesList.length})</option>
              {institutesList.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Theme filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Filter by Theme:
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Thematic Domains</option>
              {themesList.map((th) => (
                <option key={th} value={th}>
                  {th}
                </option>
              ))}
            </select>
          </div>

          {/* Search query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Search Roster:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Student, Mentor, Project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Sort Sequence:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="custom">Custom Sequence (from Reorder Table)</option>
              <option value="host_first">Host College First (GPC Bathinda)</option>
              <option value="theme">Group by Theme Domain (D-01 to D-08)</option>
              <option value="institute">Alphabetical (By Institute)</option>
              <option value="created_at">Registration Order (Early First)</option>
              <option value="code">Acknowledgement Code</option>
            </select>
          </div>

          {/* Layout & Students Per Page */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Page Density:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={studentsPerPage}
                onChange={(e) => setStudentsPerPage(Number(e.target.value))}
                className="flex-1 py-2 px-2 rounded-xl border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={10}>10 Students / A4</option>
                <option value={11}>11 Students / A4 (Standard)</option>
                <option value={12}>12 Students / A4</option>
                <option value={14}>14 Students / Compact</option>
              </select>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'paginated' ? 'continuous' : 'paginated')}
                className={`px-2.5 py-2 rounded-xl border font-bold text-[11px] transition cursor-pointer ${
                  viewMode === 'continuous'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                }`}
                title="Toggle continuous vs paginated view"
              >
                {viewMode === 'continuous' ? 'All-in-One' : 'Paged'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Showing: <strong className="text-slate-800">{filteredTeams.length}</strong> Projects / Teams &bull; <strong className="text-slate-800">{totalFilteredStudents}</strong> Students
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Total A4 Pages: <strong className="text-blue-700">{pages.length}</strong>
            </span>
          </div>
          {(selectedInstitute !== 'All' || selectedTheme !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedInstitute('All');
                setSelectedTheme('All');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. ATTENDANCE SHEET PAGES CONTAINER */}
      <div ref={printContainerRef} className="attendance-sheet-print-container flex flex-col items-center gap-8">
        {pages.map((pageTeams, pageIdx) => {
          return (
            <div
              key={pageIdx}
              className="attendance-page-sheet bg-white text-slate-900 shadow-xl rounded-2xl border-2 border-[#0e3868] p-4 sm:p-5 relative"
              style={{
                width: '1120px',
                minHeight: '790px',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff'
              }}
            >
              {/* HEADER SECTION */}
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
                      {EVENT_DETAILS.subtitle}
                    </div>

                    {/* Meta Bar Pill (single line without wrap) */}
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

              {/* TABLE SECTION */}
              <div className="mt-3">
                <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    {/* Header Row 1 */}
                    <tr className="bg-[#0e3868] text-white text-[10.5px] font-bold uppercase tracking-wider">
                      <th
                        rowSpan={2}
                        className="p-1.5 text-center border border-[#94a3b8] align-middle"
                        style={{ width: '3.5%' }}
                      >
                        Sr. No.
                      </th>
                      <th
                        rowSpan={2}
                        className="p-1.5 text-center border border-[#94a3b8] align-middle"
                        style={{ width: '16%' }}
                      >
                        Name of Institution
                        <br />
                        <span className="text-[9px] font-normal lowercase tracking-normal opacity-90">
                          (College / Polytechnic)
                        </span>
                      </th>
                      <th
                        rowSpan={2}
                        className="p-1.5 text-center border border-[#94a3b8] align-middle"
                        style={{ width: '13%' }}
                      >
                        Faculty Mentor
                        <br />
                        <span className="text-[9px] font-normal lowercase tracking-normal opacity-90">
                          (Name &amp; Contact No.)
                        </span>
                      </th>
                      <th
                        rowSpan={2}
                        className="p-1.5 text-center border border-[#94a3b8] align-middle"
                        style={{ width: '17%' }}
                      >
                        Project Idea / Title of Innovation
                      </th>
                      <th
                        rowSpan={2}
                        className="p-1.5 text-center border border-[#94a3b8] align-middle"
                        style={{ width: '13%' }}
                      >
                        Theme /
                        <br />
                        Thematic Domain
                      </th>
                      <th
                        colSpan={5}
                        className="p-1.5 text-center border border-[#94a3b8] align-middle bg-[#0b2d54]"
                        style={{ width: '37.5%' }}
                      >
                        Student Details
                      </th>
                    </tr>

                    {/* Sub-Header Row 2 for Student Details */}
                    <tr className="bg-[#0f3460] text-white text-[10px] font-bold text-center">
                      <th className="p-1 border border-[#94a3b8]" style={{ width: '3%' }}>
                        S. No.
                      </th>
                      <th className="p-1 border border-[#94a3b8]" style={{ width: '13%' }}>
                        Student Name
                      </th>
                      <th className="p-1 border border-[#94a3b8]" style={{ width: '11%' }}>
                        Roll No.
                      </th>
                      <th className="p-1 border border-[#94a3b8]" style={{ width: '4.5%' }}>
                        Semester
                      </th>
                      <th className="p-1 border border-[#94a3b8]" style={{ width: '6%' }}>
                        Signature
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageTeams.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-8 text-center text-slate-400 font-semibold text-xs border border-[#cbd5e1]"
                        >
                          No project entries found for current filter.
                        </td>
                      </tr>
                    ) : (
                      pageTeams.map((team, tIdx) => {
                        const studentCount = team.students.length || 1;
                        // Alternate row styling per team: ivory tint and ice-blue tint
                        const teamBg = tIdx % 2 === 0 ? '#fffdf7' : '#f0f7ff';

                        return team.students.map((st, sIdx) => {
                          const isFirstStudent = sIdx === 0;

                          return (
                            <tr
                              key={`${team.submissionId}_${team.teamNumber}_${st.registrationNo || sIdx}`}
                              style={{ backgroundColor: teamBg }}
                              className="text-slate-900 border-b border-[#cbd5e1]"
                            >
                              {/* RENDER TEAM DETAILS (ROW-SPANNED) ON FIRST STUDENT ROW */}
                              {isFirstStudent && (
                                <>
                                  {/* Sr. No. */}
                                  <td
                                    rowSpan={studentCount}
                                    className="p-2 text-center font-black text-slate-800 text-[12px] border border-[#cbd5e1] align-middle"
                                  >
                                    {team.globalSrNo}
                                  </td>

                                  {/* Institution Name */}
                                  <td
                                    rowSpan={studentCount}
                                    className="p-2 text-center font-black text-slate-900 text-[11px] leading-snug border border-[#cbd5e1] align-middle"
                                  >
                                    <div className="font-extrabold">{team.instituteName}</div>
                                  </td>

                                  {/* Faculty Mentor */}
                                  <td
                                    rowSpan={studentCount}
                                    className="p-2 text-center border border-[#cbd5e1] align-middle text-[11px]"
                                  >
                                    <div className="font-bold text-slate-900 leading-tight">
                                      {team.mentorName}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-mono mt-0.5 font-semibold">
                                      ({team.mentorContact})
                                    </div>
                                  </td>

                                  {/* Project Title */}
                                  <td
                                    rowSpan={studentCount}
                                    className="p-2 text-center border border-[#cbd5e1] align-middle text-[11px]"
                                  >
                                    <div className="font-bold text-slate-900 leading-snug">
                                      {team.projectTitle}
                                    </div>
                                  </td>

                                  {/* Theme Domain Code + Name */}
                                  <td
                                    rowSpan={studentCount}
                                    className="p-2 text-center border border-[#cbd5e1] align-middle text-[10px]"
                                  >
                                    <span className="inline-block px-2.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs mb-1 text-[10px]">
                                      {team.theme.code}
                                    </span>
                                    <div className="font-bold text-slate-800 leading-tight">
                                      {team.theme.name}
                                    </div>
                                  </td>
                                </>
                              )}

                              {/* STUDENT DETAILS (INDIVIDUAL ROW) */}
                              {/* S. No. */}
                              <td className="p-1 text-center font-semibold text-slate-700 text-[10px] border border-[#cbd5e1] align-middle">
                                {st.studentOrder}
                              </td>

                              {/* Student Name */}
                              <td className="p-1 text-left border border-[#cbd5e1] align-middle">
                                <span className="font-extrabold text-slate-900 text-[10.5px] block leading-tight">
                                  {st.studentName}
                                </span>
                              </td>

                              {/* Roll No */}
                              <td className="p-1 text-center font-mono font-bold text-slate-800 text-[10px] border border-[#cbd5e1] align-middle whitespace-nowrap overflow-hidden">
                                {st.registrationNo}
                              </td>

                              {/* Semester */}
                              <td className="p-1 text-center font-semibold text-slate-800 text-[10px] border border-[#cbd5e1] align-middle whitespace-nowrap">
                                {st.semester}
                              </td>

                              {/* Signature Blank Box */}
                              <td
                                className="p-1 border border-[#cbd5e1] align-middle bg-white/70"
                                style={{ minHeight: '38px', height: '38px' }}
                              >
                                <div className="w-full h-full min-h-[34px]"></div>
                              </td>
                            </tr>
                          );
                        });
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* FOOTER & OFFICIAL SIGN-OFF SECTION */}
              <div className="mt-4 pt-3 border-t-2 border-[#0e3868]/40">
                <div className="flex items-end justify-between text-xs text-slate-700 px-2 pb-2">
                  {/* Left Sign */}
                  <div className="text-center w-60">
                    <div className="h-10 border-b border-dashed border-slate-400"></div>
                    <span className="font-bold text-[11px] text-slate-900 block mt-1">
                      Faculty Mentor Signature
                    </span>
                    <span className="text-[9.5px] text-slate-500 block">
                      (Accompanying Official / Mentor)
                    </span>
                  </div>

                  {/* Center Sign */}
                  <div className="text-center w-60">
                    <div className="h-10 border-b border-dashed border-slate-400"></div>
                    <span className="font-bold text-[11px] text-slate-900 block mt-1">
                      Jury / Evaluator Signature
                    </span>
                    <span className="text-[9.5px] text-slate-500 block">
                      (Competition Evaluation Committee)
                    </span>
                  </div>

                  {/* Right Sign */}
                  <div className="text-center w-64">
                    <div className="h-10 border-b border-dashed border-slate-400"></div>
                    <span className="font-bold text-[11px] text-slate-900 block mt-1">
                      Cluster Coordinator / Principal
                    </span>
                    <span className="text-[9.5px] text-slate-500 block">
                      Government Polytechnic College, Bathinda
                    </span>
                  </div>
                </div>

                {/* Sub-footer line with page numbers */}
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500 px-1">
                  <span>
                    <strong>{EVENT_DETAILS.eventName}</strong> &bull; {EVENT_DETAILS.cluster} &bull; Host: {EVENT_DETAILS.hostInstitute} &bull; Date: {EVENT_DETAILS.eventDate}
                  </span>
                  <span>
                    Page <strong>{pageIdx + 1}</strong> of <strong>{pages.length}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
