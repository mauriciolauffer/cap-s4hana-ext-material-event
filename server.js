import cds from '@sap/cds';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extend the CAP server to serve static files
cds.on('bootstrap', (app) => {
  // Serve static files from app directory
  app.use('/app', express.static(join(__dirname, 'app')));
  
  // Serve the main index.html at root
  app.use('/', express.static(__dirname));
  
  // Create the specific route you requested: /business-partners/webapp/
  app.use('/business-partners/webapp', express.static(join(__dirname, 'app/business-partners/webapp')));
  
  // Add custom routes for frontend apps
  app.get('/business-partners-ui', (req, res) => {
    res.redirect('/app/business-partners/webapp/index.html');
  });
  
  app.get('/business-partners-simple', (req, res) => {
    res.redirect('/app/business-partners/webapp/test/simple.html');
  });
  
  app.get('/business-partners-dashboard', (req, res) => {
    res.redirect('/app/business-partners/webapp/test/dashboard.html');
  });
  
  console.log('✅ Static file serving configured for frontend apps');
  console.log('📱 Frontend URLs:');
  console.log('   • Main Page: http://localhost:4004/');
  console.log('   • Simple View: http://localhost:4004/business-partners-simple');
  console.log('   • Dashboard: http://localhost:4004/business-partners-dashboard'); 
  console.log('   • Full App: http://localhost:4004/business-partners-ui');
  console.log('   • Direct Webapp: http://localhost:4004/business-partners/webapp/index.html');
});

export default cds.server;
