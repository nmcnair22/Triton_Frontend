const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Get PORT from environment variable for Azure App Service
const PORT = process.env.PORT || 8080;

// Serve static files from the dist directory with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    // Ensure JavaScript files are served with correct MIME type
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
  },
  // Important: Let Express handle 404s for static files
  fallthrough: true
}));

// Handle client-side routing
app.get('*', (req, res, next) => {
  // Check if the requested path is for a static asset
  const isAssetPath = 
    req.path.startsWith('/assets/') || 
    req.path.startsWith('/layout/') ||
    req.path.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|map)$/);
  
  if (isAssetPath) {
    // For asset paths, check if file actually exists
    const filePath = path.join(__dirname, 'dist', req.path);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist, return 404
        console.error(`File not found: ${req.path}`);
        return res.status(404).send('File not found');
      } else {
        // File exists but wasn't served by express.static (shouldn't happen)
        // Pass to next middleware
        next();
      }
    });
  } else {
    // For non-asset routes, serve index.html for client-side routing
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    
    // Check if index.html exists
    fs.access(indexPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('index.html not found!');
        return res.status(500).send('Application not properly built');
      }
      res.sendFile(indexPath);
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
  
  // Log the dist directory contents for debugging
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('dist directory exists');
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      console.log(`Found ${files.length} files in assets directory`);
    }
  } else {
    console.error('WARNING: dist directory not found!');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});