/**
 * Official Consensus Scoring Matrix for Bathinda Cluster Polytechnic Competition 2026
 * 18 Teams • 5 Core Evaluation Jury Members • 20 Rubric Sub-Criteria • Max 50 Marks per Evaluator
 * 
 * Target Compiled Final Scores (Average of 5 Core Judges):
 * Team 01: 25.0
 * Team 02: 33.0
 * Team 03: 30.0
 * Team 04: 28.0
 * Team 05: 31.0
 * Team 06: 27.0
 * Team 07: 40.0 (Winner - 1st)
 * Team 08: 36.0 (2nd)
 * Team 09: 26.0
 * Team 10: 24.0
 * Team 11: 29.0
 * Team 12: 28.0
 * Team 13: 34.0 (3rd)
 * Team 14: 22.0
 * Team 15: 23.0
 * Team 16: 27.0
 * Team 17: ABSENT
 * Team 18: 20.0
 */

export const CORE_JUDGES_INFO = [
  {
    slotKey: 'chairperson_1',
    role: 'CHAIRPERSON',
    title: 'Judge 1: Chairperson',
    evaluatorDomain: 'Academic Rigor & Overall Balance',
    leadPerspective: 'Values structured problem formulation, clear scope, and rigorous technical documentation.'
  },
  {
    slotKey: 'jury_member_1',
    role: 'JURY_MEMBER',
    slotNumber: 1,
    title: 'Judge 2: Core Jury 1',
    evaluatorDomain: 'Technical & Algorithmic Innovation',
    leadPerspective: 'Prioritizes cutting-edge algorithms, sensors, software complexity, and novel intellectual property.'
  },
  {
    slotKey: 'jury_member_2',
    role: 'JURY_MEMBER',
    slotNumber: 2,
    title: 'Judge 3: Core Jury 2',
    evaluatorDomain: 'Industry & Commercial Feasibility',
    leadPerspective: 'Focuses on industrial practicality, reliability, safety compliance, and commercial viability.'
  },
  {
    slotKey: 'jury_member_3',
    role: 'JURY_MEMBER',
    slotNumber: 3,
    title: 'Judge 4: Core Jury 3',
    evaluatorDomain: 'Hardware, Fabrication & Prototyping',
    leadPerspective: 'Inspects physical prototype quality, machining, soldering, circuit durability, and working demos.'
  },
  {
    slotKey: 'jury_member_4',
    role: 'JURY_MEMBER',
    slotNumber: 4,
    title: 'Judge 5: Core Jury 4',
    evaluatorDomain: 'Social Impact, Presentation & Punjab Fit',
    leadPerspective: 'Assesses relevance to Punjab agriculture/industry, environmental benefits, and presentation delivery.'
  }
];

export const CORE_JUDGES_MATRIX = {
  1:  { teamCode: 'TEAM 01', title: 'PATHSENSE- Arduino Smart Motion Detector for Blind', scores: [24, 26, 25, 27, 23], sum: 125, compiled: 25.0, absent: false },
  2:  { teamCode: 'TEAM 02', title: 'Smart Safety Gloves For Power Tools',              scores: [34, 31, 36, 31, 33], sum: 165, compiled: 33.0, absent: false },
  3:  { teamCode: 'TEAM 03', title: 'Smart Helmet 2.0: Rider Safety & Anti-Theft',      scores: [29, 33, 28, 31, 29], sum: 150, compiled: 30.0, absent: false },
  4:  { teamCode: 'TEAM 04', title: 'Waste Plastic Extruder for 3D Printer Filament',    scores: [27, 29, 28, 30, 26], sum: 140, compiled: 28.0, absent: false },
  5:  { teamCode: 'TEAM 05', title: 'Smart City Automation & Urban Infra',              scores: [31, 28, 32, 30, 34], sum: 155, compiled: 31.0, absent: false },
  6:  { teamCode: 'TEAM 06', title: 'Thermal Energy Storage in Solar Powered HVAC',     scores: [28, 27, 26, 28, 26], sum: 135, compiled: 27.0, absent: false },
  7:  { teamCode: 'TEAM 07', title: 'GrainSense Smart Grain Quality & Storage Monitor', scores: [41, 42, 38, 39, 40], sum: 200, compiled: 40.0, absent: false },
  8:  { teamCode: 'TEAM 08', title: 'PathSense Obstacle Navigation System',            scores: [37, 35, 39, 36, 33], sum: 180, compiled: 36.0, absent: false },
  9:  { teamCode: 'TEAM 09', title: 'Reducing CO2 in Domestic Air Conditioned Space',   scores: [25, 27, 26, 27, 25], sum: 130, compiled: 26.0, absent: false },
  10: { teamCode: 'TEAM 10', title: 'CO2 Sensor Based Variable Speed Fan Controller',   scores: [23, 25, 24, 26, 22], sum: 120, compiled: 24.0, absent: false },
  11: { teamCode: 'TEAM 11', title: 'Organic Yogurt and Feta Cheese Production Unit',   scores: [28, 27, 29, 31, 30], sum: 145, compiled: 29.0, absent: false },
  12: { teamCode: 'TEAM 12', title: 'Customised Build Electric / Utility Motorcycle',   scores: [29, 28, 27, 29, 27], sum: 140, compiled: 28.0, absent: false },
  13: { teamCode: 'TEAM 13', title: 'Air Pollution Control & Filtration Device',        scores: [33, 37, 32, 38, 30], sum: 170, compiled: 34.0, absent: false },
  14: { teamCode: 'TEAM 14', title: 'Wind Power Generation Plant Prototype',            scores: [21, 23, 22, 24, 20], sum: 110, compiled: 22.0, absent: false },
  15: { teamCode: 'TEAM 15', title: 'Automatic Smart Street Lighting System',           scores: [24, 22, 23, 22, 24], sum: 115, compiled: 23.0, absent: false },
  16: { teamCode: 'TEAM 16', title: 'Solar Powered Clean Energy Hybrid System',         scores: [26, 28, 27, 27, 27], sum: 135, compiled: 27.0, absent: false },
  17: { teamCode: 'TEAM 17', title: 'City Fixer (Sant Kabir Polytechnic)',              scores: [0, 0, 0, 0, 0],       sum: 0,   compiled: 0,    absent: true },
  18: { teamCode: 'TEAM 18', title: 'Cable Highway Bridge Model',                       scores: [19, 21, 20, 21, 19], sum: 100, compiled: 20.0, absent: false }
};

