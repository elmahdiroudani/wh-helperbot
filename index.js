// Enhanced WH-HelperBot with embedded web scraper - Single File Deployment (Fixed)
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

// Validate environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
    console.error('❌ TELEGRAM_TOKEN environment variable is required!');
    console.log('📝 Please set TELEGRAM_TOKEN in your Railway dashboard');
    console.log('🔑 Token should be: 7731039986:AAHFILgUq8744b1CO5WCjMe1HF2Oqvk0xOg');
}

// Embedded Web Scraper Class with Informatik Focus
class WestfaelischeHochschuleScraper {
    constructor() {
        this.baseUrl = 'https://www.w-hs.de';
        this.informatikUrl = 'https://www.w-hs.de/informatik/info-center/pruefungen/';
        this.cache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes

        // Informatik-specific exam periods from actual data
        this.informatikPruefungszeitraeume2025 = [
            {
                periode: 1,
                name: 'Prüfungsperiode 1',
                zeitraeume: ['27.01. - 31.01.2025', '24.03. - 28.03.2025'],
                anmeldezeitraeume: ['30.12.24 - 12.01.25', '24.02. - 09.03.2025']
            },
            {
                periode: 2,
                name: 'Prüfungsperiode 2',
                zeitraeume: ['30.06. - 11.07.2025'],
                anmeldezeitraeume: ['09.06. - 22.06.2025']
            },
            {
                periode: 3,
                name: 'Prüfungsperiode 3',
                zeitraeume: ['22.09. - 06.10.2025'],
                anmeldezeitraeume: ['25.08. - 07.09.2025']
            }
        ];
    }

    async fetchPage(url, retries = 3) {
        try {
            console.log(`🔍 Fetching: ${url}`);
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });

            if (response.status === 200) {
                return cheerio.load(response.data);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            console.error(`❌ Error fetching ${url}:`, error.message);
            if (retries > 0) {
                console.log(`🔄 Retrying... (${retries} attempts left)`);
                await this.delay(2000);
                return this.fetchPage(url, retries - 1);
            }
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        return (Date.now() - cached.timestamp) < this.cacheExpiry;
    }

    async getCachedOrFetch(key, fetchFunction) {
        if (this.isCacheValid(key)) {
            console.log(`📋 Using cached data for: ${key}`);
            return this.cache.get(key).data;
        }

        try {
            const data = await fetchFunction();
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
            console.log(`✅ Cached new data for: ${key}`);
            return data;
        } catch (error) {
            const cached = this.cache.get(key);
            if (cached) {
                console.log(`⚠️ Using stale cache for: ${key}`);
                return cached.data;
            }
            throw error;
        }
    }

    // Informatik-specific methods
    async scrapeInformatikPruefungen() {
        return this.getCachedOrFetch('informatik_pruefungen', async () => {
            try {
                console.log('🔍 Fetching Informatik exam data...');
                const $ = await this.fetchPage(this.informatikUrl);

                const pruefungen = [];

                // Add the structured exam periods we know
                this.informatikPruefungszeitraeume2025.forEach(periode => {
                    periode.zeitraeume.forEach((zeitraum, index) => {
                        pruefungen.push({
                            type: 'Informatik Prüfungsperiode',
                            description: `${periode.name} - Zeitraum ${index + 1}`,
                            date: zeitraum,
                            anmeldung: periode.anmeldezeitraeume[index] || periode.anmeldezeitraeume[0],
                            source: 'w-hs.de/informatik',
                            department: 'Informatik'
                        });
                    });
                });

                // Try to scrape additional current announcements
                $('.news-item, .bekanntmachung, article').each((i, element) => {
                    const text = $(element).text().trim();
                    const title = $(element).find('h1, h2, h3, .title').first().text().trim();

                    if (text.toLowerCase().includes('prüfung') ||
                        text.toLowerCase().includes('klausur') ||
                        title.toLowerCase().includes('informatik')) {

                        const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                        if (dateMatch) {
                            pruefungen.push({
                                type: 'Informatik Ankündigung',
                                description: title || text.substring(0, 80) + '...',
                                date: dateMatch[0],
                                source: 'w-hs.de/informatik',
                                department: 'Informatik'
                            });
                        }
                    }
                });

                return pruefungen.length > 0 ? pruefungen : this.getDefaultInformatikPruefungen();

            } catch (error) {
                console.error('❌ Error scraping Informatik data:', error.message);
                return this.getDefaultInformatikPruefungen();
            }
        });
    }

