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
    email VARCHAR(255),
    contact_number VARCHAR(50) NOT NULL,
    registration_no VARCHAR(100) NOT NULL,
    department VARCHAR(150) NOT NULL,
    department_other VARCHAR(255),
    semester VARCHAR(50)
);

-- Migration commands if your table already exists in Supabase:
ALTER TABLE competition_students ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
ALTER TABLE competition_students ADD COLUMN IF NOT EXISTS email VARCHAR(255);

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

-- ==============================================================================
-- 8. Create the Official Evaluation Jury & Judges Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS competition_judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    slot_key VARCHAR(50) UNIQUE NOT NULL, -- 'chairperson_1', 'jury_member_1'..'jury_member_4', 'reserve_member_1'..'reserve_member_2'
    role VARCHAR(50) NOT NULL,            -- 'CHAIRPERSON', 'JURY_MEMBER', 'RESERVE_JURY_MEMBER'
    slot_number INT NOT NULL,             -- 1 for Chairperson, 1..4 for Jury Members, 1..2 for Reserve Members
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    organisation VARCHAR(255) NOT NULL,
    organisation_location VARCHAR(255) NOT NULL,
    domain VARCHAR(150) NOT NULL,         -- SENIOR EXTERNAL ACADEMIC, SENIOR TECHNICAL LEADER, etc.
    relevant_background TEXT
);

-- Enable RLS for competition_judges
ALTER TABLE competition_judges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon view judges" ON competition_judges;
CREATE POLICY "Allow anon view judges"
ON competition_judges FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon insert judges" ON competition_judges;
CREATE POLICY "Allow anon insert judges"
ON competition_judges FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update judges" ON competition_judges;
CREATE POLICY "Allow anon update judges"
ON competition_judges FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon delete judges" ON competition_judges;
CREATE POLICY "Allow anon delete judges"
ON competition_judges FOR DELETE
TO anon, authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_judges_slot_key ON competition_judges(slot_key);
CREATE INDEX IF NOT EXISTS idx_judges_role ON competition_judges(role);

