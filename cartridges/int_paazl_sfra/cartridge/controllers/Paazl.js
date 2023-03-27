'use strict';

var server = require('server');

// Address completion
// For Dutch addresses, Get the Street name and City based on postcode and street number
server.get('AddressNL', function (req, res, next) { // eslint-disable-line
    var addressService = require('*/cartridge/scripts/services/SOAP/paazlAddressValidation');

    // Fetch the basket UUID
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            success: false,
            errorMessage: 'No existing basket'
        });
        return next();
    }
    var paazlReferenceID = currentBasket.UUID;

    // The house number and postal code values must be passed to this call
    var zipCode = req.querystring.postalCode;
    var houseNbr = req.querystring.houseNbr;
    var country = req.querystring.country;
    if (!country || country !== 'NL') {
        res.json({
            success: false,
            errorMessage: 'Current country not supported'
        });
        return next();
    }
    if (!zipCode) {
        res.json({
            success: false,
            errorMessage: 'ZipCode is missing'
        });
        return next();
    }

    if (!houseNbr) {
        res.json({
            success: false,
            errorMessage: 'House number is missing'
        });
        return next();
    }

    var result = addressService.address({ zipCode: zipCode, paazlReferenceID: paazlReferenceID, houseNbr: houseNbr });
    if (result.success) {
        res.json({
            success: true,
            address: {
                addition: result.address.addition,
                city: result.address.city,
                housenumber: result.address.housenumber,
                street: result.address.street,
                zipcode: result.address.zipcode
            }
        });
    } else {
        res.json({
            success: false,
            errorMessage: result.message
        });
    }
    next();
});

module.exports = server.exports();
