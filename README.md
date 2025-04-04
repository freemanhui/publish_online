# PDF to HTML Converter for Website

A web application that converts PDF files with images into HTML format for easy viewing on the web. This project extends an existing website to include PDF conversion functionality.

## Features

- Upload PDF files and convert them to HTML
- Extract text and images from PDFs
- Responsive design for viewing on any device
- Client-side conversion using PDF.js
- Optional server-side conversion using pdf2htmlEX (if installed)
- Advanced PDF viewer with:
  - Page navigation
  - Text search
  - Zoom controls
  - Text selection for copying

## Setup

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- [Optional] pdf2htmlEX for server-side conversion

### Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Optional: Install pdf2htmlEX

For better quality conversion, you can install pdf2htmlEX:

#### On macOS:
```
brew install pdf2htmlex
```

#### On Ubuntu/Debian:
```
apt-get install pdf2htmlex
```

## Usage

1. Navigate to the PDF Converter page by clicking "PDF Converter" in the navigation bar
2. Upload a PDF file by clicking "Choose File"
3. [Optional] Enter a title for your document
4. Click "Convert PDF"
5. The converted HTML will either be displayed in a new tab or downloaded as a file

## Project Structure

- `index.html` - Main website homepage
- `upload.html` - PDF upload and conversion interface
- `server.js` - Node.js server for handling uploads
- `pdf-styles.css` - Styles for the converted PDF pages
- `pdf-viewer.js` - JavaScript for enhancing PDF viewing

## Technical Details

The conversion process works in two ways:

1. **Client-side conversion** using PDF.js
   - PDF is loaded and parsed in the browser
   - Each page is rendered to a canvas
   - Text content is extracted and positioned
   - Images are generated from canvas

2. **Server-side conversion** using pdf2htmlEX (if available)
   - More accurate conversion
   - Better preservation of fonts and layout
   - Smaller file size

## License

This project is licensed under the MIT License - see the LICENSE file for details. 