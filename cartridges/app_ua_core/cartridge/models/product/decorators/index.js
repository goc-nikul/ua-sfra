'use strict';

/**
 * @todo figure out the best way to just extend SFRA versus replacing
 */

module.exports = {
    base: require('*/cartridge/models/product/decorators/base'),
    availability: require('*/cartridge/models/product/decorators/availability'),
    description: require('*/cartridge/models/product/decorators/description'),
    images: require('~/cartridge/models/product/decorators/images'),
    fitModelImagesAvailability: require('~/cartridge/models/product/decorators/fitModelImagesAvailability'),
    price: require('*/cartridge/models/product/decorators/price'),
    searchPrice: require('*/cartridge/models/product/decorators/searchPrice'),
    promotions: require('*/cartridge/models/product/decorators/promotions'),
    quantity: require('*/cartridge/models/product/decorators/quantity'),
    quantitySelector: require('*/cartridge/models/product/decorators/quantitySelector'),
    ratings: require('*/cartridge/models/product/decorators/ratings'),
    sizeChart: require('*/cartridge/models/product/decorators/sizeChart'),
    variationAttributes: require('*/cartridge/models/product/decorators/variationAttributes'),
    searchVariationAttributes: require('*/cartridge/models/product/decorators/searchVariationAttributes'),
    attributes: require('*/cartridge/models/product/decorators/attributes'),
    options: require('*/cartridge/models/product/decorators/options'),
    currentUrl: require('*/cartridge/models/product/decorators/currentUrl'),
    online: require('*/cartridge/models/product/decorators/online'),
    readyToOrder: require('*/cartridge/models/product/decorators/readyToOrder'),
    setReadyToOrder: require('*/cartridge/models/product/decorators/setReadyToOrder'),
    bundleReadyToOrder: require('*/cartridge/models/product/decorators/bundleReadyToOrder'),
    setIndividualProducts: require('*/cartridge/models/product/decorators/setIndividualProducts'),
    bundledProducts: require('*/cartridge/models/product/decorators/bundledProducts'),
    bonusUnitPrice: require('*/cartridge/models/product/decorators/bonusUnitPrice'),
    raw: require('*/cartridge/models/product/decorators/raw'),
    pageMetaData: require('*/cartridge/models/product/decorators/pageMetaData'),
    template: require('*/cartridge/models/product/decorators/template'),
    badges: require('*/cartridge/models/product/decorators/badges'),
    tileImages: require('~/cartridge/models/product/decorators/tileImages'),
    tileSwatches: require('~/cartridge/models/product/decorators/tileSwatches'),
    customAttributes: require('~/cartridge/models/product/decorators/customAttributes'),
    videoMaterial: require('~/cartridge/models/product/decorators/videoMaterial'),
    employeeShowTerms: require('~/cartridge/models/product/decorators/showTerms'),
    inStorePickup: require('*/cartridge/models/product/decorators/availableForInStorePickup')
};
