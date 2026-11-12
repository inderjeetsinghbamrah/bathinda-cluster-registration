import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Printer,
  RotateCcw,
  Building2,
  UserCheck,
  Phone,
  Calendar,
  Award,
  Hash,
  GraduationCap,
  Layers,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SubmissionReceipt = ({ submissionData, onResetForm }) => {
  useEffect(() => {
    // Fire celebratory confetti on receipt display
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore if canvas-confetti fails
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const { submissionCode, timestamp, instituteName, principalName, principalContact, teamsCount, teams, mode } = submissionData;

  const formattedDate = new Date(timestamp || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Action buttons (hidden when printing) */}
      <div className="no-print bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6 mb-6 text-center shadow-sm">
        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          Registration Successfully Submitted!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
          Your project entry for the Bathinda Cluster Polytechnic Competition has been officially recorded.
        </p>

        {mode === 'local_demo' && (
          <div className="mt-3 inline-block bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
            Saved to local registry (Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to sync to cloud).
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            onClick={handlePrint}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print / Save Slip (PDF)
          </button>

          <button
            onClick={onResetForm}
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-white bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Register Another Institute
          </button>
        </div>
      </div>

      {/* Official Printable Slip Card */}
      <div className="print-receipt-card bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Slip Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 sm:p-6 print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/institute-logo.svg"
                alt="Government Polytechnic College Bathinda"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1 shadow-sm flex-shrink-0 object-contain"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-blue-950 px-2 py-0.5 rounded font-mono">
                  Official Entry Slip
                </span>
                <h1 className="text-lg sm:text-xl font-black mt-1">
                  Bathinda Cluster Polytechnic Project Competition
                </h1>
                <p className="text-xs text-blue-200 print:text-gray-600">
                  Department of Technical Education & Industrial Training, Punjab
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[11px] text-blue-200 uppercase tracking-wider block">
                Acknowledgment Code
              </span>
              <span className="text-lg sm:text-2xl font-mono font-black text-amber-300 print:text-black">
                {submissionCode}
              </span>
            </div>
          </div>
        </div>

        {/* Institute Info Box */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Institute & Administration Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 block text-[11px]">Institute Name</span>
              <span className="font-bold text-slate-800 text-sm sm:text-base">
                {instituteName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Principal / Head</span>
              <span className="font-semibold text-slate-800">{principalName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Principal Contact</span>
              <span className="font-mono text-slate-800">{principalContact}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Teams Registered</span>
              <span className="font-bold text-blue-700">{teamsCount} {teamsCount === 1 ? 'Team' : 'Teams'}</span>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 text-[11px] mr-2">Date & Time of Entry:</span>
              <span className="text-slate-700 font-medium">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Teams Details - Responsive: single column on mobile, 2-column grid on desktop if 2 teams */}
        <div className={`p-5 sm:p-6 ${teams.length === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-0' : 'space-y-6'}`}>
          {teams.map((team, tIdx) => (
            <div
              key={tIdx}
              className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white shadow-xs print:border-slate-400 print:shadow-none flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <span className="text-sm font-extrabold text-blue-900 bg-blue-100 print:bg-gray-100 px-2.5 py-1 rounded-lg">
                    Team {team.teamNumber || tIdx + 1}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                    Theme: {team.projectTheme === 'Others' ? team.projectThemeOther : team.projectTheme}
                  </span>
                </div>

                {/* Project Title & Mentor */}
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block uppercase font-bold">
                      Project Title
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-800">
                      {team.projectTitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Faculty Mentor</span>
                      <span className="font-semibold text-slate-800">{team.mentorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Mentor Contact</span>
                      <span className="font-mono text-slate-800">{team.mentorContact}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block uppercase font-bold mt-1">
                      Brief Summary
                    </span>
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{team.projectDescription}"
                    </p>
                  </div>
                </div>

                {/* Students Table */}
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-bold mb-2">
                    Student Team Members ({team.students.length})
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-2 border-black rounded-lg border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-black">
                        <tr>
                          <th className="p-2 w-8 text-center border border-black">#</th>
                          <th className="p-2 border border-black">Name</th>
                          <th className="p-2 border border-black">Roll No.</th>
                          <th className="p-2 border border-black">Branch</th>
                          <th className="p-2 border border-black">Sem / Year</th>
                          <th className="p-2 border border-black">Email</th>
                          <th className="p-2 border border-black">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-800">
                        {team.students.map((std, sIdx) => (
                          <tr key={sIdx} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-2 font-bold text-center text-slate-900 border border-black">{sIdx + 1}</td>
                            <td className="p-2 font-semibold text-slate-950 border border-black">
                              {std.name} {sIdx === 0 ? '(Leader)' : ''}
                            </td>
                            <td className="p-2 font-mono text-[11px] font-bold text-slate-900 border border-black">{std.registrationNo}</td>
                            <td className="p-2 text-[11px] border border-black">
                              {std.department === 'Others' ? std.departmentOther : std.department}
                            </td>
                            <td className="p-2 font-bold text-[11px] text-blue-900 border border-black">
                              {std.semester || '-'}
                            </td>
                            <td className="p-2 text-[11px] text-slate-700 border border-black">
                              {std.email || '-'}
                            </td>
                            <td className="p-2 font-mono text-[11px] font-semibold text-slate-900 border border-black">{std.contact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & Signature area */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-700">Instructions for the Event:</p>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 mt-1">
                <li>Bring a printed copy of this acknowledgment slip on the competition day.</li>
                <li>All student members must carry their institute identity cards.</li>
                <li>Working models/prototypes and presentation charts must be set up well ahead of judging.</li>
              </ul>
            </div>

            <div className="print-only text-right min-w-[180px] pt-4 sm:pt-0">
              <div className="h-12 border-b-2 border-black"></div>
              <span className="text-[10px] uppercase font-bold text-slate-800 block mt-1">
                Authorized Signature / Seal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
