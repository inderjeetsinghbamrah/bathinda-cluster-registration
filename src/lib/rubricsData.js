// ==============================================================================
// Official Evaluation Rubrics & Sub-criteria for Polytechnic Innovation Challenge
// 4 Evaluation Parameters • 20 Sub-Parameters • Total 50 Maximum Marks
// Parameters 1 & 2: Max 3 Marks each (Scores: 0, 1, 2, 3)
// Parameters 3 & 4: Max 2 Marks each (Scores: 0, 1, 2; 3 is Not Applicable)
// ==============================================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { EVENT_DETAILS } from './attendanceUtils.js';
import {
  LOGO_PUNJAB_GOVT,
  LOGO_TECH_ED,
  LOGO_GPC_BATHINDA
} from './logos.js';

export const TOTAL_RUBRIC_MAX_MARKS = 50;

export const EVALUATION_PARAMETERS = [
  {
    paramNumber: 1,
    title: '1. Depth of Problem Understanding',
    shortTitle: 'Problem Understanding',
    maxMarks: 15,
    subParameters: [
      {
        id: '1.1',
        number: 1,
        title: '1.1 Clarity of problem definition',
        maxMarks: 3,
        descriptors: {
          0: 'Problem not defined.',
          1: 'Problem stated vaguely; scope unclear.',
          2: 'Problem clearly defined but scope or context has minor gaps.',
          3: 'Problem precisely defined with clear scope, context and specific issue.'
        }
      },
      {
        id: '1.2',
        number: 2,
        title: '1.2 Identification of root causes',
        maxMarks: 3,
        descriptors: {
          0: 'No causes identified.',
          1: 'Mentions symptoms or superficial causes.',
          2: 'Identifies some underlying causes with limited explanation.',
          3: 'Clearly identifies and explains key underlying causes.'
        }
      },
      {
        id: '1.3',
        number: 3,
        title: '1.3 Understanding of affected stakeholders',
        maxMarks: 3,
        descriptors: {
          0: 'No stakeholders identified.',
          1: 'Identifies generic stakeholders.',
          2: 'Identifies relevant stakeholders but their needs are partially understood.',
          3: 'Clearly identifies key stakeholders and their specific needs and challenges.'
        }
      },
      {
        id: '1.4',
        number: 4,
        title: '1.4 Understanding of existing solutions and gaps',
        maxMarks: 3,
        descriptors: {
          0: 'No existing solutions examined.',
          1: 'Mentions existing solutions without explanation.',
          2: 'Identifies existing solutions and some limitations.',
          3: 'Analyses existing solutions and clearly establishes the gaps being addressed.'
        }
      },
      {
        id: '1.5',
        number: 5,
        title: '1.5 Evidence and validation of the problem',
        maxMarks: 3,
        descriptors: {
          0: 'No supporting evidence.',
          1: 'Provides general assumptions or anecdotal examples.',
          2: 'Provides some observations, examples or user feedback.',
          3: 'Provides relevant field observations, user interactions, survey findings or other credible evidence.'
        }
      }
    ]
  },
  {
    paramNumber: 2,
    title: '2. Usefulness and Fit for Punjab Context',
    shortTitle: 'Punjab Context & Fit',
    maxMarks: 15,
    subParameters: [
      {
        id: '2.1',
        number: 6,
        title: '2.1 Relevance to local/regional needs',
        maxMarks: 3,
        descriptors: {
          0: 'No relevance to Punjab established.',
          1: 'General relevance claimed without specific context.',
          2: 'Addresses an identifiable Punjab-related problem but local relevance is partially established.',
          3: 'Clearly addresses a specific and relevant problem in Punjab.'
        }
      },
      {
        id: '2.2',
        number: 7,
        title: '2.2 Potential benefits to intended users',
        maxMarks: 3,
        descriptors: {
          0: 'No benefits identified.',
          1: 'Benefits are vague or generic.',
          2: 'Identifies relevant benefits but their practical value is not fully explained.',
          3: 'Clearly demonstrates tangible benefits for identified users or beneficiaries.'
        }
      },
      {
        id: '2.3',
        number: 8,
        title: '2.3 Suitability to local conditions',
        maxMarks: 3,
        descriptors: {
          0: 'Local conditions not considered.',
          1: 'Mentions local conditions without linking them to the solution.',
          2: 'Considers some relevant local conditions.',
          3: 'Clearly demonstrates suitability to relevant geographical, climatic, infrastructural or socio-economic conditions.'
        }
      },
      {
        id: '2.4',
        number: 9,
        title: '2.4 Affordability and accessibility',
        maxMarks: 3,
        descriptors: {
          0: 'Cost and accessibility not considered.',
          1: 'Makes general claims about affordability.',
          2: 'Identifies some cost or accessibility considerations.',
          3: 'Demonstrates a practical and affordable approach with clear consideration of user accessibility.'
        }
      },
      {
        id: '2.5',
        number: 10,
        title: '2.5 Potential for adoption and wider applicability',
        maxMarks: 3,
        descriptors: {
          0: 'No adoption potential established.',
          1: 'Adoption potential mentioned without justification.',
          2: 'Identifies possible adoption or replication in limited settings.',
          3: 'Demonstrates credible potential for adoption, replication or scaling across Punjab.'
        }
      }
    ]
  },
  {
    paramNumber: 3,
    title: '3. Innovation at Polytechnic Level',
    shortTitle: 'Polytechnic Innovation',
    maxMarks: 10,
    subParameters: [
      {
        id: '3.1',
        number: 11,
        title: '3.1 Originality of the proposed idea',
        maxMarks: 2,
        descriptors: {
          0: 'No meaningful idea or improvement demonstrated.',
          1: 'Idea shows limited originality or minor modification.',
          2: 'Idea demonstrates a meaningful improvement or innovative approach over existing solutions.',
          3: 'Not applicable'
        }
      },
      {
        id: '3.2',
        number: 12,
        title: '3.2 Creative application of technology',
        maxMarks: 2,
        descriptors: {
          0: 'No relevant technology or engineering application demonstrated.',
          1: 'Basic application with limited relevance to the problem.',
          2: 'Appropriate and creative application of technology or engineering concepts.',
          3: 'Not applicable'
        }
      },
      {
        id: '3.3',
        number: 13,
        title: '3.3 Technical ingenuity and design approach',
        maxMarks: 2,
        descriptors: {
          0: 'No technical design approach demonstrated.',
          1: 'Basic design approach with limited technical reasoning.',
          2: 'Thoughtful engineering design with sound technical reasoning.',
          3: 'Not applicable'
        }
      },
      {
        id: '3.4',
        number: 14,
        title: '3.4 Resource-efficient innovation',
        maxMarks: 2,
        descriptors: {
          0: 'No consideration of resource efficiency.',
          1: 'Limited consideration of cost or locally available resources.',
          2: 'Demonstrates a practical low-cost or resource-efficient approach.',
          3: 'Not applicable'
        }
      },
      {
        id: '3.5',
        number: 15,
        title: '3.5 Distinctiveness and value addition',
        maxMarks: 2,
        descriptors: {
          0: 'No differentiation or added value established.',
          1: 'Limited differentiation from existing alternatives.',
          2: 'Clearly establishes distinctive features and additional value.',
          3: 'Not applicable'
        }
      }
    ]
  },
  {
    paramNumber: 4,
    title: '4. Practical Plan Towards the Prototype',
    shortTitle: 'Prototype Plan',
    maxMarks: 10,
    subParameters: [
      {
        id: '4.1',
        number: 16,
        title: '4.1 Clarity of prototype design and functionality',
        maxMarks: 2,
        descriptors: {
          0: 'No prototype concept explained.',
          1: 'Basic concept described, but design or functionality is unclear.',
          2: 'Prototype design, major components and intended functionality are clearly explained.',
          3: 'Not applicable'
        }
      },
      {
        id: '4.2',
        number: 17,
        title: '4.2 Technical feasibility',
        maxMarks: 2,
        descriptors: {
          0: 'No technically feasible approach established.',
          1: 'Feasibility is questionable or inadequately explained.',
          2: 'Demonstrates a realistic technical approach within the team\'s capabilities.',
          3: 'Not applicable'
        }
      },
      {
        id: '4.3',
        number: 18,
        title: '4.3 Identification of resources and materials',
        maxMarks: 2,
        descriptors: {
          0: 'Resources and materials not identified.',
          1: 'Identifies only some basic requirements.',
          2: 'Identifies the essential materials, components, tools and facilities required.',
          3: 'Not applicable'
        }
      },
      {
        id: '4.4',
        number: 19,
        title: '4.4 Development timeline and execution plan',
        maxMarks: 2,
        descriptors: {
          0: 'No development plan provided.',
          1: 'Provides a broad or unrealistic timeline.',
          2: 'Provides a logical sequence of activities with realistic milestones.',
          3: 'Not applicable'
        }
      },
      {
        id: '4.5',
        number: 20,
        title: '4.5 Testing, validation and improvement plan',
        maxMarks: 2,
        descriptors: {
          0: 'No testing plan identified.',
          1: 'Mentions testing without explaining the approach.',
          2: 'Identifies testing methods, validation parameters and scope for improvement.',
          3: 'Not applicable'
        }
      }
    ]
  }
];

