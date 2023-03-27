var fs = require('fs');
var path = require('path');
var extensions = require('../extensions');
var puppeteer = require('puppeteer');

/**
 * Test Factory.
 * This is a wrapper on the puppeteer library, and include a methods
 * to working with testing types objects and helpers.
 */
class Test {

    /**
     * Create new Test instance with given options.
     * @param {boolean} options.clientLogs - Parse console logs in client side, and show it in the tests environment.
     * @param {object} options.routes - A list of declared routes (page url with a specific key).
     * @param {object} options.browser - Puppeteer browser options.
     * @see https://pptr.dev/#?product=Puppeteer&version=v1.19.0&show=api-puppeteerconnectoptions
     * @param {object} options.credentials - Storefront credentials.
     * @param {object} options.credentials.username - Storefront username.
     * @param {object} options.credentials.password - Storefront password.
     */
    constructor(options = {}) {
        this.page = null;
        this.browser = null;
        this.setOptions(options);
        this.isBooted = false;
    }

    /**
     * Set user options to object instance.
     * @param {object} options
     */
    setOptions(options) {
        this.credentials = options.credentials || {};
        this.routes = options.routes || {};
        this.browserOptions = options.browser || {};
        this.clientLogs = options.clientLogs;
    }

    /**
     * Boot testing environment. Prepare page to working with tests.
     */
    async boot() {
        if (this.isBooted) {
            return;
        }
        await this.createBrowser();
        await this.createPage();
        await this.setCredentials();
        if (this.clientLogs) {
            this.enableClientLogs();
        }
        this.isBooted = true;
    }

    /**
     * Parse client console logs and show in testing environment.
     * It will be shown only serializable objects!
     */
    enableClientLogs() {
        this.page.on('console', async msg => {
            if (msg.type() === 'log') {
                const args = await msg.args();
                args.forEach(async (arg) => {
                    var logData;
                    try {
                        logData = await arg.jsonValue();
                    } catch (err) {
                        logData = msg.text();
                    }
                    console.log(logData); // eslint-disable-line
                });
            }
        });
    }

    /**
     * Create new browser instance with options, defined in constructor.
     */
    async createBrowser() {
        this.browser = await puppeteer.launch(this.browserOptions);
    }

    /**
     * Create empty page instance.
     */
    async createPage() {
        this.page = await this.browser.newPage();
    }

    /**
     * Open page by given router name.
     * @param {string} name - Name, defined in routes config.
     */
    async openPage(name) {
        var url = this.routes[name] ? this.routes[name] : name;
        await this.page.goto(url);
        await this.setCoreScripts();
    }

    /**
     * Destroy testing environment by closing page and browser.
     */
    async end() {
        await this.page.close();
        this.page = null;
        await this.browser.close();
        this.browser = null;
        this.isBooted = false;
    }

    /**
     * Set storefront credentials, given in constructor to request headers.
     */
    async setCredentials() {
        var { username, password } = this.credentials;
        if (!username || !password) {
            return;
        }
        var auth = new Buffer(`${username}:${password}`).toString('base64');
        await this.page.setExtraHTTPHeaders({ 'Authorization': `Basic ${auth}` });
    }

    /**
     * Open .js file as utf-8 string.
     * @param {string} filePath - Path to opened file.
     */
    openScriptAsText(filePath) {
        return fs.readFileSync(path.resolve(filePath), 'utf-8');
    }

    /**
     * Wrap the content of script file in closure function.
     * @param {string} fileContent - JavaScriptFile utf-8 content.
     */
    addInClosure(fileContent) {
        return `(function(){ ${fileContent} }())`;
    }

    /**
     * Attach script with given path to the testing page.
     * @param {string} filePath - Full path to attached file.
     */
    async addScript(filePath) {
        var content = this.openScriptAsText(path.resolve(filePath));
        return this.page.addScriptTag({ content: this.addInClosure(content) });
    }

    /**
     * Set all service scripts to provide working environment on the client side.
     */
    async setCoreScripts() {
        await this.addScript(path.resolve(__dirname, '../client/factory.js'));
        for (const filePath of extensions.client) {
            await this.addScript(filePath);
        }
    }

    /**
     * Get puppeteer page instance.
     */
    getPage() {
        return this.page;
    }

    /**
     * Create a type instance to run tests.
     * @param {string} type - Testing instance type (f.e. component, etc...).
     * @param {string} key - Testing instance key.
     * @param {number} timeout - Max time waiting for element (milliseconds, 0 = unlimited).
     */
    create(type, key, timeout = 30000) {
        return new extensions.typesMap[type]({
            factory: this,
            key,
            timeout
        });
    }
}

module.exports = Test;
