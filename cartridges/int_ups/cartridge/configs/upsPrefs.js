'use strict';
var Site = require('dw/system/Site').current;
var sitePrefrences = Site.preferences.custom;

module.exports = {
    returnAddress: 'returnAddress' in sitePrefrences ? sitePrefrences.returnAddress : null,
    returnFromAddress: 'returnFromAddress' in sitePrefrences ? sitePrefrences.returnFromAddress : null,
    returnShipperAddress: 'returnShipperAddress' in sitePrefrences ? sitePrefrences.returnShipperAddress : null,
    countryOverride: 'countryOverride' in sitePrefrences ? sitePrefrences.countryOverride : null,
    showOrderReference: 'showOrderReference' in sitePrefrences ? sitePrefrences.showOrderReference : []
};
