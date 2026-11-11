import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSupabaseClient } from './supabase.js';
import { EVENT_DETAILS } from './attendanceUtils.js';
import {
  LOGO_PUNJAB_GOVT,
  LOGO_TECH_ED,
  LOGO_GPC_BATHINDA
} from './logos.js';

export const JUDGE_DOMAINS = [
  'SENIOR EXTERNAL ACADEMIC',
  'SENIOR TECHNICAL LEADER',
  'INDUSTRY REPRESENTATIVE',
  'INNOVATION/ PROTOTYPING EXPERT',
  'APPLICATION DOMAIN EXPERT',
  'INTERDISCIPLINARY TECHNICAL EXPERT'
];

export const JUDGE_ROLES = {
  CHAIRPERSON: {
    id: 'CHAIRPERSON',
    title: 'Chairperson',
    description: 'Lead Evaluator & Head of Evaluation Jury Board',
    maxCount: 1,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    iconColor: 'text-amber-600',
    headerBg: 'from-amber-600 to-amber-700'
  },
  JURY_MEMBER: {
    id: 'JURY_MEMBER',
    title: 'Jury Member',
    description: 'Core Technical & Innovation Evaluation Jury',
    maxCount: 4,
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    iconColor: 'text-blue-600',
    headerBg: 'from-blue-700 to-indigo-800'
  },
  RESERVE_JURY_MEMBER: {
    id: 'RESERVE_JURY_MEMBER',
    title: 'Reserve Jury Member',
    description: 'Alternate / Standby Evaluation Jury Expert',
    maxCount: 2,
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    iconColor: 'text-purple-600',
    headerBg: 'from-purple-700 to-slate-800'
  }
};

export const JUDGE_SLOTS = [
  {
    slotKey: 'chairperson_1',
    role: 'CHAIRPERSON',
    slotNumber: 1,
    roleTitle: 'Chairperson',
    label: 'Chairperson / Head of Jury',
    shortLabel: 'Chairperson',
    isPrimary: true
  },
  {
    slotKey: 'jury_member_1',
    role: 'JURY_MEMBER',
    slotNumber: 1,
    roleTitle: 'Jury Member 1',
    label: 'Jury Member 1',
    shortLabel: 'Jury 1',
    isPrimary: true
  },
  {
    slotKey: 'jury_member_2',
    role: 'JURY_MEMBER',
    slotNumber: 2,
    roleTitle: 'Jury Member 2',
    label: 'Jury Member 2',
    shortLabel: 'Jury 2',
    isPrimary: true
  },
  {
    slotKey: 'jury_member_3',
    role: 'JURY_MEMBER',
    slotNumber: 3,
    roleTitle: 'Jury Member 3',
    label: 'Jury Member 3',
    shortLabel: 'Jury 3',
    isPrimary: true
  },
  {
    slotKey: 'jury_member_4',
    role: 'JURY_MEMBER',
    slotNumber: 4,
    roleTitle: 'Jury Member 4',
    label: 'Jury Member 4',
    shortLabel: 'Jury 4',
    isPrimary: true
  },
  {
    slotKey: 'reserve_member_1',
    role: 'RESERVE_JURY_MEMBER',
    slotNumber: 1,
    roleTitle: 'Reserve Jury Member 1',
    label: 'Reserve Jury Member 1',
    shortLabel: 'Reserve 1',
    isPrimary: false
  },
  {
    slotKey: 'reserve_member_2',
    role: 'RESERVE_JURY_MEMBER',
    slotNumber: 2,
    roleTitle: 'Reserve Jury Member 2',
    label: 'Reserve Jury Member 2',
    shortLabel: 'Reserve 2',
    isPrimary: false
  }
];

export const STORAGE_KEY_JUDGES = 'cluster_competition_judges';

/**
 * Creates a clean default empty judge template for a given slot
 */