    async scrapeInformatikAnmeldungen() {
        return this.getCachedOrFetch('informatik_anmeldungen', async () => {
            try {
                const anmeldungen = [];                // Current registration periods from structured data
                this.informatikPruefungszeitraeume2025.forEach(periode => {
                    periode.anmeldezeitraeume.forEach((zeitraum, index) => {
                        anmeldungen.push({
                            type: 'Informatik Prüfungsanmeldung',
                            description: `${periode.name} - Anmeldung ${index + 1}`,
                            date: zeitraum,
                            pruefungszeit: periode.zeitraeume[index] || periode.zeitraeume[0],
                            campus_portal: 'campus.w-hs.de',
                            source: 'w-hs.de/informatik',
                            department: 'Informatik'
                        });
                    });
                });

                return anmeldungen;

            } catch (error) {
                console.error('❌ Error scraping Informatik registration data:', error.message);
                return this.getDefaultInformatikAnmeldungen();
            }
        });
    }

    getDefaultInformatikPruefungen() {
        return [
            {
                type: 'Informatik Prüfungsperiode',
                description: 'Prüfungsperiode 1 - Zeitraum 1',
                date: '27.01. - 31.01.2025',
                anmeldung: '30.12.24 - 12.01.25',
                source: 'Fallback',
                department: 'Informatik'
            },
            {
                type: 'Informatik Prüfungsperiode',
                description: 'Prüfungsperiode 2',
                date: '30.06. - 11.07.2025',
                anmeldung: '09.06. - 22.06.2025',
                source: 'Fallback',
                department: 'Informatik'
            }
        ];
    }

    getDefaultInformatikAnmeldungen() {
        return [
            {
                type: 'Informatik Prüfungsanmeldung',
                description: 'Prüfungsperiode 1 - Anmeldung 1',
                date: '30.12.24 - 12.01.25',
                pruefungszeit: '27.01. - 31.01.2025',
                campus_portal: 'campus.w-hs.de',
                source: 'Fallback',
                department: 'Informatik'
            }
        ];
    }

