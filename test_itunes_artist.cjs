
const https = require('https');

const query = 'taylor+swift';
const url = `https://itunes.apple.com/search?term=${query}&entity=musicArtist&limit=5`;

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Result Count:', json.resultCount);
            if (json.results && json.results.length > 0) {
                console.log('First result keys:', Object.keys(json.results[0]));
                console.log('First result:', JSON.stringify(json.results[0], null, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
