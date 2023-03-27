/* eslint-disable spellcheck/spell-checker */
'use strict';

const Resource = require('dw/web/Resource');
const Money = require('dw/value/Money');

/**
 * Performs rounding of incomming money instance according to region configuration.
 * Rounds DOWN amount value for currencies without decimals.
 *
 * @param {dw.value.Money} originalPrice Money instance to be rounded
 * @returns {dw.value.Money} Rounded money or original instance
 */
function getLocalizedPrice(originalPrice) {
    if (empty(originalPrice) || originalPrice.class !== Money || originalPrice === Money.NOT_AVAILABLE) {
        return originalPrice;
    }

    const currencyCode = originalPrice.currencyCode;
    const fixedNumber = parseInt(Resource.msg('amount.fixednumber.' + currencyCode.toLowerCase(), 'config', '2'), 10);
    let price = null;

    // Round DOWN amount value for currencies without decimals
    if (fixedNumber === 0) {
        const roundedValue = Math.floor(originalPrice.value);
        price = new Money(roundedValue, currencyCode);
    } else {
        price = originalPrice;
    }

    return price;
}

/**
 * Sets the applicable price book to the site based on the country code and countries JSON
 *
 * @param {string} countryCode - countryCode
 * @param {Object} countriesJSON - list of countries
 */
function setSitesApplicablePriceBooks(countryCode, countriesJSON) {
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var countryObj = countriesJSON.filter(function (country) {
        return countryCode === country.countryCode;
    });

    var applicablePricebooks = [];
    if (countryObj && countryObj.length > 0) {
        countryObj[0].priceBooks.forEach(function (priceBook) {
            var applicablePriceBook = PriceBookMgr.getPriceBook(priceBook);
            if (applicablePriceBook) {
                applicablePricebooks.push(applicablePriceBook);
            }
        });

        if (applicablePricebooks && applicablePricebooks.length > 0) {
            PriceBookMgr.setApplicablePriceBooks(applicablePricebooks);
        }
    }
}

module.exports = {
    getLocalizedPrice: getLocalizedPrice,
    setSitesApplicablePriceBooks: setSitesApplicablePriceBooks
};
