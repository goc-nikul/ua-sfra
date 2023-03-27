'use strict';

var attributes = {
    paazlID: 'paazl-id'
};

var selectors = {
    body: 'body',
    addressService: '.js-addressservice-url',
    endlines: 'end-lines',
    hide: 'hide',
    paazlButtons: '#paazl-checkout button:not([type="submit"])',
    paazlCheckoutOptionPrefix: '#shippingMethod-',
    paazlCheckoutOptionPrefixSG: '#shipping-method-',
    paazlID: '[data-' + attributes.paazlID + ']',
    paazlWrapper: '#paazl-checkout',
    paazlPickUpPointButton: '#find-pickup-point',
    shippingAddressTile: '.shipping-address-option',
    forms: {
        shipping: 'form[name*="_shipping"]',
        billing: 'form[name$="_billing"]',
        shippingFormPrefix: '.js-shippingform-',
        billingFormPrefix: '.js-billingform-',
        paazlWidgetForm: '.js-paazlwidget-form'
    },
    address: {
        summary: '.shipping-summary .address-summary',
        street: 'input[name$=_address1]',
        houseNumber: 'input[name$=_address2]',
        addition: false,
        postalCode: 'input#shippingZipCodedefault',
        city: 'input[name$=_city]',
        country: 'select[name*=shippingAddress_addressFields_country]'
    },
    attrs: {
        addressServiceUrl: 'data-addressservice-url'
    }
};

var events = {
    blur: 'blur',
    change: 'change',
    click: 'click',
    updateShippingMethods: 'shipping:updateShippingMethods'
};

module.exports = {
    attributes: attributes,
    selectors: selectors,
    events: events
};