export const createEmptyJudge = (slotKey = 'chairperson_1') => {
  const slot = JUDGE_SLOTS.find((s) => s.slotKey === slotKey) || JUDGE_SLOTS[0];
  return {
    id: `judge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    slotKey: slot.slotKey,
    role: slot.role,
    slotNumber: slot.slotNumber,
    name: '',
    contact: '',
    email: '',
    designation: '',
    organisation: '',
    organisationLocation: '',
    domain: JUDGE_DOMAINS[0],
    relevantBackground: '',
    updatedAt: new Date().toISOString()
  };
};

/**
 * Loads judges list from localStorage
 */
export const loadJudgesFromStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JUDGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse judges from localStorage:', e);
    return [];
  }
};

/**
 * Saves judges array to localStorage
 */
export const saveJudgesToStorage = (judges = []) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_JUDGES, JSON.stringify(judges));
  } catch (e) {
    console.error('Failed to save judges to localStorage:', e);
  }
};

/**
 * Normalizes judge fields into uppercase where appropriate, matching official competition conventions
 */
export const normalizeJudgeData = (judge) => {
  return {
    ...judge,
    name: (judge.name || '').trim().toUpperCase(),
    contact: (judge.contact || '').trim(),
    email: (judge.email || '').trim().toLowerCase(),
    designation: (judge.designation || '').trim().toUpperCase(),
    organisation: (judge.organisation || '').trim().toUpperCase(),
    organisationLocation: (judge.organisationLocation || '').trim().toUpperCase(),
    domain: (judge.domain || JUDGE_DOMAINS[0]).trim().toUpperCase(),
    relevantBackground: (judge.relevantBackground || '').trim(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Fetches judges from Supabase (falls back silently if table not yet created)
 */
export const fetchJudgesFromSupabase = async () => {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'NO_CLIENT' };
  }
  try {
    const { data, error } = await client
      .from('competition_judges')
      .select('*')
      .order('slot_number', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      slotKey: row.slot_key,
      role: row.role,
      slotNumber: row.slot_number,
      name: (row.name || '').toUpperCase(),
      contact: row.contact || '',
      email: row.email || '',
      designation: (row.designation || '').toUpperCase(),
      organisation: (row.organisation || '').toUpperCase(),
      organisationLocation: (row.organisation_location || '').toUpperCase(),
      domain: (row.domain || JUDGE_DOMAINS[0]).toUpperCase(),
      relevantBackground: row.relevant_background || '',
      updatedAt: row.updated_at || row.created_at
    }));

    return { data: mapped, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Persists a single judge to Supabase (upsert by slot_key)
 */
export const saveJudgeToSupabase = async (judge) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, reason: 'NO_CLIENT' };

  try {
    const payload = {
      slot_key: judge.slotKey,
      role: judge.role,
      slot_number: judge.slotNumber,
      name: (judge.name || '').toUpperCase(),
      contact: judge.contact || '',
      email: (judge.email || '').toLowerCase(),
      designation: (judge.designation || '').toUpperCase(),
      organisation: (judge.organisation || '').toUpperCase(),
      organisation_location: (judge.organisationLocation || '').toUpperCase(),
      domain: (judge.domain || JUDGE_DOMAINS[0]).toUpperCase(),
      relevant_background: judge.relevantBackground || '',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('competition_judges')
      .upsert(payload, { onConflict: 'slot_key' })
      .select();

    if (error) {
      console.warn('Supabase judge upsert notice:', error.message);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase judge save network error:', err);
    return { success: false, error: err };
  }
};

/**
 * Deletes a judge from Supabase by slotKey
 */
export const deleteJudgeFromSupabase = async (slotKey) => {
  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const { error } = await client
      .from('competition_judges')
      .delete()
      .eq('slot_key', slotKey);

    if (error) {
      console.warn('Supabase judge delete notice:', error.message);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
};

/**
 * Calculates current completion statistics for the 7-member jury board
 */
export const getJuryPanelStats = (judgesList = []) => {
  const map = new Map();
  judgesList.forEach((j) => {
    if (j && j.slotKey && j.name?.trim()) {
      map.set(j.slotKey, j);
    }
  });

  const chairperson = map.get('chairperson_1') || null;
  const juryMembers = [1, 2, 3, 4]
    .map((n) => map.get(`jury_member_${n}`))
    .filter(Boolean);
  const reserveMembers = [1, 2]
    .map((n) => map.get(`reserve_member_${n}`))
    .filter(Boolean);

  const totalAssigned = (chairperson ? 1 : 0) + juryMembers.length + reserveMembers.length;
  const isPrimaryComplete = !!chairperson && juryMembers.length === 4;
  const isAllComplete = isPrimaryComplete && reserveMembers.length === 2;

  return {
    chairperson,
    juryMembersCount: juryMembers.length,
    reserveMembersCount: reserveMembers.length,
    totalAssigned,
    totalSlots: 7,
    isChairpersonAssigned: !!chairperson,
    isPrimaryComplete,
    isAllComplete,
    completionPercentage: Math.round((totalAssigned / 7) * 100)
  };
};

/**
 * Exports Jury Panel to formatted Excel (.xlsx)
 */
export const exportJudgesToExcel = (judgesList = [], filename = '') => {
  if (!judgesList || judgesList.length === 0) {
    alert('No judges data available to export.');
    return;
  }

  // Order according to JUDGE_SLOTS
  const slotMap = new Map();
  judgesList.forEach((j) => slotMap.set(j.slotKey, j));

  const excelRows = [];
  JUDGE_SLOTS.forEach((slot, idx) => {
    const judge = slotMap.get(slot.slotKey);
    excelRows.push({
      'Position S.No.': idx + 1,
      'Role / Designation in Jury': slot.label.toUpperCase(),
      'Judge Full Name': judge?.name ? judge.name.toUpperCase() : 'VACANT / UNASSIGNED',
      'Contact Number': judge?.contact || '-',
      'Email ID': judge?.email || '-',
      'Designation': judge?.designation ? judge.designation.toUpperCase() : '-',
      'Organisation': judge?.organisation ? judge.organisation.toUpperCase() : '-',
      'Organisation Location': judge?.organisationLocation ? judge.organisationLocation.toUpperCase() : '-',
      'Domain Specialization': judge?.domain ? judge.domain.toUpperCase() : '-',
      'Relevant Background (1-Liner)': judge?.relevantBackground || '-'
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jury Evaluation Board');

  worksheet['!cols'] = [
    { wch: 15 }, // S.No
    { wch: 28 }, // Role
    { wch: 30 }, // Name
    { wch: 18 }, // Contact
    { wch: 28 }, // Email
    { wch: 28 }, // Designation
    { wch: 34 }, // Organisation
    { wch: 24 }, // Location
    { wch: 36 }, // Domain
    { wch: 50 }  // Background
  ];

  const fname =
    filename ||
    `Jury_Evaluation_Board_Bathinda_Cluster_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, fname);
};

