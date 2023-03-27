'use strict';

class Locale {
    constructor() {
        this.ID = 'Default';
        this.country = 'US';
    }

    // eslint-disable-next-line no-unused-vars
    static getLocale(id) {
        return this;
    }
}

module.exports = Locale;
