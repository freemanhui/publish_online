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

// Directory for storing converted documents
const DOCUMENTS_DIR = path.join(__dirname, 'documents');
const METADATA_FILE = path.join(DOCUMENTS_DIR, 'metadata.json');

// Ensure directories exist
['uploads', 'converted', 'processed', 'documents'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Create metadata file if it doesn't exist
if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2));
}

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('./'));

// For serving documents from the documents directory
app.use('/documents', express.static(DOCUMENTS_DIR));

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
    limits: { fileSize: 100 * 1024 * 1024 }, // Increase to 100MB (from 50MB)
    fileFilter: function (req, file, cb) {
        // Accept only PDF files for PDF uploads or any file for document saves
        if (req.path === '/upload' && file.mimetype !== 'application/pdf') {
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

// Handle document saving
app.post('/save-document', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    try {
        // Parse metadata from request
        const metadata = JSON.parse(req.body.metadata || '{}');
        
        // Validate required fields
        if (!metadata.title || !metadata.fileName) {
            return res.status(400).json({ success: false, message: 'Title and fileName are required in metadata' });
        }
        
        // Save the file to the documents directory
        const documentPath = path.join(DOCUMENTS_DIR, metadata.fileName);
        fs.copyFileSync(req.file.path, documentPath);
        
        // Read existing metadata
        let documents = [];
        try {
            const metadataContent = fs.readFileSync(METADATA_FILE, 'utf8');
            documents = JSON.parse(metadataContent);
        } catch (err) {
            console.error('Error reading metadata:', err);
        }
        
        // Add new document metadata
        const newDoc = {
            id: Date.now(), // Simple ID generation
            title: metadata.title,
            fileName: metadata.fileName,
            date: metadata.date || new Date().toISOString(),
            fileSize: metadata.fileSize || fs.statSync(documentPath).size
        };
        
        documents.push(newDoc);
        
        // Save updated metadata
        fs.writeFileSync(METADATA_FILE, JSON.stringify(documents, null, 2));
        
        return res.json({
            success: true,
            message: 'Document saved successfully',
            document: newDoc
        });
    } catch (err) {
        console.error('Error saving document:', err);
        return res.status(500).json({ success: false, message: `Error saving document: ${err.message}` });
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// API endpoint to get all documents
app.get('/documents', (req, res) => {
    try {
        // Read metadata file
        const metadataContent = fs.readFileSync(METADATA_FILE, 'utf8');
        const documents = JSON.parse(metadataContent);
        
        res.json(documents);
    } catch (err) {
        console.error('Error reading documents:', err);
        res.status(500).json({ success: false, message: `Error reading documents: ${err.message}` });
    }
});

// API endpoint to delete a document
app.delete('/documents/:id', (req, res) => {
    const documentId = req.params.id;
    
    try {
        // Read metadata
        const metadataContent = fs.readFileSync(METADATA_FILE, 'utf8');
        let documents = JSON.parse(metadataContent);
        
        // Find the document
        const documentIndex = documents.findIndex(doc => doc.id.toString() === documentId);
        
        if (documentIndex === -1) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        const documentToDelete = documents[documentIndex];
        
        // Delete the file
        const filePath = path.join(DOCUMENTS_DIR, documentToDelete.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove from metadata
        documents.splice(documentIndex, 1);
        fs.writeFileSync(METADATA_FILE, JSON.stringify(documents, null, 2));
        
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ success: false, message: `Error deleting document: ${err.message}` });
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

// Add a route to serve the document library
app.get('/library', (req, res) => {
    res.sendFile(path.join(__dirname, 'documents.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`PDF Converter Server running on http://localhost:${port}`);
    console.log(`Upload PDF at http://localhost:${port}/upload.html`);
    console.log(`Document Library at http://localhost:${port}/documents.html`);
}); 