import React from 'react';
import { Building2, FolderKanban } from 'lucide-react';

export const MobileQuickNav = ({ teamsCount, teams }) => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="lg:hidden sticky top-[57px] sm:top-[65px] z-20 bg-slate-100/90 backdrop-blur-md py-2 px-1 mb-4 border-b border-slate-200/80 -mx-4 px-4 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        <button
          type="button"
          onClick={() => scrollTo('section-institute')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700 active:scale-95 transition"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Institute</span>
        </button>

        <button
          type="button"
          onClick={() => scrollTo('section-team-1')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-2xs text-xs font-bold text-blue-800 active:scale-95 transition"
        >
          <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
          <span>Team 1 ({teams[0]?.students.length || 0})</span>
        </button>

        {teamsCount === 2 && (
          <button
            type="button"
            onClick={() => scrollTo('section-team-2')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 shadow-2xs text-xs font-bold text-indigo-800 active:scale-95 transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
            <span>Team 2 ({teams[1]?.students.length || 0})</span>
          </button>
        )}
      </div>
    </div>
  );
};