/**
 * Exports Jury Panel to CSV
 */
export const exportJudgesToCsv = (judgesList = [], filename = '') => {
  if (!judgesList || judgesList.length === 0) {
    alert('No judges data available to export.');
    return;
  }

  const slotMap = new Map();
  judgesList.forEach((j) => slotMap.set(j.slotKey, j));

  const headers = [
    'Position S.No.',
    'Role in Jury',
    'Full Name',
    'Contact Number',
    'Email',
    'Designation',
    'Organisation',
    'Organisation Location',
    'Domain',
    'Relevant Background'
  ];

  const rows = JUDGE_SLOTS.map((slot, idx) => {
    const judge = slotMap.get(slot.slotKey);
    return [
      idx + 1,
      `"${slot.label.replace(/"/g, '""')}"`,
      `"${(judge?.name || 'VACANT').replace(/"/g, '""')}"`,
      `"${(judge?.contact || '').replace(/"/g, '""')}"`,
      `"${(judge?.email || '').replace(/"/g, '""')}"`,
      `"${(judge?.designation || '').replace(/"/g, '""')}"`,
      `"${(judge?.organisation || '').replace(/"/g, '""')}"`,
      `"${(judge?.organisationLocation || '').replace(/"/g, '""')}"`,
      `"${(judge?.domain || '').replace(/"/g, '""')}"`,
      `"${(judge?.relevantBackground || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(',')).join('\n')];
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    filename || `Jury_Evaluation_Board_Bathinda_Cluster_${Date.now()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export Jury Attendance Sheet to Excel (.xlsx) with tabs for:
 * 1. Core Jury Board (5 members)
 * 2. Standby / Reserve Jury Panel (2 members)
 * 3. Complete Evaluation Jury Board (All 7 members)
 */
export const exportJuryAttendanceToExcel = (judgesList = [], filename = '') => {
  const slotMap = new Map();
  judgesList.forEach((j) => slotMap.set(j.slotKey, j));

  const formatRows = (slots) =>
    slots.map((slot, idx) => {
      const judge = slotMap.get(slot.slotKey);
      return {
        'Sr. No.': idx + 1,
        'Jury Role / Position': slot.label.toUpperCase(),
        'Judge Full Name': judge?.name ? judge.name.toUpperCase() : 'VACANT / UNASSIGNED',
        'Contact Number': judge?.contact || '-',
        'Email ID': judge?.email || '-',
        'Designation': judge?.designation ? judge.designation.toUpperCase() : '-',
        'Organisation': judge?.organisation ? judge.organisation.toUpperCase() : '-',
        'Organisation Location': judge?.organisationLocation ? judge.organisationLocation.toUpperCase() : '-',
        'Domain Specialization': judge?.domain ? judge.domain.toUpperCase() : '-',
        'Reporting In-Time': '', // Blank for physical time entry on event day
        'Attendance / Physical Signature': '', // Blank for physical signature
        'Remarks': ''
      };
    });

  const coreSlots = JUDGE_SLOTS.filter((s) => s.role !== 'RESERVE_JURY_MEMBER');
  const reserveSlots = JUDGE_SLOTS.filter((s) => s.role === 'RESERVE_JURY_MEMBER');

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Core Jury Board (5)
  const wsCore = XLSX.utils.json_to_sheet(formatRows(coreSlots));
  // Sheet 2: Reserve Jury Panel (2)
  const wsReserve = XLSX.utils.json_to_sheet(formatRows(reserveSlots));
  // Sheet 3: Complete Jury (All 7)
  const wsAll = XLSX.utils.json_to_sheet(formatRows(JUDGE_SLOTS));

  const cols = [
    { wch: 8 },  // Sr. No.
    { wch: 28 }, // Role
    { wch: 30 }, // Name
    { wch: 16 }, // Contact
    { wch: 26 }, // Email
    { wch: 26 }, // Designation
    { wch: 32 }, // Organisation
    { wch: 22 }, // Location
    { wch: 34 }, // Domain
    { wch: 18 }, // In-Time
    { wch: 28 }, // Signature
    { wch: 22 }  // Remarks
  ];

  wsCore['!cols'] = cols;
  wsReserve['!cols'] = cols;
  wsAll['!cols'] = cols;

  XLSX.utils.book_append_sheet(workbook, wsCore, 'Core Jury Board (5)');
  XLSX.utils.book_append_sheet(workbook, wsReserve, 'Reserve Jury Panel (2)');
  XLSX.utils.book_append_sheet(workbook, wsAll, 'All Jury Combined (7)');

  const fname =
    filename ||
    `Jury_Attendance_Sheet_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.xlsx`;
  XLSX.writeFile(workbook, fname);
};

/**
 * Internal helper to render a single crisp Landscape A4 Jury Attendance Sheet page into jsPDF doc
 */
const renderJuryPdfPage = (
  doc,
  slotsToRender = [],
  judgesList = [],
  bannerTitle = 'Cluster-Level Competition – Jury Evaluation Board Attendance Sheet',
  subfooterTag = 'Official Evaluation Jury Board Attendance Record',
  pageNumber = 1,
  totalPages = 1
) => {
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;

  // Outer Page Border
  doc.setDrawColor(14, 56, 104);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 3, 3, 'S');

  // Header Left: Punjab Govt & Tech Ed Logos
  try {
    doc.addImage(LOGO_PUNJAB_GOVT, 'JPEG', margin + 3, margin + 3, 14, 14);
    doc.addImage(LOGO_TECH_ED, 'JPEG', margin + 19, margin + 4.5, 11, 11);
  } catch (e) {
    console.warn('Failed to embed left logos in PDF:', e);
  }

  // PSBTE Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(14, 56, 104);
  doc.text(EVENT_DETAILS.boardName, margin + 32, margin + 8);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Punjab State Board of Technical Education\n& Industrial Training Punjab', margin + 32, margin + 11.5);

  // Title Center
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(14, 56, 104);
  doc.text(EVENT_DETAILS.eventName, pageWidth / 2, margin + 7, { align: 'center' });

  // Center Pill Banner
  doc.setFillColor(14, 56, 104);
  const bannerWidth = Math.min(145, Math.max(120, bannerTitle.length * 1.9));
  doc.roundedRect(pageWidth / 2 - bannerWidth / 2, margin + 9.5, bannerWidth, 5.5, 2.75, 2.75, 'F');
  doc.setFontSize(8.2);
  doc.setTextColor(255, 255, 255);
  doc.text(bannerTitle, pageWidth / 2, margin + 13.5, { align: 'center' });

  // Center Meta Bar
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth / 2 - 70, margin + 16.5, 140, 4.5, 2.25, 2.25, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(`Cluster: Bathinda   |   Venue / Host: ${EVENT_DETAILS.hostInstitute}   |   Date: ${EVENT_DETAILS.eventDate}`, pageWidth / 2, margin + 19.8, { align: 'center' });

  // Header Right: GPC Bathinda Logo
  try {
    doc.addImage(LOGO_GPC_BATHINDA, 'JPEG', pageWidth - margin - 17, margin + 3, 14, 14);
  } catch (e) {
    console.warn('Failed to embed right logo in PDF:', e);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 56, 104);
  doc.text(EVENT_DETAILS.hostInstitute, pageWidth - margin - 19, margin + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Host Institute & Nodal Center', pageWidth - margin - 19, margin + 12.5, { align: 'right' });

  // Build Table Body
  const slotMap = new Map();
  judgesList.forEach((j) => slotMap.set(j.slotKey, j));

  const isFewRows = slotsToRender.length <= 2;
  const isMediumRows = slotsToRender.length <= 5;
  const minRowHeight = isFewRows ? 24 : isMediumRows ? 17 : 14;

  const tableBody = slotsToRender.map((slot, idx) => {
    const judge = slotMap.get(slot.slotKey);
    const isChair = slot.role === 'CHAIRPERSON';
    const isReserve = slot.role === 'RESERVE_JURY_MEMBER';
    const rowBg = isChair ? [254, 252, 232] : isReserve ? [250, 245, 255] : idx % 2 === 0 ? [255, 253, 247] : [240, 247, 255];

    const roleText = `${slot.label.toUpperCase()}`;
    const nameText = judge?.name ? `${judge.name.toUpperCase()}\nPh: ${judge.contact || '-'}\n${judge.email || ''}` : '[VACANT / UNASSIGNED]';
    const orgText = judge?.organisation ? `${judge.designation.toUpperCase()}\n${judge.organisation.toUpperCase()}\n(${judge.organisationLocation || '-'})` : '-';
    const domainText = judge?.domain ? judge.domain.toUpperCase() : '-';

    return [
      { content: String(idx + 1), styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: rowBg } },
      { content: roleText, styles: { halign: 'left', valign: 'middle', fontStyle: 'bold', fillColor: rowBg } },
      { content: nameText, styles: { halign: 'left', valign: 'middle', fillColor: rowBg } },
      { content: orgText, styles: { halign: 'left', valign: 'middle', fillColor: rowBg } },
      { content: domainText, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: rowBg } },
      { content: '', styles: { minCellHeight: minRowHeight, fillColor: [255, 255, 255] } }, // Reporting In-Time
      { content: '', styles: { minCellHeight: minRowHeight, fillColor: [255, 255, 255] } }, // Physical Signature (Blank)
      { content: '', styles: { minCellHeight: minRowHeight, fillColor: [255, 255, 255] } }  // Remarks
    ];
  });

  autoTable(doc, {
    startY: margin + 23,
    margin: { left: 11, right: 11 },
    tableWidth: 275,
    head: [
      [
        { content: 'Sr.\nNo.', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Jury Designation / Role', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Judge Full Name & Contact No.', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Designation, Organisation & Location', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Domain Specialization', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Reporting\nIn-Time', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Attendance / Physical Signature', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Remarks', styles: { halign: 'center', valign: 'middle' } }
      ]
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 56, 104],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      lineWidth: 0.15,
      lineColor: [148, 163, 184]
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
      lineWidth: 0.15,
      lineColor: [203, 213, 225],
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 9 },   // Sr. No.
      1: { cellWidth: 32 },  // Role
      2: { cellWidth: 44 },  // Name & Contact
      3: { cellWidth: 54 },  // Designation & Org
      4: { cellWidth: 40 },  // Domain
      5: { cellWidth: 20 },  // Reporting In-Time
      6: { cellWidth: 44 },  // Attendance (Signature) - 44mm wide!
      7: { cellWidth: 32 }   // Remarks
    }
  });

  // Footer Signatures
  const footerY = pageHeight - margin - 16;
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(margin + 12, footerY, margin + 64, footerY);
  doc.line(pageWidth / 2 - 27, footerY, pageWidth / 2 + 27, footerY);
  doc.line(pageWidth - margin - 64, footerY, pageWidth - margin - 12, footerY);
  doc.setLineDashPattern([], 0);

  const leftX = margin + 38;
  const centerX = pageWidth / 2;
  const rightX = pageWidth - margin - 38;

  // Line 1: Primary Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Chairperson, Jury Board', leftX, footerY + 3.8, { align: 'center' });
  doc.text('Nodal Officer', centerX, footerY + 3.8, { align: 'center' });
  doc.text('Principal', rightX, footerY + 3.8, { align: 'center' });

  // Line 2: Subtitles / Role Affiliations
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Evaluation Jury Board', leftX, footerY + 7.0, { align: 'center' });
  doc.text('Bathinda Cluster', centerX, footerY + 7.0, { align: 'center' });
  doc.text('Host Institute, Bathinda Cluster', rightX, footerY + 7.0, { align: 'center' });

  // Line 3: College Name for Host Institute
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Government Polytechnic College, Bathinda', rightX, footerY + 10.0, { align: 'center' });

  // Sub-footer
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Punjab Polytechnic Innovation Challenge- 2026-27 • ${EVENT_DETAILS.cluster} • Host: ${EVENT_DETAILS.hostInstitute}`, margin + 5, pageHeight - margin - 3);

  const pageLabel = totalPages > 1 ? ` • Page ${pageNumber} of ${totalPages}` : '';
  doc.text(`${subfooterTag}${pageLabel}`, pageWidth - margin - 5, pageHeight - margin - 3, { align: 'right' });
};

/**
 * Download official Jury Attendance Sheet as crisp pure Vector PDF using jsPDF + jspdf-autotable.
 * Supports:
 * - 'split': Separate sheets (Page 1: Core Jury Board [5 slots], Page 2: Standby / Reserve Jury Panel [2 slots])
 * - 'combined': All 7 positions on 1 sheet
 * - 'core': Core Evaluation Jury Board only (1 page)
 * - 'reserve': Standby / Reserve Jury Panel only (1 page)
 */
export const generateVectorJuryAttendancePdf = (
  judgesList = [],
  mode = 'split',
  filename = ''
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const coreSlots = JUDGE_SLOTS.filter((s) => s.role !== 'RESERVE_JURY_MEMBER');
  const reserveSlots = JUDGE_SLOTS.filter((s) => s.role === 'RESERVE_JURY_MEMBER');

  // Sanitize mode: default to 'split' (separate 2-page sheets) unless 'combined', 'core', or 'reserve' is explicitly passed
  const validMode =
    typeof mode === 'string' && ['split', 'combined', 'core', 'reserve'].includes(mode)
      ? mode
      : 'split';

  let defaultFilename = `Jury_Attendance_Sheet_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.pdf`;

  if (validMode === 'combined') {
    // Combined: All 7 positions on 1 page
    renderJuryPdfPage(
      doc,
      JUDGE_SLOTS,
      judgesList,
      'Cluster-Level Competition – Jury Evaluation Board Attendance Sheet (Combined)',
      'Official Evaluation Jury Board Attendance Record (Combined)',
      1,
      1
    );
    defaultFilename = `Jury_Attendance_Sheet_Combined_All7_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.pdf`;
  } else if (validMode === 'core') {
    renderJuryPdfPage(
      doc,
      coreSlots,
      judgesList,
      'Cluster-Level Competition – Core Evaluation Jury Board Attendance Sheet',
      'Official Core Jury Board Attendance Record',
      1,
      1
    );
    defaultFilename = `Jury_Attendance_Sheet_Core_Board_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.pdf`;
  } else if (validMode === 'reserve') {
    renderJuryPdfPage(
      doc,
      reserveSlots,
      judgesList,
      'Cluster-Level Competition – Standby / Reserve Jury Panel Attendance Sheet',
      'Official Standby / Reserve Jury Attendance Record',
      1,
      1
    );
    defaultFilename = `Jury_Attendance_Sheet_Reserve_Panel_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.pdf`;
  } else {
    // Default 'split': Separate sheets (Page 1: Core Board, Page 2: Reserve Panel)
    // Page 1: Core Evaluation Jury Board (1 Chairperson + 4 Jury Members)
    renderJuryPdfPage(
      doc,
      coreSlots,
      judgesList,
      'Cluster-Level Competition – Core Evaluation Jury Board Attendance Sheet',
      'Official Core Jury Board Attendance Record',
      1,
      2
    );

    // Page 2: Standby / Reserve Jury Panel (2 Reserve Members)
    doc.addPage('a4', 'landscape');
    renderJuryPdfPage(
      doc,
      reserveSlots,
      judgesList,
      'Cluster-Level Competition – Standby / Reserve Jury Panel Attendance Sheet',
      'Official Standby / Reserve Jury Attendance Record',
      2,
      2
    );

    defaultFilename = `Jury_Attendance_Sheet_Core_and_Reserve_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.pdf`;
  }

  const fname = filename || defaultFilename;
  doc.save(fname);
};
