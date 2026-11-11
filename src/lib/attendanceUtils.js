import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LOGO_PUNJAB_GOVT,
  LOGO_TECH_ED,
  LOGO_GPC_BATHINDA
} from './logos.js';

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
 * Default is set to 14 students per page to maximize page space utilization.
 */
export const paginateAttendanceTeams = (teams = [], maxStudentsPerPage = 14) => {
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
 * Download attendance sheet as pure crisp Vector PDF using jsPDF + jspdf-autotable.
 * This guarantees:
 * 1. 100% reliable merged cell rendering (no blank/clipped cells).
 * 2. True vector sharpness (no fuzzy canvas rasterization).
 * 3. Exact page breaks for A4 Landscape without overflow.
 */
export const generateVectorAttendancePdf = (
  teams = [],
  filename = '',
  maxStudentsPerPage = 14
) => {
  if (!teams || teams.length === 0) {
    throw new Error('No team records found to export to PDF');
  }

  const pages = paginateAttendanceTeams(teams, maxStudentsPerPage);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;

  pages.forEach((pageTeams, pageIdx) => {
    if (pageIdx > 0) doc.addPage('a4', 'landscape');

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
    doc.roundedRect(pageWidth / 2 - 45, margin + 9.5, 90, 5.5, 2.75, 2.75, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(EVENT_DETAILS.subtitle, pageWidth / 2, margin + 13.5, { align: 'center' });

    // Center Meta Bar
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth / 2 - 68, margin + 16.5, 136, 4.5, 2.25, 2.25, 'FD');
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

    // Dynamically adjust cell padding, row height and font size based on page density
    const totalStudentsOnPage = pageTeams.reduce((acc, t) => acc + (t.students?.length || 1), 0);
    const rowMinHeight = totalStudentsOnPage <= 10 ? 11 : totalStudentsOnPage <= 12 ? 9.8 : 8.6;
    const cellPad = totalStudentsOnPage <= 10
      ? { top: 2.2, bottom: 2.2, left: 1.5, right: 1.5 }
      : totalStudentsOnPage <= 12
      ? { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 }
      : { top: 1.4, bottom: 1.4, left: 1.5, right: 1.5 };
    const fontSize = totalStudentsOnPage <= 10 ? 8 : totalStudentsOnPage <= 12 ? 7.8 : 7.5;

    // Table Body with proper rowSpan
    const tableBody = [];
    pageTeams.forEach((team, tIdx) => {
      const studentCount = team.students.length || 1;
      const teamBg = tIdx % 2 === 0 ? [254, 253, 245] : [240, 247, 255];

      team.students.forEach((st, sIdx) => {
        const isFirst = sIdx === 0;
        const row = [];

        if (isFirst) {
          row.push(
            { content: String(team.globalSrNo), rowSpan: studentCount, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: teamBg } },
            { content: team.instituteName, rowSpan: studentCount, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: teamBg } },
            { content: `${team.mentorName}\n(${team.mentorContact})`, rowSpan: studentCount, styles: { halign: 'center', valign: 'middle', fillColor: teamBg } },
            { content: team.projectTitle, rowSpan: studentCount, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: teamBg } },
            { content: `[${team.theme.code}]\n${team.theme.name}`, rowSpan: studentCount, styles: { halign: 'center', valign: 'middle', fillColor: teamBg } }
          );
        }

        row.push(
          { content: String(st.studentOrder), styles: { halign: 'center', valign: 'middle', fillColor: teamBg } },
          { content: st.studentName, styles: { halign: 'left', valign: 'middle', fontStyle: 'bold', fillColor: teamBg } },
          { content: st.registrationNo, styles: { halign: 'center', valign: 'middle', fillColor: teamBg } },
          { content: st.semester, styles: { halign: 'center', valign: 'middle', fillColor: teamBg } },
          { content: '', styles: { minCellHeight: rowMinHeight, fillColor: [255, 255, 255] } }
        );

        tableBody.push(row);
      });
    });

    // AutoTable Call
    autoTable(doc, {
      startY: margin + 23,
      margin: { left: 11, right: 11 },
      tableWidth: 275,
      head: [
        [
          { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Name of Institution\n(College / Polytechnic)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Faculty Mentor\n(Name & Contact No.)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Project Idea / Title of Innovation', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Theme /\nThematic Domain', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Student Details', colSpan: 5, styles: { halign: 'center' } }
        ],
        [
          { content: 'S. No.', styles: { halign: 'center' } },
          { content: 'Student Name', styles: { halign: 'left' } },
          { content: 'Roll No.', styles: { halign: 'center' } },
          { content: 'Semester', styles: { halign: 'center' } },
          { content: 'Signature', styles: { halign: 'center' } }
        ]
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [14, 56, 104],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        lineWidth: 0.15,
        lineColor: [148, 163, 184]
      },
      bodyStyles: {
        fontSize: fontSize,
        cellPadding: cellPad,
        lineWidth: 0.15,
        lineColor: [203, 213, 225],
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { cellWidth: 9 },   // Sr. No.
        1: { cellWidth: 44 },  // Institution
        2: { cellWidth: 35 },  // Mentor
        3: { cellWidth: 46 },  // Project
        4: { cellWidth: 36 },  // Theme
        5: { cellWidth: 9 },   // S. No.
        6: { cellWidth: 33 },  // Student Name
        7: { cellWidth: 26 },  // Roll No
        8: { cellWidth: 18 },  // Semester
        9: { cellWidth: 19 }   // Signature
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
    doc.text('Faculty Mentor', leftX, footerY + 3.8, { align: 'center' });
    doc.text('Nodal Officer', centerX, footerY + 3.8, { align: 'center' });
    doc.text('Principal', rightX, footerY + 3.8, { align: 'center' });

    // Line 2: Subtitles / Role Affiliations
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('(Accompanying Official / Mentor)', leftX, footerY + 7.0, { align: 'center' });
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
    doc.text(`Page ${pageIdx + 1} of ${pages.length}`, pageWidth - margin - 5, pageHeight - margin - 3, { align: 'right' });
  });

  const fname = filename || `Attendance_Sheet_Punjab_Polytechnic_Innovation_Challenge_${EVENT_DETAILS.eventDate}.pdf`;
  doc.save(fname);
};

export const downloadAttendancePdf = async (
  teamsOrContainer,
  filename = '',
  onProgress = null,
  maxStudentsPerPage = 14
) => {
  if (Array.isArray(teamsOrContainer)) {
    return generateVectorAttendancePdf(teamsOrContainer, filename, maxStudentsPerPage);
  }
  // If called without teams array, cannot proceed
  throw new Error('Please pass the formatted teams array to generate the Vector PDF.');
};
