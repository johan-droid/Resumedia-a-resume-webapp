const pdfParse = require('pdf-parse');

console.log('Type of pdfParse:', typeof pdfParse);
console.log('pdfParse value:', pdfParse);

try {
    if (typeof pdfParse === 'function') {
        console.log('pdfParse is a function, test passed.');
    } else {
        console.log('pdfParse is NOT a function.');
        if (pdfParse.default) {
            console.log('pdfParse.default is:', typeof pdfParse.default);
        }
    }
} catch (e) {
    console.error('Error:', e);
}
