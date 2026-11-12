import { getSupabaseClient } from './supabase';

const STORAGE_PORTAL_STATUS_KEY = 'cluster_portal_public_open';

/**
 * Checks if the public registration portal is open or closed.
 * Defaults to CLOSED (false) unless explicitly open in database/API.
 */
export async function fetchPortalStatus() {
  // 1. Try server API endpoint
  try {
    const res = await fetch('/api/portal-status');
    if (res.ok) {
      const data = await res.json();
      if (typeof data.isOpen === 'boolean') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PORTAL_STATUS_KEY, String(data.isOpen));
        }
        return {
          isOpen: data.isOpen,
          closedNotice: data.closedNotice || 'Online registration is closed for public submissions.',
          updatedAt: data.updatedAt
        };
      }
    }
  } catch (err) {
    // API not reachable (e.g. static dev without express server)
  }

  // 2. Direct Supabase query fallback
  try {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('cluster_submissions')
        .select('raw_payload, status')
        .eq('submission_code', 'SYSTEM_PORTAL_CONFIG')
        .single();

      if (!error && data) {
        const isOpen = Boolean(data.raw_payload?.isPublicRegistrationOpen);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PORTAL_STATUS_KEY, String(isOpen));
        }
        return {
          isOpen,
          closedNotice: data.raw_payload?.closedNotice || 'Online registration is closed for public submissions.',
          updatedAt: data.raw_payload?.updatedAt
        };
      }
    }
  } catch (err) {
    console.warn('Direct Supabase check error:', err);
  }

  // 3. Check localStorage cache or default to false (CLOSED)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_PORTAL_STATUS_KEY);
    if (cached !== null) {
      return {
        isOpen: cached === 'true',
        closedNotice: 'Online registration is closed for public submissions.'
      };
    }
  }

  // Default is CLOSED
  return {
    isOpen: false,
    closedNotice: 'Online registration is closed for public submissions.'
  };
}

/**
 * Admin action to toggle public portal open/closed
 */
export async function setPortalStatus(isOpen, adminToken) {
  const boolIsOpen = Boolean(isOpen);

  // 1. Try server API
  try {
    const res = await fetch('/api/admin/toggle-portal-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isOpen: boolIsOpen })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_PORTAL_STATUS_KEY, String(boolIsOpen));
      }
      return { success: true, isOpen: boolIsOpen, message: data.message };
    }
  } catch (err) {
    console.warn('API toggle failed, trying direct Supabase:', err);
  }

  // 2. Direct Supabase fallback
  try {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from('cluster_submissions')
        .upsert({
          submission_code: 'SYSTEM_PORTAL_CONFIG',
          institute_name: 'SYSTEM_CONFIG',
          principal_name: 'System Administrator',
          principal_contact: 'admin@cluster',
          teams_count: 1,
          status: boolIsOpen ? 'open' : 'closed',
          raw_payload: {
            isPublicRegistrationOpen: boolIsOpen,
            closedNotice: 'Online registration is officially closed for public submissions.',
            updatedAt: new Date().toISOString()
          }
        }, { onConflict: 'submission_code' });

      if (!error) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PORTAL_STATUS_KEY, String(boolIsOpen));
        }
        return {
          success: true,
          isOpen: boolIsOpen,
          message: boolIsOpen
            ? 'Public registration portal has been opened.'
            : 'Public registration portal has been closed.'
        };
      }
    }
  } catch (err) {
    console.error('Supabase direct toggle error:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PORTAL_STATUS_KEY, String(boolIsOpen));
  }

  return {
    success: true,
    isOpen: boolIsOpen,
    message: boolIsOpen
      ? 'Public registration portal opened (cached).'
      : 'Public registration portal closed (cached).'
  };
}

/**
 * Allows verification of an existing registration using its acknowledgment code (e.g. BTC-2026-XXXX)
 */
export async function lookupSubmissionByCode(code) {
  if (!code || !code.trim()) return null;
  const cleanCode = code.trim().toUpperCase();

  // Try Supabase first
  try {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('cluster_submissions')
        .select(`
          id,
          submission_code,
          institute_name,
          principal_name,
          teams_count,
          created_at,
          status,
          competition_teams (
            id,
            team_number,
            project_title,
            project_theme,
            mentor_name,
            competition_students (
              student_name,
              registration_no,
              department
            )
          )
        `)
        .eq('submission_code', cleanCode)
        .single();

      if (!error && data && data.submission_code !== 'SYSTEM_PORTAL_CONFIG') {
        return { found: true, submission: data };
      }
    }
  } catch (e) {
    console.warn('Supabase lookup error:', e);
  }

  // Fallback to local demo storage
  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('bathinda_cluster_submissions') || '[]');
      const match = local.find(
        (s) => (s.submission_code || s.submissionCode || '').toUpperCase() === cleanCode
      );
      if (match) {
        return { found: true, submission: match };
      }
    } catch (e) {
      // ignore
    }
  }

  return { found: false };
}
