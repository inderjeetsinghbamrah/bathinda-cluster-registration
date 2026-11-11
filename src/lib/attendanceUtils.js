import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const EVENT_DETAILS = {
  eventName: 'Punjab Polytechnic Innovation Challenge- 2026-27',
  cluster: 'Bathinda Cluster',
  hostInstitute: 'Government Polytechnic College, Bathinda',
  eventDate: '12-11-2026',
  subtitle: 'Cluster-Level Competition – Attendance Sheet',
  boardName: 'PSBTE&IT',
  boardFullName: 'Punjab State Board of Technical Education & Industrial Training Punjab'
};

export const getThemeDomain = (theme, other) => {
  const t = (theme || '').trim();
  if (/Agriculture/i.test(t)) {
    return { code: 'D-01', name: 'Agriculture and Food Technology' };
  }
  if (/Health/i.test(t)) {
    return { code: 'D-02', name: 'Health & Wellness' };
  }
  if (/Clean Energy|Energy/i.test(t)) {
    return { code: 'D-03', name: 'Clean Energy & Environment' };
  }
  if (/Smart Cities|Mobility/i.test(t)) {
    return { code: 'D-04', name: 'Smart Cities & Mobility' };
  }
  if (/Education|EdTech/i.test(t)) {
    return { code: 'D-05', name: 'Education Technology' };
  }
  if (/Waste/i.test(t)) {
    return { code: 'D-06', name: 'Waste Management and Sustainability' };
  }
  if (/Industry|Automation/i.test(t)) {
    return { code: 'D-07', name: 'Industry 4.0 & Automation' };
  }
  return {
    code: 'D-08',
    name: other ? `Others (${other})` : (t || 'Others / Open Innovation')
  };
};

export const STORAGE_KEY_TEAM_ORDER = 'cluster_team_custom_order';

export const loadCustomTeamOrder = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAM_ORDER);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomTeamOrder = (keys = []) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TEAM_ORDER, JSON.stringify(keys));
  } catch (e) {
    console.error('Failed to save custom team order to localStorage:', e);
  }
};

export const clearCustomTeamOrder = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_TEAM_ORDER);
  } catch (e) {}
};

/**
 * Transforms raw Supabase submissions into flattened, normalized teams and students
 * suitable for the official Attendance Sheet layout and Reorderable Table.
 */
export const formatAttendanceData = (
  submissions = [],
  sortBy = 'custom',
  customOrderKeys = []
) => {
  if (!Array.isArray(submissions)) return [];

  const effectiveCustomKeys =
    Array.isArray(customOrderKeys) && customOrderKeys.length > 0
      ? customOrderKeys
      : loadCustomTeamOrder();

  const formattedTeams = [];

  submissions.forEach((sub) => {
    const rawTeams = sub.raw_payload?.teams || [];
    const teams = sub.competition_teams || [];

    // Sort teams by team_number
    const sortedTeams = [...teams].sort((a, b) => (a.team_number || 1) - (b.team_number || 1));

    sortedTeams.forEach((t) => {
      const rawTeam =
        rawTeams.find((rt) => rt.teamNumber === t.team_number) ||
        rawTeams[t.team_number ? t.team_number - 1 : 0];
      const rawStudents = rawTeam?.students || [];

      const students = t.competition_students || [];
      const sortedStudents = [...students].sort(
        (a, b) => (a.student_order || 1) - (b.student_order || 1)
      );

      const formattedStudents = sortedStudents.map((s, sIdx) => {
        const rawStudent =
          rawStudents.find(
            (rs) =>
              (rs.registrationNo && rs.registrationNo === s.registration_no) ||
              (rs.name && rs.name.trim().toLowerCase() === s.student_name?.trim().toLowerCase())
          ) || rawStudents[s.student_order ? s.student_order - 1 : sIdx];

        let semester = s.semester || rawStudent?.semester || '-';
        return {
          studentOrder: s.student_order || sIdx + 1,
          studentName: (s.student_name || '').trim(),
          registrationNo: (s.registration_no || '').trim(),
          department: s.department === 'Others' ? `${s.department} (${s.department_other || ''})` : (s.department || '-'),
          semester: semester,
          contact: s.contact_number || '',
          email: s.email || rawStudent?.email || ''
        };
      });

      const teamKey = `${sub.id}_${t.team_number || 1}`;

      formattedTeams.push({
        teamKey,
        submissionId: sub.id,
        submissionCode: sub.submission_code,
        createdAt: sub.created_at,
        instituteName: (sub.institute_name || '').trim(),
        principalName: (sub.principal_name || '').trim(),
        principalContact: (sub.principal_contact || '').trim(),
        teamNumber: t.team_number || 1,
        projectTitle: (t.project_title || '').trim(),
        mentorName: (t.mentor_name || '').trim(),
        mentorContact: (t.mentor_contact || '').trim(),
        theme: getThemeDomain(t.project_theme, t.project_theme_other),
        students: formattedStudents
      });
    });
  });

  // Sort according to requested mode
  if (sortBy === 'custom' && effectiveCustomKeys.length > 0) {
    const keyMap = new Map();
    effectiveCustomKeys.forEach((k, idx) => keyMap.set(k, idx));
    formattedTeams.sort((a, b) => {
      const idxA = keyMap.has(a.teamKey) ? keyMap.get(a.teamKey) : 9999;
      const idxB = keyMap.has(b.teamKey) ? keyMap.get(b.teamKey) : 9999;
      if (idxA !== idxB) return idxA - idxB;
      return a.instituteName.localeCompare(b.instituteName);
    });
  } else if (sortBy === 'host_first') {
    formattedTeams.sort((a, b) => {
      const isHostA = a.instituteName.toLowerCase().includes('government') && a.instituteName.toLowerCase().includes('bathinda');
      const isHostB = b.instituteName.toLowerCase().includes('government') && b.instituteName.toLowerCase().includes('bathinda');
      if (isHostA && !isHostB) return -1;
      if (!isHostA && isHostB) return 1;
      return a.instituteName.localeCompare(b.instituteName);
    });
  } else if (sortBy === 'theme') {
    formattedTeams.sort((a, b) => {
      const cmp = a.theme.code.localeCompare(b.theme.code);
      if (cmp !== 0) return cmp;
      return a.instituteName.localeCompare(b.instituteName);
    });
  } else if (sortBy === 'institute') {
    formattedTeams.sort((a, b) => a.instituteName.localeCompare(b.instituteName));
  } else if (sortBy === 'created_at') {
    formattedTeams.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === 'code') {
    formattedTeams.sort((a, b) => a.submissionCode.localeCompare(b.submissionCode));
  }

  // Renumber globalSrNo sequentially
  return formattedTeams.map((t, idx) => ({
    ...t,
    globalSrNo: idx + 1
  }));
};