// Flat list of all 20 sub-parameters
export const RUBRICS_FLAT_LIST = EVALUATION_PARAMETERS.flatMap((p) =>
  p.subParameters.map((sp) => ({
    ...sp,
    parameterNumber: p.paramNumber,
    parameterTitle: p.title,
    parameterShortTitle: p.shortTitle
  }))
);

/**
 * Common PDF Header for Rubric & Score Sheets (Logos Only on Left & Right)
 */
const renderPdfHeader = (doc, title, subtitle, isLandscape = true) => {
  const pageWidth = isLandscape ? 297 : 210;
  const margin = 6;

  // Outer border
  doc.setDrawColor(14, 56, 104);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, (isLandscape ? 210 : 297) - margin * 2, 3, 3, 'S');

  // Left Logos
  try {
    doc.addImage(LOGO_PUNJAB_GOVT, 'JPEG', margin + 3, margin + 2.5, 15, 15);
    doc.addImage(LOGO_TECH_ED, 'JPEG', margin + 20, margin + 3.5, 13, 13);
  } catch (e) {
    console.warn('Failed to embed left logos in PDF:', e);
  }

  // Right Logo
  try {
    doc.addImage(LOGO_GPC_BATHINDA, 'JPEG', pageWidth - margin - 18, margin + 2.5, 15, 15);
  } catch (e) {
    console.warn('Failed to embed right logo in PDF:', e);
  }

  // Center Event Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isLandscape ? 13 : 11.5);
  doc.setTextColor(14, 56, 104);
  doc.text(EVENT_DETAILS.eventName, pageWidth / 2, margin + 6.5, { align: 'center' });

  // Center Pill Banner
  doc.setFillColor(14, 56, 104);
  const bannerWidth = Math.min(isLandscape ? 170 : 130, Math.max(100, title.length * (isLandscape ? 1.8 : 1.6)));
  doc.roundedRect(pageWidth / 2 - bannerWidth / 2, margin + 8.8, bannerWidth, 5.2, 2.6, 2.6, 'F');
  doc.setFontSize(isLandscape ? 8 : 7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageWidth / 2, margin + 12.5, { align: 'center' });

  // Center Meta Bar
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  const metaWidth = isLandscape ? 160 : 140;
  doc.roundedRect(pageWidth / 2 - metaWidth / 2, margin + 15.5, metaWidth, 4.3, 2.15, 2.15, 'FD');
  doc.setFontSize(isLandscape ? 7 : 6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Cluster: Bathinda   |   Venue / Host: ${EVENT_DETAILS.hostInstitute}   |   Date: ${EVENT_DETAILS.eventDate}`,
    pageWidth / 2,
    margin + 18.5,
    { align: 'center' }
  );

  return margin + 22; // return startY for content
};

/**
 * Generates the Official Rubric & Descriptors Guide (Landscape A4)
 * Page 1: Parameters 1 & 2 (30 marks total, 10 sub-parameters)
 * Page 2: Parameters 3 & 4 (20 marks total, 10 sub-parameters)
 */
export const generateVectorRubricsGuidePdf = (filename = null) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pagesData = [
    {
      pageNo: 1,
      totalPages: 2,
      title: 'Official Evaluation Rubrics – Part A: Problem Understanding & Punjab Context (Max 30 Marks)',
      parameters: EVALUATION_PARAMETERS.slice(0, 2)
    },
    {
      pageNo: 2,
      totalPages: 2,
      title: 'Official Evaluation Rubrics – Part B: Polytechnic Innovation & Prototype Plan (Max 20 Marks)',
      parameters: EVALUATION_PARAMETERS.slice(2, 4)
    }
  ];

  pagesData.forEach((pg, pIdx) => {
    if (pIdx > 0) doc.addPage('a4', 'landscape');
    const startY = renderPdfHeader(doc, pg.title, '', true);

    const tableRows = [];
    pg.parameters.forEach((param) => {
      // Parameter Header row spanning all columns
      tableRows.push([
        {
          content: `${param.title.toUpperCase()} (MAX MARKS: ${param.maxMarks})`,
          colSpan: 8,
          styles: {
            fillColor: [14, 56, 104],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 7.5
          }
        }
      ]);

      param.subParameters.forEach((sp) => {
        tableRows.push([
          String(sp.number),
          param.shortTitle,
          sp.title,
          String(sp.maxMarks),
          sp.descriptors[0],
          sp.descriptors[1],
          sp.descriptors[2],
          sp.descriptors[3]
        ]);
      });
    });

    autoTable(doc, {
      startY: startY,
      margin: { left: 9, right: 9 },
      tableWidth: 279,
      head: [
        [
          { content: 'No.', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Evaluation Parameter', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Sub-parameter', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Max\nMarks', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Score 0', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Score 1', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Score 2', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Score 3', styles: { halign: 'center', valign: 'middle' } }
        ]
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 45, 84],
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold',
        lineWidth: 0.15,
        lineColor: [148, 163, 184]
      },
      bodyStyles: {
        fontSize: 6.2,
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        textColor: [15, 23, 42],
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.2, right: 1.2 }
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 46 },
        5: { cellWidth: 48 },
        6: { cellWidth: 48 },
        7: { cellWidth: 47 }
      }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 4;
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Punjab Polytechnic Innovation Challenge 2026-27 • Official 50-Mark Jury Rubrics Reference Guide • Page ${pg.pageNo} of ${pg.totalPages}`,
      14,
      Math.min(202, Math.max(finalY, 198))
    );
    doc.text(
      `Bathinda Cluster • Host Center: ${EVENT_DETAILS.hostInstitute}`,
      283,
      Math.min(202, Math.max(finalY, 198)),
      { align: 'right' }
    );
  });

  const outFname = filename || `Official_Evaluation_Rubrics_Guide_Bathinda_Cluster_${EVENT_DETAILS.eventDate}.pdf`;
  doc.save(outFname);
};

