/**
 * PDF Viewer JavaScript
 * Enhances the PDF viewing experience with navigation and search functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create navigation controls
    createNavigation();
    
    // Add zoom functionality
    addZoomControls();
    
    // Add search functionality
    addSearchBox();
    
    // Add text view toggle option
    addTextViewToggle();
    
    // Handle text selection for copying
    enableTextSelection();
});

/**
 * Creates navigation controls for the PDF viewer
 */
function createNavigation() {
    const pdfContainer = document.querySelector('.pdf-container');
    const pages = document.querySelectorAll('.pdf-page');
    
    if (!pdfContainer || pages.length === 0) return;
    
    // Create navigation container
    const navControls = document.createElement('div');
    navControls.classList.add('pdf-nav-controls');
    navControls.innerHTML = `
        <div class="pdf-nav">
            <button id="prev-page" title="Previous Page">❮</button>
            <span id="page-display">Page 1 of ${pages.length}</span>
            <button id="next-page" title="Next Page">❯</button>
        </div>
    `;
    
    // Insert navigation before the first page
    pdfContainer.insertBefore(navControls, pdfContainer.firstChild);
    
    // Add event listeners for navigation
    let currentPage = 1;
    
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            navigateToPage(--currentPage);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < pages.length) {
            navigateToPage(++currentPage);
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            if (currentPage < pages.length) {
                navigateToPage(++currentPage);
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            if (currentPage > 1) {
                navigateToPage(--currentPage);
            }
        }
    });
    
    // Function to navigate to a specific page
    function navigateToPage(pageNum) {
        // Update current page
        currentPage = pageNum;
        
        // Update page display
        document.getElementById('page-display').textContent = `Page ${currentPage} of ${pages.length}`;
        
        // Scroll to the page
        const targetPage = document.getElementById(`page-${currentPage}`);
        targetPage.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Initialize - show first page
    navigateToPage(1);
}

/**
 * Adds zoom controls for the PDF viewer
 */
function addZoomControls() {
    const navControls = document.querySelector('.pdf-nav-controls');
    if (!navControls) return;
    
    // Create zoom container
    const zoomControls = document.createElement('div');
    zoomControls.classList.add('pdf-zoom-controls');
    zoomControls.innerHTML = `
        <button id="zoom-out" title="Zoom Out">−</button>
        <span id="zoom-level">100%</span>
        <button id="zoom-in" title="Zoom In">+</button>
    `;
    
    // Add zoom controls to navigation
    navControls.appendChild(zoomControls);
    
    // Initialize zoom level
    let zoomLevel = 100;
    const zoomStep = 25;
    const minZoom = 50;
    const maxZoom = 200;
    
    // Apply zoom to all page images
    function applyZoom() {
        const pageImages = document.querySelectorAll('.page-image');
        pageImages.forEach(img => {
            img.style.width = `${zoomLevel}%`;
        });
        
        document.getElementById('zoom-level').textContent = `${zoomLevel}%`;
    }
    
    // Zoom in event listener
    document.getElementById('zoom-in').addEventListener('click', function() {
        if (zoomLevel < maxZoom) {
            zoomLevel += zoomStep;
            applyZoom();
        }
    });
    
    // Zoom out event listener
    document.getElementById('zoom-out').addEventListener('click', function() {
        if (zoomLevel > minZoom) {
            zoomLevel -= zoomStep;
            applyZoom();
        }
    });
    
    // Keyboard shortcuts for zooming
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === '=') {
            e.preventDefault();
            if (zoomLevel < maxZoom) {
                zoomLevel += zoomStep;
                applyZoom();
            }
        } else if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            if (zoomLevel > minZoom) {
                zoomLevel -= zoomStep;
                applyZoom();
            }
        }
    });
}

/**
 * Adds a toggle button to switch between image view and text-only view
 */
function addTextViewToggle() {
    const pages = document.querySelectorAll('.pdf-page');
    if (pages.length === 0) return;
    
    pages.forEach(page => {
        // Create text-only view container
        const textOnlyView = document.createElement('div');
        textOnlyView.classList.add('text-only-view');
        
        // Extract text from text-lines and add to text-only view
        const textLines = page.querySelectorAll('.text-line');
        let pageText = '';
        
        textLines.forEach(line => {
            pageText += line.textContent + '\n';
        });
        
        textOnlyView.textContent = pageText;
        
        // Create toggle button
        const toggleBtn = document.createElement('div');
        toggleBtn.classList.add('text-view-toggle');
        toggleBtn.textContent = 'Toggle Text-Only View';
        toggleBtn.addEventListener('click', function() {
            textOnlyView.classList.toggle('active');
            const pageImage = page.querySelector('.page-image');
            const pageTextLayer = page.querySelector('.page-text');
            
            if (textOnlyView.classList.contains('active')) {
                // Switch to text-only view
                toggleBtn.textContent = 'Show Original View';
                if (pageImage) pageImage.style.display = 'none';
                if (pageTextLayer) pageTextLayer.style.display = 'none';
            } else {
                // Switch back to original view
                toggleBtn.textContent = 'Toggle Text-Only View';
                if (pageImage) pageImage.style.display = 'block';
                if (pageTextLayer) pageTextLayer.style.display = 'block';
            }
        });
        
        // Add toggle button and text view to page
        page.appendChild(toggleBtn);
        page.appendChild(textOnlyView);
    });
}

