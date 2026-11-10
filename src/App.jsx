import React, { useState, useEffect } from 'react';
import {
  Send,
  AlertCircle,
  FolderKanban,
  Award,
  Sparkles,
  Columns2,
  Rows3
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { InstituteSection } from './components/InstituteSection';
import { TeamSection } from './components/TeamSection';
import { SubmissionReceipt } from './components/SubmissionReceipt';
import { StatusBar } from './components/StatusBar';
import { AdminPortal } from './components/AdminPortal';
import { createEmptyTeam, createEmptyStudent } from './lib/constants';
import { submitProjectForm } from './lib/supabase';

export function App() {
  const [isAdminView, setIsAdminView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('admin-cluster-access') ||
      window.location.hash.includes('admin-cluster-access') ||
      window.location.search.includes('admin=cluster')
    );
  });

  useEffect(() => {
    const checkRoute = () => {
      setIsAdminView(
        window.location.pathname.includes('admin-cluster-access') ||
        window.location.hash.includes('admin-cluster-access') ||
        window.location.search.includes('admin=cluster')
      );
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const [formData, setFormData] = useState({
    instituteName: '',
    principalName: '',
    principalContact: '',
    teamsCount: 1,
    teams: [createEmptyTeam(1)]
  });

  const [desktopLayoutMode, setDesktopLayoutMode] = useState('dual'); // 'dual' (side-by-side) or 'stacked'
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
        // Add Team 2
        updatedTeams.push(createEmptyTeam(2));
      } else if (count === 1 && updatedTeams.length > 1) {
        // Keep only Team 1
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

      // Re-order remaining students
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
        if (!st.registrationNo.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_registrationNo`] = 'Registration / Roll No is required.';
        }
        if (!st.department) {
          errs[`team_${tIdx}_student_${sIdx}_department`] = 'Select department.';
        } else if (st.department === 'Others' && !st.departmentOther?.trim()) {
          errs[`team_${tIdx}_student_${sIdx}_department`] = 'Specify department.';
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
      // Find first error and scroll to it
      const firstErrorEl = document.querySelector('.border-red-400');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitProjectForm(formData);
      setSubmissionSuccessData({
        ...formData,
        submissionCode: result.submissionCode,
        timestamp: result.timestamp,
        mode: result.mode
      });
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

  if (isAdminView) {
    return <AdminPortal />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 sm:pb-16">
        {submissionSuccessData ? (
          <SubmissionReceipt
            submissionData={submissionSuccessData}
            onResetForm={handleReset}
          />
        ) : (
          <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5">
            {/* Hero / Information Banner */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 text-white rounded-2xl p-4 sm:p-6 mb-4 shadow-md relative overflow-hidden">
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
                      Bathinda Cluster Polytechnic Project Competition 2026
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight">
                      Project Registration Portal
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-3xl leading-relaxed">
                      Official project entry form for polytechnic institutes competing at the Bathinda Cluster.
                      Enter 1 or 2 project teams with complete student details. No login required.
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
                      <span className="text-[10px] uppercase tracking-wider text-blue-200 block">Registered</span>
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
                /* Widescreen 2-Team Dual Column Grid (Left: Team 1, Right: Team 2) */
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
                /* Full-Width Stacked View (Works for 1 Team or Stacked 2 Teams) */
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
                    Ready to complete submission?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Registering {formData.teamsCount} {formData.teamsCount === 1 ? 'team' : 'teams'} ({totalStudents} students total across your institute)
                  </p>
                </div>

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
                      <span>Submit Project Details</span>
                    </>
                  )}
                </button>
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
