import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function adminAuthPlugin() {
  let otpStore = null;
  const activeSessions = new Set();
  const FROZEN_EMAIL = 'inderjeetsinghit@gmail.com';

  return {
    name: 'admin-auth-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only intercept /api/admin/*
        if (!req.url.startsWith('/api/admin/')) {
          return next();
        }

        const readBody = () => new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
          });
        });

        // 1. POST /api/admin/send-otp
        if (req.method === 'POST' && req.url === '/api/admin/send-otp') {
          try {
            const env = loadEnv('', process.cwd(), '');
            const brevoApiKey = env.BREVO_API_KEY;
            const senderEmail = env.BREVO_SENDER_EMAIL || 'noreply@eduobal.com';
            const senderName = env.BREVO_SENDER_NAME || 'GPC Bathinda';

            // Generate secure 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

            otpStore = { otp, expiresAt, attempts: 0 };
            console.log(`\n=================================================`);
            console.log(`🔐 [ADMIN ACCESS OTP]: ${otp} for ${FROZEN_EMAIL}`);
            console.log(`=================================================\n`);

            // Send via Brevo API
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
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: brevoData.message || 'Failed to send OTP email.' }));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: `OTP sent successfully to ${FROZEN_EMAIL}` }));
          } catch (err) {
            console.error('Send OTP Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // 2. POST /api/admin/verify-otp
        if (req.method === 'POST' && req.url === '/api/admin/verify-otp') {
          const body = await readBody();
          const { otp } = body;

          if (!otpStore || Date.now() > otpStore.expiresAt) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'OTP has expired or was not requested. Please request a new code.' }));
          }

          if (otpStore.otp !== String(otp).trim()) {
            otpStore.attempts = (otpStore.attempts || 0) + 1;
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid OTP code. Please check your email and try again.' }));
          }

          // OTP Valid: Create Session
          const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
          activeSessions.add(token);
          otpStore = null; // Clear OTP once used

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, token, email: FROZEN_EMAIL }));
        }

        // 3. GET /api/admin/submissions
        if (req.method === 'GET' && req.url === '/api/admin/submissions') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/, '').trim();

          if (!activeSessions.has(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Unauthorized or expired session.' }));
          }

          try {
            const env = loadEnv('', process.cwd(), '');
            const supabaseUrl = env.VITE_SUPABASE_URL;
            const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

            const subRes = await fetch(`${supabaseUrl}/rest/v1/cluster_submissions?select=*,competition_teams(*,competition_students(*))&order=created_at.desc`, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            });

            const data = await subRes.json();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // 4. POST /api/admin/delete-submission
        if (req.method === 'POST' && req.url === '/api/admin/delete-submission') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/, '').trim();

          if (!activeSessions.has(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Unauthorized session.' }));
          }

          const body = await readBody();
          const targetIds = Array.isArray(body.ids) ? body.ids : (body.id ? [body.id] : []);

          if (targetIds.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'No submission ID provided.' }));
          }

          try {
            const env = loadEnv('', process.cwd(), '');
            const supabaseUrl = env.VITE_SUPABASE_URL;
            const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

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

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              deletedCount: targetIds.length,
              message: `Successfully deleted ${targetIds.length} submission(s)`
            }));
          } catch (err) {
            console.error('Delete submission error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminAuthPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
