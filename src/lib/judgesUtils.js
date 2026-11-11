import * as XLSX from 'xlsx';
import { getSupabaseClient } from './supabase.js';
import { EVENT_DETAILS } from './attendanceUtils.js';

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
