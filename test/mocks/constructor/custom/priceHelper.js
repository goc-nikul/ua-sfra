'use strict';

var PriceBookMgr = require('../../../mocks/dw/dw_catalog_PriceBookMgr');

function getPricebookID(currencyCode, locale, type) {
    if (empty(currencyCode) || empty(type)) return;

    var pricebook = PriceBookMgr.getPriceBook(currencyCode + '-' + type);

    /**
    * @returns {Array} - list and sale pricebook Ids
    */
    const getPricebookIdsFromPref = function () {
        let PreferencesUtil = require('../../../mocks/scripts/PreferencesUtil');
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
module.exports = {
    getPricebookID: getPricebookID
};