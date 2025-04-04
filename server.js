/**
 * PDF to HTML Converter Server
 * A simple Express server that handles PDF uploads and serves static files
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('./'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, 'uploads');
        
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename and keep original extension
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${sanitizedName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit to 50MB
    fileFilter: function (req, file, cb) {
        // Accept only PDF files
        if (file.mimetype !== 'application/pdf') {
            req.fileValidationError = 'Only PDF files are allowed';
            return cb(null, false, new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    }
});

// Handle PDF uploads
app.post('/upload', upload.single('pdf-file'), (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({ success: false, message: req.fileValidationError });
    }
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const pdfPath = req.file.path;
    const fileName = path.basename(pdfPath, path.extname(pdfPath));
    const title = req.body.title || fileName;
    const outputDir = path.join(__dirname, 'converted', fileName);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert PDF to HTML using pdf2htmlEX (if installed)
    // Otherwise, we'll rely on client-side processing
    try {
        const command = `pdf2htmlEX --dest-dir "${outputDir}" --zoom 1.5 "${pdfPath}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error converting PDF: ${error.message}`);
                console.error(`stderr: ${stderr}`);
                
                // If conversion fails, send path to the original PDF for client-side processing
                return res.json({
                    success: true,
                    message: 'PDF uploaded successfully, but server-side conversion failed. Client-side processing will be used.',
                    pdfPath: `/uploads/${path.basename(pdfPath)}`,
                    title: title
                });
            }
            
            console.log(`pdf2htmlEX output: ${stdout}`);
            
            // Find the generated HTML file
            const htmlFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.html'));
            
            if (htmlFiles.length > 0) {
                const htmlPath = `/converted/${fileName}/${htmlFiles[0]}`;
                
                return res.json({
                    success: true,
                    message: 'PDF converted successfully',
                    htmlPath: htmlPath,
                    title: title
                });
            } else {
                return res.json({
                    success: false,
                    message: 'PDF conversion failed - no HTML output found',
                    pdfPath: `/uploads/${path.basename(pdfPath)}`,
                    title: title
                });
            }
        });
    } catch (err) {
        console.error('Error executing pdf2htmlEX:', err);
        
        // If command execution fails (e.g., pdf2htmlEX not installed), send path to original PDF
        return res.json({
            success: true,
            message: 'PDF uploaded successfully, but server-side conversion failed. Client-side processing will be used.',
            pdfPath: `/uploads/${path.basename(pdfPath)}`,
            title: title
        });
    }
});

// Handle PDF processing to extract text and images
app.post('/process', upload.single('pdf-file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const pdfPath = req.file.path;
    const outputDir = path.join(__dirname, 'processed', path.basename(pdfPath, '.pdf'));
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Use simple-pdf-parser (you would need to install this package)
    // This is a placeholder - you should implement actual PDF parsing logic here
    try {
        const extractedText = `Sample extracted text from ${pdfPath}`;
        const extractedImages = ['sample-image1.jpg', 'sample-image2.jpg'];
        
        return res.json({
            success: true,
            message: 'PDF processed successfully',
            text: extractedText,
            images: extractedImages,
            outputPath: `/processed/${path.basename(pdfPath, '.pdf')}`
        });
    } catch (err) {
        console.error('Error processing PDF:', err);
        return res.status(500).json({ success: false, message: 'Error processing PDF' });
    }
});

// Create uploads and processed directories
['uploads', 'converted', 'processed'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`PDF Converter Server running on http://localhost:${port}`);
    console.log(`Upload PDF at http://localhost:${port}/upload.html`);
}); 