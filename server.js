const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist');

// Serve static files from the 'dist' directory
app.use(express.static(distPath));

// SPA Fallback: For any request that doesn't match a static file,
// send back index.html.
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  // It's still a good idea to check if index.html exists, especially on first launch
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Application not properly built. index.html not found.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);

  // Debugging: Log directory contents on start
  if (!fs.existsSync(distPath)) {
    console.error('CRITICAL: dist directory not found!');
  } else {
    console.log('dist directory exists.');
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      console.log(`Found ${files.length} files in the assets directory.`);
    }
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});