import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection
} from '../lib/supabase';

export const SupabaseModal = ({ isOpen, onClose, onConfigSaved }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setKey(config.key || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please enter both Supabase URL and Anon Public Key.'
      });
      setTesting(false);
      return;
    }

    const res = await testSupabaseConnection(cleanUrl, cleanKey);
    setTestResult(res);
    setTesting(false);

    if (res.success || res.code === 'TABLES_MISSING') {
      saveSupabaseConfig(cleanUrl, cleanKey);
      onConfigSaved();
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear saved Supabase credentials from this browser?')) {
      clearSupabaseConfig();
      setUrl('');
      setKey('');
      setTestResult({ success: true, message: 'Supabase configuration cleared.' });
      onConfigSaved();
    }
  };

  const copySqlSchema = () => {
    const sql = `-- Supabase Schema for Bathinda Cluster Polytechnic Competition
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cluster_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    submission_code VARCHAR(30) UNIQUE NOT NULL,
    institute_name VARCHAR(255) NOT NULL,
    principal_name VARCHAR(255) NOT NULL,
    principal_contact VARCHAR(100) NOT NULL,
    teams_count INT NOT NULL CHECK (teams_count IN (1, 2)),
    status VARCHAR(50) DEFAULT 'submitted',
    raw_payload JSONB
);

CREATE TABLE IF NOT EXISTS competition_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES cluster_submissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    team_number INT NOT NULL CHECK (team_number IN (1, 2)),
    mentor_name VARCHAR(255) NOT NULL,
    mentor_contact VARCHAR(100) NOT NULL,
    project_title VARCHAR(300) NOT NULL,
    project_theme VARCHAR(150) NOT NULL,
    project_theme_other VARCHAR(255),
    project_description TEXT NOT NULL,
    students_count INT NOT NULL CHECK (students_count >= 1)
);

CREATE TABLE IF NOT EXISTS competition_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES competition_teams(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES cluster_submissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_order INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    registration_no VARCHAR(100) NOT NULL,
    department VARCHAR(150) NOT NULL,
    department_other VARCHAR(255)
);

ALTER TABLE cluster_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert submissions" ON cluster_submissions;
CREATE POLICY "Allow anon insert submissions" ON cluster_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert teams" ON competition_teams;
CREATE POLICY "Allow anon insert teams" ON competition_teams FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert students" ON competition_students;
CREATE POLICY "Allow anon insert students" ON competition_students FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select submissions" ON cluster_submissions;
CREATE POLICY "Allow anon select submissions" ON cluster_submissions FOR SELECT TO anon, authenticated USING (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Supabase Connection Settings
              </h3>
              <p className="text-xs text-slate-500">
                Connect your database to store live submissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTestAndSave} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Find in: Project Settings &rarr; API &rarr; Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon Key (public API key)
            </label>
            <div className="relative">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Find in: Project Settings &rarr; API &rarr; Project API keys (anon public)
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : testResult.code === 'TABLES_MISSING'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.code === 'TABLES_MISSING' && (
                  <p className="mt-1 text-[11px]">
                    Click the <strong>Copy SQL Schema</strong> button below and run it in your Supabase SQL Editor.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={testing}
              className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Verify Connection
                </>
              )}
            </button>

            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1"
                title="Clear Credentials"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </form>

        {/* SQL Schema Copy Section */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-100 rounded-b-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Quick Database Setup (SQL Script)
            </span>
            <button
              onClick={copySqlSchema}
              type="button"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded bg-blue-50 border border-blue-200 transition"
            >
              {copiedSql ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            To set up tables in Supabase in 30 seconds:
            <br />
            1. Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-600 underline">Supabase Dashboard</a>
            <br />
            2. Click <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>
            <br />
            3. Paste the copied SQL script and click <strong>Run</strong>. Done!
          </p>
        </div>
      </div>
    </div>
  );
};
