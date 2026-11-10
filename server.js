import app from './api/index.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Serve static assets from built Vite frontend
app.use(express.static(distPath));

// Handle SPA routing: all non-API requests return index.html
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Bathinda Cluster Portal server running on port ${PORT}`);
  console.log(`🌐 Public Portal: http://localhost:${PORT}`);
  console.log(`🔐 Admin Access:  http://localhost:${PORT}/admin-cluster-access`);
  console.log(`======================================================\n`);
});
