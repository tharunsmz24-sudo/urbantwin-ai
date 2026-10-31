const fs = require('fs');
const dataCode = fs.readFileSync('js/data.js', 'utf8');

const combined = dataCode + `
fs.writeFileSync('districts.json', JSON.stringify(TAMIL_NADU_DISTRICTS, null, 2));
console.log('Saved districts.json successfully with', TAMIL_NADU_DISTRICTS.length, 'districts.');
`;

eval(combined);
