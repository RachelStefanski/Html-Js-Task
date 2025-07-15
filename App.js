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
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

    // עבור כל עמוד ב-PDF
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        let words = [];
        textContent.items.forEach(item => {
            words.push({
                text: item.str,
                x: item.transform[4],  // קואורדינטת X
                y: item.transform[5]   // קואורדינטת Y
            });
        });

        // שלב 1: חישוב הטורים לפי X
        const columns = detectColumns(words);  // זיהוי הטורים בעמוד

        // הצגת התוצאה
        let outputHTML = '';
        columns.forEach(column => {
            outputHTML += column.map(word => word.text).join(' ') + ' ';  // שרשור מילים בטור
        });

        allText += outputHTML + '\n';  // הוספת הטקסט לעיבוד
    }

    extractedText = allText.trim();
    output.textContent = extractedText; 
    updateStats(extractedText, numPages); 
}

// חישוב המרחק בין שתי מילים
function calculateDistance(word1, word2) {
    // אם אין קואורדינטות תקינות, תדלג על חישוב המרחק
    if (word1.x === undefined || word2.x === undefined) {
        return 0;
    }
    return Math.abs(word1.x - word2.x);
}

// זיהוי טורים בעמוד
function detectColumns(words) {
    let columns = [];
    let currentColumn = [];
    let lastX = words[0].x;
    let averageDistance = calculateAverageDistance(words);

    words.forEach((word, index) => {
        // אם המילה הנוכחית או המילה הבאה אינה מכילה קואורדינטה, נדלג עליה
        if (word.x === undefined || words[index + 1]?.x === undefined) {
            return;
        }

        let distance = calculateDistance(word, words[index + 1]);

        // אם המרחק גדול מהממוצע, מדובר בטור חדש
        if (distance > averageDistance) {
            columns.push(currentColumn);
            currentColumn = [word];
        } else {
            currentColumn.push(word);
        }

        lastX = word.x;
    });

    if (currentColumn.length > 0) {
        columns.push(currentColumn); // הוספת הטור האחרון
    }

    return columns;
}

// חישוב ממוצע המרחק בין מילים בעמוד
function calculateAverageDistance(words) {
    let totalDistance = 0;
    let count = 0;

    for (let i = 1; i < words.length; i++) {
        totalDistance += calculateDistance(words[i], words[i - 1]);
        count++;
    }

    return count > 0 ? totalDistance / count : 0;
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
fileInput.addEventListener('change', function () {
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
dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function (e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', function (e) {
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

dropZone.addEventListener('click', function () {
    fileInput.click();
});

// לחיצה על כפתור חילוץ
extractBtn.addEventListener('click', function () {
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
    document.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
});