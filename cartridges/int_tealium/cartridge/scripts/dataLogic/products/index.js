const pdpProductLogic = require('*/cartridge/scripts/dataLogic/products/pdpProduct.js');
const cartProductLogic = require('*/cartridge/scripts/dataLogic/products/cartProduct.js');
const orderProductLogic = require('*/cartridge/scripts/dataLogic/products/orderProduct.js');
const searchProductLogic = require('*/cartridge/scripts/dataLogic/products/searchProduct.js');

module.exports = function productLogic(logicArgs) {
    const pageTypeLogicMap = {
        'product-listing': searchProductLogic,
        'product-detail': pdpProductLogic,
        'order-receipt': orderProductLogic,
        cart: cartProductLogic,
        checkout: cartProductLogic,
        search: searchProductLogic
    };
    const dataLogicMethod = pageTypeLogicMap[logicArgs.pageType];

    return dataLogicMethod
      ? dataLogicMethod(logicArgs)
      : [];
};
