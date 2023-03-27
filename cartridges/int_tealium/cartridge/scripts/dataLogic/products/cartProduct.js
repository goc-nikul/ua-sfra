/* eslint spellcheck/spell-checker: 0 */
const helpers = require('*/cartridge/scripts/dataLogic/products/helpers.js');

module.exports = function cartProductLogic(logicArgs) {
    const cartItems = logicArgs.cartData &&
      logicArgs.cartData.mapped &&
      logicArgs.cartData.mapped.allProductLineItems || [];

    return cartItems.map(helpers.mapOrderCartProductLineItem);
};
