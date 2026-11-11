import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env variables if not already present in environment
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFile();

const router = express.Router();
router.use(express.json());

const FROZEN_EMAIL = process.env.ADMIN_FROZEN_EMAIL || 'inderjeetsinghit@gmail.com';
const AUTH_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'cluster-admin-secret-2026';

let otpStore = null;
const activeSessions = new Set();

function getCookie(req, name) {
  const match = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function verifyAdminToken(token) {
  if (!token) return false;
  if (activeSessions.has(token)) return true;
  if (token.startsWith('admin_session_')) {
    const parts = token.split('_');
    if (parts.length >= 4) {
      const expiry = parseInt(parts[2], 10);
      const sig = parts.slice(3).join('_');
      if (Date.now() <= expiry) {
        const expected = crypto.createHmac('sha256', AUTH_SECRET).update(`admin_session:${expiry}`).digest('hex');
        if (sig === expected) {
          activeSessions.add(token);
          return true;
        }
      }
    }
  }
  return false;
}

// 1. POST /api/admin/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@eduobal.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'GPC Bathinda';

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore = { otp, expiresAt, attempts: 0 };
    console.log(`\n=================================================`);
    console.log(`🔐 [ADMIN ACCESS OTP]: ${otp} for ${FROZEN_EMAIL}`);
    console.log(`=================================================\n`);

    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${otp}:${expiresAt}`).digest('hex');
    res.setHeader('Set-Cookie', `admin_otp_token=${expiresAt}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

    // Send via Brevo API if key is configured
    if (brevoApiKey && !brevoApiKey.includes('your-brevo-api-key')) {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: FROZEN_EMAIL, name: 'Cluster Administrator' }],
          subject: `Your Admin Verification Code: ${otp} - Bathinda Cluster Portal`,
          textContent: `Your Admin Verification Code is: ${otp}\n\nValid for 10 minutes.\nBathinda Cluster Polytechnic Competition\nDepartment of Technical Education & Industrial Training, Punjab`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #1e3a8a; margin: 0;">Bathinda Cluster Polytechnic Competition</h2>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Department of Technical Education & Industrial Training, Punjab</p>
              </div>
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e2e8f0;">
                <p style="color: #334155; font-size: 14px; margin: 0 0 14px; font-weight: 500;">Use the following One-Time Password (OTP) to access the confidential Master Submissions Portal:</p>
                <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; background: #ffffff; padding: 14px 28px; display: inline-block; border-radius: 8px; border: 2px dashed #93c5fd; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  ${otp}
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 16px;">⏱️ This code expires in <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
              </div>
              <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">Automated administrative authentication sent to ${FROZEN_EMAIL}.</p>
            </div>
          `
        })
      });

      const brevoData = await brevoRes.json();
      if (!brevoRes.ok) {
        console.error('Brevo API Error:', brevoData);
        return res.status(500).json({ success: false, message: brevoData.message || 'Failed to send OTP email.' });
      }
    }

    return res.json({ success: true, message: `OTP sent successfully to ${FROZEN_EMAIL}` });
  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/admin/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body || {};
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please enter the OTP.' });
    }

    const trimmedOtp = String(otp).trim();
    let isValid = false;

    // A. Check in-memory first
    if (otpStore && Date.now() <= otpStore.expiresAt && otpStore.otp === trimmedOtp) {
      isValid = true;
      otpStore = null;
    } else {
      // B. Check stateless HMAC token from cookie
      const cookieToken = getCookie(req, 'admin_otp_token');
      if (cookieToken) {
        const [expiresStr, expectedSig] = cookieToken.split('.');
        const expiresAt = parseInt(expiresStr, 10);
        if (Date.now() <= expiresAt) {
          const computedSig = crypto.createHmac('sha256', AUTH_SECRET).update(`${trimmedOtp}:${expiresAt}`).digest('hex');
          if (computedSig === expectedSig) {
            isValid = true;
          }
        }
      }
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please check your email and try again.' });
    }

    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const sessionSig = crypto.createHmac('sha256', AUTH_SECRET).update(`admin_session:${sessionExpiry}`).digest('hex');
    const token = `admin_session_${sessionExpiry}_${sessionSig}`;
    activeSessions.add(token);

    return res.json({ success: true, token, email: FROZEN_EMAIL });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/admin/submissions
router.get('/submissions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();

    if (!verifyAdminToken(token)) {
      return res.status(401).json({ success: false, message: 'Unauthorized or expired session.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
    }

    const subRes = await fetch(`${supabaseUrl}/rest/v1/cluster_submissions?select=*,competition_teams(*,competition_students(*))&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const data = await subRes.json();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Submissions Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/admin/delete-submission
