import React from 'react';
import {
  Users2,
  Lightbulb,
  UserCheck,
  Phone,
  FileText,
  Tag,
  PlusCircle,
  FolderKanban,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { PROJECT_THEMES } from '../lib/constants';
import { StudentCard } from './StudentCard';

export const TeamSection = ({
  team,
  teamIndex,
  totalTeams,
  isDualColumn = false,
  errors,
  onTeamFieldChange,
  onStudentChange,
  onAddStudent,
  onRemoveStudent,
  onSetStudentsCount
}) => {
  const isTeam1 = teamIndex === 0;
  const teamLabel = `Team ${teamIndex + 1}`;
  const accentBorder = isTeam1 ? 'border-blue-300' : 'border-indigo-300';
  const badgeColor = isTeam1 ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white';

  return (
    <div
      id={`section-team-${teamIndex + 1}`}
      className={`bg-white rounded-2xl shadow-sm border-2 ${accentBorder} p-4 sm:p-6 transition-all scroll-mt-24`}
    >
      {/* Team Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${badgeColor}`}>
            <FolderKanban className="w-4 h-4" />
            {teamLabel}
          </span>
          <span className="text-sm font-bold text-slate-800 hidden sm:inline">
            Project Proposal & Student Roster
          </span>
          {totalTeams === 2 && (
            <span className="text-xs text-slate-400 font-medium">
              ({teamIndex + 1} of 2 Teams)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            {team.students.length} Student{team.students.length > 1 ? 's' : ''} Enrolled
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Part A: Mentor Details */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
              A
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
              Faculty Mentor / Guide Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            {/* Mentor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mentor Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={team.mentorName}
                  onChange={(e) => onTeamFieldChange(teamIndex, 'mentorName', e.target.value)}
                  placeholder="e.g. Prof. Harpreet Kaur"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${
                    errors[`team_${teamIndex}_mentorName`] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                  } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white`}
                />
              </div>
              {errors[`team_${teamIndex}_mentorName`] && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors[`team_${teamIndex}_mentorName`]}</p>
              )}
            </div>

            {/* Mentor Contact */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mentor Contact (Phone/Email) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={team.mentorContact}
                  onChange={(e) => onTeamFieldChange(teamIndex, 'mentorContact', e.target.value)}
                  placeholder="e.g. 9812345678 or mentor@college.edu"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${
                    errors[`team_${teamIndex}_mentorContact`] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                  } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white`}
                />
              </div>
              {errors[`team_${teamIndex}_mentorContact`] && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors[`team_${teamIndex}_mentorContact`]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Part B: Project Concept & Theme */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-xs">
              B
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
              Project Concept & Theme
            </h3>
          </div>

          <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3.5">
            {/* Title & Theme side-by-side on wide screens */}
            <div className={`grid grid-cols-1 ${isDualColumn ? 'gap-3' : 'lg:grid-cols-12 gap-3.5'}`}>
              {/* Project Title */}
              <div className={isDualColumn ? '' : 'lg:col-span-7'}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project Title / Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={team.projectTitle}
                    onChange={(e) => onTeamFieldChange(teamIndex, 'projectTitle', e.target.value)}
                    placeholder="e.g. Solar-Powered Smart Precision Irrigation System for Malwa Belt"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${
                      errors[`team_${teamIndex}_projectTitle`] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white`}
                  />
                </div>
                {errors[`team_${teamIndex}_projectTitle`] && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors[`team_${teamIndex}_projectTitle`]}</p>
                )}
              </div>

              {/* Theme Dropdown */}
              <div className={isDualColumn ? '' : 'lg:col-span-5'}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Competition Theme <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <select
                    value={team.projectTheme}
                    onChange={(e) => onTeamFieldChange(teamIndex, 'projectTheme', e.target.value)}
                    className={`w-full pl-9 pr-8 py-2.5 rounded-xl border ${
                      errors[`team_${teamIndex}_projectTheme`] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    } text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm appearance-none truncate`}
                  >
                    <option value="">-- Select Project Theme --</option>
                    {PROJECT_THEMES.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
                {errors[`team_${teamIndex}_projectTheme`] && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors[`team_${teamIndex}_projectTheme`]}</p>
                )}
              </div>
            </div>

            {/* If 'Others' theme is selected */}
            {team.projectTheme === 'Others' && (
              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1.5">
                  Specify Other Theme <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={team.projectThemeOther || ''}
                  onChange={(e) => onTeamFieldChange(teamIndex, 'projectThemeOther', e.target.value)}
                  placeholder="Specify domain/theme..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    errors[`team_${teamIndex}_projectThemeOther`] ? 'border-red-400 bg-red-50/40' : 'border-amber-300'
                  } bg-amber-50/40 text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none`}
                />
                {errors[`team_${teamIndex}_projectThemeOther`] && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors[`team_${teamIndex}_projectThemeOther`]}</p>
                )}
              </div>
            )}

            {/* Project Brief Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Project Brief Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {team.projectDescription ? team.projectDescription.length : 0} chars
                </span>
              </div>
              <textarea
                rows={3}
                value={team.projectDescription}
                onChange={(e) => onTeamFieldChange(teamIndex, 'projectDescription', e.target.value)}
                placeholder="Briefly describe problem statement, working prototype, hardware/software tools used, and novelty (minimum 25 characters)..."
                className={`w-full p-3 rounded-xl border ${
                  errors[`team_${teamIndex}_projectDescription`] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm leading-relaxed bg-white`}
              />
              {errors[`team_${teamIndex}_projectDescription`] && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors[`team_${teamIndex}_projectDescription`]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Part C: Participating Students */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                C
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                Participating Students ({team.students.length})
              </h3>
            </div>

            {/* Student count & Add student toolbar */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-1.5">Count:</span>
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => onSetStudentsCount(teamIndex, cnt)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                      team.students.length === cnt
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              {team.students.length < 6 && (
                <button
                  type="button"
                  onClick={() => onAddStudent(teamIndex)}
                  className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Add another student"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Student</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-3.5">
            Student 1 is the designated Team Leader. Fill details for all enrolled members.
          </p>

          {/* MULTI-COLUMN STUDENT CARDS GRID: Fills the entire screen width! */}
          <div className={`grid grid-cols-1 ${isDualColumn ? 'sm:grid-cols-2 xl:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'} gap-3.5`}>
            {team.students.map((student, sIdx) => (
              <StudentCard
                key={student.id || sIdx}
                student={student}
                index={sIdx}
                teamIndex={teamIndex}
                canRemove={team.students.length > 1}
                onStudentChange={onStudentChange}
                onRemoveStudent={onRemoveStudent}
                errors={errors}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
