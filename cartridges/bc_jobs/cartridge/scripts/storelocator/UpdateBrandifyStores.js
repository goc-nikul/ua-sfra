'use strict';

const HashMap = require('dw/util/HashMap'),
    Logger = require('dw/system/Logger'),
    Site = require('dw/system/Site'),
    System = require('dw/system/System'),
    XMLStreamWriter = require('dw/io/XMLStreamWriter'),
    Status = require('dw/system/Status'),
    StringUtils = require('dw/util/StringUtils'),
    BrandifyService = require('bc_jobs/cartridge/scripts/services/BrandifyApiService');

function initFeed(xsw) {
    xsw.writeStartDocument('UTF-8', '1.0');
    xsw.writeStartElement('stores');
    xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/store/2007-04-30');
}

function execute(params) {
    const IO = require('dw/io'),
        File = IO.File,
        FileWriter = IO.FileWriter,
        StreamWriter = IO.XMLStreamWriter;
    var siteId = Site.getCurrent().getID().toLowerCase();
    // Make the stores xml folders if they do not exist
    var dir = new File(File.IMPEX + '/src/feeds/stores/');
    dir.mkdirs();
    // Create file
    const fileNameSuffix = StringUtils.formatCalendar(System.getCalendar(), 'yyyyMMddHHmm') + '.xml';
    const file = new File(File.IMPEX + '/src/feeds/stores/brandifyStores_' + siteId + '_' + fileNameSuffix);
    file.createNewFile();
    try {
        var fileWriter = new FileWriter(file, 'UTF-8'),
            xsw = new StreamWriter(fileWriter);
        // Begin The XML document
        initFeed(xsw);
        // call brandify service
        var countryCode = !empty(params.country) ? params.country : 'US';
        var response = BrandifyService.call(countryCode);
        var storesDataXML = new XML(response);
        if (!empty(storesDataXML)) {
            var storeContentXML = storesDataXML.child('collection');
            var storesData = storeContentXML.child('poi');
            var Totalstores = storesData.length();
            for (var i = 0; i < Totalstores; i++) {
                var storeData = storesData[i];
                var storesLength = storeData.child('stnum').text().length();
                if (storesLength > 0) {
                    createStoresXML(xsw, storesData[i]);
                }
            }
        }
        /**
         * Write the end of the XML document
         * Example Output: </stores>
        */
        finalizeFeed(xsw);
        return new Status(Status.OK);
    } catch (e) {
        Logger.error("UpdateBrandifyStores.js: Could not create stores xml file for site: " + siteId + " - " + e);
        return new Status(Status.ERROR);
    }
}

function createStoresXML(xsw, storeData) {
    var storeID = '0' + storeData.child('stnum').text().toString();
    xsw.writeStartElement('store');
    xsw.writeAttribute('store-id', storeID);
    // write store elements
    writeStoreXML(xsw, 'name', storeData.child('subname').text().toString());
    writeStoreXML(xsw, 'address1', storeData.child('address1').text().toString());
    writeStoreXML(xsw, 'address2', storeData.child('address2').text().toString());
    writeStoreXML(xsw, 'city', storeData.child('city').text().toString());
    writeStoreXML(xsw, 'postal-code', storeData.child('postalcode').text().toString().split('-')[0]);
    writeStoreXML(xsw, 'state-code', storeData.child('state').text().toString());
    writeStoreXML(xsw, 'country-code', storeData.child('country').text().toString());
    writeStoreXML(xsw, 'phone', storeData.child('phone').text().toString());
    xsw.writeStartElement('store-hours');
    xsw.writeAttribute('xml:lang', 'x-default');
    storeHoursHTML(xsw, 'Monday', storeData.child('monopen').text().toString(), storeData.child('monclose').text().toString());
    storeHoursHTML(xsw, 'Tuesday', storeData.child('tueopen').text().toString(), storeData.child('tueclose').text().toString());
    storeHoursHTML(xsw, 'Wednesday', storeData.child('wedopen').text().toString(), storeData.child('wedclose').text().toString());
    storeHoursHTML(xsw, 'Thursday', storeData.child('thuropen').text().toString(), storeData.child('thurclose').text().toString());
    storeHoursHTML(xsw, 'Friday', storeData.child('friopen').text().toString(), storeData.child('friclose').text().toString());
    storeHoursHTML(xsw, 'Saturday', storeData.child('satopen').text().toString(), storeData.child('satclose').text().toString());
    storeHoursHTML(xsw, 'Sunday', storeData.child('sunopen').text().toString(), storeData.child('sunclose').text().toString());
    xsw.writeEndElement(); // end </storeHours>
    writeStoreXML(xsw, 'latitude', storeData.child('latitude').text().toString());
    writeStoreXML(xsw, 'longitude', storeData.child('longitude').text().toString());
    var inventoryId = 'US_Store_' + storeID + '_Inventory';
    writeStoreXML(xsw, 'inventory-list-id', inventoryId);
    // store custom attributes
    xsw.writeStartElement('custom-attributes');
    writeCustomAttrXML(xsw, 'countryCodeValue', storeData.child('country').text().toString());
    writeCustomAttrXML(xsw, 'inventoryListId', inventoryId);
    var storeHoursJson = storeHoursJsonFormat(storeData);
    // storeHours JSON
    writeCustomAttrXML(xsw, 'storeHoursJson', JSON.stringify(storeHoursJson));
    var storeType = storeData.child('icon').text().toString();
    var storeElement = '';
    if (storeType == 'UA_Outlet') {
        storeElement = 'factoryStore';
    } else if (storeType == 'UA_Specialty') {
        storeElement = 'brandHouse';
    } else {
        storeElement = 'other';
    }
    writeCustomAttrXML(xsw, 'storeType', storeElement);
    xsw.writeEndElement(); // </custom-attributes>
    xsw.writeEndElement();  // end </store>
    xsw.flush();
}

