const XLSX = require('xlsx');
const products = require('./src/data/products.json');

// Build rows: one row per image
const rows = [];

products.forEach(product => {
  const images = product.images || (product.image ? [product.image] : []);
  const baseUrl = 'https://techedge-market.vercel.app';
  
  images.forEach((img, index) => {
    const imageUrl = img.startsWith('http') ? img : `${baseUrl}${img}`;
    rows.push({
      'Product Name': product.name,
      'Image URL': imageUrl
    });
  });
});

// Sort by name DESC (A > Z)
rows.sort((a, b) => b['Product Name'].localeCompare(a['Product Name']));

// Create workbook
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Products');

// Write file
XLSX.writeFile(wb, 'products_images.xlsx');
console.log('Created products_images.xlsx with', rows.length, 'rows');
