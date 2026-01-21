const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = parseInt(process.env.PORT || '10000', 10);

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Log startup info for debugging
console.log('Starting Express server...');
console.log('__dirname:', __dirname);
console.log('dist path:', distPath);
console.log('index.html path:', indexPath);

// Verify index.html exists
if (!fs.existsSync(indexPath)) {
  console.error('ERROR: index.html not found at', indexPath);
  console.error('Did you run npm run build first?');
  process.exit(1);
}

// Serve static files from dist directory
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-file requests
// This must come after express.static so actual files are served first
app.use((req, res, next) => {
  // Skip if request looks like a file (has extension)
  if (req.path.includes('.')) {
    return next();
  }

  console.log(`SPA fallback: serving index.html for ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      next(err);
    }
  });
});

// 404 handler for actual missing files
app.use((req, res) => {
  console.log(`404 Not Found: ${req.path}`);
  res.status(404).send('Not Found');
});

// Bind to 0.0.0.0 for Render.com (required for public HTTP access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Serving static files from: ${distPath}`);
});
