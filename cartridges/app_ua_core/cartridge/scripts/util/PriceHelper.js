/* eslint-disable spellcheck/spell-checker */
'use strict';

const Resource = require('dw/web/Resource');
const Money = require('dw/value/Money');
var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;

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

/**
 * calculate the total diff of sale and list as well as automatic applied product level promotion
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing product promotional discount
 */
function getProductTotalDiscount(lineItemContainer) {
    var currencyCode = lineItemContainer.currencyCode;
    var productTotalDiscount = new Money(0, currencyCode);
    collections.forEach(lineItemContainer.getAllProductLineItems(), function (pli) {
        if (pli.product && pli.product.custom && (!('giftCard' in pli.product.custom) || (pli.product.custom.giftCard.value !== 'EGIFT_CARD'))) {
            var diffPrice = new Money(0, currencyCode);
            var promotionDiscount = new Money(0, currencyCode);
            if (pli.priceAdjustments.length > 0) {
                collections.forEach(pli.priceAdjustments, function (priceAdjustment) {
                    promotionDiscount = promotionDiscount.add(priceAdjustment.price);
                });
            }
            promotionDiscount = promotionDiscount.add(diffPrice);
            productTotalDiscount = productTotalDiscount.add(promotionDiscount);
        }
    });
    return {
        value: productTotalDiscount.value,
        formatted: formatMoney(productTotalDiscount)
    };
}

module.exports = {
    getLocalizedPrice: getLocalizedPrice,
    setSitesApplicablePriceBooks: setSitesApplicablePriceBooks,
    getProductTotalDiscount: getProductTotalDiscount
};
