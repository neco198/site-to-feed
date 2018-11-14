const scrapeIt = require('scrape-it');
const got = require('got');
const randomUseragent = require('random-useragent');

class OlxScraper {

    constructor(options = {}) {
        this.client = got.extend({
            baseUrl: 'https://www.olx.ba',
            headers: {
                'user-agent': randomUseragent.getRandom()
            },
            ...options
        });
    }

    parseDetails() {

    }

    async parseList(params) {
        if (!params) throw new Error('Invalid arguments');
        let resource;
        try {
            resource = await this.client.get('/pretraga', params);
        } catch (e) {
            if (!(e instanceof got.HTTPError && e.body.includes('id="rezultatipretrage"'))) {
                throw e;
            }
            resource = e;
        }
        return scrapeIt.scrapeHTML(resource.body, {
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
    }
}

module.exports = {
    OlxScraper
};