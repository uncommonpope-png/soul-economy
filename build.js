const fs = require('fs');

// Read the catalog (raw JS array)
const catalogJs = fs.readFileSync('data/catalog.json', 'utf8');

// Convert JS object literal string to JSON
// This is a simple approach that handles our specific format
let json = '[' + catalogJs + ']';

// Remove comments
json = json.replace(/\/\/.*/g, '');

// Convert single-quoted property names to double-quoted
json = json.replace(/'(\w+)':/g, '"$1":');

// Convert single-quoted string values to double-quoted
// Handle the escaped single quotes inside strings
json = json.replace(/:'([^']*?)'(,|}|\n|$)/g, (match, p1, p2) => {
    return ':"' + p1.replace(/\\'/g, "'") + '"' + p2;
});

// Fix any remaining single quotes
json = json.replace(/'/g, '"');

// Parse and re-stringify to validate
try {
    const data = JSON.parse(json);
    fs.writeFileSync('data/catalog.json', JSON.stringify(data, null, 2));
    console.log(`✓ Catalog saved: ${data.length} items`);
    
    // Generate the items array snippet for the HTML
    let itemsJs = 'const items = [\n';
    data.forEach((item, i) => {
        const icon = item.icon || '❓';
        const type = item.type || 'unknown';
        const name = item.name || '';
        const desc = (item.desc || '').replace(/'/g, "\\'");
        const plt = item.plt || '0.5/0.5/0.5';
        const file = item.file || '';
        const url = item.url || '';
        const featured = item.featured || false;
        
        if (url) {
            itemsJs += `  {icon:'${icon}',type:'${type}',name:'${name}',desc:'${desc}',plt:'${plt}',url:'${url}'${featured ? ',featured:true' : ''}},\n`;
        } else {
            itemsJs += `  {icon:'${icon}',type:'${type}',name:'${name}',desc:'${desc}',plt:'${plt}',file:'${file}'${featured ? ',featured:true' : ''}},\n`;
        }
    });
    itemsJs += '];';
    
    // Read the current index.html
    let html = fs.readFileSync('index.html', 'utf8');
    
    // Replace the items array
    const startMarker = 'const items = [';
    const endMarker = '];';
    const startIdx = html.indexOf(startMarker);
    const endIdx = html.indexOf(endMarker, startIdx) + 2;
    
    if (startIdx >= 0 && endIdx > startIdx) {
        html = html.substring(0, startIdx) + itemsJs + html.substring(endIdx);
        fs.writeFileSync('index.html', html);
        console.log('✓ index.html updated');
    }
    
    // Also generate a catalog loader snippet
    const loaderSnippet = `
// Load catalog from JSON
async function loadCatalog() {
    try {
        const res = await fetch('./data/catalog.json');
        if (res.ok) {
            window.items = await res.json();
            return window.items;
        }
    } catch(e) {}
    return window.items; // fallback to embedded
}
`;
    console.log('\nDone. Catalog decoupled from HTML.');
    
} catch (e) {
    console.error('JSON parse error:', e.message);
    console.log('Saving raw for manual fix...');
    fs.writeFileSync('data/catalog-raw.json', json);
}
