import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  FolderKanban,
  Users,
  Send,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const ProgressSidebar = ({
  formData,
  isSubmitting,
  onSubmit,
  isSupabaseConfigured
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

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="sticky top-20 space-y-4">
      {/* Progress & Quick Nav Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Form Progress
            </h3>
          </div>
          <span className="text-sm font-extrabold text-blue-700">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Live Checklist */}
        <div className="space-y-2.5 text-xs">
          {/* Institute Section Link */}
          <button
            type="button"
            onClick={() => scrollToSection('section-institute')}
            className="w-full p-2.5 rounded-xl text-left transition flex items-center justify-between hover:bg-slate-50 border border-transparent hover:border-slate-200 group"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 group-hover:text-blue-700">
                  Institute Details
                </p>
                <p className="text-[10px] text-slate-500">
                  {formData.instituteName ? (
                    <span className="truncate block max-w-[140px]">{formData.instituteName}</span>
                  ) : (
                    'Not specified'
                  )}
                </p>
              </div>
            </div>
            {formData.instituteName && formData.principalName && formData.principalContact ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Team 1 Section Link */}
          <button
            type="button"
            onClick={() => scrollToSection('section-team-1')}
            className="w-full p-2.5 rounded-xl text-left transition flex items-center justify-between hover:bg-blue-50/50 border border-transparent hover:border-blue-200 group"
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 group-hover:text-blue-700">
                  Team 1 Details
                </p>
                <p className="text-[10px] text-slate-500">
                  {formData.teams[0]?.students.length || 0} students &bull; {formData.teams[0]?.projectTheme || 'Theme pending'}
                </p>
              </div>
            </div>
            {formData.teams[0]?.projectTitle && formData.teams[0]?.mentorName ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Team 2 Section Link (if selected) */}
          {formData.teamsCount === 2 && (
            <button
              type="button"
              onClick={() => scrollToSection('section-team-2')}
              className="w-full p-2.5 rounded-xl text-left transition flex items-center justify-between hover:bg-indigo-50/50 border border-transparent hover:border-indigo-200 group"
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-indigo-700">
                    Team 2 Details
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formData.teams[1]?.students.length || 0} students &bull; {formData.teams[1]?.projectTheme || 'Theme pending'}
                  </p>
                </div>
              </div>
              {formData.teams[1]?.projectTitle && formData.teams[1]?.mentorName ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          )}
        </div>

        {/* Desktop Quick Submit Button */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting Entry...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit All Details</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-2">
            {formData.teamsCount} {formData.teamsCount === 1 ? 'Team' : 'Teams'} &bull; {totalStudents} Students Total
          </p>
        </div>
      </div>

      {/* Summary Info Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span>Bathinda Cluster Info</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
            2026 Edition
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Polytechnic institutions can register maximum 2 project teams. Ensure all student registration numbers match Punjab State Board of Technical Education records.
        </p>
      </div>
    </aside>
  );
};
