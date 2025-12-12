const pdfParse = require('pdf-parse/dist/node/cjs/index.cjs');

console.log('Type of pdfParse:', typeof pdfParse);
if (typeof pdfParse === 'function') {
    console.log('pdfParse is a function!');
} else {
    console.log('Still not a function:', pdfParse);
    if (pdfParse.default) {
        console.log('Default export:', typeof pdfParse.default);
    }
}
