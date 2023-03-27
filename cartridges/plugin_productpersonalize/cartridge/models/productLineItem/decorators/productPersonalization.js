'use strict';

module.exports = function (object, lineItem) {
    if (!object || !lineItem) return;
    var productPersonlizationHelpers = require('*/cartridge/scripts/helpers/productPersonlizationHelpers');
    Object.defineProperty(object, 'isPersonalizationEligible', {
        enumerable: true,
        value: productPersonlizationHelpers.isPersonalizationEligible(lineItem.product)
            && require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable
            && (!!('jerseyNameText' in lineItem.custom && lineItem.custom.jerseyNameText)
            || !!('jerseyNumberText' in lineItem.custom && lineItem.custom.jerseyNumberText)
            || !!('sponsors' in lineItem.custom && lineItem.custom.sponsors === 'Yes'))
    });
    if (object.isPersonalizationEligible) {
        Object.defineProperty(object, 'personalizationName', {
            enumerable: true,
            value: lineItem.custom.jerseyNameText || ''
        });
        Object.defineProperty(object, 'personalizationNumber', {
            enumerable: true,
            value: lineItem.custom.jerseyNumberText || ''
        });
        Object.defineProperty(object, 'personalizationSponsors', {
            enumerable: true,
            value: (lineItem.custom.sponsors && lineItem.custom.sponsors === 'Yes') || false
        });
        Object.defineProperty(object, 'personalizationDetail', {
            enumerable: true,
            value: (function () {
                var details = [];
                if (object.personalizationName) details.push(object.personalizationName);
                if (object.personalizationNumber) details.push(object.personalizationNumber);
                return (details.length > 0)
                    ? require('dw/web/Resource').msgf('personalize.detail', 'personalize', null, details.join(' | '))
                    : null;
            }())
        });
    }
};

