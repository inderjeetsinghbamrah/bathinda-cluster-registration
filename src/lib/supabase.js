import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'poly_bathinda_supabase_url';
const STORAGE_KEY_KEY = 'poly_bathinda_supabase_key';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '';

  const url = (envUrl && envUrl.trim() !== '' && !envUrl.includes('your-project-id')) ? envUrl : (localUrl || '');
  const key = (envKey && envKey.trim() !== '' && !envKey.includes('your-anon-key')) ? envKey : (localKey || '');

  return { url: url.trim(), key: key.trim() };
};

export const saveSupabaseConfig = (url, key) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
};

let cachedClient = null;
let lastUsedConfig = '';

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    return null;
  }

  const currentConfigKey = `${url}___${key}`;
  if (cachedClient && lastUsedConfig === currentConfigKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    lastUsedConfig = currentConfigKey;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
};

// Test if Supabase is reachable and tables are accessible
export const testSupabaseConnection = async (testUrl, testKey) => {
  const url = testUrl || getSupabaseConfig().url;
  const key = testKey || getSupabaseConfig().key;

  if (!url || !key) {
    return { success: false, message: 'Supabase URL or Anon Key is missing.' };
  }

  try {
    const testClient = createClient(url, key);
    // Attempt a light select to check connection & table existence
    const { error } = await testClient
      .from('cluster_submissions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          code: 'TABLES_MISSING',
          message: 'Connected to Supabase project, but tables are missing. Please run the schema SQL script.'
        };
      }
      return { success: false, message: error.message || 'Supabase returned an error.' };
    }

    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to reach Supabase server.' };
  }
};

// Generates an official submission tracking code (e.g. BTC-2026-X8R4)
export const generateSubmissionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BTC-2026-${rand}`;
};

// Submit full project data into Supabase
export const submitProjectForm = async (formData) => {
  const client = getSupabaseClient();
  const submissionCode = generateSubmissionCode();
  const timestamp = new Date().toISOString();

  // Create sanitized payload
  const submissionRecord = {
    submission_code: submissionCode,
    institute_name: formData.instituteName.trim(),
    principal_name: formData.principalName.trim(),
    principal_contact: formData.principalContact.trim(),
    teams_count: parseInt(formData.teamsCount, 10),
    status: 'submitted',
    raw_payload: formData
  };

  // If Supabase is NOT configured, store in localStorage demo registry
  if (!client) {
    console.warn('Supabase not configured. Saving submission locally.');
    const localStore = JSON.parse(localStorage.getItem('bathinda_cluster_submissions') || '[]');
    const localData = {
      id: `local_${Date.now()}`,
      created_at: timestamp,
      ...submissionRecord,
      teams: formData.teams
    };
    localStore.unshift(localData);
    localStorage.setItem('bathinda_cluster_submissions', JSON.stringify(localStore));

    return {
      success: true,
      mode: 'local_demo',
      submissionCode,
      timestamp,
      data: localData,
      message: 'Saved to local registry (Supabase not configured yet).'
    };
  }

  // 1. Insert into cluster_submissions table
  const { data: subData, error: subError } = await client
    .from('cluster_submissions')
    .insert([submissionRecord])
    .select()
    .single();

  if (subError) {
    console.error('Error inserting cluster_submissions:', subError);
    throw new Error(`Failed to save institute details: ${subError.message}`);
  }

  const submissionId = subData.id;

  // 2. Insert Teams and Students
  for (let i = 0; i < formData.teams.length; i++) {
    const team = formData.teams[i];

    const teamRecord = {
      submission_id: submissionId,
      team_number: team.teamNumber,
      mentor_name: team.mentorName.trim(),
      mentor_contact: team.mentorContact.trim(),
      project_title: team.projectTitle.trim(),
      project_theme: team.projectTheme,
      project_theme_other: team.projectTheme === 'Others' ? (team.projectThemeOther || '').trim() : null,
      project_description: team.projectDescription.trim(),
      students_count: team.students.length
    };

    const { data: tData, error: tError } = await client
      .from('competition_teams')
      .insert([teamRecord])
      .select()
      .single();

    if (tError) {
      console.error(`Error inserting team ${i + 1}:`, tError);
      throw new Error(`Failed to save Team ${i + 1}: ${tError.message}`);
    }

    const teamId = tData.id;

    // 3. Insert Students for this team
    const studentRecords = team.students.map((student, sIdx) => ({
      team_id: teamId,
      submission_id: submissionId,
      student_order: sIdx + 1,
      student_name: student.name.trim(),
      contact_number: student.contact.trim(),
      registration_no: student.registrationNo.trim(),
      department: student.department,
      department_other: student.department === 'Others' ? (student.departmentOther || '').trim() : null,
      semester: (student.semester || '').trim() || null
    }));

    let { error: sError } = await client
      .from('competition_students')
      .insert(studentRecords);

    // Graceful fallback if Supabase DB has not added 'semester' column yet
    if (sError && (sError.code === '42703' || String(sError.message).toLowerCase().includes('semester'))) {
      console.warn("Retrying student insert without 'semester' column (run SQL migration to enable semester column in Supabase)");
      const fallbackRecords = studentRecords.map(({ semester, ...rest }) => rest);
      const retryResult = await client
        .from('competition_students')
        .insert(fallbackRecords);
      sError = retryResult.error;
    }

    if (sError) {
      console.error(`Error inserting students for team ${i + 1}:`, sError);
      throw new Error(`Failed to save students for Team ${i + 1}: ${sError.message}`);
    }
  }

  return {
    success: true,
    mode: 'supabase',
    submissionId,
    submissionCode,
    timestamp,
    message: 'Submitted successfully to Supabase database!'
  };
};
