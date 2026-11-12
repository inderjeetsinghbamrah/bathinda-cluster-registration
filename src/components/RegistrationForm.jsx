import React, { useState } from 'react';
import {
  Send,
  AlertCircle,
  FolderKanban,
  Award,
  Sparkles,
  Columns2,
  Rows3,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { InstituteSection } from './InstituteSection';
import { TeamSection } from './TeamSection';
import { SubmissionReceipt } from './SubmissionReceipt';
import { StatusBar } from './StatusBar';
import { createEmptyTeam, createEmptyStudent } from '../lib/constants';
import { submitProjectForm } from '../lib/supabase';

export const RegistrationForm = ({
  isAdminMode = false,
  onBackToAdmin = null,
  onSubmissionSuccess = null
}) => {
  const [formData, setFormData] = useState({
    instituteName: '',
    principalName: '',
    principalContact: '',
    teamsCount: 1,
    teams: [createEmptyTeam(1)]
  });

  const [desktopLayoutMode, setDesktopLayoutMode] = useState('dual'); // 'dual' or 'stacked'
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState(null);

  // Handle Institute Top-level fields
  const handleInstituteChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Switch between 1 and 2 teams
  const handleTeamCountChange = (count) => {
    setFormData((prev) => {
      let updatedTeams = [...prev.teams];
      if (count === 2 && updatedTeams.length === 1) {
        updatedTeams.push(createEmptyTeam(2));
      } else if (count === 1 && updatedTeams.length > 1) {
        updatedTeams = [updatedTeams[0]];
      }
      return {
        ...prev,
        teamsCount: count,
        teams: updatedTeams
      };
    });
  };

  // Handle Team field changes
  const handleTeamFieldChange = (teamIndex, field, value) => {
    setFormData((prev) => {
      const updatedTeams = [...prev.teams];
      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        [field]: value
      };
      return { ...prev, teams: updatedTeams };
    });

    const errorKey = `team_${teamIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Set number of students dynamically
  const handleSetStudentsCount = (teamIndex, count) => {
    setFormData((prev) => {
      const updatedTeams = [...prev.teams];
      const currentStudents = [...updatedTeams[teamIndex].students];

      if (count > currentStudents.length) {
        for (let i = currentStudents.length; i < count; i++) {
          currentStudents.push(createEmptyStudent(i + 1));
        }
      } else if (count < currentStudents.length) {
        currentStudents.splice(count);
      }

      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        studentsCount: count,
        students: currentStudents
      };

      return { ...prev, teams: updatedTeams };
    });
  };

  // Add a single student
  const handleAddStudent = (teamIndex) => {
    setFormData((prev) => {
      const updatedTeams = [...prev.teams];
      const currentStudents = [...updatedTeams[teamIndex].students];
      if (currentStudents.length >= 6) return prev;

      currentStudents.push(createEmptyStudent(currentStudents.length + 1));
      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        studentsCount: currentStudents.length,
        students: currentStudents
      };
      return { ...prev, teams: updatedTeams };
    });
  };

  // Remove a student
  const handleRemoveStudent = (teamIndex, studentIndex) => {
    setFormData((prev) => {
      const updatedTeams = [...prev.teams];
      const currentStudents = updatedTeams[teamIndex].students.filter((_, idx) => idx !== studentIndex);

      const reordered = currentStudents.map((st, i) => ({ ...st, order: i + 1 }));

      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        studentsCount: reordered.length,
        students: reordered
      };
      return { ...prev, teams: updatedTeams };
    });
  };

  // Handle student fields
  const handleStudentChange = (teamIndex, studentIndex, field, value) => {
    setFormData((prev) => {
      const updatedTeams = [...prev.teams];
      const currentStudents = [...updatedTeams[teamIndex].students];

      currentStudents[studentIndex] = {
        ...currentStudents[studentIndex],
        [field]: value
      };

      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        students: currentStudents
      };
      return { ...prev, teams: updatedTeams };
    });

    const errorKey = `team_${teamIndex}_student_${studentIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Validation
  const validateForm = () => {
    const errs = {};

    // 1. Validate Institute
    if (!formData.instituteName.trim()) {
      errs.instituteName = 'Institute name is required.';
    }
    if (!formData.principalName.trim()) {
      errs.principalName = 'Principal name is required.';
    }
    if (!formData.principalContact.trim()) {
      errs.principalContact = 'Principal contact number or email is required.';
    }

    // 2. Validate Teams
    formData.teams.forEach((team, tIdx) => {
      if (!team.mentorName.trim()) {
        errs[`team_${tIdx}_mentorName`] = 'Mentor name is required.';
      }
      if (!team.mentorContact.trim()) {
        errs[`team_${tIdx}_mentorContact`] = 'Mentor contact is required.';
      }
      if (!team.projectTitle.trim()) {
        errs[`team_${tIdx}_projectTitle`] = 'Project title is required.';
      }
      if (!team.projectTheme) {
        errs[`team_${tIdx}_projectTheme`] = 'Please select a project theme.';
      } else if (team.projectTheme === 'Others' && !team.projectThemeOther?.trim()) {
        errs[`team_${tIdx}_projectThemeOther`] = 'Please specify the theme name.';
      }

      if (!team.projectDescription.trim()) {
        errs[`team_${tIdx}_projectDescription`] = 'Project brief description is required.';
      } else if (team.projectDescription.trim().length < 25) {
        errs[`team_${tIdx}_projectDescription`] = 'Please write at least 25 characters for description.';
      }

      // Validate Students
      team.students.forEach((st, sIdx) => {
        if (!st.name.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_name`] = 'Student name is required.';
        }
        if (!st.contact.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_contact`] = 'Contact number is required.';
        }
        if (!st.email?.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_email`] = 'Student email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(st.email.trim())) {
          errs[`team_${tIdx}_student_${sIdx}_email`] = 'Enter a valid email address.';
        }
        if (!st.registrationNo.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_registrationNo`] = 'Registration / Roll No is required.';
        }
        if (!st.department) {
          errs[`team_${tIdx}_student_${sIdx}_department`] = 'Select department.';
        } else if (st.department === 'Others' && !st.departmentOther?.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_department`] = 'Specify department.';
        }
        if (!st.semester) {
          errs[`team_${tIdx}_student_${sIdx}_semester`] = st.department === 'D-Pharmacy' ? 'Select year of study.' : 'Select semester.';
        }
      });
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateForm()) {
      const firstErrorEl = document.querySelector('.border-red-400');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitProjectForm(formData);
      const successData = {
        ...formData,
        submissionCode: result.submissionCode,
        timestamp: result.timestamp,
        mode: result.mode
      };
      setSubmissionSuccessData(successData);
      if (onSubmissionSuccess) {
        onSubmissionSuccess(successData);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(`Submission error: ${err.message || 'Failed to submit'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for another registration
  const handleReset = () => {
    setFormData({
      instituteName: '',
      principalName: '',
      principalContact: '',
      teamsCount: 1,
      teams: [createEmptyTeam(1)]
    });
    setErrors({});
    setSubmissionSuccessData(null);
  };

  const totalStudents = formData.teams.reduce((acc, t) => acc + t.students.length, 0);
  const isDualColumnMode = formData.teamsCount === 2 && desktopLayoutMode === 'dual';

  return (
    <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5">
      {/* Top Admin Back Navigation (if in Admin mode) */}
      {isAdminMode && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToAdmin}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Dashboard</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Admin Exclusive Mode
              </span>
              <span className="text-xs text-slate-300 hidden md:inline">
                Authorized Direct Entry • Public Portal Closed
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Authenticated Admin: <span className="text-amber-300 font-mono font-bold">inderjeetsinghit@gmail.com</span>
          </div>
        </div>
      )}

      {submissionSuccessData ? (
        <div className="space-y-4">
          {isAdminMode && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Project successfully recorded in Master Roster!</span>
              </div>
              <button
                type="button"
                onClick={onBackToAdmin}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Master Submissions List</span>
              </button>
            </div>
          )}

          <SubmissionReceipt
            submissionData={submissionSuccessData}
            onResetForm={handleReset}
          />

          {isAdminMode && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={onBackToAdmin}
                className="px-6 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-sm shadow-md inline-flex items-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Admin Dashboard</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Hero / Information Banner */}
          <div className={`bg-gradient-to-br ${
            isAdminMode
              ? 'from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/40'
              : 'from-blue-900 via-indigo-900 to-blue-950'
          } text-white rounded-2xl p-4 sm:p-6 mb-4 shadow-md relative overflow-hidden`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <img
                  src="/institute-logo.svg"
                  alt="Institute Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1 shadow-md flex-shrink-0 hidden xs:block ring-4 ring-white/10 object-contain"
                />
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bathinda Cluster Polytechnic Project Competition 2026</span>
                    {isAdminMode && (
                      <span className="bg-amber-400 text-blue-950 px-2 py-0.2 rounded-full font-black text-[10px] ml-1">
                        ADMIN REGISTRATION
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight">
                    {isAdminMode ? 'Direct Project Registration (Admin Authority)' : 'Project Registration Portal'}
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-3xl leading-relaxed">
                    {isAdminMode
                      ? 'Administrator-only submission interface. Add an institute, team(s), and student roster directly into the official competition database while the portal remains closed to the public.'
                      : 'Official project entry form for polytechnic institutes competing at the Bathinda Cluster. Enter 1 or 2 project teams with complete student details.'}
                  </p>
                </div>
              </div>

              {/* Right Hero Stats & Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {formData.teamsCount === 2 && (
                  <div className="hidden lg:flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 text-xs">
                    <button
                      type="button"
                      onClick={() => setDesktopLayoutMode('dual')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        desktopLayoutMode === 'dual'
                          ? 'bg-white text-blue-950 shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                      title="Side-by-Side Dual Columns"
                    >
                      <Columns2 className="w-3.5 h-3.5" />
                      Dual Columns
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesktopLayoutMode('stacked')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        desktopLayoutMode === 'stacked'
                          ? 'bg-white text-blue-950 shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                      title="Stacked View"
                    >
                      <Rows3 className="w-3.5 h-3.5" />
                      Stacked View
                    </button>
                  </div>
                )}

                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-3 py-2 rounded-xl text-xs flex items-center gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-200 block">Adding</span>
                    <span className="font-extrabold text-amber-300">{formData.teamsCount} Team{formData.teamsCount > 1 ? 's' : ''} &bull; {totalStudents} Students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative background shape */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <Award className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
            </div>
          </div>

          {/* Sticky Navigation & Live Progress Status Bar */}
          <StatusBar
            formData={formData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Section 1: Institute Information */}
            <InstituteSection
              formData={formData}
              errors={errors}
              onChange={handleInstituteChange}
              onTeamCountChange={handleTeamCountChange}
            />

            {/* Section 2: Team Forms */}
            {isDualColumnMode ? (
              <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {formData.teams.map((team, idx) => (
                    <TeamSection
                      key={team.teamNumber || idx}
                      team={team}
                      teamIndex={idx}
                      totalTeams={formData.teamsCount}
                      isDualColumn={true}
                      errors={errors}
                      onTeamFieldChange={handleTeamFieldChange}
                      onStudentChange={handleStudentChange}
                      onAddStudent={handleAddStudent}
                      onRemoveStudent={handleRemoveStudent}
                      onSetStudentsCount={handleSetStudentsCount}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 mb-6">
                {formData.teams.map((team, idx) => (
                  <TeamSection
                    key={team.teamNumber || idx}
                    team={team}
                    teamIndex={idx}
                    totalTeams={formData.teamsCount}
                    isDualColumn={false}
                    errors={errors}
                    onTeamFieldChange={handleTeamFieldChange}
                    onStudentChange={handleStudentChange}
                    onAddStudent={handleAddStudent}
                    onRemoveStudent={handleRemoveStudent}
                    onSetStudentsCount={handleSetStudentsCount}
                  />
                ))}
              </div>
            )}

            {/* Error Summary Banner if any */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 my-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">
                    Please review incomplete fields
                  </h4>
                  <p className="text-xs text-red-600 mt-0.5">
                    There are {Object.keys(errors).length} required fields highlighted in red above.
                  </p>
                </div>
              </div>
            )}

            {/* Desktop Full-Width Bottom Submit Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hidden sm:flex items-center justify-between mt-6">
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                  {isAdminMode ? 'Ready to insert project into competition database?' : 'Ready to complete submission?'}
                </h4>
                <p className="text-xs text-slate-500">
                  Registering {formData.teamsCount} {formData.teamsCount === 1 ? 'team' : 'teams'} ({totalStudents} students total across this institute)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isAdminMode && (
                  <button
                    type="button"
                    onClick={onBackToAdmin}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting to Database...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isAdminMode ? 'Submit & Record Project' : 'Submit Project Details'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Sticky Bottom Submit Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-blue-900 block truncate">
                  {formData.teamsCount} {formData.teamsCount === 1 ? 'Team' : 'Teams'} &bull; {totalStudents} Students
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {formData.instituteName || 'Tap submit when filled'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Form</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Centered Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-600">
              Bathinda Cluster Polytechnic Competition
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Department of Technical Education &amp; Industrial Training, Punjab
            </p>
          </div>
        </>
      )}
    </div>
  );
};