router.post('/delete-submission', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();

    if (!verifyAdminToken(token)) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const targetIds = Array.isArray(req.body.ids) ? req.body.ids : (req.body.id ? [req.body.id] : []);
    if (targetIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No submission ID provided.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    const queryParam = targetIds.length === 1 
      ? `id=eq.${targetIds[0]}`
      : `id=in.(${targetIds.join(',')})`;

    const delRes = await fetch(`${supabaseUrl}/rest/v1/cluster_submissions?${queryParam}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!delRes.ok) {
      const errText = await delRes.text();
      throw new Error(errText || 'Failed to delete record from Supabase.');
    }

    return res.json({
      success: true,
      deletedCount: targetIds.length,
      message: `Successfully deleted ${targetIds.length} submission(s)`
    });
  } catch (err) {
    console.error('Delete submission error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. POST /api/admin/update-submission
router.post('/update-submission', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();

    if (!verifyAdminToken(token)) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const { submissionId, instituteName, principalName, principalContact, teams } = req.body || {};
    if (!submissionId) {
      return res.status(400).json({ success: false, message: 'Submission ID is required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: 'Supabase credentials missing.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing submission
    const { data: existingSub, error: fetchErr } = await supabase
      .from('cluster_submissions')
      .select('*, competition_teams(*, competition_students(*))')
      .eq('id', submissionId)
      .single();

    if (fetchErr || !existingSub) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Build updated raw_payload
    const existingRaw = existingSub.raw_payload || {};
    const updatedRawTeams = (teams || []).map((t, tIdx) => {
      const existingRawTeam = existingRaw.teams?.[tIdx] || {};
      const studentsList = t.students || t.competition_students || [];
      return {
        ...existingRawTeam,
        teamNumber: t.teamNumber || t.team_number || tIdx + 1,
        projectTitle: (t.projectTitle || t.project_title || '').trim(),
        projectTheme: t.projectTheme || t.project_theme || 'Others',
        projectThemeOther: (t.projectThemeOther || t.project_theme_other || '').trim(),
        mentorName: (t.mentorName || t.mentor_name || '').trim(),
        mentorContact: (t.mentorContact || t.mentor_contact || '').trim(),
        projectDescription: (t.projectDescription || t.project_description || '').trim(),
        studentsCount: studentsList.length,
        students: studentsList.map((st, sIdx) => ({
          id: st.id || `student_${Date.now()}_${sIdx}`,
          order: st.studentOrder || st.student_order || sIdx + 1,
          name: (st.studentName || st.student_name || '').trim(),
          registrationNo: (st.registrationNo || st.registration_no || '').trim(),
          department: st.department || '',
          departmentOther: st.departmentOther || st.department_other || '',
          semester: st.semester || '',
          contact: (st.contact || st.contact_number || '').trim(),
          email: (st.email || '').trim().toLowerCase()
        }))
      };
    });

    const updatedRawPayload = {
      ...existingRaw,
      instituteName: (instituteName || existingSub.institute_name || '').trim(),
      principalName: (principalName || existingSub.principal_name || '').trim(),
      principalContact: (principalContact || existingSub.principal_contact || '').trim(),
      teamsCount: updatedRawTeams.length,
      teams: updatedRawTeams
    };

    // 1. Update cluster_submissions table
    const { error: subErr } = await supabase
      .from('cluster_submissions')
      .update({
        institute_name: updatedRawPayload.instituteName,
        principal_name: updatedRawPayload.principalName,
        principal_contact: updatedRawPayload.principalContact,
        teams_count: updatedRawPayload.teamsCount,
        raw_payload: updatedRawPayload
      })
      .eq('id', submissionId);

    if (subErr) {
      throw new Error(`Failed to update institute details: ${subErr.message}`);
    }

    // 2. Update each team and students
    if (Array.isArray(teams)) {
      for (let tIdx = 0; tIdx < teams.length; tIdx++) {
        const t = teams[tIdx];
        const teamId = t.id;
        const studentsList = t.students || t.competition_students || [];

        if (teamId) {
          // Update team record
          await supabase
            .from('competition_teams')
            .update({
              project_title: (t.projectTitle || t.project_title || '').trim(),
              mentor_name: (t.mentorName || t.mentor_name || '').trim(),
              mentor_contact: (t.mentorContact || t.mentor_contact || '').trim(),
              project_theme: t.projectTheme || t.project_theme || 'Others',
              project_theme_other: (t.projectTheme === 'Others' || t.project_theme === 'Others')
                ? (t.projectThemeOther || t.project_theme_other || '').trim()
                : null,
              project_description: (t.projectDescription || t.project_description || '').trim(),
              students_count: studentsList.length
            })
            .eq('id', teamId);

          // Update students
          const currentStudentIds = new Set();
          for (let sIdx = 0; sIdx < studentsList.length; sIdx++) {
            const st = studentsList[sIdx];
            const studentId = st.id;
            const studentData = {
              student_order: sIdx + 1,
              student_name: (st.studentName || st.student_name || '').trim(),
              registration_no: (st.registrationNo || st.registration_no || '').trim(),
              department: st.department || '',
              department_other: st.department === 'Others' ? (st.departmentOther || st.department_other || '').trim() : null,
              contact_number: (st.contact || st.contact_number || '').trim(),
              semester: st.semester || null,
              email: (st.email || '').trim().toLowerCase() || null
            };

            if (studentId) {
              currentStudentIds.add(studentId);
              let { error: sUpErr } = await supabase
                .from('competition_students')
                .update(studentData)
                .eq('id', studentId);

              if (sUpErr && (sUpErr.code === '42703' || /semester|email/i.test(String(sUpErr.message)))) {
                const { semester, email, ...fallback } = studentData;
                await supabase.from('competition_students').update(fallback).eq('id', studentId);
              }
            } else {
              // New student inserted
              const insertData = {
                ...studentData,
                team_id: teamId,
                submission_id: submissionId
              };
              let { data: newSt, error: sInErr } = await supabase
                .from('competition_students')
                .insert([insertData])
                .select()
                .single();

              if (sInErr && (sInErr.code === '42703' || /semester|email/i.test(String(sInErr.message)))) {
                const { semester, email, ...fallback } = insertData;
                const retry = await supabase.from('competition_students').insert([fallback]).select().single();
                if (retry.data?.id) currentStudentIds.add(retry.data.id);
              } else if (newSt?.id) {
                currentStudentIds.add(newSt.id);
              }
            }
          }

          // If any previous student was removed from this team
          const existingStudentsForTeam = existingSub.competition_teams?.find(ct => ct.id === teamId)?.competition_students || [];
          for (const est of existingStudentsForTeam) {
            if (!currentStudentIds.has(est.id)) {
              await supabase.from('competition_students').delete().eq('id', est.id);
            }
          }
        }
      }
    }

    // 3. Return refreshed complete submission record
    const { data: updatedSub } = await supabase
      .from('cluster_submissions')
      .select('*, competition_teams(*, competition_students(*))')
      .eq('id', submissionId)
      .single();

    return res.json({
      success: true,
      data: updatedSub,
      message: 'Submission successfully updated!'
    });
  } catch (err) {
    console.error('Update submission error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Standard Vercel Serverless Function entry point
const app = express();
app.use('/api/admin', router);

export default app;
