// משתנים גלובליים
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const extractBtn = document.getElementById('extractBtn');
const downloadBtn = document.getElementById('downloadBtn');
const output = document.getElementById('output');
const loading = document.getElementById('loading');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const outputInfo = document.getElementById('outputInfo');
const stats = document.getElementById('stats');
const pageCount = document.getElementById('pageCount');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');

let pdfFile = null;
let extractedText = '';

// פונקציות עזר
function showMessage(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function showLoading() {
    loading.classList.add('active');
    extractBtn.disabled = true;
}

function hideLoading() {
    loading.classList.remove('active');
    extractBtn.disabled = false;
}

function updateStats(text, pages) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = text.length;
    
    pageCount.textContent = pages;
    wordCount.textContent = words.toLocaleString();
    charCount.textContent = characters.toLocaleString();
    
    stats.style.display = 'grid';
    outputInfo.textContent = `Updated: ${new Date().toLocaleString('en-US')}`;
}

// טעינת PDF
async function loadPDF(file) {
    showLoading();
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        await processPDF(pdf);
        
        showMessage(successMessage, `Text extracted successfully from ${pdf.numPages} pages!`);
        downloadBtn.disabled = false;
        
    } catch (error) {
        showMessage(errorMessage, `Error loading file: ${error.message}`);
        console.error('Error loading PDF:', error);
    } finally {
        hideLoading();
    }
}

// עיבוד PDF
async function processPDF(pdf) {
    const numPages = pdf.numPages;
    let allText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        textContent.items.forEach(item => {
            pageText += item.str + ' ';
        });
        
        allText += `\n${pageText.trim()}\n`;
    }

    extractedText = allText.trim();
    output.textContent = extractedText;
    updateStats(extractedText, numPages);
}

// הורדת קובץ טקסט
function downloadTextFile() {
    if (!extractedText) {
        showMessage(errorMessage, 'No text to download');
        return;
    }

    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `extracted-text-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showMessage(successMessage, 'File downloaded successfully!');
}

// מאזיני אירועים
fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (file && file.type === 'application/pdf') {
        pdfFile = file;
        extractBtn.disabled = false;
        showMessage(successMessage, `File selected: ${file.name}`);
    } else {
        showMessage(errorMessage, 'Please select a valid PDF file');
    }
});

// גרירה ושחרור
dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        pdfFile = file;
        extractBtn.disabled = false;
        showMessage(successMessage, `File selected: ${file.name}`);
    } else {
        showMessage(errorMessage, 'Please drag a valid PDF file');
    }
});

dropZone.addEventListener('click', function() {
    fileInput.click();
});

// לחיצה על כפתור חילוץ
extractBtn.addEventListener('click', function() {
    if (pdfFile) {
        loadPDF(pdfFile);
    } else {
        showMessage(errorMessage, 'Please select a PDF file first');
    }
});

// לחיצה על כפתור הורדה
downloadBtn.addEventListener('click', downloadTextFile);

// מניעת התנהגות ברירת מחדל לגרירה
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
});