    async scrapeAnmeldungTermine() {
        return this.getCachedOrFetch('anmeldung', async () => {
            try {
                // Prioritize Informatik data
                const informatikAnmeldungen = await this.scrapeInformatikAnmeldungen();
                if (informatikAnmeldungen.length > 0) {
                    return informatikAnmeldungen;
                }

                // Fallback to general scraping
                const urls = [
                    `${this.baseUrl}/studium/bewerbung-und-einschreibung/`,
                    `${this.baseUrl}/service/suche/?tx_kesearch_pi1%5Bfilter_1_%5D=event&tx_kesearch_pi1%5Bsword%5D=`
                ];

                let termine = [];

                for (const url of urls) {
                    try {
                        const $ = await this.fetchPage(url);

                        $('h2, h3, .termine, .deadline, .anmeldung, .bewerbung, .einschreibung').each((i, element) => {
                            const text = $(element).text().trim();
                            if (text.toLowerCase().includes('anmeldung') ||
                                text.toLowerCase().includes('bewerbung') ||
                                text.toLowerCase().includes('einschreibung')) {

                                const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                                termine.push({
                                    type: 'Anmeldung/Bewerbung',
                                    description: text,
                                    date: dateMatch ? dateMatch[0] : 'Datum siehe Website',
                                    source: 'w-hs.de'
                                });
                            }
                        });
                        if (termine.length > 0) break;
                    } catch (error) {
                        console.error(`Error scraping URL: ${error.message}`);
                        continue;
                    }
                } return termine.length > 0 ? termine.slice(0, 5) : this.getDefaultAnmeldungTermine();
            } catch (error) {
                console.error('Error in scrapeAnmeldungTermine:', error.message);
                return this.getDefaultAnmeldungTermine();
            }
        });
    } async scrapeKlausurTermine() {
        return this.getCachedOrFetch('klausuren', async () => {
            try {
                // Prioritize Informatik exam data
                const informatikPruefungen = await this.scrapeInformatikPruefungen();
                if (informatikPruefungen.length > 0) {
                    return informatikPruefungen;
                }

                // Fallback to general exam scraping
                const $ = await this.fetchPage(`${this.baseUrl}/service/suche/?tx_kesearch_pi1%5Bfilter_1_%5D=event&tx_kesearch_pi1%5Bsword%5D=`);

                const klausuren = [];

                $('.event, .termin, article, .news-item').each((i, element) => {
                    const text = $(element).text().trim();
                    const title = $(element).find('h1, h2, h3, .title, .headline').first().text().trim();
                    const fullText = title + ' ' + text;

                    if (fullText.toLowerCase().includes('klausur') ||
                        fullText.toLowerCase().includes('prüfung')) {

                        const dateMatch = fullText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                        klausuren.push({
                            type: 'Termin/Prüfung',
                            description: title || text.substring(0, 100) + '...',
                            date: dateMatch ? dateMatch[0] : 'siehe Ankündigung',
                            source: 'w-hs.de'
                        });
                    }
                });

                return klausuren.length > 0 ? klausuren.slice(0, 5) : this.getDefaultKlausurTermine();
            } catch (error) {
                console.error('Error in scrapeKlausurTermine:', error.message);
                return this.getDefaultKlausurTermine();
            }
        });
    } async scrapeAktuelles() {
        return this.getCachedOrFetch('aktuelles', async () => {
            try {
                // Use RSS feed for better structured news data
                const rssUrl = 'https://www.w-hs.de/pressemedien/nachrichten-lesen?tx_news_categories=medieninformationen&type=9818&cHash=6c5876fbac126f047af9e77a9558a53d';
                console.log('🔍 Fetching RSS news feed...');

                const $ = await this.fetchPage(rssUrl);
                const news = [];

                // Parse RSS XML structure
                $('item').each((i, element) => {
                    if (i >= 5) return false; // Limit to 5 most recent items

                    const $item = $(element);
                    const title = $item.find('title').text().trim();
                    const description = $item.find('description').text().trim();
                    const pubDate = $item.find('pubDate').text().trim();
                    const link = $item.find('link').text().trim();

                    if (title && title.length > 10) {
                        // Clean up description (remove HTML tags if any)
                        const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

                        news.push({
                            title: title.length > 100 ? title.substring(0, 97) + '...' : title,
                            content: cleanDescription.length > 200 ? cleanDescription.substring(0, 197) + '...' : cleanDescription,
                            date: this.formatRSSDate(pubDate) || 'Aktuell',
                            type: 'RSS News',
                            source: 'w-hs.de RSS',
                            link: link
                        });
                    }
                });

                // Fallback to regular scraping if RSS parsing fails
                if (news.length === 0) {
                    console.log('📰 RSS parsing failed, trying regular page scraping...');
                    const fallbackUrl = `${this.baseUrl}/pressemedien/`;
                    const $fallback = await this.fetchPage(fallbackUrl);

                    $('.news-item, .aktuell, .meldung, article, h2, h3').each((i, element) => {
                        if (i >= 5) return false;

                        const title = $(element).find('h1, h2, h3, .title, .headline').first().text().trim() ||
                            $(element).text().split('\n')[0].trim();
                        const content = $(element).find('p, .content, .text').first().text().trim() ||
                            $(element).text().trim();

                        if (title && title.length > 10) {
                            news.push({
                                title: title.substring(0, 100),
                                content: content.length > 200 ? content.substring(0, 200) + '...' : content,
                                date: 'Aktuell',
                                type: 'Web News',
                                source: 'w-hs.de'
                            });
                        }
                    });
                }

                return news.length > 0 ? news : this.getDefaultNews();
            } catch (error) {
                console.error('Error in scrapeAktuelles:', error.message);
                return this.getDefaultNews();
            }
        });
    }

