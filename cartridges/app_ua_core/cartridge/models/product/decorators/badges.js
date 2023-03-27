'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'productTileBottomLeftBadge', {
        enumerable: true,
        value: apiProduct.custom.productTileBottomLeftBadge
    });
    Object.defineProperty(object, 'productTileUpperLeftBadge', {
        enumerable: true,
        value: (!empty(apiProduct.custom.productTileUpperLeftBadge) && apiProduct.custom.productTileUpperLeftBadge.value === 'new-arrival') ? '' : apiProduct.custom.productTileUpperLeftBadge
    });
    Object.defineProperty(object, 'exclusive', {
        enumerable: true,
        value: apiProduct.custom.exclusive
    });
    Object.defineProperty(object, 'outletProductTileUpperLeftBadge', {
        enumerable: true,
        value: apiProduct.custom.outletProductTileUpperLeftBadge
    });
    Object.defineProperty(object, 'productTileUpperLeftFlameIconBadge', {
        enumerable: true,
        value: 'productTileUpperLeftFlameIconBadge' in apiProduct.custom && apiProduct.custom.productTileUpperLeftFlameIconBadge ? apiProduct.custom.productTileUpperLeftFlameIconBadge : null
    });
};
