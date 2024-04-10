'use strict';

var Resource = require('dw/web/Resource');

/**
 * Get footer content to show on invoice
 * @param {string} locale - request locale, ex - en_DE
 * @returns {Array} an array of object containing string values to display
 */
function getFooterContent(locale) {
    var country = locale.split('_')[1];
    var resourceFile = 'forms_' + locale;
    var wee = Resource.msg('forms.invoice.wee', resourceFile, '');

    if (empty(wee)) {
        resourceFile = 'forms_en_' + country;
        wee = Resource.msg('forms.invoice.wee', resourceFile, '');
    }

    var batt = Resource.msg('forms.invoice.batt', resourceFile, '');
    var pack = Resource.msg('forms.invoice.pack', resourceFile, '');
    var textile = Resource.msg('forms.invoice.textile', resourceFile, '');
    var asl = Resource.msg('forms.invoice.asl', resourceFile, '');

    return [wee, batt, pack, textile, asl];
}

/**
 * Get locale resource
 * Created this method as we are unable to set locale in request to get
 * localized string from Resource files. Therefore, performing the operation
 * manually here.
 * @param {string} locale - request locale, ex - en_DE
 * @returns {Object} localized string to display labels in invoice
 */
function getLocaleResources(locale) {
    var labels = {
        tabTitle: 'forms.order',
        invoiceTitle: 'forms.invoice',
        addressBillTo: 'forms.invoice.billTo',
        addressShipTo: 'forms.invoice.shipTo',
        invoiceNumber: 'forms.invoice.invoiceNumber',
        orderNumber: 'forms.invoice.orderNumber',
        currency: 'forms.invoice.currency',
        invoiceDate: 'forms.invoice.invoiceDate',
        article: 'forms.invoice.article',
        description: 'forms.invoice.description',
        size: 'forms.invoice.size',
        color: 'forms.invoice.color',
        quantity: 'forms.invoice.quantity',
        unitPrice: 'forms.invoice.unitPrice',
        vat: 'forms.invoice.VAT',
        valValue: 'forms.invoice.VATValue',
        itemTotalPaid: 'forms.invoice.itemTotalPaid',
        subTotal: 'forms.invoice.subTotal',
        delivery: 'forms.invoice.delivery',
        totalPaid: 'forms.invoice.totalPaid',
        total: 'forms.invoice.total'
    };

    var language = locale.split('_')[0];
    var country = locale.split('_')[1];

    Object.keys(labels).forEach(label => {
        var key = labels[label];
        var resourceFile = 'forms_' + locale;
        var value = Resource.msg(key, resourceFile, '');

        if (empty(value)) {
            resourceFile = 'forms_' + language;
            value = Resource.msg(key, resourceFile, '');
        }

        if (empty(value)) {
            resourceFile = 'forms_en_' + country;
            value = Resource.msg(key, resourceFile, '');
        }

        if (empty(value)) {
            resourceFile = 'forms';
            value = Resource.msg(key, resourceFile, '');
        }

        labels[label] = value;
    });

    return labels;
}

/**
 * Reformats colorway names string.
 * @param {string} inputValue - string
 * @returns {string} String for color Names
 */
function fixProductColorNames(inputValue) {
    let retString = '';
    let colorBuckets = inputValue.split('/').map(function (item) {
        return item.trim();
    });
    if (colorBuckets.length > 1) {
        retString += colorBuckets[0];
        if (colorBuckets[1] !== '' && colorBuckets[0] !== colorBuckets[1]) {
            retString += ' / ' + colorBuckets[1];
        } else if (colorBuckets[2] && colorBuckets[2] !== '' && colorBuckets[2] !== colorBuckets[1]) {
            retString += ' / ' + colorBuckets[2];
        }
    }
    return retString;
}

module.exports = {
    getFooterContent: getFooterContent,
    getLocaleResources: getLocaleResources,
    fixProductColorNames: fixProductColorNames
};
