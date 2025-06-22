const express = require('express');
const path = require('path');
const app = express();

// Get PORT from environment variable for Azure App Service
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist'), {
  // Ensure proper MIME types for JavaScript files
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Handle client-side routing with a catch-all route
// IMPORTANT: This should only catch non-file requests
app.get('*', (req, res) => {
  // Don't serve index.html for static file requests
  if (req.path.startsWith('/assets/') || 
      req.path.startsWith('/layout/') || 
      req.path.startsWith('/demo/') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.ico') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.svg')) {
    // Let express.static handle these, if not found return 404
    return res.status(404).send('File not found');
  }
  
  // Only serve index.html for actual page routes
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 