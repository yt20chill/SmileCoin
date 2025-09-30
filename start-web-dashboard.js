const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Enable CORS for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let filePath = '.' + req.url;
    
    // Default to simple dashboard
    if (filePath === './') {
        filePath = './simple-dashboard.html';
    }

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    // Check if file exists
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 Not Found</title></head>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1>404 - File Not Found</h1>
                            <p>The requested file <code>${req.url}</code> was not found.</p>
                            <p><a href="/">Go to Dashboard</a></p>
                        </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🌐 SmileCoin Web Dashboard Server Started');
    console.log('=======================================');
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Simple Dashboard: http://localhost:${PORT}/simple-dashboard.html`);
    console.log(`🔗 Advanced Dashboard: http://localhost:${PORT}/web-dashboard.html`);
    console.log('');
    console.log('📋 Prerequisites:');
    console.log('  ✅ Hardhat network running on http://127.0.0.1:8545');
    console.log('  ✅ SmileCoin contract deployed');
    console.log('  ✅ local-deployment-report.json file exists');
    console.log('');
    console.log('🛑 To stop server: Press Ctrl+C');
    console.log('');
    console.log('🎉 Open your browser and visit the dashboard!');
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down web dashboard server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});