const pdfParse = require('pdf-parse');

console.log('Keys:', Object.keys(pdfParse));
if (typeof pdfParse.default === 'function') {
    console.log('Found default export function');
} else {
    console.log('No default export function found');
    console.log('Type of default:', typeof pdfParse.default);
}