/**
 * Reorders an array moving item from fromIndex to toIndex
 */
export const moveTeamInList = (teams = [], fromIndex, toIndex) => {
  if (!Array.isArray(teams) || fromIndex < 0 || toIndex < 0 || fromIndex >= teams.length || toIndex >= teams.length) {
    return teams;
  }
  const updated = [...teams];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated.map((t, idx) => ({
    ...t,
    globalSrNo: idx + 1
  }));
};

/**
 * Paginates teams so that no team's student group is ever split across pages,
 * ensuring each printed page cleanly fits A4 Landscape.
 */
export const paginateAttendanceTeams = (teams = [], maxStudentsPerPage = 11) => {
  if (!teams || teams.length === 0) return [];
  const pages = [];
  let currentPage = [];
  let currentStudentCount = 0;

  for (const team of teams) {
    const studentCount = team.students?.length || 1;

    // If page is not empty and adding this team would exceed maxStudentsPerPage
    if (currentPage.length > 0 && currentStudentCount + studentCount > maxStudentsPerPage) {
      pages.push(currentPage);
      currentPage = [team];
      currentStudentCount = studentCount;
    } else {
      currentPage.push(team);
      currentStudentCount += studentCount;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

/**
 * Export attendance sheet rows to Excel (.xlsx)
 */
export const exportAttendanceToExcel = (teams = [], filename = '') => {
  if (!teams || teams.length === 0) return;

  const excelRows = [];
  teams.forEach((t) => {
    t.students.forEach((s) => {
      excelRows.push({
        'Sr. No.': t.globalSrNo,
        'Name of Institution': t.instituteName,
        'Faculty Mentor': `${t.mentorName} (${t.mentorContact})`,
        'Project Idea / Title of Innovation': t.projectTitle,
        'Thematic Domain Code': t.theme.code,
        'Theme': t.theme.name,
        'Student S.No.': s.studentOrder,
        'Student Name': s.studentName,
        'Roll No.': s.registrationNo,
        'Branch / Dept': s.department,
        'Semester': s.semester,
        'Attendance / Signature': '' // Blank for physical signature
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Sheet');

  const cols = [
    { wch: 8 },  // Sr. No.
    { wch: 35 }, // Institute
    { wch: 25 }, // Mentor
    { wch: 35 }, // Project
    { wch: 10 }, // Code
    { wch: 28 }, // Theme
    { wch: 8 },  // S.No
    { wch: 22 }, // Student
    { wch: 16 }, // Roll
    { wch: 22 }, // Dept
    { wch: 10 }, // Sem
    { wch: 18 }  // Signature
  ];
  worksheet['!cols'] = cols;

  const fname = filename || `Punjab_Polytechnic_Attendance_Sheet_${EVENT_DETAILS.eventDate}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, fname);
};

/**
 * Download attendance sheet as high-resolution A4 Landscape PDF
 */
export const downloadAttendancePdf = async (containerRef, filename = '', onProgress = null) => {
  if (!containerRef) {
    throw new Error('Container reference missing for PDF download');
  }

  const pageElements = containerRef.querySelectorAll('.attendance-page-sheet');
  if (!pageElements || pageElements.length === 0) {
    throw new Error('No attendance sheet pages found to export');
  }

  const totalPages = pageElements.length;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  for (let i = 0; i < totalPages; i++) {
    if (onProgress) {
      onProgress({ current: i + 1, total: totalPages, status: `Rendering page ${i + 1} of ${totalPages}...` });
    }

    const pageEl = pageElements[i];

    // Render page with html2canvas
    const canvas = await html2canvas(pageEl, {
      scale: 2, // High resolution crisp rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress({ current: totalPages, total: totalPages, status: 'Finalizing PDF download...' });
  }

  const fname = filename || `Attendance_Sheet_Punjab_Polytechnic_Innovation_Challenge_${EVENT_DETAILS.eventDate}.pdf`;
  pdf.save(fname);
};
