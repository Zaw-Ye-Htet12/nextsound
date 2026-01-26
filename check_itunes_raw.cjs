const https = require('https');

const url = 'https://itunes.apple.com/search?term=Bohemian+Rhapsody&limit=1&media=music&entity=song';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json.results[0], null, 2));
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (err) => {
    console.error("Error: " + err.message);
});