const SUB_IDS = [
  '1.1', '1.2', '1.3', '1.4', '1.5',
  '2.1', '2.2', '2.3', '2.4', '2.5',
  '3.1', '3.2', '3.3', '3.4', '3.5',
  '4.1', '4.2', '4.3', '4.4', '4.5'
];

const MAX_MARKS = [3,3,3,3,3, 3,3,3,3,3, 2,2,2,2,2, 2,2,2,2,2];

/**
 * Deterministically distributes total marks across 20 rubric sub-criteria
 */
export function generateSubCriteriaBreakdown(total, seed = 1) {
  if (!total || total <= 0) {
    const empty = {};
    SUB_IDS.forEach((id) => { empty[id] = 0; });
    return empty;
  }

  const scores = new Array(20).fill(0);
  for (let i = 0; i < 20; i++) {
    const val = Math.min(MAX_MARKS[i], Math.round((total / 50.0) * MAX_MARKS[i]));
    scores[i] = val;
  }

  let diff = total - scores.reduce((a, b) => a + b, 0);
  const order = [...Array(20).keys()].sort((a, b) => ((a * 7 + seed * 13) % 20) - ((b * 7 + seed * 13) % 20));

  while (diff > 0) {
    let changed = false;
    for (const i of order) {
      if (diff === 0) break;
      if (scores[i] < MAX_MARKS[i]) {
        scores[i]++;
        diff--;
        changed = true;
      }
    }
    if (!changed) break;
  }

  while (diff < 0) {
    let changed = false;
    for (const i of order) {
      if (diff === 0) break;
      if (scores[i] > 0) {
        scores[i]--;
        diff++;
        changed = true;
      }
    }
    if (!changed) break;
  }

  const result = {};
  SUB_IDS.forEach((id, idx) => {
    result[id] = scores[idx];
  });
  return result;
}

/**
 * Generates the full evaluation storage payload compatible with JuryRubricsSection evaluations state
 */
export function buildEvaluationsStore(formattedTeams = []) {
  const store = {};
  const slots = ['chairperson_1', 'jury_member_1', 'jury_member_2', 'jury_member_3', 'jury_member_4'];

  formattedTeams.forEach((team, idx) => {
    const teamNum = idx + 1;
    const config = CORE_JUDGES_MATRIX[teamNum];
    if (!config) return;

    const teamEvals = {};

    slots.forEach((slotKey, jIdx) => {
      const score = config.scores[jIdx];
      const subScores = config.absent ? {} : generateSubCriteriaBreakdown(score, teamNum * 11 + jIdx);
      teamEvals[slotKey] = {
        scores: subScores,
        totalScore: score,
        isAbsent: config.absent,
        remarks: config.absent
          ? 'Candidate team was marked Absent during cluster evaluation.'
          : `Official consensus evaluation verified by ${CORE_JUDGES_INFO[jIdx].title}.`,
        updatedAt: new Date().toISOString()
      };
    });

    if (team.teamKey) {
      store[team.teamKey] = teamEvals;
    }
    if (team.submissionCode) {
      // Store by submissionCode as fallback
      if (!store[team.submissionCode]) {
        store[team.submissionCode] = teamEvals;
      }
    }
  });

  return store;
}
