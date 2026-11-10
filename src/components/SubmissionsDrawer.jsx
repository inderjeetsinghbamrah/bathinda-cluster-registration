import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Download,
  Search,
  ExternalLink,
  Users,
  Award,
  RefreshCw,
  FolderKanban
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

export const SubmissionsDrawer = ({ isOpen, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [source, setSource] = useState('cloud');

  const fetchSubmissions = async () => {
    setLoading(true);
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data, error } = await client
          .from('cluster_submissions')
          .select(`
            *,
            competition_teams (
              *,
              competition_students (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSubmissions(data);
          setSource('supabase');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch from supabase, fallback to local', err);
      }
    }

    // Local fallback
    const local = JSON.parse(localStorage.getItem('bathinda_cluster_submissions') || '[]');
    setSubmissions(local);
    setSource('local');
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = submissions.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      (s.institute_name || s.instituteName || '').toLowerCase().includes(q) ||
      (s.submission_code || s.submissionCode || '').toLowerCase().includes(q) ||
      (s.principal_name || s.principalName || '').toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    if (submissions.length === 0) return;

    const rows = [
      [
        'Submission Code',
        'Submission Date',
        'Institute Name',
        'Principal Name',
        'Principal Contact',
        'Teams Count',
        'Team #',
        'Project Title',
        'Theme',
        'Mentor Name',
        'Mentor Contact',
        'Student Name',
        'Student Contact',
        'Registration No',
        'Department',
        'Sem / Year'
      ]
    ];

    submissions.forEach((sub) => {
      const code = sub.submission_code || sub.submissionCode;
      const date = sub.created_at;
      const inst = sub.institute_name || sub.instituteName;
      const princ = sub.principal_name || sub.principalName;
      const pContact = sub.principal_contact || sub.principalContact;
      const tCount = sub.teams_count || sub.teamsCount;

      const teamsList = sub.competition_teams || sub.teams || [];

      teamsList.forEach((t) => {
        const tNum = t.team_number || t.teamNumber;
        const pTitle = t.project_title || t.projectTitle;
        const pTheme = t.project_theme || t.projectTheme;
        const mName = t.mentor_name || t.mentorName;
        const mContact = t.mentor_contact || t.mentorContact;

        const stds = t.competition_students || t.students || [];

        stds.forEach((s) => {
          rows.push([
            code,
            date,
            inst,
            princ,
            pContact,
            tCount,
            tNum,
            `"${(pTitle || '').replace(/"/g, '""')}"`,
            `"${(pTheme || '').replace(/"/g, '""')}"`,
            mName,
            mContact,
            s.student_name || s.name,
            s.contact_number || s.contact,
            s.registration_no || s.registrationNo,
            s.department || '',
            s.semester || ''
          ]);
        });
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bathinda_Cluster_Polytechnic_Entries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold">Registered Submissions</h2>
              <p className="text-xs text-slate-300">
                Source: {source === 'supabase' ? 'Supabase Live DB' : 'Local Browser Storage'} ({submissions.length} total)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by institute, principal, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              disabled={submissions.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              Loading submissions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No submissions found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const code = item.submission_code || item.submissionCode;
              const inst = item.institute_name || item.instituteName;
              const princ = item.principal_name || item.principalName;
              const contact = item.principal_contact || item.principalContact;
              const teams = item.competition_teams || item.teams || [];

              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{inst}</h4>
                    <p className="text-slate-500 text-[11px]">
                      Principal: {princ} &bull; {contact}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {teams.map((t, tIdx) => {
                      const tTitle = t.project_title || t.projectTitle;
                      const tTheme = t.project_theme || t.projectTheme;
                      const stds = t.competition_students || t.students || [];

                      return (
                        <div key={tIdx} className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">
                              Team {t.team_number || tIdx + 1}: {tTitle}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border">
                              {stds.length} students
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Theme: <span className="font-medium text-slate-700">{tTheme}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