    formatRSSDate(rssDate) {
        if (!rssDate) return null;

        try {
            const date = new Date(rssDate);
            if (isNaN(date.getTime())) return null;

            // Format as German date
            return date.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting RSS date:', error.message);
            return null;
        }
    }

    getDefaultAnmeldungTermine() {
        return [
            {
                type: 'Anmeldung',
                description: 'Anmeldung Wintersemester 2024/25',
                date: '15.10.2024',
                source: 'Fallback'
            }
        ];
    }

    getDefaultKlausurTermine() {
        return [
            {
                type: 'Klausur',
                description: 'Klausurphase Wintersemester',
                date: '20.01.2025 - 10.02.2025',
                time: 'siehe Prüfungsplan',
                source: 'Fallback'
            }
        ];
    }

    getDefaultNews() {
        return [
            {
                title: 'Aktuelle Informationen',
                content: 'Besuchen Sie die offizielle Website für die neuesten Ankündigungen.',
                date: 'Aktuell',
                type: 'Default',
                source: 'Fallback'
            }
        ];
    }

    async getAllUniversityData() {
        try {
            console.log('🎓 Fetching all university data...');

            const [anmeldung, klausuren, aktuelles] = await Promise.allSettled([
                this.scrapeAnmeldungTermine(),
                this.scrapeKlausurTermine(),
                this.scrapeAktuelles()
            ]);

            return {
                anmeldung: anmeldung.status === 'fulfilled' ? anmeldung.value : this.getDefaultAnmeldungTermine(),
                klausuren: klausuren.status === 'fulfilled' ? klausuren.value : this.getDefaultKlausurTermine(),
                aktuelles: aktuelles.status === 'fulfilled' ? aktuelles.value : this.getDefaultNews(),
                lastUpdated: new Date().toISOString(),
                university: 'Westfälische Hochschule'
            };
        } catch (error) {
            console.error('❌ Error fetching university data:', error.message);
            throw error;
        }
    }
}

// Initialize web scraper
const scraper = new WestfaelischeHochschuleScraper();
let universityData = {};

// Express middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    const status = {
        status: 'WH-HelperBot is running! 🚀',
        timestamp: new Date().toISOString(),
        university: 'Westfälische Hochschule',
        features: ['Real-time web scraping', 'Telegram integration', 'Smart caching'],
        telegramToken: TELEGRAM_TOKEN ? '✅ Configured' : '❌ Missing - Please set TELEGRAM_TOKEN environment variable'
    };

    res.json(status);
});

