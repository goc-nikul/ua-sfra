var Site = require('dw/system/Site'),
    CurrentSite = Site.current.preferences,
    preferences = CurrentSite ? CurrentSite.custom : {};

function returnLogLevel(item) {
    if (preferences[item]) {
        return preferences[item].value;
    }
    return 'ERROR';
}

const Request = {
    QuotationRequest: {
        type: 'QuotationRequestType',
        lineItem: 'LineItemQSIType'
    },
    InvoiceRequest: {
        type: 'InvoiceRequestType',
        lineItem: 'LineItemISIType'
    }
}

const Seller = {
    city: preferences['Vertex_City'],
    address: preferences['Vertex_Address'],
    mainDvision: preferences['Vertex_MainDivision'],
    country: preferences['Vertex_Country'],
    postalCode: preferences['Vertex_PostalCode'],
    company: preferences['Vertex_Company'],
    divison: preferences['Vertex_Division']
}

const SellerAdmin = {
    city: preferences['Vertex_City_Admin'],
    address: preferences['Vertex_Address_Admin'],
    mainDvision: preferences['Vertex_MainDivision_Admin'],
    country: preferences['Vertex_Country_Admin'],
    postalCode: preferences['Vertex_PostalCode_Admin'],
    company: preferences['Vertex_Company']
}


//auth
module.exports.Username = preferences['Vertex_UserName'];
module.exports.Password = preferences['Vertex_Password'];
module.exports.TrustedId = preferences['Vertex_TrustedId'];

module.exports.LookupTaxAreaURL = preferences['Vertex_EndpointLookup'];
module.exports.CalculateTaxURL = preferences['Vertex_EndpointTax'];

// Customer ISO Country Code
module.exports.Vertex_ISOCountryCode = preferences['Vertex_ISOCountryCode'];

// Customer Tax Registration Number
module.exports.Vertex_TaxRegistrationNumber = preferences['Vertex_TaxRegistrationNumber'];

//common
module.exports.isEnabled = preferences['Vertex_isEnabled'];
module.exports.isVATEnabled = preferences['Vertex_isVATEnabled'];
module.exports.isHashEnabled = preferences['enableHashCalculation'];
module.exports.DeliveryTerms = preferences['Vertex_DeliveryTerms'];
module.exports.isInvoiceEnabled = preferences['Vertex_isInvoiceEnabled'];
module.exports.isAddressCleansingEnabled = preferences['Vertex_isAddressCleansingEnabled'];
module.exports.ProductClassAsRoot = preferences['Vertex_ProductClassDepth'];

// Log Levels
module.exports.generalLogLevel = returnLogLevel('Vertex_GeneralLogLevel');
module.exports.detailedLogLevel = returnLogLevel('Vertex_DetailedLogLevel');

module.exports.GENERAL_LOG_NONE = 'NONE';
module.exports.GENERAL_LOG_ERROR = 'ERROR';
module.exports.GENERAL_LOG_TRACE = 'TRACE';
module.exports.GENERAL_LOG_DEBUG = 'DEBUG';

// Requests
module.exports.Request = Request;

//Seller
module.exports.Seller = Seller;
module.exports.SellerAdmin = SellerAdmin;

// Var
module.exports.TransactionType = 'SALE';
module.exports.DEBUG_LOG = "debug";
module.exports.ERROR_LOG = "error";
module.exports.INFO_LOG = "info";

module.exports.SFRA = preferences['Vertex_isSFRA'];