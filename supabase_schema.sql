-- ==============================================================================
-- Supabase Schema for Bathinda Cluster Polytechnic Project Competition Portal
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the main Submissions table
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

-- 3. Create the Teams table
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

-- 4. Create the Students table
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
    department_other VARCHAR(255),
    semester VARCHAR(50)
);

-- Migration command if your table already exists in Supabase:
ALTER TABLE competition_students ADD COLUMN IF NOT EXISTS semester VARCHAR(50);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE cluster_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_students ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for Anonymous Public Submission (No Login Required)
-- Allow anyone (public/anon) to insert records
DROP POLICY IF EXISTS "Allow anon insert submissions" ON cluster_submissions;
CREATE POLICY "Allow anon insert submissions"
ON cluster_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert teams" ON competition_teams;
CREATE POLICY "Allow anon insert teams"
ON competition_teams FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert students" ON competition_students;
CREATE POLICY "Allow anon insert students"
ON competition_students FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon to select their newly submitted record by code (optional for receipt verification)
DROP POLICY IF EXISTS "Allow anon view submissions" ON cluster_submissions;
CREATE POLICY "Allow anon view submissions"
ON cluster_submissions FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon view teams" ON competition_teams;
CREATE POLICY "Allow anon view teams"
ON competition_teams FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon view students" ON competition_students;
CREATE POLICY "Allow anon view students"
ON competition_students FOR SELECT
TO anon, authenticated
USING (true);

-- 7. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_submissions_code ON cluster_submissions(submission_code);
CREATE INDEX IF NOT EXISTS idx_teams_submission_id ON competition_teams(submission_id);
CREATE INDEX IF NOT EXISTS idx_students_team_id ON competition_students(team_id);
