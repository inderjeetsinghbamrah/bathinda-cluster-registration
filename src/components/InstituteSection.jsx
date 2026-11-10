import React from 'react';
import { School, UserCheck, Phone, Users, CheckCircle2, Building2 } from 'lucide-react';
import { SUGGESTED_INSTITUTES } from '../lib/constants';

export const InstituteSection = ({
  formData,
  errors,
  onChange,
  onTeamCountChange
}) => {
  return (
    <div id="section-institute" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 mb-6 scroll-mt-24">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">1. Institute Details</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Provide official polytechnic institute and principal information
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
          Step 1 of 2
        </span>
      </div>

      {/* Responsive Input Grid: 1 col on mobile, 2 cols on tablet, 12 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Institute Name: spans 12 cols on mobile/tablet, 6 cols on desktop */}
        <div className="md:col-span-2 lg:col-span-6">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Name of Institute <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="instituteName"
              list="institutes-list"
              value={formData.instituteName}
              onChange={onChange}
              placeholder="e.g. Government Polytechnic College, Bathinda"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.instituteName ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
              } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm`}
            />
            <datalist id="institutes-list">
              {SUGGESTED_INSTITUTES.map((inst, index) => (
                <option key={index} value={inst} />
              ))}
            </datalist>
          </div>
          {errors.instituteName && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.instituteName}</p>
          )}
        </div>

        {/* Principal Name: 1 col on tablet, 3 cols on desktop */}
        <div className="md:col-span-1 lg:col-span-3">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Principal Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="principalName"
              value={formData.principalName}
              onChange={onChange}
              placeholder="e.g. Dr. Gurpreet Singh"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                errors.principalName ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
              } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm`}
            />
          </div>
          {errors.principalName && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.principalName}</p>
          )}
        </div>

        {/* Principal Contact: 1 col on tablet, 3 cols on desktop */}
        <div className="md:col-span-1 lg:col-span-3">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Principal Contact (Phone/Email) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="principalContact"
              value={formData.principalContact}
              onChange={onChange}
              placeholder="e.g. 9876543210 or principal@gpc.ac.in"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border ${
                errors.principalContact ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
              } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm`}
            />
          </div>
          {errors.principalContact && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.principalContact}</p>
          )}
        </div>

        {/* Number of Teams Participating */}
        <div className="md:col-span-2 lg:col-span-12 pt-3 border-t border-slate-100">
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
            Number of Participating Teams <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Select how many teams your institute is sending (1 or 2). Respective team forms will automatically appear below on this page.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* 1 Team option */}
            <button
              type="button"
              onClick={() => onTeamCountChange(1)}
              className={`p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-start justify-between cursor-pointer active:scale-[0.99] ${
                formData.teamsCount === 1
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-blue-900">1 Team</span>
                  {formData.teamsCount === 1 && (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Single project submission for your institute</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  formData.teamsCount === 1
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {formData.teamsCount === 1 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* 2 Teams option */}
            <button
              type="button"
              onClick={() => onTeamCountChange(2)}
              className={`p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-start justify-between cursor-pointer active:scale-[0.99] ${
                formData.teamsCount === 2
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-blue-900">2 Teams</span>
                  {formData.teamsCount === 2 && (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Two separate project teams (Team 1 & Team 2)</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  formData.teamsCount === 2
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {formData.teamsCount === 2 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
