import React from 'react';
import {
  CheckCircle2,
  Building2,
  FolderKanban,
  Users,
  Send,
  Sparkles
} from 'lucide-react';

export const StatusBar = ({
  formData,
  isSubmitting,
  onSubmit
}) => {
  // Calculate completion percentage
  let totalTasks = 3; // Institute name, principal name, principal contact
  let completedTasks = 0;

  if (formData.instituteName.trim()) completedTasks++;
  if (formData.principalName.trim()) completedTasks++;
  if (formData.principalContact.trim()) completedTasks++;

  formData.teams.forEach((t) => {
    totalTasks += 4; // mentorName, mentorContact, projectTitle, projectTheme
    if (t.mentorName.trim()) completedTasks++;
    if (t.mentorContact.trim()) completedTasks++;
    if (t.projectTitle.trim()) completedTasks++;
    if (t.projectTheme) completedTasks++;

    t.students.forEach((s) => {
      totalTasks += 3; // student name, contact, registrationNo
      if (s.name.trim()) completedTasks++;
      if (s.contact.trim()) completedTasks++;
      if (s.registrationNo.trim()) completedTasks++;
    });
  });

  const progressPercent = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
  const totalStudents = formData.teams.reduce((acc, t) => acc + t.students.length, 0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-[58px] sm:top-[65px] z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-2.5 sm:p-3.5 mb-5 sm:mb-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Jump Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => scrollTo('section-institute')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex-shrink-0 cursor-pointer active:scale-95"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Institute</span>
            {formData.instituteName && formData.principalName && formData.principalContact ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => scrollTo('section-team-1')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition flex-shrink-0 cursor-pointer active:scale-95"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Team 1 ({formData.teams[0]?.students.length || 0})</span>
            {formData.teams[0]?.projectTitle && formData.teams[0]?.mentorName ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
            ) : null}
          </button>

          {formData.teamsCount === 2 && (
            <button
              type="button"
              onClick={() => scrollTo('section-team-2')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition flex-shrink-0 cursor-pointer active:scale-95"
            >
              <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Team 2 ({formData.teams[1]?.students.length || 0})</span>
              {formData.teams[1]?.projectTitle && formData.teams[1]?.mentorName ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
              ) : null}
            </button>
          )}
        </div>

        {/* Right: Live Progress & Fast Submit Action */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {/* Progress Percentage & Bar */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {progressPercent}% Complete
            </span>
            <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <span className="hidden lg:inline text-xs text-slate-400 font-medium">
            {formData.teamsCount} {formData.teamsCount === 1 ? 'Team' : 'Teams'} &bull; {totalStudents} Students Total
          </span>

          {/* Quick Submit Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