/**
 * Generates an Individual Team Evaluation Score Sheet (Landscape A4, 1 Clean Sheet)
 * Can be used for a specific team or generated blank for physical scoring.
 */
export const generateVectorTeamScoreSheetPdf = (teamData = null, judgeName = '', filename = null) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const isBlank = !teamData;
  const startY = renderPdfHeader(
    doc,
    'Official Jury Evaluation & Scoring Sheet (Maximum 50 Marks)',
    '',
    true
  );

  // Metadata Box (ONLY Team Code & Project Title)
  const metaBoxY = startY;
  const metaBoxHeight = 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(14, 56, 104);
  doc.setLineWidth(0.5);
  doc.roundedRect(9, metaBoxY, 279, metaBoxHeight, 1.5, 1.5, 'FD');

  const teamCodeStr = teamData ? (teamData.teamCode || `TEAM ${String(teamData.globalSrNo || 1).padStart(2, '0')}`) : 'TEAM [  ]';
  const projectTitleStr = teamData?.projectTitle ? String(teamData.projectTitle).toUpperCase() : '__________________________________________________________________________';

  // Team Code Badge (Solid Dark Blue Pill)
  doc.setFillColor(14, 56, 104);
  doc.roundedRect(12, metaBoxY + 1.8, 34, 6.4, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(teamCodeStr, 29, metaBoxY + 6.1, { align: 'center' });

  // Project Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 56, 104);
  doc.text('PROJECT TITLE:', 51, metaBoxY + 6.1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const maxTitleW = 150;
  const splitTitle = doc.splitTextToSize(projectTitleStr, maxTitleW);
  doc.text(splitTitle[0] || projectTitleStr, 78, metaBoxY + 6.1);

  // Evaluator space on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(14, 56, 104);
  doc.text('EVALUATOR:', 236, metaBoxY + 6.1, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text(judgeName || '____________________', 238, metaBoxY + 6.1);

  // 20-Sub-Criteria Scoring Grid (Table)
  const tableRows = [];
  EVALUATION_PARAMETERS.forEach((param) => {
    // Parameter Header Row
    tableRows.push([
      {
        content: `${param.title.toUpperCase()} (SUBTOTAL: _____ / ${param.maxMarks} MARKS)`,
        colSpan: 5,
        styles: {
          fillColor: [14, 56, 104],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 6.8
        }
      }
    ]);

    param.subParameters.forEach((sp) => {
      const allowedScores = sp.maxMarks === 3 ? '0  |  1  |  2  |  3' : '0  |  1  |  2';
      tableRows.push([
        String(sp.number),
        sp.title,
        String(sp.maxMarks),
        `[     ]   (Options: ${allowedScores})`,
        ''
      ]);
    });
  });

  autoTable(doc, {
    startY: metaBoxY + metaBoxHeight + 2,
    margin: { left: 9, right: 9 },
    tableWidth: 279,
    head: [
      [
        { content: 'Sr.', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Evaluation Parameter & Sub-parameter Description', styles: { halign: 'left', valign: 'middle' } },
        { content: 'Max\nMarks', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Score Awarded (Physical Check / Write 0, 1, 2, 3)', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Specific Remarks / Technical Observations', styles: { halign: 'center', valign: 'middle' } }
      ]
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 45, 84],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      lineWidth: 0.15,
      lineColor: [148, 163, 184]
    },
    bodyStyles: {
      fontSize: 6,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      cellPadding: { top: 1.1, bottom: 1.1, left: 1.5, right: 1.5 }
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 110, fontStyle: 'bold' },
      2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 62, halign: 'center', fontStyle: 'bold', textColor: [14, 56, 104] },
      4: { cellWidth: 85 }
    }
  });

  // Footer Scoring Summary & Signatures
  const bottomY = doc.lastAutoTable.finalY + 2;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(14, 56, 104);
  doc.setLineWidth(0.3);
  doc.roundedRect(9, bottomY, 279, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(14, 56, 104);
  doc.text('TOTAL SCORE OBTAINED:  ________ / 50 MARKS', 14, bottomY + 5.5);
  doc.text('PERCENTAGE:  ________ %', 14, bottomY + 10.5);

  doc.text('OVERALL RECOMMENDATION:', 110, bottomY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('[   ] Recommended for State Level     [   ] Commended for Prototyping     [   ] Needs Improvement', 110, bottomY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(14, 56, 104);
  doc.text('EVALUATOR SIGNATURE', 242, bottomY + 5.5, { align: 'center' });
  doc.line(220, bottomY + 9.5, 264, bottomY + 9.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Member, Jury Board', 242, bottomY + 12.5, { align: 'center' });

  const defaultName = isBlank
    ? `Official_Jury_Evaluation_Score_Sheet_Blank_Template_${EVENT_DETAILS.eventDate}.pdf`
    : `Jury_Score_Sheet_${(teamData.submissionCode || 'Team').replace(/[^a-zA-Z0-9]/g, '_')}_Bathinda_${EVENT_DETAILS.eventDate}.pdf`;

  const outFname = filename || defaultName;
  doc.save(outFname);
};

/**
 * Generates Batch Score Sheets for All 17 Teams in a Single Multi-Page PDF
 */
export const generateBatchAllTeamsScoreSheetsPdf = (teamsList = [], filename = null) => {
  if (!teamsList || teamsList.length === 0) {
    generateVectorTeamScoreSheetPdf(null, '', filename);
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  teamsList.forEach((team, idx) => {
    if (idx > 0) doc.addPage('a4', 'landscape');

    const teamCodeStr = team.teamCode || `TEAM ${String(idx + 1).padStart(2, '0')}`;
    const projectTitleStr = String(team.projectTitle || '').toUpperCase();

    const startY = renderPdfHeader(
      doc,
      `Official Jury Evaluation Sheet • ${teamCodeStr} (Maximum 50 Marks)`,
      '',
      true
    );

    // Metadata Box (ONLY Team Code & Project Title)
    const metaBoxY = startY;
    const metaBoxHeight = 10;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(14, 56, 104);
    doc.setLineWidth(0.5);
    doc.roundedRect(9, metaBoxY, 279, metaBoxHeight, 1.5, 1.5, 'FD');

    // Team Code Badge (Solid Dark Blue Pill)
    doc.setFillColor(14, 56, 104);
    doc.roundedRect(12, metaBoxY + 1.8, 34, 6.4, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(teamCodeStr, 29, metaBoxY + 6.1, { align: 'center' });

    // Project Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(14, 56, 104);
    doc.text('PROJECT TITLE:', 51, metaBoxY + 6.1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const maxTitleW = 150;
    const splitTitle = doc.splitTextToSize(projectTitleStr, maxTitleW);
    doc.text(splitTitle[0] || projectTitleStr, 78, metaBoxY + 6.1);

    // Evaluator space on Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(14, 56, 104);
    doc.text('EVALUATOR:', 236, metaBoxY + 6.1, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text('____________________', 238, metaBoxY + 6.1);

    // 20-Sub-Criteria Scoring Grid
    const tableRows = [];
    EVALUATION_PARAMETERS.forEach((param) => {
      tableRows.push([
        {
          content: `${param.title.toUpperCase()} (SUBTOTAL: _____ / ${param.maxMarks} MARKS)`,
          colSpan: 5,
          styles: {
            fillColor: [14, 56, 104],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 6.8
          }
        }
      ]);

      param.subParameters.forEach((sp) => {
        const allowedScores = sp.maxMarks === 3 ? '0  |  1  |  2  |  3' : '0  |  1  |  2';
        tableRows.push([
          String(sp.number),
          sp.title,
          String(sp.maxMarks),
          `[     ]   (Options: ${allowedScores})`,
          ''
        ]);
      });
    });

    autoTable(doc, {
      startY: metaBoxY + metaBoxHeight + 2,
      margin: { left: 9, right: 9 },
      tableWidth: 279,
      head: [
        [
          { content: 'Sr.', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Evaluation Parameter & Sub-parameter Description', styles: { halign: 'left', valign: 'middle' } },
          { content: 'Max\nMarks', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Score Awarded (Physical Check / Write 0, 1, 2, 3)', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Specific Remarks / Technical Observations', styles: { halign: 'center', valign: 'middle' } }
        ]
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 45, 84],
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold',
        lineWidth: 0.15,
        lineColor: [148, 163, 184]
      },
      bodyStyles: {
        fontSize: 6,
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        textColor: [15, 23, 42],
        cellPadding: { top: 1.1, bottom: 1.1, left: 1.5, right: 1.5 }
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 110, fontStyle: 'bold' },
        2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 62, halign: 'center', fontStyle: 'bold', textColor: [14, 56, 104] },
        4: { cellWidth: 85 }
      }
    });

    // Footer
    const bottomY = doc.lastAutoTable.finalY + 2;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(14, 56, 104);
    doc.setLineWidth(0.3);
    doc.roundedRect(9, bottomY, 279, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(14, 56, 104);
    doc.text('TOTAL SCORE OBTAINED:  ________ / 50 MARKS', 14, bottomY + 5.5);
    doc.text('PERCENTAGE:  ________ %', 14, bottomY + 10.5);

    doc.text('OVERALL RECOMMENDATION:', 110, bottomY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text('[   ] Recommended for State Level     [   ] Commended for Prototyping     [   ] Needs Improvement', 110, bottomY + 10.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(14, 56, 104);
    doc.text('EVALUATOR SIGNATURE', 242, bottomY + 5.5, { align: 'center' });
    doc.line(220, bottomY + 9.5, 264, bottomY + 9.5);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Member, Jury Board', 242, bottomY + 12.5, { align: 'center' });
  });

  const outFname = filename || `All_${teamsList.length}_Teams_Evaluation_Score_Sheets_Bathinda_${EVENT_DETAILS.eventDate}.pdf`;
  doc.save(outFname);
};

/**
 * Generates Master Scoring Matrix PDF:
 * Page 1: Single master table with all 17 projects, each with 20 numbered sub-criteria columns (1.1 to 4.5),
 *         Total / 50, Rank, and official Jury Signatures.
 * Pages 2 & 3: Elaborated Rubric Guide explaining all 20 criteria in full detail.
 */
export const generateConsolidatedJuryMatrixPdf = (teamsList = [], filename = null) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // ==========================================
  // PAGE 1: MASTER EVALUATION TABLE (ALL TEAMS)
  // ==========================================
  const startY = renderPdfHeader(
    doc,
    'Official Master Jury Evaluation & Scoring Matrix (All Projects)',
    'Cluster-Level Competition – 20 Sub-Criteria Comprehensive Scoring (Max 50 Marks)',
    true
  );

  // Table Body Rows (All Teams with 20 sub-criteria blank score cells)
  const tableRows = teamsList.map((team, idx) => [
    String(idx + 1),
    team.teamCode || `TEAM ${String(idx + 1).padStart(2, '0')}`,
    String(team.projectTitle || '').toUpperCase(),
    '', '', '', '', '', // 1.1 to 1.5
    '', '', '', '', '', // 2.1 to 2.5
    '', '', '', '', '', // 3.1 to 3.5
    '', '', '', '', '', // 4.1 to 4.5
    '', // Total (50)
    '', // Rank
    ''  // Jury Sign
  ]);

  autoTable(doc, {
    startY: startY,
    margin: { left: 6.5, right: 6.5 },
    tableWidth: 284,
    head: [
      [
        { content: 'Sr.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Team\nCode', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Project Title of Innovation', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: '1. Problem Understanding (15M)', colSpan: 5, styles: { halign: 'center', valign: 'middle', fillColor: [14, 56, 104] } },
        { content: '2. Punjab Fit & Use (15M)', colSpan: 5, styles: { halign: 'center', valign: 'middle', fillColor: [11, 45, 84] } },
        { content: '3. Polytechnic Innovation (10M)', colSpan: 5, styles: { halign: 'center', valign: 'middle', fillColor: [14, 56, 104] } },
        { content: '4. Prototype Plan (10M)', colSpan: 5, styles: { halign: 'center', valign: 'middle', fillColor: [11, 45, 84] } },
        { content: 'Total\n(50)', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [10, 37, 64] } },
        { content: 'Rank', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Jury\nSign', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ],
      [
        { content: '1.1\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '1.2\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '1.3\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '1.4\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '1.5\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '2.1\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '2.2\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '2.3\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '2.4\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '2.5\n(3)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '3.1\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '3.2\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '3.3\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '3.4\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '3.5\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '4.1\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '4.2\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '4.3\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '4.4\n(2)', styles: { halign: 'center', fontSize: 5.2 } },
        { content: '4.5\n(2)', styles: { halign: 'center', fontSize: 5.2 } }
      ]
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 56, 104],
      textColor: [255, 255, 255],
      fontSize: 6.2,
      fontStyle: 'bold',
      lineWidth: 0.15,
      lineColor: [148, 163, 184],
      cellPadding: { top: 1.2, bottom: 1.2, left: 0.5, right: 0.5 }
    },
    bodyStyles: {
      fontSize: 6.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      cellPadding: { top: 1.5, bottom: 1.5, left: 0.6, right: 0.6 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 17, halign: 'center', fontStyle: 'bold', textColor: [14, 56, 104] },
      2: { cellWidth: 59, fontStyle: 'bold' },
      3: { cellWidth: 8, halign: 'center' },
      4: { cellWidth: 8, halign: 'center' },
      5: { cellWidth: 8, halign: 'center' },
      6: { cellWidth: 8, halign: 'center' },
      7: { cellWidth: 8, halign: 'center' },
      8: { cellWidth: 8, halign: 'center' },
      9: { cellWidth: 8, halign: 'center' },
      10: { cellWidth: 8, halign: 'center' },
      11: { cellWidth: 8, halign: 'center' },
      12: { cellWidth: 8, halign: 'center' },
      13: { cellWidth: 8, halign: 'center' },
      14: { cellWidth: 8, halign: 'center' },
      15: { cellWidth: 8, halign: 'center' },
      16: { cellWidth: 8, halign: 'center' },
      17: { cellWidth: 8, halign: 'center' },
      18: { cellWidth: 8, halign: 'center' },
      19: { cellWidth: 8, halign: 'center' },
      20: { cellWidth: 8, halign: 'center' },
      21: { cellWidth: 8, halign: 'center' },
      22: { cellWidth: 8, halign: 'center' },
      23: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [14, 56, 104] },
      24: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
      25: { cellWidth: 16, halign: 'center' }
    }
  });

  // Footer: Signatures for Chairperson and Jury Panel
  const finalY = doc.lastAutoTable.finalY + 2.5;
  if (finalY < 192) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(14, 56, 104);
    doc.text('OFFICIAL JURY BOARD ENDORSEMENT & VALIDATION:', 10, finalY + 2.5);

    const sigs = [
      'Chairperson, Jury Board',
      'Jury Member 1 (Academic)',
      'Jury Member 2 (Tech Leader)',
      'Jury Member 3 (Industry)',
      'Jury Member 4 (Prototype)',
      'Reserve Jury Member 1',
      'Reserve Jury Member 2'
    ];
    const boxW = 37;
    sigs.forEach((sig, sIdx) => {
      const x = 10 + sIdx * 39.5;
      doc.setDrawColor(180, 180, 180);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x, finalY + 10.5, x + boxW, finalY + 10.5);
      doc.setLineDashPattern([], 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.2);
      doc.setTextColor(70, 70, 70);
      doc.text(sig, x + boxW / 2, finalY + 13.5, { align: 'center' });
    });
  }

  // Footer note on Page 1 pointing to elaborated criteria
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `* Note: See Pages 2 & 3 for complete elaborated descriptions and scoring levels (0, 1, 2, 3) for all 20 Sub-Criteria (1.1 through 4.5).`,
    10,
    pageHeight - 5
  );
  doc.text(`Page 1 of 3 (Master Scoring Matrix)`, pageWidth - 10, pageHeight - 5, { align: 'right' });

  // ==========================================
  // PAGES 2 & 3: ALL CRITERIA ELABORATED GUIDE
  // ==========================================
  const rubricsPages = [
    {
      pageNo: 2,
      totalPages: 3,
      title: 'Official Rubric Criteria Elaboration – Part A: Problem Understanding & Punjab Context',
      parameters: EVALUATION_PARAMETERS.slice(0, 2)
    },
    {
      pageNo: 3,
      totalPages: 3,
      title: 'Official Rubric Criteria Elaboration – Part B: Polytechnic Innovation & Prototype Plan',
      parameters: EVALUATION_PARAMETERS.slice(2, 4)
    }
  ];

  rubricsPages.forEach((pg) => {
    doc.addPage('a4', 'landscape');
    const startYRubric = renderPdfHeader(doc, pg.title, '', true);

    const rubricRows = [];
    pg.parameters.forEach((param) => {
      rubricRows.push([
        {
          content: `${param.title.toUpperCase()} (MAX MARKS: ${param.maxMarks})`,
          colSpan: 8,
          styles: {
            fillColor: [14, 56, 104],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 7.2
          }
        }
      ]);

      param.subParameters.forEach((sp) => {
        rubricRows.push([
          String(sp.number),
          param.shortTitle,
          sp.title,
          String(sp.maxMarks),
          sp.descriptors[0],
          sp.descriptors[1],
          sp.descriptors[2],
          sp.descriptors[3]
        ]);
      });
    });

    autoTable(doc, {
      startY: startYRubric,
      margin: { left: 9, right: 9 },
      tableWidth: 279,
      head: [
        [
          { content: 'No.', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Evaluation Parameter', styles: { halign: 'left', valign: 'middle' } },
          { content: 'Sub-parameter Description', styles: { halign: 'left', valign: 'middle' } },
          { content: 'Max\nMarks', styles: { halign: 'center', valign: 'middle' } },
          { content: 'Score 0', styles: { halign: 'left', valign: 'middle' } },
          { content: 'Score 1', styles: { halign: 'left', valign: 'middle' } },
          { content: 'Score 2', styles: { halign: 'left', valign: 'middle' } },
          { content: 'Score 3', styles: { halign: 'left', valign: 'middle' } }
        ]
      ],
      body: rubricRows,
      theme: 'grid',
      headStyles: {
        fillColor: [14, 56, 104],
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold',
        lineWidth: 0.15,
        lineColor: [148, 163, 184]
      },
      bodyStyles: {
        fontSize: 5.8,
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        textColor: [15, 23, 42],
        cellPadding: { top: 1.2, bottom: 1.2, left: 1.2, right: 1.2 }
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 46 },
        5: { cellWidth: 48 },
        6: { cellWidth: 48 },
        7: { cellWidth: 47 }
      }
    });

    // Sub-footer on criteria pages
    doc.setFontSize(6.2);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Punjab Polytechnic Innovation Challenge • Official 50-Mark Rubric Reference • Page ${pg.pageNo} of ${pg.totalPages}`,
      10,
      pageHeight - 5
    );
    doc.text(`Host Center: ${EVENT_DETAILS.hostInstitute}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
  });

  const outFname = filename || `Master_Jury_Scoring_Matrix_All_Projects_Bathinda_${EVENT_DETAILS.eventDate}.pdf`;
  doc.save(outFname);
};

/**
 * Export Rubrics & Criteria to Multi-Tab Excel Workbook
 */
export const exportRubricsToExcel = (teamsList = []) => {
  const wb = XLSX.utils.book_new();

  // Tab 1: Master Scoring Matrix (All Projects with 20 Criteria Columns)
  const masterMatrixRows = (teamsList || []).map((team, idx) => ({
    'Sr. No.': idx + 1,
    'Team Code': team.teamCode || `TEAM ${String(idx + 1).padStart(2, '0')}`,
    'Project Title of Innovation': team.projectTitle,
    '1.1 Clarity of problem definition (3)': '',
    '1.2 Identification of root causes (3)': '',
    '1.3 Understanding affected stakeholders (3)': '',
    '1.4 Existing solutions and gaps (3)': '',
    '1.5 Evidence and validation (3)': '',
    '2.1 Relevance to Punjab needs (3)': '',
    '2.2 Potential benefits to users (3)': '',
    '2.3 Suitability to local conditions (3)': '',
    '2.4 Affordability and accessibility (3)': '',
    '2.5 Adoption and wider applicability (3)': '',
    '3.1 Originality of proposed idea (2)': '',
    '3.2 Creative application of tech (2)': '',
    '3.3 Technical ingenuity & design (2)': '',
    '3.4 Resource-efficient innovation (2)': '',
    '3.5 Distinctiveness & value addition (2)': '',
    '4.1 Prototype design clarity (2)': '',
    '4.2 Technical feasibility (2)': '',
    '4.3 Resources & materials (2)': '',
    '4.4 Development timeline (2)': '',
    '4.5 Testing & improvement plan (2)': '',
    'Total Score (50)': '',
    'Cluster Rank': '',
    'Jury Signature / Remarks': ''
  }));
  const wsMaster = XLSX.utils.json_to_sheet(masterMatrixRows);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Scoring Matrix (20)');

  // Tab 2: Official Rubrics Matrix (20 Sub-parameters)
  const rubricsData = RUBRICS_FLAT_LIST.map((r) => ({
    'No.': r.number,
    'Evaluation Parameter': r.parameterTitle,
    'Sub-parameter': r.title,
    'Maximum Marks': r.maxMarks,
    'Score 0 (Unsatisfactory)': r.descriptors[0],
    'Score 1 (Developing)': r.descriptors[1],
    'Score 2 (Proficient)': r.descriptors[2],
    'Score 3 (Exemplary)': r.descriptors[3]
  }));
  const wsRubrics = XLSX.utils.json_to_sheet(rubricsData);
  XLSX.utils.book_append_sheet(wb, wsRubrics, 'Rubrics & Descriptors (50)');

  XLSX.writeFile(wb, `Master_Jury_Scoring_Matrix_Bathinda_${EVENT_DETAILS.eventDate}.xlsx`);
};
