import React from 'react';
import { Award, Lock } from 'lucide-react';

export const Navbar = ({ isClosed = false, onAdminClick = null }) => {
  const handleAdminNavigate = (e) => {
    if (onAdminClick) {
      e.preventDefault();
      onAdminClick();
    } else {
      window.location.href = '/admin-cluster-access';
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-3 sm:py-3.5 flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-3 hover:opacity-95 transition">
          <img
            src="/institute-logo.svg"
            alt="Government Polytechnic College Bathinda"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-full bg-white p-0.5 shadow-md flex-shrink-0 ring-2 ring-white/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Bathinda Cluster
              </span>
              <span className="text-[10px] sm:text-xs text-amber-300 font-semibold hidden xs:inline">
                Polytechnic Competition
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold leading-tight text-white line-clamp-1">
              Project Registration Portal
            </h1>
          </div>
        </a>

        <div className="flex items-center gap-2.5">
          {isClosed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              <span className="hidden sm:inline">Registration:</span> Closed
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Portal Open
            </span>
          )}

          <a
            href="/admin-cluster-access"
            onClick={handleAdminNavigate}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/15 flex items-center gap-1.5 transition cursor-pointer"
            title="Administrator & Organizer Sign In"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Admin</span> Access
          </a>

          <span className="text-[11px] sm:text-xs font-semibold text-blue-100 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 hidden md:inline">
            Punjab Technical Education
          </span>
        </div>
      </div>
    </header>
  );
};
