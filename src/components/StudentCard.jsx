import React from 'react';
import { User, Phone, Hash, GraduationCap, Calendar, Trash2 } from 'lucide-react';
import { DEPARTMENTS, SEMESTER_OPTIONS, PHARMACY_YEAR_OPTIONS } from '../lib/constants';

export const StudentCard = ({
  student,
  index,
  teamIndex,
  canRemove,
  onStudentChange,
  onRemoveStudent,
  errors = {}
}) => {
  const isPharmacy = student.department === 'D-Pharmacy';

  const handleDepartmentChange = (val) => {
    onStudentChange(teamIndex, index, 'department', val);
    if (val === 'D-Pharmacy' && student.semester && !PHARMACY_YEAR_OPTIONS.includes(student.semester)) {
      onStudentChange(teamIndex, index, 'semester', '');
    } else if (val !== 'D-Pharmacy' && PHARMACY_YEAR_OPTIONS.includes(student.semester)) {
      onStudentChange(teamIndex, index, 'semester', '');
    }
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all p-3.5 sm:p-4 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-2xs">
              {index + 1}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Student #{index + 1} {index === 0 ? <span className="text-blue-700 font-extrabold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Leader</span> : <span className="text-slate-400 font-normal text-xs">(Member)</span>}
            </span>
          </div>

          {canRemove && (
            <button
              type="button"
              onClick={() => onRemoveStudent(teamIndex, index)}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition active:scale-95"
              title="Remove Student"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Remove</span>
            </button>
          )}
        </div>

        {/* Form Fields: 2-column or stacked inside each student tile */}
        <div className="space-y-3">
          {/* Student Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Student Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={student.name}
                onChange={(e) => onStudentChange(teamIndex, index, 'name', e.target.value)}
                placeholder="e.g. Amanpreet Singh"
                className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                  errors[`team_${teamIndex}_student_${index}_name`]
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300'
                } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs`}
              />
            </div>
            {errors[`team_${teamIndex}_student_${index}_name`] && (
              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                {errors[`team_${teamIndex}_student_${index}_name`]}
              </p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="tel"
                value={student.contact}
                onChange={(e) => onStudentChange(teamIndex, index, 'contact', e.target.value)}
                placeholder="10-digit mobile number"
                className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                  errors[`team_${teamIndex}_student_${index}_contact`]
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300'
                } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs`}
              />
            </div>
            {errors[`team_${teamIndex}_student_${index}_contact`] && (
              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                {errors[`team_${teamIndex}_student_${index}_contact`]}
              </p>
            )}
          </div>

          {/* Registration No / Roll No */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Reg. / Roll No. <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={student.registrationNo}
                onChange={(e) => onStudentChange(teamIndex, index, 'registrationNo', e.target.value)}
                placeholder="e.g. 230485729101"
                className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                  errors[`team_${teamIndex}_student_${index}_registrationNo`]
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300'
                } text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-mono`}
              />
            </div>
            {errors[`team_${teamIndex}_student_${index}_registrationNo`] && (
              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                {errors[`team_${teamIndex}_student_${index}_registrationNo`]}
              </p>
            )}
          </div>

          {/* Department / Branch */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Department / Branch <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <select
                value={student.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className={`w-full pl-8 pr-7 py-2 rounded-lg border ${
                  errors[`team_${teamIndex}_student_${index}_department`]
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300'
                } text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs appearance-none truncate`}
              >
                <option value="">-- Select Branch --</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            {errors[`team_${teamIndex}_student_${index}_department`] && (
              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                {errors[`team_${teamIndex}_student_${index}_department`]}
              </p>
            )}
          </div>

          {/* If 'Others' department selected */}
          {student.department === 'Others' && (
            <div className="pt-0.5">
              <label className="block text-[11px] font-bold text-amber-800 mb-1">
                Specify Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={student.departmentOther || ''}
                onChange={(e) => onStudentChange(teamIndex, index, 'departmentOther', e.target.value)}
                placeholder="e.g. Architectural Assistantship..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          {/* Semester / Year Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                {isPharmacy ? 'Year of Study' : 'Current Semester'} <span className="text-red-500">*</span>
              </label>
              {isPharmacy && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Annual Mode
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <select
                value={student.semester || ''}
                onChange={(e) => onStudentChange(teamIndex, index, 'semester', e.target.value)}
                className={`w-full pl-8 pr-7 py-2 rounded-lg border ${
                  errors[`team_${teamIndex}_student_${index}_semester`]
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-slate-300'
                } text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs appearance-none`}
              >
                <option value="">
                  {isPharmacy ? '-- Select Pharmacy Year --' : '-- Select Semester --'}
                </option>
                {isPharmacy
                  ? PHARMACY_YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))
                  : SEMESTER_OPTIONS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            {errors[`team_${teamIndex}_student_${index}_semester`] && (
              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                {errors[`team_${teamIndex}_student_${index}_semester`]}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
