var countries = require( '*/cartridge/countries' );
var Locale = require( 'dw/util/Locale' );

/**
 * @description filter out the countries array to return only ones that are allowed in
 * site's allowedLocales
 * @return {array} allowedCountries array of countries that have allowed locales
 */
function getCountries() {
	var site = dw.system.Site.getCurrent();
	var allowedLocales = site.getAllowedLocales();
	var allowedCountries = countries.filter( function( country ) {
		var hasAllowedLocale = false;
		// loop over allowed locales
		for ( var i = 0; i < allowedLocales.length; i++ ) {
			var locale = Locale.getLocale( allowedLocales[i] );
			if ( country.countryCode === locale.country ) {
				hasAllowedLocale = true;
				break;
			}
		}
		return hasAllowedLocale;
	} );
	return allowedCountries;
}

function getCountriesGroupedBy( group ) {
	var countries = getCountries();
	var countriesGrouped = {};
	countries.forEach( function( country ) {
		var key = country.hasOwnProperty( group ) ? country[group] : undefined;
		if ( countriesGrouped.hasOwnProperty( key ) ) {
			countriesGrouped[key].push( country );
		} else {
			countriesGrouped[key] = [country];
		}
	} );
	return countriesGrouped;
}

/**
 * @description iterate over the countries array, find the first country that has the current locale
 * @param {PipelineDictionary} pdict the current pdict object
 * @return {object} country the object containing the country's settings
 */
function getCurrent( pdict ) {
	if ( !countries || countries.length === 0 ) {
		return;
	}
	var currentLocale = Locale.getLocale( pdict.CurrentRequest.locale );
	var country;
	if ( !currentLocale.country ) {
		return countries[0]; // return the first in the list if the requested one is not available
	}
	for ( var i = 0; i < countries.length; i++ ) {
		var _country = countries[i];
		if ( _country.countryCode === currentLocale.country ) {
			country = _country;
			break;
		}
	}
	return country || countries[0];  // return the first in the list if the requested one is not available
};

exports.getCountries = getCountries;
exports.getCountriesGroupedBy = getCountriesGroupedBy;
exports.getCurrent = getCurrent;
