'use strict';

/**
 * Personlisation model
 * @param {Object} customobject DW custom object
 */
function personalize(customobject) {
    this.productID = customobject.custom.ID && customobject.custom.ID.split('_').length > 0 ? customobject.custom.ID.split('_')[1] : '';
    this.jerseyStyle = customobject.custom.jerseyStyle;
    this.frontImage = customobject.custom.frontImage;
    this.backImage = customobject.custom.backImage;
    this.enableSponsors = customobject.custom.enableSponsors;
    this.frontImageSponsors = customobject.custom.frontImageSponsors;
    this.backImageSponsors = customobject.custom.backImageSponsors;
    this.nameLocation = customobject.custom.nameLocation;
    this.personalizationInfo = customobject.custom.personalizationInfo;
    // Personalizations Options
    this.nopersonalizationsOption = Number(customobject.custom.nopersonalizationsOption).toFixed(2);
    this.nameOption = Number(customobject.custom.nameOption).toFixed(2);
    this.numberOption = Number(customobject.custom.numberOption).toFixed(2);
    this.namenumberOption = Number(customobject.custom.namenumberOption).toFixed(2);
    this.sponsorsOption = Number(customobject.custom.sponsorsOption).toFixed(2);
    this.namesponsorsOption = Number(customobject.custom.namesponsorsOption).toFixed(2);
    this.numbersponsorsOption = Number(customobject.custom.numbersponsorsOption).toFixed(2);
    this.namenumbersponsorsOption = Number(customobject.custom.namenumbersponsorsOption).toFixed(2);
    this.defaultOption = customobject.custom.defaultOption;
}

module.exports = personalize;
