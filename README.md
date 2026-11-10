# Bathinda Cluster Polytechnic Project Competition Portal

A modern, mobile-first project entry web portal designed for polytechnic institutes competing at the **Bathinda Cluster Level Project Competition** (under the Department of Technical Education & Industrial Training, Punjab).

---

## 🌟 Key Features

1. **No Login Required**: Fast, hassle-free public submission accessible from any smartphone, tablet, or desktop browser.
2. **Institute Details**:
   - Institute Name (with autocomplete suggestions for Punjab & Bathinda cluster polytechnics)
   - Principal Name & Contact Number / Email
3. **Dynamic Multi-Team Architecture**:
   - Toggle between **1 or 2 Teams**.
   - Team 2 form automatically appears on the same page when selected without refreshing or losing data.
4. **Comprehensive Team Capture**:
   - Faculty Mentor Name & Contact
   - Project Title
   - **8 Competition Themes**:
     - *Agriculture and Food Technology*
     - *Health & Wellness*
     - *Clean Energy & Environment*
     - *Smart Cities & Mobility*
     - *Education Technology*
     - *Waste Management and Sustainability*
     - *Industry 4.0 & Automation*
     - *Others* (with dynamic specify input)
   - Project Brief Description with live character count
5. **Dynamic Student Enrollment**:
   - Select student count (1 to 5 per team) with instant quick-select buttons or Add/Remove student controls.
   - For every student:
     - Full Name (designated Team Leader indicator for Student 1)
     - 10-Digit Mobile Contact
     - Registration No. / Roll No.
     - **Polytechnic Branches**:
       - *Automobile Engineering*
       - *Civil Engineering*
       - *Computer Science & Engineering*
       - *Electrical Engineering*
       - *Electronics and Communication Engineering*
       - *Information Technology*
       - *Mechanical Engineering*
       - *Mechanical Engineering (Production)*
       - *D-Pharmacy*
       - *Others* (with dynamic branch input)
6. **Supabase Cloud Integration**:
   - Connect directly to your Supabase PostgreSQL database using URL and Anon Key.
   - Configurable via `.env` or directly through the in-app **Supabase Settings** modal (persisted locally).
   - In-app **Connection Test** and **1-Click SQL Schema Copy** button.
   - Built-in fallback demo mode if Supabase credentials are pending.
7. **Mobile-First UX**:
   - High-contrast touch targets, non-zooming iOS inputs (`font-size: 16px`), numeric dialpad triggers (`type="tel"`).
   - Sticky bottom action bar for effortless one-thumb submission on smartphones.
8. **Printable Official Receipt**:
   - Generates an official acknowledgment slip with unique tracking code (e.g., `BTC-2026-X7R2`), timestamp, and clean print styling for PDF export.
9. **Organizer Review & CSV Export**:
   - Built-in entries viewer drawer with instant search and CSV export of all institute teams and students.

---

## 🚀 Quick Start

### 1. Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗄️ Setting Up Supabase Database (Takes 30 Seconds)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to your Supabase project's **SQL Editor** &rarr; **New Query**.
3. Copy the entire contents of [`supabase_schema.sql`](./supabase_schema.sql) and paste it into the query box.
4. Click **Run**.
5. Copy your **Project URL** and **Anon public key** from:
   - **Project Settings** &rarr; **API**.
6. Set them in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   *(Or click the **Setup DB** button directly inside the web application and paste them there without restarting the server!)*

---

## 📁 Project Structure

```
forms/
├── supabase_schema.sql      # Supabase database table definitions & RLS policies
├── .env.example             # Supabase environment variables template
├── .env                     # Local environment variables
├── index.html               # Mobile-optimized HTML root
├── vite.config.js           # Vite build config
├── tailwind.config.js       # Tailwind CSS configuration
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Main form controller & state handling
│   ├── index.css            # Tailwind directives & print styles
│   ├── lib/
│   │   ├── constants.js     # Themes, departments, polytechnic colleges list
│   │   └── supabase.js      # Supabase client, validation & submission logic
│   └── components/
│       ├── Navbar.jsx              # Header with DB status badge
│       ├── InstituteSection.jsx    # Institute info & 1/2 team toggle
│       ├── TeamSection.jsx         # Mentor, project details & dynamic students
│       ├── StudentCard.jsx         # Individual student detail fields
│       ├── SubmissionReceipt.jsx   # Printable official receipt slip
│       ├── SupabaseModal.jsx       # DB settings & SQL helper modal
│       └── SubmissionsDrawer.jsx   # Organizer entries viewer & CSV export
```