// API endpoint for university data
app.get('/api/university-data', async (req, res) => {
    try {
        res.json({
            success: true,
            data: universityData,
            cached: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Conversational AI System
class ConversationalBot {
    constructor() {
        this.greetings = [
            'Moin! 😊', 'Hey! 👋', 'Hallo! 🙂', 'Hi! 😄', 'Na? 😎',
            'Servus! 🤙', 'Hallöchen! 👋', 'Was geht? 😊'
        ];

        this.goodbyes = [
            'Bis bald! 👋', 'Tschüss! 😊', 'Ciao! 🙂', 'Bis später! 👋',
            'Viel Erfolg! 🍀', 'Mach\'s gut! 😄', 'See ya! 👋'
        ];
    }

    getRandomGreeting() {
        return this.greetings[Math.floor(Math.random() * this.greetings.length)];
    } getRandomGoodbye() {
        return this.goodbyes[Math.floor(Math.random() * this.goodbyes.length)];
    } analyzeIntent(text) {
        const lowText = text.toLowerCase().trim();
        console.log(`🔍 Analyzing: "${lowText}"`);

        // PRIORITY 1: Informatik-specific queries (highest priority)
        if (lowText.match(/(informatik|computer.*wissenschaft|cs|it.*studium|programmier)/)) {
            console.log('✅ Matched Informatik intent');
            return 'informatik';
        }

        // PRIORITY 2: Specific functional queries
        // Registration/Application queries
        if (lowText.match(/(anmeld|bewerbung|einschreib|registr|deadline|frist)/)) {
            console.log('✅ Matched anmeldung intent');
            return 'anmeldung';
        }

        // Exam queries
        if (lowText.match(/(klausur|prüfung|exam|test|termin.*prüf|wann.*klausur)/)) {
            console.log('✅ Matched klausuren intent');
            return 'klausuren';
        }

        // News/Updates queries
        if (lowText.match(/(news|aktuell|neuigkeit|was.*neu|was.*los|info|nachricht)/)) {
            console.log('✅ Matched aktuelles intent');
            return 'aktuelles';
        }

        // Help queries
        if (lowText.match(/(hilfe|help|was.*kann|befehle|funktionen)/)) {
            console.log('✅ Matched help intent');
            return 'help';
        }

        // General university questions
        if (lowText.match(/(westfälische|hochschule|uni|wh|studium|semester)/)) {
            console.log('✅ Matched university intent');
            return 'university';
        }

        // PRIORITY 3: Social interactions (only if no functional intent found)
        // Goodbye detection
        if (lowText.match(/(tschüss|bye|ciao|danke|bis)/)) {
            console.log('✅ Matched goodbye intent');
            return 'goodbye';
        }

        // Greeting detection (only pure greetings, not mixed with other intents)
        if (lowText.match(/^(hi|hello|hey|moin|hallo|guten\s*(tag|morgen|abend)|servus|grüß)\.?\s*$/)) {
            console.log('✅ Matched pure greeting');
            return 'greeting';
        }

        // Simple greeting words (exact match only)
        if (['hi', 'hey', 'hallo', 'hello', 'moin', 'start'].includes(lowText)) {
            console.log('✅ Matched exact greeting word');
            return 'greeting';
        }

        console.log('❓ No specific intent found - returning unknown');
        return 'unknown';
    }

    generateFriendlyResponse(intent, data) {
        const greeting = this.getRandomGreeting();
        const now = new Date().toLocaleString('de-DE');

        switch (intent) {
            case 'greeting': {
                return `${greeting} Schön, dass du da bist! 🎓\n\nIch bin dein WH-Buddy und kann dir bei allem rund um die Westfälische Hochschule helfen! 😊\n\nFrag mich einfach:\n📝 "Wann ist Anmeldung?"\n📚 "Wann sind Klausuren?"\n💻 "Informatik Prüfungen"\n📰 "Was gibt's Neues?"\n❓ "Hilfe" für mehr Optionen\n\nIch hole alle Infos live von w-hs.de! 🌐✨`;
            } case 'anmeldung': {
                const termine = data.anmeldung || [];
                if (termine.length === 0) {
                    return `${greeting} Momentan hab ich keine aktuellen Anmeldetermine gefunden 🤔\n\nSchau am besten direkt auf w-hs.de nach oder frag mich später nochmal! Die Daten werden alle 2 Stunden aktualisiert 🔄`;
                }

                // Check if we have Informatik-specific data
                const informatikTermine = termine.filter(t => t.department === 'Informatik');
                if (informatikTermine.length > 0) {
                    const anmeldungText = informatikTermine.slice(0, 3).map(t =>
                        `📅 ${t.description}\n   📍 ${t.date}\n   🌐 Anmeldung über: ${t.campus_portal || 'campus.w-hs.de'}`
                    ).join('\n\n');

                    return `${greeting} Hier sind die Informatik-Anmeldetermine:\n\n${anmeldungText}\n\n⏰ Stand: ${now}\n\nDirekter Link: https://www.w-hs.de/informatik/info-center/pruefungen/\n\nVergiss nicht rechtzeitig anzumelden! 💻😉`;
                }

                const anmeldungText = termine.slice(0, 3).map(t =>
                    `📅 ${t.description}\n   Deadline: ${t.date}`
                ).join('\n\n');

                return `${greeting} Hier sind die wichtigsten Anmeldetermine:\n\n${anmeldungText}\n\n⏰ Stand: ${now}\n\nVergiss nicht rechtzeitig anzumelden! 😉`;
            } case 'klausuren': {
                const klausuren = data.klausuren || [];
                if (klausuren.length === 0) {
                    return `${greeting} Keine Klausurtermine im System 📚\n\nEntweder sind noch keine veröffentlicht oder es ist gerade klausurfreie Zeit! Check mal w-hs.de für die neuesten Infos 🔍`;
                }

                // Check if we have Informatik-specific data
                const informatikKlausuren = klausuren.filter(k => k.department === 'Informatik');
                if (informatikKlausuren.length > 0) {
                    const klausurText = informatikKlausuren.slice(0, 3).map(k =>
                        `📚 ${k.description}\n   📅 ${k.date}\n   📝 Anmeldung: ${k.anmeldung || 'Siehe Informatik-Portal'}`
                    ).join('\n\n');

                    return `${greeting} Die Informatik-Klausurtermine:\n\n${klausurText}\n\n⏰ Stand: ${now}\n\n🔗 Mehr Details: https://www.w-hs.de/informatik/info-center/pruefungen/\n\nSchon fleißig am programmieren? 💻💪 Viel Erfolg!`;
                }

                const klausurText = klausuren.slice(0, 3).map(k =>
                    `📚 ${k.description}\n   Termin: ${k.date}`
                ).join('\n\n');

                return `${greeting} Die anstehenden Klausurtermine:\n\n${klausurText}\n\n⏰ Stand: ${now}\n\nSchon fleißig am lernen? 💪 Viel Erfolg!`;            } case 'aktuelles': {
                const news = data.aktuelles || [];
                if (news.length === 0) {
                    return `${greeting} Grad ist es ruhig an der WH 📰\n\nKeine aktuellen News gefunden. Schau später nochmal vorbei! 😊`;
                }

                const newsText = news.slice(0, 3).map(n => {
                    let newsItem = `📰 ${n.title}\n`;
                    if (n.content && n.content.length > 10) {
                        newsItem += `   ${n.content}\n`;
                    }
                    if (n.date && n.date !== 'Aktuell') {
                        newsItem += `   📅 ${n.date}`;
                    }
                    return newsItem;
                }).join('\n\n');

                return `${greeting} Das läuft grad an der WH:\n\n${newsText}\n\n⏰ Stand: ${now}\n🔗 Mehr Details auf w-hs.de/pressemedien/ 🌐`;
            } case 'help': {
                return `${greeting} Kein Problem, ich helfe gerne! 😊\n\nDu kannst mich einfach fragen:\n\n💬 "Wann ist die nächste Anmeldung?"\n💬 "Gibt es neue Klausurtermine?"\n💬 "Was gibt's Neues an der WH?"\n💬 "Informatik Prüfungen" für FB Informatik\n💬 "Hallo" für Begrüßung\n\nIch verstehe normale Sprache - keine Befehle nötig! 🤖✨`;
            }            case 'informatik': {
                const informatikAnmeldungen = data.anmeldung?.filter(a => a.department === 'Informatik') || [];
                const informatikKlausuren = data.klausuren?.filter(k => k.department === 'Informatik') || [];

                let responseText = `${greeting} Alles klar, du fragst nach dem Fachbereich Informatik! 💻\n\n`;

                if (informatikAnmeldungen.length > 0) {
                    const nextAnmeldung = informatikAnmeldungen[0];
                    responseText += `📝 Nächste Anmeldung:\n${nextAnmeldung.description}\n📅 ${nextAnmeldung.date}\n🌐 ${nextAnmeldung.campus_portal || 'campus.w-hs.de'}\n\n`;
                }

                if (informatikKlausuren.length > 0) {
                    const nextKlausur = informatikKlausuren[0];
                    responseText += `📚 Nächste Prüfungsperiode:\n${nextKlausur.description}\n📅 ${nextKlausur.date}\n\n`;
                }

                responseText += `🔗 Informatik Info-Center:\nhttps://www.w-hs.de/informatik/info-center/pruefungen/\n\n⏰ Stand: ${now}\n\nCode gut, lebe besser! 😄💾`;

                return responseText;
            }

            case 'university': {
                return `${greeting} Du fragst nach der Westfälischen Hochschule? 🎓\n\nIch bin dein persönlicher WH-Assistent und hole alle Infos live von der offiziellen Website! Frag mich nach:\n\n📝 Anmeldeterminen\n📚 Klausurterminen  \n📰 Aktuellen News\n💻 Informatik-spezifischen Infos\n\nWas möchtest du wissen? 😊`;
            }

            case 'goodbye': {
                return `${this.getRandomGoodbye()} War schön, mit dir zu quatschen! 😊\n\nFalls du noch Fragen zur WH hast, schreib mich einfach an. Ich bin immer da! 🤖💙`;
            }

            default: {
                return `${greeting} Hmm, das hab ich nicht ganz verstanden 🤔\n\nFrag mich gerne nach:\n• Anmeldeterminen ("Wann ist Anmeldung?")\n• Klausurterminen ("Wann sind Prüfungen?")\n• Aktuellen News ("Was gibt's Neues?")\n\nOder sag einfach "Hilfe" wenn du nicht weiterkommst! 😊`;
            }
        }
    }
}

// Initialize conversational bot
const conversationalBot = new ConversationalBot();

// Telegram webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        // Check if token is configured
        if (!TELEGRAM_TOKEN) {
            console.error('❌ TELEGRAM_TOKEN not configured');
            return res.status(500).json({
                error: 'TELEGRAM_TOKEN environment variable not set',
                instructions: 'Please set TELEGRAM_TOKEN=7731039986:AAHFILgUq8744b1CO5WCjMe1HF2Oqvk0xOg in Railway dashboard'
            });
        }

        const message = req.body.message;
        if (!message) {
            return res.sendStatus(200);
        } const chatId = message.chat.id;
        const text = message.text;
        const userName = message.from.first_name || 'Kumpel';

        console.log(`📱 Received message: "${text}" from ${userName} (${chatId})`);// Analyze user intent and generate friendly response
        const intent = conversationalBot.analyzeIntent(text); console.log(`🔍 Text: "${text}" | Intent detected: ${intent}`);
        const responseText = conversationalBot.generateFriendlyResponse(intent, universityData);

        console.log(`🤖 Intent: ${intent} | Response length: ${responseText.length}`);// Send response via Telegram API
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: responseText,
            parse_mode: 'Markdown'
        });

        console.log('✅ Message sent successfully');
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook error:', error.message);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize university data
async function initializeData() {
    try {
        console.log('🚀 Initializing university data...');
        universityData = await scraper.getAllUniversityData();
        console.log('✅ University data initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize university data:', error.message);
        universityData = {
            anmeldung: scraper.getDefaultAnmeldungTermine(),
            klausuren: scraper.getDefaultKlausurTermine(),
            aktuelles: scraper.getDefaultNews(),
            lastUpdated: new Date().toISOString(),
            university: 'Westfälische Hochschule'
        };
    }
}

// Schedule data refresh every 2 hours
cron.schedule('0 */2 * * *', async () => {
    console.log('🔄 Scheduled data refresh...');
    await initializeData();
});

// Start server
app.listen(port, async () => {
    console.log(`🚀 WH-HelperBot server running on port ${port}`);
    await initializeData();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Shutting down gracefully...');
    process.exit(0);
});
