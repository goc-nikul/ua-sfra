/* eslint spellcheck/spell-checker: 0 */
const helpers = require('*/cartridge/scripts/dataLogic/products/helpers.js');

module.exports = function orderProductLogic(logicArgs) {
    const orderItems = logicArgs.orderData &&
      logicArgs.orderData.mapped &&
      logicArgs.orderData.mapped.allProductLineItems || [];

    return orderItems.map(helpers.mapOrderCartProductLineItem);
};