/**
 * Adds search functionality to the PDF viewer
 */
function addSearchBox() {
    const navControls = document.querySelector('.pdf-nav-controls');
    if (!navControls) return;
    
    // Create search container
    const searchBox = document.createElement('div');
    searchBox.classList.add('pdf-search');
    searchBox.innerHTML = `
        <input type="text" id="pdf-search-input" placeholder="Search...">
        <button id="pdf-search-btn">Search</button>
        <span id="search-results"></span>
    `;
    
    // Add search box to navigation
    navControls.appendChild(searchBox);
    
    // Handle search
    document.getElementById('pdf-search-btn').addEventListener('click', performSearch);
    document.getElementById('pdf-search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        const searchTerm = document.getElementById('pdf-search-input').value.trim().toLowerCase();
        const resultsDisplay = document.getElementById('search-results');
        
        if (!searchTerm) {
            resultsDisplay.textContent = 'Please enter a search term';
            return;
        }
        
        // Clear previous highlights
        clearHighlights();
        
        // Search in all text elements
        const textLines = document.querySelectorAll('.text-line');
        let matchCount = 0;
        let firstMatchPage = null;
        
        textLines.forEach(line => {
            const text = line.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                // Highlight matches
                highlightText(line, searchTerm);
                matchCount++;
                
                // Store first match page for navigation
                if (!firstMatchPage) {
                    const pageEl = line.closest('.pdf-page');
                    if (pageEl) {
                        firstMatchPage = pageEl;
                    }
                }
            }
        });
        
        // Show results
        if (matchCount > 0) {
            resultsDisplay.textContent = `Found ${matchCount} matches`;
            
            // Navigate to first match
            if (firstMatchPage) {
                firstMatchPage.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            resultsDisplay.textContent = 'No matches found';
        }
    }
    
    function highlightText(element, term) {
        // Create a highlighted version by wrapping the term in a span
        const originalText = element.textContent;
        const lowerText = originalText.toLowerCase();
        let highlightedHTML = '';
        let lastIndex = 0;
        
        // Find all occurrences of the term
        let startIndex = lowerText.indexOf(term);
        while (startIndex !== -1) {
            // Add text before the match
            highlightedHTML += originalText.substring(lastIndex, startIndex);
            
            // Add the highlighted match
            const matchedText = originalText.substr(startIndex, term.length);
            highlightedHTML += `<mark>${matchedText}</mark>`;
            
            // Update indices
            lastIndex = startIndex + term.length;
            startIndex = lowerText.indexOf(term, lastIndex);
        }
        
        // Add remaining text
        highlightedHTML += originalText.substring(lastIndex);
        
        // Update element
        element.innerHTML = highlightedHTML;
    }
    
    function clearHighlights() {
        document.querySelectorAll('.text-line mark').forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.textContent = parent.textContent;
            }
        });
    }
}

/**
 * Enables text selection for copying
 */
function enableTextSelection() {
    const textElements = document.querySelectorAll('.text-line');
    
    textElements.forEach(element => {
        element.style.userSelect = 'text';
        element.style.cursor = 'text';
    });
}

// Add CSS styles dynamically for controls
const styles = document.createElement('style');
styles.textContent = `
    .pdf-nav-controls {
        position: sticky;
        top: 65px;
        background-color: #f9f9f9;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        z-index: 100;
    }
    
    .pdf-nav {
        display: flex;
        align-items: center;
        margin: 5px 0;
    }
    
    .pdf-nav button {
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 16px;
        margin: 0 5px;
    }
    
    .pdf-nav button:hover {
        background-color: #0056b3;
    }
    
    #page-display {
        margin: 0 10px;
        font-weight: bold;
    }
    
    .pdf-zoom-controls {
        display: flex;
        align-items: center;
        margin: 5px 0;
    }
    
    .pdf-zoom-controls button {
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 16px;
        margin: 0 5px;
    }
    
    .pdf-zoom-controls button:hover {
        background-color: #5a6268;
    }
    
    #zoom-level {
        margin: 0 10px;
        font-weight: bold;
    }
    
    .pdf-search {
        display: flex;
        align-items: center;
        margin: 5px 0;
        flex-grow: 1;
        justify-content: flex-end;
    }
    
    #pdf-search-input {
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-right: 5px;
        width: 200px;
    }
    
    #pdf-search-btn {
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
    }
    
    #pdf-search-btn:hover {
        background-color: #218838;
    }
    
    #search-results {
        margin-left: 10px;
        font-size: 14px;
    }
    
    mark {
        background-color: yellow;
        color: black;
    }
    
    @media (max-width: 768px) {
        .pdf-nav-controls {
            flex-direction: column;
        }
        
        .pdf-nav, .pdf-zoom-controls, .pdf-search {
            width: 100%;
            justify-content: center;
            margin: 5px 0;
        }
        
        #pdf-search-input {
            width: 150px;
        }
    }
    
    @media (prefers-color-scheme: dark) {
        .pdf-nav-controls {
            background-color: #444;
        }
        
        #pdf-search-input {
            background-color: #333;
            color: #fff;
            border-color: #555;
        }
        
        mark {
            background-color: #b58900;
            color: #eee;
        }
    }
`;

document.head.appendChild(styles); 