const express = require('express');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '10000', 10);

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Log startup info for debugging
console.log('Starting Express server...');
console.log('__dirname:', __dirname);
console.log('dist path:', distPath);
console.log('index.html path:', indexPath);

// Serve static files from dist directory
app.use(express.static(distPath));

// Handle SPA routing - Express 5 requires {*splat} syntax for wildcards
// This catches ALL routes including root and serves index.html
app.get('/{*splat}', (req, res) => {
  console.log(`Serving index.html for path: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Application error');
    }
  });
});

// Bind to 0.0.0.0 for Render.com (required for public HTTP access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Serving static files from: ${distPath}`);
});
