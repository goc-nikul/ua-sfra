'use strict';

var base = require('org/utils/components-config');
var references = base.references;

if ($('div[data-is-personalize]').data('is-personalize')) references.productDetail = require('sf_productpersonalize/components/product/ProductDetail').default;
if ($('div[data-is-personalize]').data('is-personalize')) references.cartTile = require('sf_productpersonalize/components/product/CartTile').default;
if ($('div[data-is-personalize]').data('is-personalize')) references.editBasketProduct = require('sf_productpersonalize/components/common/EditBasketProduct').default;

references.formGeneric = require('../components/forms/FormGeneric').default;
references.addressFormGeneric = require('../addressBook/addressFormGeneric').default;
references.giftCardFormGeneric = $('.gift-card-payment').length ? require('../checkout/giftCardFormGeneric').default : '';
module.exports = {
    configuration: base.configuration,
    references: references
};
