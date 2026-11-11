import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckSquare,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Calculator,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Save,
  Trophy,
  User,
  Building2,
  Users
} from 'lucide-react';
import {
  EVALUATION_PARAMETERS,
  RUBRICS_FLAT_LIST,
  TOTAL_RUBRIC_MAX_MARKS,
  generateVectorRubricsGuidePdf,
  generateVectorTeamScoreSheetPdf,
  generateBatchAllTeamsScoreSheetsPdf,
  generateConsolidatedJuryMatrixPdf,
  generateAllThreeMasterSheetsPdf,
  exportRubricsToExcel
} from '../lib/rubricsData';
import { EVENT_DETAILS } from '../lib/attendanceUtils';
import {
  LOGO_PUNJAB_GOVT,
  LOGO_TECH_ED,
  LOGO_GPC_BATHINDA
} from '../lib/logos';

export const JuryRubricsSection = ({
  judges = [],
  judgesMap = new Map(),
  formattedTeams = [],
  onPrint = null
}) => {
  const [subView, setSubView] = useState('master_matrix'); // 'master_matrix' | 'descriptors' | 'sheet_preview' | 'live_scoring'
  const [sheetVariant, setSheetVariant] = useState('all_seven'); // 'all_seven' | 'core_only' | 'individual'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParamFilter, setSelectedParamFilter] = useState('All');
  const [selectedTeamCode, setSelectedTeamCode] = useState(() => {
    return formattedTeams.length > 0 ? formattedTeams[0].submissionCode : 'blank';
  });
  const [selectedJudgeSlot, setSelectedJudgeSlot] = useState('chairperson_1');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [showElaboratedGuide, setShowElaboratedGuide] = useState(true);

  // Local storage for live evaluations: { [teamCode]: { [judgeSlot]: { scores: {}, remarks: '', updatedAt: '' } } }
  const [evaluations, setEvaluations] = useState(() => {
    try {
      const stored = localStorage.getItem('polytechnic_jury_rubric_evaluations');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Filtered rubrics for descriptors table
  const filteredRubrics = useMemo(() => {
    return RUBRICS_FLAT_LIST.filter((sp) => {
      const matchesParam =
        selectedParamFilter === 'All' || sp.parameterNumber === Number(selectedParamFilter);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sp.title.toLowerCase().includes(q) ||
        sp.parameterTitle.toLowerCase().includes(q) ||
        sp.descriptors[0].toLowerCase().includes(q) ||
        sp.descriptors[1].toLowerCase().includes(q) ||
        sp.descriptors[2].toLowerCase().includes(q) ||
        (sp.descriptors[3] && sp.descriptors[3].toLowerCase().includes(q));
      return matchesParam && matchesSearch;
    });
  }, [searchQuery, selectedParamFilter]);

  // Selected team data object for sheet preview
  const currentPreviewTeam = useMemo(() => {
    if (selectedTeamCode === 'blank') return null;
    return formattedTeams.find((t) => t.submissionCode === selectedTeamCode) || null;
  }, [selectedTeamCode, formattedTeams]);

  // Current judge object
  const currentJudge = useMemo(() => {
    return judgesMap.get(selectedJudgeSlot) || null;
  }, [selectedJudgeSlot, judgesMap]);

  // Current live evaluation scores for selected team and judge
  const currentEvaluationScores = useMemo(() => {
    if (!selectedTeamCode || selectedTeamCode === 'blank') return {};
    return evaluations[selectedTeamCode]?.[selectedJudgeSlot]?.scores || {};
  }, [evaluations, selectedTeamCode, selectedJudgeSlot]);

  // Calculate live totals
  const liveTotals = useMemo(() => {
    let total = 0;
    const paramScores = { 1: 0, 2: 0, 3: 0, 4: 0 };

    RUBRICS_FLAT_LIST.forEach((sp) => {
      const score = currentEvaluationScores[sp.id];
      if (typeof score === 'number') {
        total += score;
        paramScores[sp.parameterNumber] += score;
      }
    });

    const percentage = ((total / TOTAL_RUBRIC_MAX_MARKS) * 100).toFixed(1);
    const answeredCount = Object.keys(currentEvaluationScores).length;

    return { total, paramScores, percentage, answeredCount };
  }, [currentEvaluationScores]);

  // Handle score change in live scoring
  const handleScoreChange = (subCriteriaId, score) => {
    if (!selectedTeamCode || selectedTeamCode === 'blank') return;

    setEvaluations((prev) => {
      const teamEvals = prev[selectedTeamCode] || {};
      const judgeEval = teamEvals[selectedJudgeSlot] || { scores: {}, remarks: '' };
      const updatedScores = {
        ...judgeEval.scores,
        [subCriteriaId]: score
      };

      const next = {
        ...prev,
        [selectedTeamCode]: {
          ...teamEvals,
          [selectedJudgeSlot]: {
            ...judgeEval,
            scores: updatedScores,
            updatedAt: new Date().toISOString()
          }
        }
      };

      try {
        localStorage.setItem('polytechnic_jury_rubric_evaluations', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save evaluations:', err);
      }

      return next;
    });
  };

  // Reset scores for current team & judge
  const handleResetCurrentEvaluation = () => {
    if (!confirm('Are you sure you want to reset scores for this team and judge?')) return;
    setEvaluations((prev) => {
      const teamEvals = { ...(prev[selectedTeamCode] || {}) };
      delete teamEvals[selectedJudgeSlot];
      const next = { ...prev, [selectedTeamCode]: teamEvals };
      localStorage.setItem('polytechnic_jury_rubric_evaluations', JSON.stringify(next));
      return next;
    });
  };

  // PDF Handlers
  const handleDownloadBlankSheet = async () => {
    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      generateVectorTeamScoreSheetPdf(null);
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCurrentSheet = async () => {
    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      generateVectorTeamScoreSheetPdf(currentPreviewTeam, currentJudge?.name || '');
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadAllSheets = async () => {
    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 80));
      generateBatchAllTeamsScoreSheetsPdf(formattedTeams);
    } catch (err) {
      alert('Error generating batch PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadRubricsGuide = async () => {
    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      generateVectorRubricsGuidePdf();
    } catch (err) {
      alert('Error generating Rubrics Guide: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadMasterMatrix = async (variant = sheetVariant) => {
    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      generateConsolidatedJuryMatrixPdf(formattedTeams, variant, null, judgesMap);
    } catch (err) {
      alert('Error generating Master Matrix: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadAllThreeSheets = async () => {
    setIsExportingPdf(true);
    try {
      await new Promise((r) => setTimeout(r, 80));
      generateAllThreeMasterSheetsPdf(formattedTeams, null, judgesMap);
    } catch (err) {
      alert('Error generating All 3 Master Sheets: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. TOP CONTROL TOOLBAR (Hidden in Print) */}
      <div className="w-full max-w-[1200px] mb-4 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs space-y-4 no-print">
        {/* Row 1: Title, Badges & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shadow-2xs">
              <CheckSquare className="w-6 h-6 text-[#0e3868]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Official Evaluation Rubrics &amp; Score Sheets
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-900 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  50 Marks Total
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                4 Core Evaluation Parameters &bull; 20 Sub-Criteria &bull; Scale: 0 to 3 Marks &bull; Punjab Polytechnic Innovation Challenge
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Blank Score Sheet PDF */}
            <button
              type="button"
              onClick={handleDownloadBlankSheet}
              disabled={isExportingPdf}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Download Blank Physical Score Sheet Template (Landscape A4)"
            >
              <Download className="w-3.5 h-3.5 text-blue-300" />
              <span>Blank Sheet (PDF)</span>
            </button>

            {/* Master Scoring Matrix PDF */}
            <button
              type="button"
              onClick={() => handleDownloadMasterMatrix(sheetVariant)}
              disabled={isExportingPdf || formattedTeams.length === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 active:scale-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Download Master Score Sheet (Active Variant with 20 criteria + full criteria elaborated at end)"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Master Score Sheet (PDF)</span>
            </button>

            {/* All 3 Master Sheets in 1 Combined PDF */}
            <button
              type="button"
              onClick={handleDownloadAllThreeSheets}
              disabled={isExportingPdf || formattedTeams.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-950 hover:from-purple-950 hover:to-slate-900 active:scale-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Download all 3 Master Sheets in 1 Package: Sheet 1 (All 7 Jury), Sheet 2 (Core 5), Sheet 3 (Individual Evaluator) + Rubric Guide"
            >
              <Download className="w-3.5 h-3.5 text-purple-300" />
              <span>All 3 Sheets (5-Page PDF)</span>
            </button>

            {/* All Teams Booklet PDF */}
            <button
              type="button"
              onClick={handleDownloadAllSheets}
              disabled={isExportingPdf || formattedTeams.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Download individual score sheets (1 page per project)"
            >
              <Download className="w-3.5 h-3.5 text-blue-300" />
              <span>Individual Sheets Booklet</span>
            </button>

            {/* Blank Sheet Template */}
            <button
              type="button"
              onClick={handleDownloadBlankSheet}
              disabled={isExportingPdf}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Download Blank Physical Score Sheet Template (Landscape A4)"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Blank Template</span>
            </button>

            {/* Rubrics Reference Guide PDF */}
            <button
              type="button"
              onClick={handleDownloadRubricsGuide}
              disabled={isExportingPdf}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Download Official 2-Page Rubrics Descriptors Guide (Landscape A4)"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Rubrics Guide</span>
            </button>

            {/* Excel Export */}
            <button
              type="button"
              onClick={() => exportRubricsToExcel(formattedTeams)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Export Master Matrix & 20 Criteria to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Row 2: Sub-View Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSubView('master_matrix')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'master_matrix'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Master Scoring Matrix (Single Table)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('descriptors')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'descriptors'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rubrics &amp; Descriptors (20)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('sheet_preview')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'sheet_preview'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Project Score Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('live_scoring')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'live_scoring'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-300" />
              <span>Live Evaluation</span>
            </button>
          </div>

          {/* Quick Mark Allocation Pills */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              P1: Problem (15)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              P2: Punjab Context (15)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              P3: Innovation (10)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
              P4: Prototype Plan (10)
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* SUB-VIEW 0: MASTER JURY SCORING MATRIX (SINGLE TABLE FOR ALL PROJECTS)        */}
      {/* ============================================================================== */}
      {subView === 'master_matrix' && (
        <div className="w-full max-w-[1240px] space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-2xs">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <span>Master Jury Scoring Matrix &bull; All 17 Projects in Single Table</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
                      20 Sub-Criteria
                    </span>
                  </h3>
                  <p className="text-slate-500 text-[11px] font-medium">
                    All 20 Sub-Criteria numbered 1.1 through 4.5 in a single unified grid &bull; Max 50 Marks &bull; 3 Official Sheet Variants
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadMasterMatrix(sheetVariant)}
                  disabled={isExportingPdf || formattedTeams.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-[#0e3868] hover:bg-blue-950 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Download Active Sheet Variant (PDF with 20 criteria + full criteria elaborated at end)"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Download {sheetVariant === 'all_seven' ? 'Sheet 1 (7 Jury)' : sheetVariant === 'core_only' ? 'Sheet 2 (Core 5)' : 'Sheet 3 (Individual)'} (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAllThreeSheets}
                  disabled={isExportingPdf || formattedTeams.length === 0}
                  className="px-3 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Download all 3 Master Sheets in 1 Combined 5-Page PDF"
                >
                  <Download className="w-3.5 h-3.5 text-purple-300" />
                  <span>All 3 Sheets (5-Page PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportRubricsToExcel(formattedTeams)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Export all sheet variants to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Excel (4 Tabs)</span>
                </button>
              </div>
            </div>

            {/* Sheet Variant Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">
                  Select Layout / Sheet Variant:
                </span>
                <button
                  type="button"
                  onClick={() => setSheetVariant('all_seven')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    sheetVariant === 'all_seven'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>1. All 7 Jury Members</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${sheetVariant === 'all_seven' ? 'bg-blue-800 text-blue-200' : 'bg-slate-200 text-slate-600'}`}>
                    Full Board
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSheetVariant('core_only')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    sheetVariant === 'core_only'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>2. Core Board Only</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${sheetVariant === 'core_only' ? 'bg-blue-800 text-blue-200' : 'bg-slate-200 text-slate-600'}`}>
                    5 Members
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSheetVariant('individual')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    sheetVariant === 'individual'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>3. Individual Evaluator Score Sheet</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${sheetVariant === 'individual' ? 'bg-blue-800 text-blue-200' : 'bg-slate-200 text-slate-600'}`}>
                    Evaluator Sign
                  </span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                {sheetVariant === 'all_seven'
                  ? 'Showing consensus sheet with all 7 signature blocks (Chairperson + 4 Core + 2 Reserve)'
                  : sheetVariant === 'core_only'
                  ? 'Showing official decision matrix with 5 Core Jury Member signature blocks'
                  : 'Showing individual scoring matrix with judge name, remarks, and signature certification'}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  {/* Tier 1 Header: Main Parameters */}
                  <tr className="bg-[#0e3868] text-white uppercase text-[10px] font-extrabold tracking-wider border-b border-blue-950 text-center">
                    <th rowSpan={2} className="py-2.5 px-2 w-10 border-r border-blue-900 align-middle">
                      Sr.
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 w-24 border-r border-blue-900 align-middle">
                      Team Code
                    </th>
                    {sheetVariant !== 'individual' && (
                      <th rowSpan={2} className="py-2.5 px-3 min-w-[160px] border-r border-blue-900 align-middle text-left">
                        Name of Institution
                      </th>
                    )}
                    <th rowSpan={2} className={`py-2.5 px-3 ${sheetVariant === 'individual' ? 'min-w-[260px]' : 'min-w-[180px]'} border-r border-blue-900 align-middle text-left`}>
                      Project Title of Innovation
                    </th>
                    {sheetVariant !== 'individual' && (
                      <th rowSpan={2} className="py-2.5 px-3 min-w-[180px] border-r border-blue-900 align-middle text-left">
                        Team Details (Mentor &amp; Students)
                      </th>
                    )}
                    <th colSpan={5} className="py-2 px-1 border-r border-blue-900 bg-[#0e3868]">
                      1. Problem Understanding (15M)
                    </th>
                    <th colSpan={5} className="py-2 px-1 border-r border-blue-900 bg-[#0b2d54]">
                      2. Punjab Context &amp; Fit (15M)
                    </th>
                    <th colSpan={5} className="py-2 px-1 border-r border-blue-900 bg-[#0e3868]">
                      3. Innovation (10M)
                    </th>
                    <th colSpan={5} className="py-2 px-1 border-r border-blue-900 bg-[#0b2d54]">
                      4. Prototype Plan (10M)
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 w-16 border-r border-blue-900 bg-[#081e36] align-middle">
                      Total
                      <br />
                      <span className="text-[8px] font-normal lowercase opacity-80">(50M)</span>
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 w-16 align-middle text-center">
                      Action
                    </th>
                  </tr>

                  {/* Tier 2 Header: 20 Sub-Criteria Numbered 1.1 to 4.5 */}
                  <tr className="bg-[#0b2d54] text-white text-[9px] font-bold text-center border-b border-blue-950">
                    {/* 1.1 to 1.5 (Max 3) */}
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="1.1 Clarity of problem definition (Max 3)">1.1<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="1.2 Identification of root causes (Max 3)">1.2<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="1.3 Understanding affected stakeholders (Max 3)">1.3<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="1.4 Existing solutions and gaps (Max 3)">1.4<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="1.5 Evidence and validation (Max 3)">1.5<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>

                    {/* 2.1 to 2.5 (Max 3) */}
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="2.1 Relevance to Punjab needs (Max 3)">2.1<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="2.2 Potential benefits to users (Max 3)">2.2<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="2.3 Suitability to local conditions (Max 3)">2.3<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="2.4 Affordability and accessibility (Max 3)">2.4<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="2.5 Adoption and wider applicability (Max 3)">2.5<br/><span className="text-[7.5px] opacity-75 font-normal">(3)</span></th>

                    {/* 3.1 to 3.5 (Max 2) */}
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="3.1 Originality of proposed idea (Max 2)">3.1<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="3.2 Creative application of tech (Max 2)">3.2<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="3.3 Technical ingenuity & design (Max 2)">3.3<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="3.4 Resource-efficient innovation (Max 2)">3.4<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8" title="3.5 Distinctiveness & value addition (Max 2)">3.5<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>

                    {/* 4.1 to 4.5 (Max 2) */}
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="4.1 Prototype design clarity (Max 2)">4.1<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="4.2 Technical feasibility (Max 2)">4.2<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="4.3 Resources & materials (Max 2)">4.3<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="4.4 Development timeline (Max 2)">4.4<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                    <th className="py-1 px-1 border-r border-blue-900 w-8 bg-[#09223e]" title="4.5 Testing & improvement plan (Max 2)">4.5<br/><span className="text-[7.5px] opacity-75 font-normal">(2)</span></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {formattedTeams.length === 0 ? (
                    <tr>
                      <td colSpan={sheetVariant !== 'individual' ? 28 : 26} className="p-8 text-center text-slate-400 font-semibold">
                        No projects registered yet.
                      </td>
                    </tr>
                  ) : (
                    formattedTeams.map((team, tIdx) => {
                      const teamScores = evaluations[team.submissionCode]?.[selectedJudgeSlot]?.scores || {};
                      let totalScored = 0;
                      let hasScores = false;
                      RUBRICS_FLAT_LIST.forEach((sp) => {
                        const val = teamScores[sp.id];
                        if (val !== undefined && val !== null && val !== '') {
                          totalScored += Number(val);
                          hasScores = true;
                        }
                      });

                      const rowBg = tIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';

                      return (
                        <tr key={team.teamKey || team.submissionCode} className={`${rowBg} hover:bg-blue-50/60 transition`}>
                          {/* Sr. No. */}
                          <td className="py-2.5 px-2 text-center font-bold text-slate-600 border-r border-slate-200">
                            {team.globalSrNo}
                          </td>

                          {/* Team Code */}
                          <td className="py-2.5 px-2 text-center border-r border-slate-200 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-[#0e3868] text-white font-mono font-black text-xs tracking-wider shadow-2xs border border-blue-900 inline-block">
                              {team.teamCode || `TEAM ${String(team.globalSrNo).padStart(2, '0')}`}
                            </span>
                          </td>

                          {/* Name of Institution (Sheet 1 & Sheet 2) */}
                          {sheetVariant !== 'individual' && (
                            <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-800 text-[11px] uppercase leading-snug">
                              {team.instituteName}
                            </td>
                          )}

                          {/* Project Title */}
                          <td className="py-2.5 px-3 border-r border-slate-200 font-extrabold text-slate-900 text-xs uppercase leading-snug">
                            {team.projectTitle}
                          </td>

                          {/* Team Details: Mentor & Students (Sheet 1 & Sheet 2) */}
                          {sheetVariant !== 'individual' && (
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 text-[10.5px] leading-tight">
                              <div className="font-extrabold text-blue-950">
                                Mentor: <span className="font-semibold text-slate-800">{team.mentorName || '-'}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Students: <span className="text-slate-700">{(team.students || []).map((s) => s.studentName).join(', ') || '-'}</span>
                              </div>
                            </td>
                          )}

                          {/* 20 Sub-Criteria Score Cells */}
                          {RUBRICS_FLAT_LIST.map((sp) => {
                            const val = teamScores[sp.id];
                            const isPresent = val !== undefined && val !== null && val !== '';
                            return (
                              <td
                                key={sp.id}
                                className="py-2 px-1 text-center border-r border-slate-200 font-bold text-xs"
                                title={`${sp.title} (Max ${sp.maxMarks} Marks)`}
                              >
                                {isPresent ? (
                                  <span className="inline-block w-6 h-6 rounded-md bg-blue-100 text-blue-900 font-black text-xs leading-6 text-center shadow-2xs">
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-mono text-[11px]">&bull;</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Total Score */}
                          <td className="py-2.5 px-2 text-center border-r border-slate-200 font-black text-xs bg-slate-100/70">
                            {hasScores ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-900 text-white font-mono font-black text-xs shadow-2xs">
                                {totalScored}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">—/50</span>
                            )}
                          </td>

                          {/* Action: Score */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTeamCode(team.submissionCode);
                                setSubView('live_scoring');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-[11px] transition cursor-pointer"
                            >
                              Score
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Endorsement & Signatures Section according to active sheetVariant */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-900" />
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-950">
                  {sheetVariant === 'all_seven'
                    ? 'Official Jury Board Endorsement & Final Ranking Validation (All 7 Members)'
                    : sheetVariant === 'core_only'
                    ? 'Core Evaluation Jury Board Endorsement & Cluster Ranking Validation (5 Core Members)'
                    : 'Individual Evaluator Scoring Declaration & Signature'}
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {sheetVariant === 'all_seven'
                  ? '1 Chairperson + 4 Core Members + 2 Reserve Members'
                  : sheetVariant === 'core_only'
                  ? '1 Chairperson + 4 Core Members'
                  : 'Individual Evaluation Record'}
              </span>
            </div>

            {/* Signature Blocks according to variant */}
            {sheetVariant === 'all_seven' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
                {[
                  { role: 'Chairperson, Jury Board', slotKey: 'chairperson_1' },
                  { role: 'Jury Member 1', slotKey: 'jury_member_1' },
                  { role: 'Jury Member 2', slotKey: 'jury_member_2' },
                  { role: 'Jury Member 3', slotKey: 'jury_member_3' },
                  { role: 'Jury Member 4', slotKey: 'jury_member_4' },
                  { role: 'Reserve Jury Member 1', slotKey: 'reserve_member_1' },
                  { role: 'Reserve Jury Member 2', slotKey: 'reserve_member_2' }
                ].map((sig, sIdx) => {
                  const jName = judgesMap.get(sig.slotKey)?.name;
                  const bracketText = jName ? `(${jName.toUpperCase()})` : '(Name: _________________)';
                  return (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center flex flex-col justify-end min-h-[72px]"
                    >
                      <div className="border-b border-dashed border-slate-400 mb-2 mt-4" />
                      <div className="font-extrabold text-[11px] text-slate-800 leading-tight">
                        {sig.role}
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate" title={bracketText}>
                        {bracketText}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sheetVariant === 'core_only' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
                {[
                  { role: 'Chairperson, Jury Board', slotKey: 'chairperson_1' },
                  { role: 'Jury Member 1', slotKey: 'jury_member_1' },
                  { role: 'Jury Member 2', slotKey: 'jury_member_2' },
                  { role: 'Jury Member 3', slotKey: 'jury_member_3' },
                  { role: 'Jury Member 4', slotKey: 'jury_member_4' }
                ].map((sig, sIdx) => {
                  const jName = judgesMap.get(sig.slotKey)?.name;
                  const bracketText = jName ? `(${jName.toUpperCase()})` : '(Name: _________________)';
                  return (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 text-center flex flex-col justify-end min-h-[76px]"
                    >
                      <div className="border-b border-dashed border-blue-400 mb-2 mt-5" />
                      <div className="font-extrabold text-xs text-blue-950 leading-tight">
                        {sig.role}
                      </div>
                      <div className="text-[10.5px] text-blue-900 font-semibold mt-0.5 truncate" title={bracketText}>
                        {bracketText}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sheetVariant === 'individual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
                  <div className="font-extrabold text-slate-900 text-xs">
                    Evaluator's Overall Observations / Key Remarks:
                  </div>
                  <div className="border-b border-dashed border-slate-300 h-5" />
                  <div className="border-b border-dashed border-slate-300 h-5" />
                  <div className="border-b border-dashed border-slate-300 h-5" />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-2.5">
                  <div className="font-extrabold text-blue-950 text-xs">
                    Evaluator Certification &amp; Signature:
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1">
                    <span className="font-bold">Evaluator Full Name:</span>
                    <span className="border-b border-slate-400 w-48 text-right font-mono text-slate-500">________________________</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-700">
                    <span className="font-bold">Jury Role / Position:</span>
                    <span className="border-b border-slate-400 w-48 text-right font-mono text-slate-500">________________________</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1">
                    <span className="font-bold">Physical Signature &amp; Date:</span>
                    <span className="border-b border-slate-400 w-48 text-right font-mono text-slate-500">________________________</span>
                  </div>
                </div>
              </div>
            )}

            {/* PROMINENT OFFICIAL REFERENCE NOTE BOX */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md bg-amber-400 text-blue-950 font-black text-[10px] tracking-wider uppercase shadow-2xs">
                  Rubric Reference Note
                </span>
                <span className="text-xs font-bold text-slate-100">
                  Complete elaborated criteria descriptors and scoring levels (Scores 0, 1, 2, 3) for all 20 Sub-Parameters (1.1 through 4.5) are provided on Pages 2 &amp; 3 of the exported PDF (and directly in the guide below).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowElaboratedGuide((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 border border-white/20"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>{showElaboratedGuide ? 'Hide Guide Below' : 'View Full Guide Below'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Criteria Elaboration Guide */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowElaboratedGuide((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-800 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <span className="font-extrabold text-sm text-slate-900">
                  All 20 Criteria Elaborated Reference Guide (Descriptors for Score 0, 1, 2, 3)
                </span>
                <span className="text-xs text-slate-500 font-medium ml-2">
                  (Attached at end of PDF)
                </span>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {showElaboratedGuide ? 'Hide Elaboration' : 'Show Full Elaboration'}
              </span>
            </button>

            {showElaboratedGuide && (
              <div className="p-4 border-t border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0e3868] text-white uppercase text-[10px] font-extrabold tracking-wider border-b border-blue-950">
                      <th className="py-2.5 px-2 text-center w-10 border-r border-blue-900">No.</th>
                      <th className="py-2.5 px-3 w-40 border-r border-blue-900">Evaluation Parameter</th>
                      <th className="py-2.5 px-3 w-48 border-r border-blue-900">Sub-parameter</th>
                      <th className="py-2.5 px-2 text-center w-16 border-r border-blue-900 bg-[#0b2d54]">Max Marks</th>
                      <th className="py-2.5 px-3 border-r border-blue-900 bg-[#0b2d54] text-amber-200">Score 0</th>
                      <th className="py-2.5 px-3 border-r border-blue-900 text-blue-200">Score 1</th>
                      <th className="py-2.5 px-3 border-r border-blue-900 text-emerald-200">Score 2</th>
                      <th className="py-2.5 px-3 text-emerald-300">Score 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {RUBRICS_FLAT_LIST.map((sp, idx) => (
                      <tr key={sp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono font-bold text-slate-700">
                          {sp.id}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-[#0e3868] text-[11px]">
                          {sp.parameterShortTitle}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-extrabold text-slate-900 text-[11px] leading-tight">
                          {sp.title}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-black text-slate-900">
                          <span className="inline-block w-6 h-6 rounded-full leading-6 text-center bg-blue-100 text-blue-900 text-xs font-black">
                            {sp.maxMarks}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-600 bg-rose-50/20 leading-snug">
                          {sp.descriptors[0]}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-700 bg-amber-50/20 leading-snug">
                          {sp.descriptors[1]}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-700 bg-blue-50/20 leading-snug">
                          {sp.descriptors[2]}
                        </td>
                        <td className="py-2 px-3 text-[11px] leading-snug">
                          {sp.descriptors[3] === 'Not applicable' ? (
                            <span className="text-slate-400 italic">Not applicable (Max 2 Marks)</span>
                          ) : (
                            <span className="text-emerald-900 font-medium">{sp.descriptors[3]}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUB-VIEW 1: RUBRICS & DESCRIPTORS MASTER TABLE */}
      {/* ============================================================================== */}
      {subView === 'descriptors' && (
        <div className="w-full max-w-[1200px] space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sub-criteria or scoring descriptors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Parameter Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-slate-400 font-bold text-[11px] uppercase mr-1">Parameter:</span>
              <button
                type="button"
                onClick={() => setSelectedParamFilter('All')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                  selectedParamFilter === 'All'
                    ? 'bg-[#0e3868] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All (20)
              </button>
              {EVALUATION_PARAMETERS.map((p) => (
                <button
                  key={p.paramNumber}
                  type="button"
                  onClick={() => setSelectedParamFilter(p.paramNumber)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    selectedParamFilter === p.paramNumber
                      ? 'bg-[#0e3868] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  P{p.paramNumber}: {p.shortTitle} ({p.maxMarks}M)
                </button>
              ))}
            </div>
          </div>

          {/* Master Rubric Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e3868] text-white uppercase text-[10px] font-extrabold tracking-wider border-b border-blue-950">
                    <th className="py-3 px-2 text-center w-10 border-r border-blue-900">No.</th>
                    <th className="py-3 px-3 w-40 border-r border-blue-900">Evaluation Parameter</th>
                    <th className="py-3 px-3 w-48 border-r border-blue-900">Sub-parameter</th>
                    <th className="py-3 px-2 text-center w-16 border-r border-blue-900 bg-[#0b2d54]">Max Marks</th>
                    <th className="py-3 px-3 border-r border-blue-900 bg-[#0b2d54] text-amber-200">Score 0</th>
                    <th className="py-3 px-3 border-r border-blue-900 text-blue-200">Score 1</th>
                    <th className="py-3 px-3 border-r border-blue-900 text-emerald-200">Score 2</th>
                    <th className="py-3 px-3 text-emerald-300">Score 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRubrics.map((sp, idx) => {
                    const isParam1 = sp.parameterNumber === 1;
                    const isParam2 = sp.parameterNumber === 2;
                    const isParam3 = sp.parameterNumber === 3;
                    const isParam4 = sp.parameterNumber === 4;

                    const rowBg =
                      isParam1 ? '#ffffff' : isParam2 ? '#f8fafc' : isParam3 ? '#ffffff' : '#f8fafc';

                    return (
                      <tr key={sp.id} style={{ backgroundColor: rowBg }} className="hover:bg-blue-50/50 transition">
                        {/* No */}
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200 text-xs">
                          {sp.number}
                        </td>

                        {/* Parameter */}
                        <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide ${
                              isParam1
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : isParam2
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : isParam3
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            P{sp.parameterNumber}: {sp.parameterShortTitle}
                          </span>
                        </td>

                        {/* Sub-parameter Title */}
                        <td className="py-2.5 px-3 border-r border-slate-200 font-extrabold text-slate-900 text-[11px] leading-tight">
                          {sp.title}
                        </td>

                        {/* Max Marks */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 font-black text-slate-900 text-sm">
                          <span
                            className={`inline-block w-7 h-7 rounded-full leading-7 text-center ${
                              sp.maxMarks === 3
                                ? 'bg-blue-900 text-white shadow-2xs'
                                : 'bg-indigo-100 text-indigo-900 font-bold'
                            }`}
                          >
                            {sp.maxMarks}
                          </span>
                        </td>

                        {/* Score 0 */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-[11px] text-slate-600 bg-rose-50/20 leading-snug">
                          <span className="font-bold text-rose-700 block text-[9.5px] uppercase mb-0.5">0 Marks</span>
                          {sp.descriptors[0]}
                        </td>

                        {/* Score 1 */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-[11px] text-slate-700 bg-amber-50/20 leading-snug">
                          <span className="font-bold text-amber-700 block text-[9.5px] uppercase mb-0.5">1 Mark</span>
                          {sp.descriptors[1]}
                        </td>

                        {/* Score 2 */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-[11px] text-slate-700 bg-blue-50/20 leading-snug">
                          <span className="font-bold text-blue-700 block text-[9.5px] uppercase mb-0.5">2 Marks</span>
                          {sp.descriptors[2]}
                        </td>

                        {/* Score 3 */}
                        <td className="py-2.5 px-3 text-[11px] leading-snug">
                          {sp.descriptors[3] === 'Not applicable' ? (
                            <span className="text-slate-400 italic text-[10px]">[Not Applicable &bull; Max 2]</span>
                          ) : (
                            <div className="bg-emerald-50/30 text-slate-800">
                              <span className="font-bold text-emerald-700 block text-[9.5px] uppercase mb-0.5">3 Marks (Exemplary)</span>
                              {sp.descriptors[3]}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Showing {filteredRubrics.length} of 20 evaluation sub-parameters</span>
              <span>Total Cluster Evaluation Score: <strong>50 Marks</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUB-VIEW 2: PRINTABLE SCORE SHEET PREVIEW */}
      {/* ============================================================================== */}
      {subView === 'sheet_preview' && (
        <div className="w-full flex flex-col items-center space-y-4">
          {/* Team Selector & Print Action Bar */}
          <div className="w-full max-w-[1120px] bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-700">Select Project Team:</span>
              <select
                value={selectedTeamCode}
                onChange={(e) => setSelectedTeamCode(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="blank">★ Blank Master Template (Print for Any Team)</option>
                {formattedTeams.map((t, idx) => (
                  <option key={t.teamKey || t.submissionCode} value={t.submissionCode}>
                    {t.teamCode || `TEAM ${String(idx + 1).padStart(2, '0')}`}: {t.projectTitle.substring(0, 45)}... ({t.instituteName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCurrentSheet}
                disabled={isExportingPdf}
                className="px-3.5 py-2 rounded-xl bg-[#0e3868] hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Download This Sheet (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span>Print Score Sheet</span>
              </button>
            </div>
          </div>

          {/* Printable Sheet Card */}
          <div
            className="rubric-score-sheet bg-white text-slate-900 shadow-xl rounded-2xl border-2 border-[#0e3868] p-4 sm:p-5 relative mx-auto"
            style={{
              width: '1120px',
              maxWidth: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff'
            }}
          >
            {/* OFFICIAL HEADER (LOGOS ONLY) */}
            <div className="pb-2.5 border-b-2 border-[#0e3868]">
              <div className="flex items-center justify-between" style={{ gap: '14px' }}>
                {/* LEFT: Punjab Govt & Tech Ed Logos Only */}
                <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: '120px' }}>
                  <img
                    src={LOGO_PUNJAB_GOVT}
                    alt="Govt of Punjab"
                    style={{ height: '52px', width: 'auto', maxHeight: '52px', objectFit: 'contain' }}
                  />
                  <img
                    src={LOGO_TECH_ED}
                    alt="Tech Ed Punjab"
                    style={{ height: '44px', width: '44px', maxHeight: '44px', objectFit: 'contain' }}
                    className="rounded-lg"
                  />
                </div>

                {/* CENTER: Challenge Title + Pill Banner + Meta Bar */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#0e3868', lineHeight: 1.1, letterSpacing: '-0.2px' }}>
                    {EVENT_DETAILS.eventName}
                  </h1>

                  <div style={{ margin: '4px 0', backgroundColor: '#0e3868', color: '#ffffff', fontWeight: 800, fontSize: '11px', letterSpacing: '0.3px', padding: '2.5px 22px', borderRadius: '9999px' }}>
                    Official Evaluation Rubric &amp; Jury Score Sheet (Maximum 50 Marks)
                  </div>

                  <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '9999px', padding: '2px 14px', fontSize: '9px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
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

                {/* RIGHT: Host Institute Logo Only */}
                <div className="flex items-center justify-end flex-shrink-0" style={{ minWidth: '120px' }}>
                  <img
                    src={LOGO_GPC_BATHINDA}
                    alt="GPC Bathinda"
                    style={{ height: '52px', width: '52px', maxHeight: '52px', objectFit: 'contain' }}
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* PROJECT METADATA CARD (ONLY TEAM CODE & PROJECT TITLE) */}
            <div className="mt-2.5 p-2 px-3 rounded-xl bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-[#0e3868] text-white font-mono font-black text-xs tracking-wider shadow-2xs">
                  {currentPreviewTeam?.teamCode || 'TEAM [  ]'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0e3868] uppercase text-[10px]">Project Title:</span>
                  <span className="font-extrabold text-slate-900 text-xs uppercase">
                    {currentPreviewTeam ? currentPreviewTeam.projectTitle : '_____________________________________________________'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Evaluator:</span>
                <span className="font-semibold text-slate-800">
                  {currentJudge?.name || '____________________'}
                </span>
              </div>
            </div>

            {/* 20 SUB-CRITERIA SCORING TABLE */}
            <div className="mt-2.5">
              <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-[#0e3868] text-white text-[9px] font-extrabold uppercase tracking-wider">
                    <th className="p-1.5 text-center border border-[#94a3b8]" style={{ width: '3.5%' }}>Sr.</th>
                    <th className="p-1.5 border border-[#94a3b8]" style={{ width: '46%' }}>Evaluation Parameter &amp; Sub-criteria Description</th>
                    <th className="p-1.5 text-center border border-[#94a3b8]" style={{ width: '8.5%' }}>Max Marks</th>
                    <th className="p-1.5 text-center border border-[#94a3b8] bg-[#0b2d54]" style={{ width: '22%' }}>Score Awarded (Check / Write 0,1,2,3)</th>
                    <th className="p-1.5 text-center border border-[#94a3b8]" style={{ width: '20%' }}>Specific Evaluator Observations / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_PARAMETERS.map((param) => (
                    <React.Fragment key={param.paramNumber}>
                      {/* Parameter Subtotal Header Row */}
                      <tr className="bg-slate-200 border border-[#94a3b8] text-slate-900 font-black text-[9.5px]">
                        <td colSpan={5} className="p-1.5 uppercase tracking-wide bg-gradient-to-r from-blue-100 to-slate-100 text-[#0e3868]">
                          {param.title} &bull; (Subtotal: _______ / {param.maxMarks} Marks)
                        </td>
                      </tr>

                      {/* Sub-parameters */}
                      {param.subParameters.map((sp) => {
                        const isMax3 = sp.maxMarks === 3;
                        return (
                          <tr key={sp.id} className="border-b border-[#cbd5e1] text-[9.5px] hover:bg-slate-50">
                            {/* Sr */}
                            <td className="p-1 text-center font-bold text-slate-700 border border-[#cbd5e1]">
                              {sp.number}
                            </td>

                            {/* Title */}
                            <td className="p-1.5 border border-[#cbd5e1]">
                              <div className="font-extrabold text-slate-900 leading-tight">{sp.title}</div>
                              <div className="text-[8px] text-slate-500 mt-0.5 leading-snug">
                                {sp.descriptors[sp.maxMarks]}
                              </div>
                            </td>

                            {/* Max Marks */}
                            <td className="p-1 text-center font-black text-slate-900 border border-[#cbd5e1] text-[11px]">
                              {sp.maxMarks}
                            </td>

                            {/* Physical Checkboxes / Blank Box */}
                            <td className="p-1 border border-[#cbd5e1] align-middle bg-slate-50/50">
                              <div className="flex items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-slate-700">
                                  <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center bg-white text-[8px]"></span> 0
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-slate-700">
                                  <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center bg-white text-[8px]"></span> 1
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-slate-700">
                                  <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center bg-white text-[8px]"></span> 2
                                </span>
                                {isMax3 ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black text-emerald-800">
                                    <span className="w-4 h-4 border-2 border-emerald-600 rounded flex items-center justify-center bg-white text-[8px]"></span> 3
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[8px] italic">[N/A]</span>
                                )}
                              </div>
                            </td>

                            {/* Observations */}
                            <td className="p-1 border border-[#cbd5e1] bg-white">
                              <div className="h-4 border-b border-dotted border-slate-300"></div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SCORING SUMMARY & SIGNATURES */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-300">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-[#0e3868] text-sm">TOTAL SCORE OBTAINED: </span>
                  <span className="font-mono font-black text-base text-slate-900 ml-2">_______ / 50 MARKS</span>
                </div>

                <div>
                  <span className="font-extrabold text-[#0e3868]">PERCENTAGE: </span>
                  <span className="font-mono font-black text-sm text-slate-900 ml-2">_______ %</span>
                </div>

                <div className="text-[10px] text-slate-600 font-medium">
                  <strong>Recommendation:</strong> [ &nbsp; ] State Level &nbsp;&bull;&nbsp; [ &nbsp; ] Commended &nbsp;&bull;&nbsp; [ &nbsp; ] Needs Work
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-4 pt-2 border-t border-slate-200 flex items-start justify-between text-[9px]">
                <div className="w-64 text-center">
                  <div className="h-7 border-b border-dashed border-slate-400"></div>
                  <span className="font-bold text-slate-900 block mt-1 uppercase">Evaluating Jury Member</span>
                  <span className="text-slate-500 block leading-tight">Member, Evaluation Jury Board</span>
                </div>

                <div className="w-64 text-center">
                  <div className="h-7 border-b border-dashed border-slate-400"></div>
                  <span className="font-bold text-slate-900 block mt-1 uppercase">Chairperson, Jury Board</span>
                  <span className="text-slate-500 block leading-tight">Presiding Officer &bull; Bathinda Cluster</span>
                </div>

                <div className="w-64 text-center">
                  <div className="h-7 border-b border-dashed border-slate-400"></div>
                  <span className="font-bold text-slate-900 block mt-1 uppercase">Nodal Center Validation</span>
                  <span className="text-slate-500 block leading-tight">Government Polytechnic College, Bathinda</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUB-VIEW 3: INTERACTIVE LIVE SCORING CALCULATOR */}
      {/* ============================================================================== */}
      {subView === 'live_scoring' && (
        <div className="w-full max-w-[1200px] space-y-4">
          {/* Controls Bar: Select Judge & Team */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Judge Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Evaluating Judge:
                </label>
                <select
                  value={selectedJudgeSlot}
                  onChange={(e) => setSelectedJudgeSlot(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="chairperson_1">Chairperson: {judgesMap.get('chairperson_1')?.name || 'Vacant'}</option>
                  <option value="jury_member_1">Jury 1 (Academic): {judgesMap.get('jury_member_1')?.name || 'Vacant'}</option>
                  <option value="jury_member_2">Jury 2 (Tech Lead): {judgesMap.get('jury_member_2')?.name || 'Vacant'}</option>
                  <option value="jury_member_3">Jury 3 (Industry): {judgesMap.get('jury_member_3')?.name || 'Vacant'}</option>
                  <option value="jury_member_4">Jury 4 (Prototype): {judgesMap.get('jury_member_4')?.name || 'Vacant'}</option>
                </select>
              </div>

              {/* Team Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Evaluating Project Team:
                </label>
                <select
                  value={selectedTeamCode}
                  onChange={(e) => setSelectedTeamCode(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formattedTeams.map((t, idx) => (
                    <option key={t.teamKey || t.submissionCode} value={t.submissionCode}>
                      {t.teamCode || `TEAM ${String(idx + 1).padStart(2, '0')}`}: {t.projectTitle.substring(0, 45)}... ({t.instituteName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scorecard Widget */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-5 py-3 rounded-2xl shadow-sm">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Total Marks</span>
                <span className="text-2xl font-black text-amber-300">{liveTotals.total} <span className="text-xs text-white/70">/ 50</span></span>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Percentage</span>
                <span className="text-2xl font-black text-white">{liveTotals.percentage}%</span>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">Evaluated</span>
                <span className="text-xs font-extrabold text-emerald-300">{liveTotals.answeredCount} of 20</span>
              </div>
            </div>
          </div>

          {/* Scoring Grid per Parameter */}
          <div className="space-y-4">
            {EVALUATION_PARAMETERS.map((param) => {
              const currentParamScore = liveTotals.paramScores[param.paramNumber] || 0;
              const isParam1or2 = param.maxMarks === 15;

              return (
                <div key={param.paramNumber} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center">
                        P{param.paramNumber}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{param.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Subtotal:</span>
                      <span className="text-sm font-black text-[#0e3868] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {currentParamScore} / {param.maxMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Sub-parameters */}
                  <div className="space-y-3">
                    {param.subParameters.map((sp) => {
                      const awarded = currentEvaluationScores[sp.id];
                      const isMax3 = sp.maxMarks === 3;

                      return (
                        <div key={sp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex-1 min-w-[280px]">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-700 text-xs">#{sp.number}</span>
                              <span className="font-bold text-slate-900 text-xs">{sp.title}</span>
                              <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded">
                                Max {sp.maxMarks}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {awarded !== undefined ? (
                                <span className="font-semibold text-blue-900">
                                  Awarded: {awarded} Marks &ndash; &ldquo;{sp.descriptors[awarded]}&rdquo;
                                </span>
                              ) : (
                                sp.descriptors[sp.maxMarks]
                              )}
                            </p>
                          </div>

                          {/* Score Selector Pills: 0, 1, 2, 3 */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {[0, 1, 2, ...(isMax3 ? [3] : [])].map((score) => {
                              const isSelected = awarded === score;
                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => handleScoreChange(sp.id, score)}
                                  className={`w-9 h-9 rounded-xl font-black text-xs transition cursor-pointer flex flex-col items-center justify-center ${
                                    isSelected
                                      ? score === 3
                                        ? 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-400'
                                        : score === 2
                                        ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-400'
                                        : score === 1
                                        ? 'bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                                        : 'bg-rose-600 text-white shadow-md scale-105 ring-2 ring-rose-400'
                                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                                  }`}
                                  title={`Score ${score}: ${sp.descriptors[score]}`}
                                >
                                  <span>{score}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetCurrentEvaluation}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Scores for This Team</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSaveSuccessMessage('Evaluation scores successfully saved to local registry!');
                setTimeout(() => setSaveSuccessMessage(''), 3000);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-200" />
              <span>Save Evaluation</span>
            </button>
          </div>

          {saveSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
              {saveSuccessMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
