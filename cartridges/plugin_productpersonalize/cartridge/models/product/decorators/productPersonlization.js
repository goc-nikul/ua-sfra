'use strict';

var Resource = require('dw/web/Resource');

module.exports = function (object, apiProduct) {
    var productPersonlizationHelpers = require('*/cartridge/scripts/helpers/productPersonlizationHelpers');
    var preferences = require('*/cartridge/config/peronslizePreferences');
    Object.defineProperty(object, 'isPersonalizationEligible', {
        enumerable: true,
        value: preferences.isPersonalizationEnable && productPersonlizationHelpers.isPersonalizationEligible(apiProduct)
    });
    if (object.isPersonalizationEligible) {
        Object.defineProperty(object, 'personalizationBadge', {
            enumerable: true,
            value: Resource.msg('personalize.flag', 'personalize', 'Personalize')
        });
        Object.defineProperty(object, 'personalizationEditMessage', {
            enumerable: true,
            value: Resource.msg('personalize.flag.edit', 'personalize', 'Personalize')
        });
        Object.defineProperty(object, 'personalizationAddMessage', {
            enumerable: true,
            value: Resource.msg('personalize.flag', 'personalize', 'Personalize')
        });
        Object.defineProperty(object, 'personalizationMaxName', {
            enumerable: true,
            value: preferences.personalizationMaxName
        });
        Object.defineProperty(object, 'personalizationMaxNumber', {
            enumerable: true,
            value: preferences.personalizationMaxNumber
        });
        Object.defineProperty(object, 'personalizationNegativeWords', {
            enumerable: true,
            value: preferences.personalizationNegativeWordList
        });
        // Product Personalisation values
        var customObj = productPersonlizationHelpers.getCustomObject(apiProduct);
        if (customObj) {
            Object.defineProperty(object, 'personalizationContent', {
                enumerable: true,
                value: new (require('*/cartridge/models/personalize'))(customObj)
            });
        }
    }
    Object.defineProperty(object, 'personlizeTemplate', {
        enumerable: true,
        value: (function () {
            return (!object.isPersonalizationEligible)
                ? ''
                : require('*/cartridge/scripts/renderTemplateHelper').getRenderedHtml({ product: object }, 'product/personalization');
        }())
    });
};
