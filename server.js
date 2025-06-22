const express = require('express');
const path = require('path');
const app = express();

// Get PORT from environment variable for Azure App Service
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    // Ensure JavaScript files are served with correct MIME type
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Handle client-side routing ONLY for non-asset routes
app.get('*', (req, res) => {
  // Don't serve index.html for static assets
  if (req.path.startsWith('/assets/') || 
      req.path.startsWith('/layout/') ||
      req.path.endsWith('.js') || 
      req.path.endsWith('.css') || 
      req.path.endsWith('.ico') ||
      req.path.endsWith('.woff') ||
      req.path.endsWith('.woff2') ||
      req.path.endsWith('.ttf') ||
      req.path.endsWith('.eot') ||
      req.path.endsWith('.svg')) {
    // Let express.static handle it, or return 404
    return res.status(404).send('File not found');
  }
  
  // Only serve index.html for actual page routes
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});