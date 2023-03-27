'use strict';

/**
 * Format Amount
 * @param {string} amount Amount set in BM
 * @returns {string} formatted amount
 */
function formatAmount(amount) {
    var Money = require('dw/value/Money');
    var price = amount || 0;
    var unformattedPrice = Number(price).toFixed(2);
    return require('dw/util/StringUtils').formatMoney(new Money(unformattedPrice, session.currency.currencyCode));
}

/**
 * Personlisation model
 * @param {Object} customobject DW custom object
 */
function personalize(customobject) {
    if (!customobject) return;
    var preferences = require('*/cartridge/config/peronslizePreferences');
    this.productID = customobject.custom.ID && customobject.custom.ID.split('_').length > 0 ? customobject.custom.ID.split('_')[1] : '';
    this.jerseyStyle = customobject.custom.jerseyStyle;
    this.frontImage = customobject.custom.frontImage ? preferences.scene7BaseURL + customobject.custom.frontImage : null;
    this.backImage = customobject.custom.backImage ? preferences.scene7BaseURL + customobject.custom.backImage : null;
    this.enableSponsors = !empty(customobject.custom.enableSponsors) && customobject.custom.enableSponsors === 'true';
    this.frontImageSponsors = customobject.custom.frontImageSponsors ? preferences.scene7BaseURL + customobject.custom.frontImageSponsors : null;
    this.backImageSponsors = customobject.custom.backImageSponsors ? preferences.scene7BaseURL + customobject.custom.backImageSponsors : null;
    this.nameLocation = customobject.custom.nameLocation ? customobject.custom.nameLocation.value : null;
    this.personalizationInfo = customobject.custom.personalizationInfo;
    // Personalizations Options
    this.nopersonalizationsOption = formatAmount(customobject.custom.nopersonalizationsOption);
    this.nameOption = formatAmount(customobject.custom.nameOption);
    this.numberOption = formatAmount(customobject.custom.numberOption);
    this.namenumberOption = formatAmount(customobject.custom.namenumberOption);
    this.sponsorsOption = formatAmount(customobject.custom.sponsorsOption);
    this.namesponsorsOption = formatAmount(customobject.custom.namesponsorsOption);
    this.numbersponsorsOption = formatAmount(customobject.custom.numbersponsorsOption);
    this.namenumbersponsorsOption = formatAmount(customobject.custom.namenumbersponsorsOption);
    this.defaultOption = customobject.custom.defaultOption;
    this.sameCost = (this.nameOption !== this.numberOption)
        ? null
        : require('dw/web/Resource').msgf('personalize.price.sameCost', 'personalize', null, formatAmount(customobject.custom.numberOption));
}

module.exports = personalize;
