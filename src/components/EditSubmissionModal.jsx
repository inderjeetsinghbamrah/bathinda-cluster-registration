import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  User,
  Phone,
  Mail,
  BookOpen,
  FolderKanban,
  GraduationCap,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  PROJECT_THEMES,
  DEPARTMENTS,
  SEMESTER_OPTIONS,
  PHARMACY_YEAR_OPTIONS
} from '../lib/constants';

export const EditSubmissionModal = ({
  isOpen = false,
  submission = null,
  authToken = '',
  onClose = () => {},
  onSave = () => {}
}) => {
  if (!isOpen || !submission) return null;

  // Form State
  const [instituteName, setInstituteName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalContact, setPrincipalContact] = useState('');
  const [teams, setTeams] = useState([]);
  const [activeTeamTab, setActiveTeamTab] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form state when submission prop changes
  useEffect(() => {
    if (!submission) return;

    setInstituteName(submission.institute_name || '');
    setPrincipalName(submission.principal_name || '');
    setPrincipalContact(submission.principal_contact || '');
    setErrorMessage('');
    setSuccessMessage('');

    // Teams initialization
    const rawTeams = submission.raw_payload?.teams || [];
    const dbTeams = submission.competition_teams || [];

    const initializedTeams = dbTeams.map((t, tIdx) => {
      const rawTeam =
        rawTeams.find((rt) => rt.teamNumber === t.team_number) ||
        rawTeams[t.team_number ? t.team_number - 1 : tIdx] ||
        {};
      const rawStudents = rawTeam.students || [];
      const dbStudents = t.competition_students || [];

      const students = dbStudents.map((st, sIdx) => {
        const rawSt =
          rawStudents.find(
            (rs) =>
              (rs.registrationNo && rs.registrationNo === st.registration_no) ||
              (rs.name && rs.name.trim().toLowerCase() === st.student_name?.trim().toLowerCase())
          ) || rawStudents[st.student_order ? st.student_order - 1 : sIdx];

        return {
          id: st.id,
          studentOrder: st.student_order || sIdx + 1,
          studentName: st.student_name || rawSt?.name || '',
          registrationNo: st.registration_no || rawSt?.registrationNo || '',
          department: st.department || rawSt?.department || '',
          departmentOther: st.department_other || rawSt?.departmentOther || '',
          semester: st.semester || rawSt?.semester || '1st Sem',
          contact: st.contact_number || rawSt?.contact || '',
          email: st.email || rawSt?.email || ''
        };
      });

      return {
        id: t.id,
        teamNumber: t.team_number || tIdx + 1,
        projectTitle: t.project_title || rawTeam.projectTitle || '',
        projectTheme: t.project_theme || rawTeam.projectTheme || 'Others',
        projectThemeOther: t.project_theme_other || rawTeam.projectThemeOther || '',
        mentorName: t.mentor_name || rawTeam.mentorName || '',
        mentorContact: t.mentor_contact || rawTeam.mentorContact || '',
        projectDescription: t.project_description || rawTeam.projectDescription || '',
        students
      };
    });

    setTeams(initializedTeams);
    setActiveTeamTab(0);
  }, [submission]);

  // Handle Team field changes
  const handleTeamChange = (teamIdx, field, value) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx] = {
        ...updated[teamIdx],
        [field]: value
      };
      return updated;
    });
  };

  // Handle Student field changes
  const handleStudentChange = (teamIdx, studentIdx, field, value) => {
    setTeams((prev) => {
      const updated = [...prev];
      const team = { ...updated[teamIdx] };
      const students = [...team.students];
      students[studentIdx] = {
        ...students[studentIdx],
        [field]: value
      };
      team.students = students;
      updated[teamIdx] = team;
      return updated;
    });
  };

  // Add new student to team (max 4)
  const handleAddStudent = (teamIdx) => {
    const currentTeam = teams[teamIdx];
    if (currentTeam.students.length >= 4) {
      alert('A maximum of 4 students is permitted per team.');
      return;
    }

    const newOrder = currentTeam.students.length + 1;
    const newStudent = {
      id: null, // new student
      studentOrder: newOrder,
      studentName: '',
      registrationNo: '',
      department: currentTeam.students[0]?.department || 'Computer Science & Engineering',
      departmentOther: '',
      semester: '5th Sem',
      contact: '',
      email: ''
    };

    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx] = {
        ...updated[teamIdx],
        students: [...updated[teamIdx].students, newStudent]
      };
      return updated;
    });
  };

  // Remove student from team (min 1)
  const handleRemoveStudent = (teamIdx, studentIdx) => {
    const currentTeam = teams[teamIdx];
    if (currentTeam.students.length <= 1) {
      alert('A team must have at least 1 student member.');
      return;
    }

    setTeams((prev) => {
      const updated = [...prev];
      const team = { ...updated[teamIdx] };
      team.students = team.students
        .filter((_, idx) => idx !== studentIdx)
        .map((st, idx) => ({ ...st, studentOrder: idx + 1 }));
      updated[teamIdx] = team;
      return updated;
    });
  };

  // Validate form before saving
  const validateForm = () => {
    if (!instituteName.trim()) return 'Institute Name is required.';
    if (!principalName.trim()) return 'Principal Name is required.';
    if (!principalContact.trim()) return 'Principal Contact Number is required.';

    for (let tIdx = 0; tIdx < teams.length; tIdx++) {
      const t = teams[tIdx];
      const tNum = t.teamNumber || tIdx + 1;
      if (!t.projectTitle.trim()) return `Team ${tNum}: Project Title is required.`;
      if (!t.mentorName.trim()) return `Team ${tNum}: Mentor Name is required.`;
      if (!t.mentorContact.trim()) return `Team ${tNum}: Mentor Contact Number is required.`;

      if (t.students.length === 0) return `Team ${tNum} must have at least 1 student.`;

      for (let sIdx = 0; sIdx < t.students.length; sIdx++) {
        const s = t.students[sIdx];
        if (!s.studentName.trim()) return `Team ${tNum}, Student #${sIdx + 1}: Name is required.`;
        if (!s.registrationNo.trim()) return `Team ${tNum}, Student #${sIdx + 1}: Roll / Registration No. is required.`;
      }
    }

    return null;
  };

  // Submit update to backend API
  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        submissionId: submission.id,
        instituteName: instituteName.trim(),
        principalName: principalName.trim(),
        principalContact: principalContact.trim(),
        teams: teams.map((t) => ({
          id: t.id,
          teamNumber: t.teamNumber,
          projectTitle: t.projectTitle.trim(),
          projectTheme: t.projectTheme,
          projectThemeOther: t.projectTheme === 'Others' ? (t.projectThemeOther || '').trim() : null,
          mentorName: t.mentorName.trim(),
          mentorContact: t.mentorContact.trim(),
          projectDescription: (t.projectDescription || '').trim(),
          students: t.students.map((st, sIdx) => ({
            id: st.id,
            studentOrder: sIdx + 1,
            studentName: st.studentName.trim(),
            registrationNo: st.registrationNo.trim(),
            department: st.department,
            departmentOther: st.department === 'Others' ? (st.departmentOther || '').trim() : null,
            semester: st.semester,
            contact: st.contact.trim(),
            email: (st.email || '').trim().toLowerCase()
          }))
        }))
      };

      const res = await fetch('/api/admin/update-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update submission.');
      }

      setSuccessMessage('Entry updated successfully in database!');
      if (onSave) {
        onSave(data.data);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Update error:', err);
      setErrorMessage(err.message || 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  {submission.submission_code}
                </span>
                <span className="text-xs text-slate-400">
                  Registered: {new Date(submission.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Edit Submission &bull; {instituteName || submission.institute_name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close editor without saving"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: INSTITUTE & PRINCIPAL DETAILS */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Institute &amp; Principal Authority</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Name of Institution *
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="Government Polytechnic College..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Principal Name *
                </label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Dr. / Er. Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Principal Contact No. *
                </label>
                <input
                  type="text"
                  value={principalContact}
                  onChange={(e) => setPrincipalContact(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TEAMS TABS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {teams.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTeamTab(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                      activeTeamTab === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Team {t.teamNumber || idx + 1}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTeamTab === idx ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.students.length}
                    </span>
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Total Teams: {teams.length}
              </span>
            </div>

            {/* ACTIVE TEAM CARD */}
            {teams[activeTeamTab] && (
              <div className="bg-white rounded-2xl border-2 border-blue-500/30 p-4 sm:p-5 shadow-sm space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Project Idea / Title of Innovation *
                    </label>
                    <input
                      type="text"
                      value={teams[activeTeamTab].projectTitle}
                      onChange={(e) =>
                        handleTeamChange(activeTeamTab, 'projectTitle', e.target.value)
                      }
                      placeholder="e.g. Smart IoT Crop Irrigation System"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-extrabold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  {/* Project Theme */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Thematic Domain *
                    </label>
                    <select
                      value={teams[activeTeamTab].projectTheme}
                      onChange={(e) =>
                        handleTeamChange(activeTeamTab, 'projectTheme', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {PROJECT_THEMES.map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>

                    {teams[activeTeamTab].projectTheme === 'Others' && (
                      <input
                        type="text"
                        value={teams[activeTeamTab].projectThemeOther || ''}
                        onChange={(e) =>
                          handleTeamChange(activeTeamTab, 'projectThemeOther', e.target.value)
                        }
                        placeholder="Specify Theme Details..."
                        className="mt-2 w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    )}
                  </div>

                  {/* Mentor Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mentor Name *
                      </label>
                      <input
                        type="text"
                        value={teams[activeTeamTab].mentorName}
                        onChange={(e) =>
                          handleTeamChange(activeTeamTab, 'mentorName', e.target.value)
                        }
                        placeholder="Er. / Prof. Name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mentor Contact *
                      </label>
                      <input
                        type="text"
                        value={teams[activeTeamTab].mentorContact}
                        onChange={(e) =>
                          handleTeamChange(activeTeamTab, 'mentorContact', e.target.value)
                        }
                        placeholder="Mobile No."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Project Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Project Abstract / Brief Summary
                    </label>
                    <textarea
                      rows={2}
                      value={teams[activeTeamTab].projectDescription || ''}
                      onChange={(e) =>
                        handleTeamChange(activeTeamTab, 'projectDescription', e.target.value)
                      }
                      placeholder="Brief description of the problem solved and innovation..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* STUDENTS ROSTER FOR THIS TEAM */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Enrolled Students ({teams[activeTeamTab].students.length} / 4)</span>
                    </h5>

                    {teams[activeTeamTab].students.length < 4 && (
                      <button
                        type="button"
                        onClick={() => handleAddStudent(activeTeamTab)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Student</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {teams[activeTeamTab].students.map((st, sIdx) => {
                      const isPharmacy = st.department === 'D-Pharmacy';

                      return (
                        <div
                          key={st.id || sIdx}
                          className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-[10px]">
                                {sIdx + 1}
                              </span>
                              <span>{sIdx === 0 ? 'Team Leader' : `Student #${sIdx + 1}`}</span>
                            </span>

                            {teams[activeTeamTab].students.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(activeTeamTab, sIdx)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                                title="Remove this student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Student Name */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={st.studentName}
                                onChange={(e) =>
                                  handleStudentChange(
                                    activeTeamTab,
                                    sIdx,
                                    'studentName',
                                    e.target.value
                                  )
                                }
                                placeholder="Student Name"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>

                            {/* Roll No */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Roll / Registration No. *
                              </label>
                              <input
                                type="text"
                                value={st.registrationNo}
                                onChange={(e) =>
                                  handleStudentChange(
                                    activeTeamTab,
                                    sIdx,
                                    'registrationNo',
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. 240195301968"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>

                            {/* Department */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Branch / Department *
                              </label>
                              <select
                                value={st.department}
                                onChange={(e) =>
                                  handleStudentChange(
                                    activeTeamTab,
                                    sIdx,
                                    'department',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {DEPARTMENTS.map((dept) => (
                                  <option key={dept} value={dept}>
                                    {dept}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Semester */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Semester / Year *
                              </label>
                              <select
                                value={st.semester}
                                onChange={(e) =>
                                  handleStudentChange(
                                    activeTeamTab,
                                    sIdx,
                                    'semester',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {(isPharmacy ? PHARMACY_YEAR_OPTIONS : SEMESTER_OPTIONS).map(
                                  (sem) => (
                                    <option key={sem} value={sem}>
                                      {sem}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            {/* Contact Phone */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Mobile No.
                              </label>
                              <input
                                type="text"
                                value={st.contact}
                                onChange={(e) =>
                                  handleStudentChange(
                                    activeTeamTab,
                                    sIdx,
                                    'contact',
                                    e.target.value
                                  )
                                }
                                placeholder="10-digit mobile"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Email */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={st.email}
                                onChange={(e) =>
                                  handleStudentChange(activeTeamTab, sIdx, 'email', e.target.value)
                                }
                                placeholder="student@example.com"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-blue-200" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
