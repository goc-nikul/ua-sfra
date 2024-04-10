/**
 * Changes value of strategy site preferences. This was created to process parameters from a
 * job. The job will call this function to change the ingestion strategy for a given feed.
*
* @param {*} parameters The type of data to be updated.
*/
function updateIngestionStrategy(parameters) {
    var config = require('link_constructor_connect_legacy/cartridge/scripts/helpers/config');
    var sitePrefs = dw.system.Site.getCurrent().getPreferences();

    if (parameters.DataType === 'product') {
        sitePrefs.getCustom()[config.configKeys.CONSTRUCTOR_PRODUCT_INGESTION_STRATEGY] = parameters.Strategy;
    } else if (parameters.DataType === 'inventory') {
        sitePrefs.getCustom()[config.configKeys.CONSTRUCTOR_INVENTORY_INGESTION_STRATEGY] = parameters.Strategy;
    } else if (parameters.DataType === 'category') {
        sitePrefs.getCustom()[config.configKeys.CONSTRUCTOR_CATEGORY_INGESTION_STRATEGY] = parameters.Strategy;
    }
}

module.exports.updateIngestionStrategy = updateIngestionStrategy;
