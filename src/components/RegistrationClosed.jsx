import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Mail,
  FileCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { Navbar } from './Navbar';
import { lookupSubmissionByCode } from '../lib/portalStatus';

export const RegistrationClosed = ({ onAdminAccess }) => {
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupCode.trim()) {
      setSearchError('Please enter your acknowledgment code (e.g. BTC-2026-XXXX)');
      setLookupResult(null);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setLookupResult(null);

    try {
      const res = await lookupSubmissionByCode(lookupCode.trim());
      if (res && res.found) {
        setLookupResult(res.submission);
      } else {
        setSearchError(`No submission found matching code "${lookupCode.trim().toUpperCase()}". Please check your receipt code or contact organizers.`);
      }
    } catch (err) {
      setSearchError('Unable to check code right now. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdminClick = (e) => {
    e.preventDefault();
    if (onAdminAccess) {
      onAdminAccess();
    } else {
      window.location.href = '/admin-cluster-access';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar isClosed={true} onAdminClick={handleAdminClick} />

      {/* Main Container */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero Notice Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-blue-900/40 relative overflow-hidden mb-8">
          {/* Decorative ambient background */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              <span>Online Registration Portal Closed</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              Bathinda Cluster Polytechnic Project Competition 2026
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              The public project registration window for polytechnic institutes has officially concluded. 
              Submissions are now closed for the public. Further project additions or adjustments can only be 
              processed directly by the designated cluster administrative authorities.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAdminClick}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-blue-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <Lock className="w-4 h-4 text-blue-950" />
                <span>Admin &amp; Organizer Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#verify-code"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition"
              >
                <Search className="w-4 h-4 text-blue-300" />
                <span>Verify Existing Acknowledgment Code</span>
              </a>
            </div>
          </div>

          <div className="absolute right-6 bottom-6 opacity-10 hidden md:block pointer-events-none">
            <Award className="w-56 h-56 text-white" />
          </div>
        </div>

        {/* 3 Status Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Entries Safely Recorded
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If your polytechnic submitted project details prior to portal closure, your teams and student rosters are safely locked in the official competition master database.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Master Roster &amp; Evaluation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The organizing committee is actively compiling attendance sheets, team sequences, and blind scoring rubrics for the 7-member official evaluation jury board.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">
              Admin Exclusive Access
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              New project registrations or urgent student roster corrections can only be performed by cluster administrators via authenticated OTP access.
            </p>
          </div>
        </div>

        {/* Interactive Acknowledgment Code Verification Widget */}
        <div id="verify-code" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 scroll-mt-24">
          <div className="max-w-2xl mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Search className="w-3.5 h-3.5" />
              <span>Participant Verification Tool</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verify Your Institute&apos;s Registration Status
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your 13-character Acknowledgment Code from your confirmation receipt to verify your project submission details in the official roster.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={lookupCode}
                onChange={(e) => {
                  setLookupCode(e.target.value.toUpperCase());
                  setSearchError('');
                }}
                placeholder="BTC-2026-XXXX"
                maxLength={20}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-mono font-bold text-sm tracking-wider uppercase text-slate-800 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check Status</span>
                </>
              )}
            </button>
          </form>

          {/* Search Error Message */}
          {searchError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 max-w-2xl animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Search Result Card */}
          {lookupResult && (
            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-blue-50/50 border border-emerald-200/80 shadow-xs max-w-3xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-200/60 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Verified Submission</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {lookupResult.institute_name || lookupResult.instituteName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Principal: <span className="font-semibold">{lookupResult.principal_name || lookupResult.principalName}</span>
                  </p>
                </div>

                <div className="bg-white px-3 py-2 rounded-xl border border-emerald-200 text-right sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Acknowledgment Code</span>
                  <span className="font-mono font-extrabold text-blue-900 text-base">
                    {lookupResult.submission_code || lookupResult.submissionCode}
                  </span>
                </div>
              </div>

              {/* Teams breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Registered Project Teams ({lookupResult.competition_teams?.length || lookupResult.teams?.length || 1})
                </span>

                {(lookupResult.competition_teams || lookupResult.teams || []).map((t, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-black">
                          Team {t.team_number || t.teamNumber || idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {t.project_title || t.projectTitle}
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        Theme: {t.project_theme || t.projectTheme}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Mentor: <strong className="text-slate-800">{t.mentor_name || t.mentorName}</strong></span>
                      <span>
                        Students: <strong className="text-slate-800">{t.competition_students?.length || t.students?.length || 0} registered</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Submitted on: {new Date(lookupResult.created_at || lookupResult.timestamp || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span className="text-emerald-700 font-bold">Status: Confirmed in Master Roster</span>
              </div>
            </div>
          )}
        </div>

        {/* Organizer Contact & Administration Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-1">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg mb-1">
                Need Support or Urgent Late Registration?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                If your polytechnic institution has exceptional grounds for late entry or requires urgent updates to student rosters, please contact the competition organizing committee directly.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  Host: <strong>Government Polytechnic College, Bathinda</strong>
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  Email: <a href="mailto:inderjeetsinghit@gmail.com" className="text-amber-300 font-mono hover:underline">inderjeetsinghit@gmail.com</a>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdminClick}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 transition flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Admin Sign-In</span>
          </button>
        </div>

        {/* Official Footer */}
        <footer className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            Bathinda Cluster Polytechnic Project Competition 2026
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Department of Technical Education &amp; Industrial Training, Punjab • Government Polytechnic College, Bathinda
          </p>
        </footer>
      </main>
    </div>
  );
};
