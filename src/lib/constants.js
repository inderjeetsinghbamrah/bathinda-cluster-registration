export const PROJECT_THEMES = [
  'Agriculture and Food Technology',
  'Health & Wellness',
  'Clean Energy & Environment',
  'Smart Cities & Mobility',
  'Education Technology',
  'Waste Management and Sustainability',
  'Industry 4.0 & Automation',
  'Others'
];

export const DEPARTMENTS = [
  'Automobile Engineering',
  'Civil Engineering',
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Electronics and Communication Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Mechanical Engineering (Production)',
  'D-Pharmacy',
  'Others'
];

export const SUGGESTED_INSTITUTES = [
  'Government Polytechnic College, Bathinda',
  'Government Polytechnic College, Mansa',
  'Government Polytechnic College, Muktsar',
  'Government Polytechnic College, Fazilka',
  'Government Polytechnic College, Ferozepur',
  'Government Polytechnic College, Kotkapura',
  'Baba Farid Polytechnic College, Deon, Bathinda',
  'Malwa Polytechnic College, Faridkot',
  'Akal Polytechnic College, Talwandi Sabo',
  'Adesh Polytechnic College, Muktsar',
  'Guru Gobind Singh Polytechnic College, Talwandi Sabo'
];

export const SEMESTER_OPTIONS = [
  '1st Sem',
  '2nd Sem',
  '3rd Sem',
  '4th Sem',
  '5th Sem',
  '6th Sem',
  '7th Sem',
  '8th Sem'
];

export const PHARMACY_YEAR_OPTIONS = [
  '1st Year',
  '2nd Year'
];

export const createEmptyStudent = (order = 1) => ({
  id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  order,
  name: '',
  contact: '',
  registrationNo: '',
  department: '',
  departmentOther: '',
  semester: ''
});

export const createEmptyTeam = (teamNumber = 1) => ({
  teamNumber,
  mentorName: '',
  mentorContact: '',
  projectTitle: '',
  projectTheme: '',
  projectThemeOther: '',
  projectDescription: '',
  studentsCount: 3,
  students: [
    createEmptyStudent(1),
    createEmptyStudent(2),
    createEmptyStudent(3)
  ]
});