function finalizeFeed(xsw) {
    xsw.writeEndElement();
    xsw.writeEndDocument();
    xsw.flush();
    xsw.close();
}

function writeStoreXML(xsw, storeAttr, value) {
    if (!empty(value)) {
        xsw.writeStartElement(storeAttr);
        xsw.writeCharacters(value);
        xsw.writeEndElement();
    }
}

function writeCustomAttrXML(xsw, storeAttr, attrValue) {
    if (!empty(attrValue)) {
        xsw.writeStartElement('custom-attribute');
        xsw.writeAttribute('attribute-id', storeAttr);
        xsw.writeCharacters(attrValue);
        xsw.writeEndElement(); // end </custom-attribute>
    }
}

function storeHoursJsonFormat(storeData) {
    var storeHours = [];
    const days = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];
    let dayTimingObj = days.reduce((result, day) => {
        result[day] = {
            open: storeData.child(day + 'open').text().toString(),
            close: storeData.child(day + 'close').text().toString()
        }
        return result;
    }, {});

    var specialHours = storeData.child('specialhours').text().toString();
    const now = Date.now();
    const nextWeek = now + 7 * 1440 * 60000;
    if (!empty(specialHours)) {
        // we want to use special hours for use cases like holiday-specific store hours if this exists
        var specialHoursList = specialHours.split(',');
        specialHoursList.forEach((item) => {
            const matchme = /([0-9]+\/[0-9]+\/[0-9]+):{0,1}\s(.*)/g;
            const matches = matchme.exec(item);
            if (!matches) {
                return;
            }
            let matchesArray = [];
            for (var match of matches) {
                matchesArray.push(match);
            }
            const specialDateStr = matchesArray[1];
            const hours = matchesArray[2].toLowerCase();
            const d = new Date(specialDateStr)
            if (d.getTime() > now && d.getTime() < nextWeek) {
                if (hours === 'closed') {
                    dayTimingObj[days[d.getDay()]] = {};
                } else {
                    const openCloseMatch = /([0-9]+:[0-9]+[AP]M) - ([0-9]+:[0-9]+[AP]M)/g;
                    const openCloseTimesMatches = openCloseMatch.exec(item);
                    let openCloseTimes = [];
                    if (!openCloseTimesMatches) {
                        return;
                    }
                    for (let match of openCloseTimesMatches) {
                        openCloseTimes.push(match);
                    }
                    const openTime = openCloseTimes[1];
                    const closeTime = openCloseTimes[2];
                    dayTimingObj[days[d.getDay()]] = {
                        open: openTime,
                        close: closeTime
                    };
                }
            }
        });
    }
    storeHours = days.map(day => {
        let result = {};
        result[day + 'open'] = dayTimingObj[day].open;
        result[day + 'close'] = dayTimingObj[day].close;
        return result;
    });
    return storeHours;
}

function storeHoursHTML(xsw, dayName, openingTime, closingTime) {
    if (!empty(openingTime) && !empty(closingTime)) {
        xsw.writeCharacters(dayName + ' - ' + openingTime + ' - ' + closingTime);
        xsw.writeCharacters("\n");
    }
}

exports.execute = execute;

exports.unitTestFunctions = {
    storeHoursJsonFormat: storeHoursJsonFormat
};
