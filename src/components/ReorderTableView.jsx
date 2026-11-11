import React, { useState, useEffect, useMemo } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  FileText,
  Printer,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  Building2,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  Users,
  Award,
  Hash,
  ArrowLeft,
  Pencil,
  Database,
  Loader2
} from 'lucide-react';
import {
  formatAttendanceData,
  saveCustomTeamOrder,
  loadCustomTeamOrder,
  clearCustomTeamOrder,
  moveTeamInList,
  exportAttendanceToExcel,
  saveTeamOrderToDatabase,
  EVENT_DETAILS
} from '../lib/attendanceUtils';

export const ReorderTableView = ({
  submissions = [],
  authToken = '',
  onOpenAttendance = null,
  onBack = null,
  onEditSubmission = null,
  onSubmissionsUpdate = null
}) => {
  const [customKeys, setCustomKeys] = useState(() => loadCustomTeamOrder());
  const [orderedTeams, setOrderedTeams] = useState(() => {
    return formatAttendanceData(submissions, 'custom', loadCustomTeamOrder());
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [lastActionMessage, setLastActionMessage] = useState('');
  const [editingRankKey, setEditingRankKey] = useState(null);
  const [tempRankValue, setTempRankValue] = useState('');
  const [isSavingToDb, setIsSavingToDb] = useState(false);

  // Update when submissions load or change
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const formatted = formatAttendanceData(submissions, 'custom', customKeys);
      setOrderedTeams(formatted);
    }
  }, [submissions]);

  // Flash message timeout
  useEffect(() => {
    if (lastActionMessage) {
      const timer = setTimeout(() => setLastActionMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastActionMessage]);

  // Save changes to state, localStorage, and Supabase database
  const commitOrder = async (newTeams, actionDescription = 'Order updated') => {
    const resequenced = newTeams.map((t, idx) => ({
      ...t,
      globalSrNo: idx + 1,
      sequenceOrder: idx + 1,
      teamCode: `TEAM ${String(idx + 1).padStart(2, '0')}`
    }));

    const keys = resequenced.map((t) => t.teamKey);
    setCustomKeys(keys);
    saveCustomTeamOrder(keys);
    setOrderedTeams(resequenced);
    setLastActionMessage(`${actionDescription} • Saving to database...`);

    setIsSavingToDb(true);
    try {
      const res = await saveTeamOrderToDatabase(resequenced, authToken);
      if (res?.success) {
        setLastActionMessage(
          `${actionDescription} • Saved to Database (TEAM 01 - TEAM ${String(resequenced.length).padStart(2, '0')})`
        );
        if (onSubmissionsUpdate) {
          onSubmissionsUpdate(resequenced);
        }
      } else {
        setLastActionMessage(
          `${actionDescription} • Saved locally (DB: ${res?.message || 'offline'})`
        );
      }
    } catch (err) {
      setLastActionMessage(`${actionDescription} • Saved locally`);
    } finally {
      setIsSavingToDb(false);
    }
  };

  // Move a team from one position to another
  const handleMove = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= orderedTeams.length) return;
    const teamTitle = orderedTeams[fromIdx]?.projectTitle || 'Project';
    const updated = moveTeamInList(orderedTeams, fromIdx, toIdx);
    commitOrder(updated, `Moved "${teamTitle.slice(0, 24)}..." to position #${toIdx + 1}`);
  };

  // Move to Top
  const handleMoveToTop = (index) => {
    if (index === 0) return;
    const teamTitle = orderedTeams[index]?.projectTitle || 'Project';
    const updated = moveTeamInList(orderedTeams, index, 0);
    commitOrder(updated, `Moved "${teamTitle.slice(0, 24)}..." to top (#1)`);
  };

  // Move to Bottom
  const handleMoveToBottom = (index) => {
    if (index === orderedTeams.length - 1) return;
    const teamTitle = orderedTeams[index]?.projectTitle || 'Project';
    const updated = moveTeamInList(orderedTeams, index, orderedTeams.length - 1);
    commitOrder(updated, `Moved "${teamTitle.slice(0, 24)}..." to bottom (#${orderedTeams.length})`);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const teamTitle = orderedTeams[draggedIndex]?.projectTitle || 'Project';
    const updated = moveTeamInList(orderedTeams, draggedIndex, dropIndex);
    commitOrder(updated, `Dragged "${teamTitle.slice(0, 24)}..." to position #${dropIndex + 1}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Manual rank edit
  const startEditingRank = (team) => {
    setEditingRankKey(team.teamKey);
    setTempRankValue(team.globalSrNo.toString());
  };

  const submitRankEdit = (fromIdx) => {
    const targetRank = parseInt(tempRankValue, 10);
    setEditingRankKey(null);
    if (isNaN(targetRank) || targetRank < 1 || targetRank > orderedTeams.length) {
      return;
    }
    const toIdx = targetRank - 1;
    if (fromIdx !== toIdx) {
      handleMove(fromIdx, toIdx);
    }
  };

  // Preset Sorts
  const applyPresetSort = (sortType, label) => {
    const sorted = formatAttendanceData(submissions, sortType, []);
    commitOrder(sorted, `Applied preset sort: ${label}`);
  };

  const resetOrderToDefault = () => {
    clearCustomTeamOrder();
    setCustomKeys([]);
    const defaultList = formatAttendanceData(submissions, 'institute', []);
    commitOrder(defaultList, 'Reset order to default (Alphabetical by Institute)');
  };

  // Filtered view
  const displayTeams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orderedTeams.filter((t) => {
      const matchesTheme = selectedTheme === 'All' || t.theme.name.includes(selectedTheme);
      const matchesSearch =
        !q ||
        t.instituteName.toLowerCase().includes(q) ||
        t.projectTitle.toLowerCase().includes(q) ||
        t.mentorName.toLowerCase().includes(q) ||
        t.submissionCode.toLowerCase().includes(q) ||
        (t.teamCode && t.teamCode.toLowerCase().includes(q)) ||
        t.students.some(
          (s) =>
            s.studentName.toLowerCase().includes(q) ||
            s.registrationNo.toLowerCase().includes(q)
        );
      return matchesTheme && matchesSearch;
    });
  }, [orderedTeams, searchQuery, selectedTheme]);

  // Unique themes list for filter
  const themesList = useMemo(() => {
    const set = new Set(orderedTeams.map((t) => t.theme.name));
    return Array.from(set).sort();
  }, [orderedTeams]);

  // Export reordered excel
  const handleExportExcel = () => {
    exportAttendanceToExcel(
      orderedTeams,
      `Bathinda_Cluster_Reordered_Attendance_${Date.now()}.xlsx`
    );
  };

  // Export reordered CSV
  const handleExportCsv = () => {
    const headers = [
      'Sr. No.',
      'Acknowledgement Code',
      'Name of Institution',
      'Team Number',
      'Project Title',
      'Thematic Domain Code',
      'Thematic Domain',
      'Faculty Mentor',
      'Mentor Contact',
      'Enrolled Students Count',
      'Students Details'
    ];

    const rows = orderedTeams.map((t) => {
      const studentDetails = t.students
        .map((s) => `${s.studentOrder}. ${s.studentName} (${s.registrationNo}, ${s.semester})`)
        .join('; ');

      return [
        t.globalSrNo,
        t.submissionCode,
        `"${t.instituteName.replace(/"/g, '""')}"`,
        `Team ${t.teamNumber}`,
        `"${t.projectTitle.replace(/"/g, '""')}"`,
        t.theme.code,
        `"${t.theme.name.replace(/"/g, '""')}"`,
        `"${t.mentorName.replace(/"/g, '""')}"`,
        `"${t.mentorContact.replace(/"/g, '""')}"`,
        t.students.length,
        `"${studentDetails.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(',')).join('\n')];
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bathinda_Cluster_Reordered_Projects_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalStudents = orderedTeams.reduce((acc, t) => acc + t.students.length, 0);

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER & WORKSPACE TOOLBAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
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
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  Custom Sequence Workspace
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {EVENT_DETAILS.cluster} &bull; {EVENT_DETAILS.eventDate}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Reorderable Project Schedule &amp; Table View
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Open Attendance Sheet with this exact order */}
            {onOpenAttendance && (
              <button
                type="button"
                onClick={onOpenAttendance}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Attendance Sheet (PDF)</span>
              </button>
            )}

            {/* Export Reordered Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Excel</span>
            </button>

            {/* Export Reordered CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Save Order to Database */}
            <button
              type="button"
              disabled={isSavingToDb}
              onClick={() => commitOrder(orderedTeams, 'Manual save')}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Save current sequence & team codes to database"
            >
              {isSavingToDb ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
              ) : (
                <Database className="w-4 h-4 text-blue-200" />
              )}
              <span>{isSavingToDb ? 'Saving...' : 'Save to DB'}</span>
            </button>
          </div>
        </div>

        {/* Action Message Flash Banner */}
        {lastActionMessage && (
          <div className="mt-3 py-2 px-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            {isSavingToDb ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            )}
            <span>{lastActionMessage}</span>
          </div>
        )}

        {/* 2. PRESET SORTING SHORTCUTS */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Quick Presets:
            </span>

            {/* Host First */}
            <button
              type="button"
              onClick={() => applyPresetSort('host_first', 'Host College First (GPC Bathinda)')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Host College First (GPC Bathinda)</span>
            </button>

            {/* Group by Theme */}
            <button
              type="button"
              onClick={() => applyPresetSort('theme', 'Group by Theme Domain (D-01 to D-08)')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>Group by Theme Domain</span>
            </button>

            {/* Alphabetical */}
            <button
              type="button"
              onClick={() => applyPresetSort('institute', 'Alphabetical (A-Z)')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-[11px] transition cursor-pointer"
            >
              Alphabetical (A to Z)
            </button>

            {/* Submission Order */}
            <button
              type="button"
              onClick={() => applyPresetSort('created_at', 'Registration Date Order')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-[11px] transition cursor-pointer"
            >
              Registration Date
            </button>

            {/* Reset Order */}
            <button
              type="button"
              onClick={resetOrderToDefault}
              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-medium text-[11px]">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-semibold">
              <strong>{orderedTeams.length}</strong> Total Projects &bull; <strong>{totalStudents}</strong> Students
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Auto-saved to DB &amp; Browser
            </span>
          </div>
        </div>

        {/* 3. SEARCH & THEME FILTER */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by institute, project, mentor, roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Theme:</span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
            >
              <option value="All">All Thematic Domains ({themesList.length})</option>
              {themesList.map((th) => (
                <option key={th} value={th}>
                  {th}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. REORDERABLE TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0e3868] text-white font-bold border-b border-blue-950">
              <tr>
                <th className="p-3 w-14 text-center">Handle</th>
                <th className="p-3 w-28 text-center">Reorder</th>
                <th className="p-3 w-16 text-center">Seq #</th>
                <th className="p-3 w-28 text-center">Team Code</th>
                <th className="p-3 w-24">Ack Code</th>
                <th className="p-3">Institution Name</th>
                <th className="p-3 w-24 text-center">Team #</th>
                <th className="p-3">Project Title</th>
                <th className="p-3">Thematic Domain</th>
                <th className="p-3">Faculty Mentor</th>
                <th className="p-3">Enrolled Students</th>
                <th className="p-3 w-16 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800">
              {displayTeams.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400 font-semibold text-sm">
                    No project entries found matching your search.
                  </td>
                </tr>
              ) : (
                displayTeams.map((team, idx) => {
                  const globalIdx = orderedTeams.findIndex((t) => t.teamKey === team.teamKey);
                  const isFirst = globalIdx === 0;
                  const isLast = globalIdx === orderedTeams.length - 1;
                  const isBeingDragged = draggedIndex === globalIdx;
                  const isDragOver = dragOverIndex === globalIdx;

                  return (
                    <tr
                      key={team.teamKey}
                      draggable
                      onDragStart={(e) => handleDragStart(e, globalIdx)}
                      onDragOver={(e) => handleDragOver(e, globalIdx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, globalIdx)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors select-none ${
                        isBeingDragged
                          ? 'opacity-40 bg-indigo-50 border-2 border-dashed border-indigo-500'
                          : isDragOver
                          ? 'bg-blue-100 border-t-2 border-b-2 border-blue-600'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-slate-50/70 hover:bg-slate-100/70'
                      }`}
                    >
                      {/* Drag Grip Handle */}
                      <td className="p-2.5 text-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600">
                        <div className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-200 transition">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </td>

                      {/* Step Reorder Buttons & Rank Input */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Move to Top */}
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveToTop(globalIdx)}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move to top (#1)"
                          >
                            <ChevronsUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMove(globalIdx, globalIdx - 1)}
                            className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move up one position"
                          >
                            <ArrowUp className="w-3.5 h-3.5 font-bold" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMove(globalIdx, globalIdx + 1)}
                            className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move down one position"
                          >
                            <ArrowDown className="w-3.5 h-3.5 font-bold" />
                          </button>

                          {/* Move to Bottom */}
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveToBottom(globalIdx)}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move to bottom"
                          >
                            <ChevronsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Editable Sequence / Sr. No. */}
                      <td className="p-2.5 text-center">
                        {editingRankKey === team.teamKey ? (
                          <input
                            type="number"
                            min={1}
                            max={orderedTeams.length}
                            value={tempRankValue}
                            autoFocus
                            onChange={(e) => setTempRankValue(e.target.value)}
                            onBlur={() => submitRankEdit(globalIdx)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRankEdit(globalIdx);
                              if (e.key === 'Escape') setEditingRankKey(null);
                            }}
                            className="w-12 text-center py-0.5 px-1 rounded border-2 border-indigo-500 bg-white font-black text-xs outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingRank(team)}
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-black text-xs flex items-center justify-center hover:bg-indigo-100 hover:border-indigo-300 transition cursor-pointer mx-auto shadow-2xs"
                            title="Click to change order sequence number"
                          >
                            {team.globalSrNo}
                          </button>
                        )}
                      </td>

                      {/* Assigned Team Code (TEAM 01, TEAM 02...) */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0e3868] text-white font-mono font-black text-xs tracking-wider shadow-2xs border border-blue-900 inline-block">
                          {team.teamCode || `TEAM ${String(team.globalSrNo).padStart(2, '0')}`}
                        </span>
                      </td>

                      {/* Ack Code */}
                      <td className="p-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {team.submissionCode}
                      </td>

                      {/* Institute Name */}
                      <td className="p-2.5 font-extrabold text-slate-900 max-w-[200px] uppercase">
                        <div>{team.instituteName}</div>
                        <div className="text-[10.5px] text-slate-500 font-normal mt-0.5 normal-case">
                          Principal: <span className="uppercase">{team.principalName}</span> ({team.principalContact})
                        </div>
                      </td>

                      {/* Team Number */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black ${
                            team.teamNumber === 1
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          Team {team.teamNumber}
                        </span>
                      </td>

                      {/* Project Title */}
                      <td className="p-2.5 max-w-[240px]">
                        <span className="font-extrabold text-slate-900 block leading-snug uppercase">
                          {team.projectTitle}
                        </span>
                      </td>

                      {/* Theme */}
                      <td className="p-2.5 max-w-[190px]">
                        <span className="inline-block px-2 py-0.5 rounded-full font-black text-[10px] bg-blue-100 text-blue-800 border border-blue-200 mb-0.5">
                          {team.theme.code}
                        </span>
                        <div className="text-[10.5px] font-semibold text-slate-700 leading-tight uppercase">
                          {team.theme.name}
                        </div>
                      </td>

                      {/* Faculty Mentor */}
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 uppercase">{team.mentorName}</div>
                        <div className="text-[10.5px] font-mono text-slate-500 font-semibold">
                          {team.mentorContact}
                        </div>
                      </td>

                      {/* Students List */}
                      <td className="p-2.5 min-w-[230px]">
                        <div className="space-y-1">
                          {team.students.map((st, sIdx) => (
                            <div
                              key={sIdx}
                              className="text-[10.5px] bg-white p-1 rounded border border-slate-200 flex items-center justify-between gap-1 shadow-2xs"
                            >
                              <span className="font-bold text-slate-800 truncate uppercase">
                                {st.studentOrder}. {st.studentName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 uppercase">
                                {st.registrationNo} &bull; {st.semester}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Action / Edit */}
                      <td className="p-2.5 text-center">
                        {onEditSubmission && (
                          <button
                            type="button"
                            onClick={() => onEditSubmission(team.submissionId)}
                            className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                            title="Edit this submission entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
