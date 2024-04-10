var PriceBookMgr = require('dw/catalog/PriceBookMgr');

/**
 * Gets and returns the ID of the price book for the passed data.
 *
 * @param {string} currencyCode Three letter currency code
 * @param {string} locale SFCC locale
 * @param {string} type pricebook type: 'list' || 'sale'
 * @returns {Object} - pricebook id
 */
function getPricebookID(currencyCode, locale, type) {
    if (empty(currencyCode) || empty(type)) return;

    var pricebook = PriceBookMgr.getPriceBook(currencyCode + '-' + type); // original method.

    /**
    * @returns {Array} - list and sale pricebook Ids
    */
    const getPricebookIdsFromPref = function () {
        let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        let countriesJSON = PreferencesUtil.getJsonValue('countriesJSON');

        if (countriesJSON) {
            for (let key in countriesJSON) { // eslint-disable-line
                let current = countriesJSON[key];
                let locales = !empty(current) && 'locales' in current ? current.locales : null;

                // search locale in preference
                if (locales && locales.indexOf(locale) !== -1) {
                    return current.priceBooks;
                }
            }
        }
        return [];
    };

    if (empty(pricebook) || pricebook == null) {
        let pricebookIds = getPricebookIdsFromPref();

        // get pricebook id by type
        let pricebookId = pricebookIds.filter(function (item) {
            return item.includes(type);
        });

        pricebook = PriceBookMgr.getPriceBook(pricebookId);
    }

    return pricebook ? pricebook.getID() : null; // eslint-disable-line
}

module.exports.getPricebookID = getPricebookID;
