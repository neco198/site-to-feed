require('now-env');
const express = require('express');
const scrapeIt = require('scrape-it');
const got = require('got');
const tunnel = require('tunnel');

const {
    PORT = 3000,
    PROXY_SERVERS = '',
    PROXY_AUTH = ''
} = process.env;
const app = express();


app.get('/olx/*', async (req, res) => {
    let optionRequest = {};
    if (PROXY_SERVERS.length) {
        console.log({PROXY_SERVERS});
        let servers = PROXY_SERVERS.split(',');
        let proxy = servers[Math.floor(Math.random() * servers.length)].split(':');
        console.log({servers, proxy});
        optionRequest.agent = tunnel.httpOverHttp({
            proxy: {
                proxyAuth: PROXY_AUTH,
                host: proxy[0],
                port: proxy[1]
            }
        })
    }
    let resource = await got.get(`http://olx.ba${req.url.replace('/olx', '')}`, optionRequest);
    let results = scrapeIt.scrapeHTML(resource.body, {
        posts: {
            listItem: "#desno .artikal.imaHover-disabled",
            data: {
                link: {
                    selector: '> a',
                    attr: 'href'
                },
                title: '.naslov p.na',
                location: '.naslov > .lokacijadiv',
                intro_image: {
                    selector: '> a img',
                    attr: 'src'
                },
                short_description: '.naslov > .pna',
                price: '.cijena > .datum > span ',
                date: {
                    selector: '.cijena > .datum > .kada',
                    attr: 'title'
                },
                status: '.cijena > .stanje',
                pik_radnja: '.pikradnja'
            }
        }
    }).posts.map(item => {
        item.intro_image = item.intro_image.replace('-thumb.', '-velika.');
        item.date = item.date.replace('u ', '');
        return item;
    });

    res.header('Total', results.length)
    res.send(results);

});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
