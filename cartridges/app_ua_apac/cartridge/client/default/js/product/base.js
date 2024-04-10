'use strict';
module.exports = {
    enableBonusProductSelection: function () {
        $('body').on('bonusproduct:updateSelectButton', function (e, response) {
            $('button.select-bonus-product', response.$productContainer).attr('disabled', $('.selected-bonus-products .selected-bonus-product-container').length === $('#bonusProduct').data('maxpids') ? true : (!response.product.readyToOrder || !response.product.available));
            $('button.select-bonus-product').attr('data-product-availability', (response.product.readyToOrder && response.product.available));
            var pid = response.product.id;
            $('button.select-bonus-product').data('pid', pid);
        });
    }
};
