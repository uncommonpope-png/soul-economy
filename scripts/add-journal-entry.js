/**
 * ADD JOURNAL ENTRY — Run after every completed task
 * Usage: node scripts/add-journal-entry.js
 * 
 * This appends a new entry to data/journal-entries.json
 * so the dashboard pyramid always has the latest journal.
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const journalPath = 'data/journal-entries.json';

function ask(q) { return new Promise(r => rl.question(q, r)); }

async function main() {
    console.log('\n✦ ADD JOURNAL ENTRY — The pyramid awaits your update.\n');

    const session = await ask('Session name (e.g. "Session 35 — The Great Fix"): ');
    const date = await ask('Date (YYYY-MM-DD): ') || new Date().toISOString().slice(0, 10);
    const summary = await ask('Summary (one line): ');

    const chapters = [];
    let adding = true;
    while (adding) {
        const icon = await ask('Chapter icon (♦♥▲✪): ') || '♦';
        const name = await ask('Chapter name: ');
        if (!name) { adding = false; break; }
        const desc = await ask('Chapter description: ');
        chapters.push({ icon, name, desc });
        const more = await ask('Add another chapter? (y/n): ');
        if (more.toLowerCase() !== 'y') adding = false;
    }

    const entry = {
        id: session.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        session,
        date,
        author: 'Profit Prime',
        chapters,
        summary
    };

    const data = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    data.entries.push(entry);
    fs.writeFileSync(journalPath, JSON.stringify(data, null, 2));
    
    console.log(`\n✦ Journal updated: ${data.entries.length} entries now in the pyramid.`);
    console.log('Push to GitHub for the CEO to see.\n');
    
    rl.close();
}

main();
