
const https = require('https');

const query = 'taylor+swift';
const url = `https://api.deezer.com/search/artist?q=${query}&limit=1`;

console.log(`Fetching from: ${url}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.data && json.data.length > 0) {
                console.log('Result:', JSON.stringify(json.data[0], null, 2));
            } else {
                console.log('No data found');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
