require('now-env');
const express = require('express');
const Feed = require('feed').Feed;
const tunnel = require('tunnel');
const {OlxScraper} = require("./scrapers");

const app = express();

const {
    PORT = 3000,
    PROXY_SERVERS = '',
    PROXY_AUTH = ''
} = process.env;


app.get('/olx/:response_type/pretraga', async (req, res) => {
    console.log('doing');
    let options = {};
    if (PROXY_SERVERS.length) {
        console.log({PROXY_SERVERS});
        let servers = PROXY_SERVERS.split(',');
        let proxy = servers[Math.floor(Math.random() * servers.length)].split(':');
        console.log({proxy});
        options.agent = tunnel.httpsOverHttp({
            proxy: {
                proxyAuth: PROXY_AUTH,
                host: proxy[0],
                port: proxy[1]
            }
        })
    }
    let parser = new OlxScraper(options);
    try {
        console.log('Doing');
        let results = await parser.parseList({query: req.query});
        if (req.params.response_type && req.params.response_type.toLocaleLowerCase() === 'json') {
            res.header('Total', results.length);
            return res.send(results);
        }
        let feed = new Feed({
            title: 'Olx searching feed',
            description: 'Generate RSS for params' + JSON.stringify(req.query),
            author: {}
        });
        for (const result of results) {
            console.log(result);
            feed.addItem({
                id: result.link,
                title: result.title,
                link: result.link,
                description: result.short_description,
                image: result.intro_image,
                content: `
                  Lokacija: ${result.location} \n
                  Cijena: ${result.price} \n
                  Status: ${result.status} \n
                  Pik radnja: ${result.pik_radnja} \n
                `,
                date: '',
            });
        }
        res.set('Content-Type', 'application/rss+xml');
        return res.send(feed.rss2())

    } catch (e) {
        console.error(e);
        res.status(500);
        return res.send('Something Wrong')
    }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
