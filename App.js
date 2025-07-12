// משתנים
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const extractBtn = document.getElementById('extractBtn');
const output = document.getElementById('output');

let pdfFile = null;

// טעינת PDF
function loadPDF(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        pdfjsLib.getDocument({data: arrayBuffer}).promise.then(function(pdf) {
            processPDF(pdf);
        }).catch(function(error) {
            output.textContent = "Error loading PDF: " + error.message;
        });
    };

    reader.readAsArrayBuffer(file);
}

// פונקציה שמבצעת את כל תהליך העיבוד
async function processPDF(pdf) {
    try {
        const numPages = pdf.numPages;
        let allItems = [];

        // חילוץ טקסט ותמונות מכל הדפים בסדר
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const textItems = await extractTextFromPage(pdf, pageNum);
            const imageItems = await extractImagesFromPage(pdf, pageNum);
            const pageItems = [...textItems, ...imageItems];

            // מיון על פי המיקומים (לינארי) עבור כל דף בנפרד
            const sortedItems = sortByPosition(pageItems);

            // הצגת התוצאה של הדף הנוכחי
            displayItems(sortedItems, pageNum);
        }

    } catch (error) {
        output.textContent = "Error processing PDF: " + error.message;
    }
}

// חילוץ טקסט מדף אחד
async function extractTextFromPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    let textItems = [];
    textContent.items.forEach(item => {
        console.log("Item:", item);  // הוספת הדפסה כדי לראות את פרטי ה-item
        textItems.push(item.str.trim());  // הוספת הטקסט עצמו
    });

    return textItems;
}

// חילוץ תמונות מדף אחד
async function extractImagesFromPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const operatorList = await page.getOperatorList();

    let images = [];
    operatorList.fnArray.forEach((fn, index) => {
        if (fn === pdfjsLib.OPS.paintImageXObject) {
            const imagePosition = operatorList.argsArray[index];  // מיקום התמונה
            images.push({
                image: 'image',  // מציין שהתמונה נמצאה
                x: imagePosition[0],  // מיקום x
                y: imagePosition[1],  // מיקום y
                pageNum: pageNum  // מספר הדף
            });
        }
    });

    return images;
}

// מיון האלמנטים לפי המיקומים (לינארי)
function sortByPosition(items) {
    items.sort((a, b) => {
        if (a.y === b.y) {
            return a.x - b.x;  // אם ה-Y זהה, נשווה לפי ה-X
        }
        return a.y - b.y;  // קודם כל לפי ה-Y
    });

    return items;
}

function displayItems(items, pageNum) {
    let outputText = "";

    items.forEach(item => {
        if (item) {
            outputText += item + " ";  // הצגת כל טקסט פשוט
        }
    });

    output.innerHTML += outputText + "\n";
}

// טיפול בהעלאת קובץ
fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (file && file.type === 'application/pdf') {
        pdfFile = file;
        loadPDF(pdfFile);
    } else {
        output.textContent = 'Please upload a valid PDF file.';
    }
});

// טיפול בגרירה ושחרור
dropZone.addEventListener('dragover', function(event) {
    event.preventDefault();
    dropZone.style.backgroundColor = '#e9e9e9';
});

dropZone.addEventListener('dragleave', function(event) {
    dropZone.style.backgroundColor = '#fff';
});

dropZone.addEventListener('drop', function(event) {
    event.preventDefault();
    dropZone.style.backgroundColor = '#fff';
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        pdfFile = file;
        loadPDF(pdfFile);
    } else {
        output.textContent = 'Please drop a valid PDF file.';
    }
});

// חילוץ טקסט לפי לחיצה על כפתור
extractBtn.addEventListener('click', function() {
    if (pdfFile) {
        loadPDF(pdfFile);
    } else {
        output.textContent = 'Please upload or drop a PDF first.';
    }
});
