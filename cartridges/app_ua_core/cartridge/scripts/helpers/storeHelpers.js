'use strict';

var base = module.superModule;
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
const isMAOEnabled = Site.getCurrent().getCustomPreferenceValue('MAOEnabled');

/**
 * give google map link for the given store.
 * @param {Object} store - storeObject
 * @returns {string} gives time in 24 hour format HH:MM
 */
function getStoreGoogleMapLink(store) {
    var BaseURL = Site.getCurrent().getCustomPreferenceValue('halGoogleMapsEndpoint');
    var address;
    var storeAddress = '';
    try {
        storeAddress += store.address1 + ' ';
        if (store.address2 !== null) {
            storeAddress += store.address2 + ' ';
        }
        storeAddress += store.city + ' ' + store.stateCode + ' ' + store.postalCode;
        address = storeAddress.toString().replace(' ', '+').replace('&', '+');
    } catch (e) {
        Logger.error('Error while executing getStoreGoogleMapLink :: {0}', e.message);
    }
    return BaseURL + address;
}

/**
 * gives time in 24 hour format HH:MM
 * @param {string} time - time in 12 hour format HH:MM AM/PM
 * @returns {string} gives time in 24 hour format HH:MM
 */
function get24HourTimeFormat(time) {
    let hours = time ? Number(time.match(/^(\d+)/)[1]) : '';
    let minutes = time ? Number(time.match(/:(\d+)/)[1]) : '';
    let AMPM = time ? time.match(/(AM|A\.M\.|am|a\.m\.|PM|P\.M\.|pm|p\.m\.)/)[0] : '';
    if (AMPM === 'PM' && hours < 12) hours += 12;
    if (AMPM === 'AM' && hours === 12) hours -= 12;
    let sHours = hours.toString();
    let sMinutes = minutes.toString();
    if (hours < 10) sHours = '0' + sHours;
    if (minutes < 10) sMinutes = '0' + sMinutes;
    return sHours + '.' + sMinutes;
}

/**
 * gives time in 12 hour format HH:MM AM/PM
 * @param {string} time - time in 24 hour format HH:MM
 * @returns {string} gives time in 12 hour format HH:MM AM/PM
 */
function get12HourTimeformat(time) {
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time]; // eslint-disable-line no-param-reassign
    if (time.length > 1) {
        time = time.slice(1); // eslint-disable-line no-param-reassign
        time[5] = +time[0] < 12 ? ' AM' : ' PM'; // eslint-disable-line no-param-reassign
        time[0] = +time[0] % 12 || 12; // eslint-disable-line no-param-reassign
    }
    return time.join('');
}

/**
 * Time string to minutes
 * @param {string} t - time
 * @returns {string} returns minutes
 */
function strToMins(t) {
    var s = t.split('.');
    return Number(s[0]) * 60 + Number(s[1]); // eslint-disable-line
}

/**
 * Time minutes to string
 * @param {string} t - time
 * @returns {string} returns time in string HH:MM
 */
function minsToStr(t) {
    return Math.floor(t / 60) + ':' + ('00' + t % 60).slice(-2); // eslint-disable-line
}

/**
 * returns current time in the given time zone
 * @param {string} timeZone - time zone from store object
 * @returns {string} returns time
 */
function getCalendarInStoreTimeZone(timeZone) {
    var Calendar = require('dw/util/Calendar');
    var current = new Calendar();
    if (timeZone) {
        current.setTimeZone(timeZone);
    }
    return current;
}

/**
 * returns store open and store close hours for a particular day
 * @param {string} day - Day of week
 * @param {Object} storeHours - storeHoursJson
 * @returns {Object} returns store open and store close hours
 */
function getStoreHours(day, storeHours) {
    var current = {};
    switch (day) { // eslint-disable-line
        case 0:
            current.storeOpen = storeHours[day].sunopen;
            current.storeClose = storeHours[day].sunclose;
            break;
        case 1:
            current.storeOpen = storeHours[day].monopen;
            current.storeClose = storeHours[day].monclose;
            break;
        case 2:
            current.storeOpen = storeHours[day].tueopen;
            current.storeClose = storeHours[day].tueclose;
            break;
        case 3:
            current.storeOpen = storeHours[day].wedopen;
            current.storeClose = storeHours[day].wedclose;
            break;
        case 4:
            current.storeOpen = storeHours[day].thuropen;
            current.storeClose = storeHours[day].thurclose;
            break;
        case 5:
            current.storeOpen = storeHours[day].friopen;
            current.storeClose = storeHours[day].friclose;
            break;
        case 6:
            current.storeOpen = storeHours[day].satopen;
            current.storeClose = storeHours[day].satclose;
            break;
    }
    if (!empty(current.storeOpen)) current.storeOpen = get24HourTimeFormat(current.storeOpen);
    if (!empty(current.storeClose)) current.storeClose = get24HourTimeFormat(current.storeClose);
    return current;
}

/**
 * returns store open hours
 * @param {array} data of stores in array
 * @returns {array} returns store hours in required format
 */
function formatStoreHours(data) {
    var days = ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'];
    var dayOfWeekTranslation = {
        mon: 'Mon',
        tue: 'Tue',
        wed: 'Wedn',
        thur: 'Thur',
        fri: 'Fri',
        sat: 'Sat',
        sun: 'Sun'
    };

    var startDay = days[0];
    var storeHoursRange = [];
    var startOpen = !empty(data[startDay + 'open']) ? data[startDay + 'open'].replace(':00', ' ') : data[startDay + 'open'];
    var startClose = !empty(data[startDay + 'close']) ? data[startDay + 'close'].replace(':00', ' ') : data[startDay + 'close'];

    for (var d = 1; d < days.length; d++) {
        var nowDay = days[d];
        var storeHoursRangeObj = {};
        var nowOpen = !empty(data[nowDay + 'open']) ? data[nowDay + 'open'].replace(':00', ' ') : data[nowDay + 'open'];
        var nowClose = !empty(data[nowDay + 'close']) ? data[nowDay + 'close'].replace(':00', ' ') : data[nowDay + 'close'];
        if (startOpen !== nowOpen || startClose !== nowClose) {
            storeHoursRangeObj.startDay = dayOfWeekTranslation[startDay];
            storeHoursRangeObj.openTime = startOpen;
            storeHoursRangeObj.closeTime = startClose;
            if (startDay === days[d - 1]) {
                storeHoursRangeObj.endDay = dayOfWeekTranslation[startDay];
            } else {
                storeHoursRangeObj.endDay = dayOfWeekTranslation[days[d - 1]];
            }
            storeHoursRange.push(storeHoursRangeObj);
            startDay = nowDay;
            startOpen = nowOpen;
            startClose = nowClose;
        }
    }
    var sunDay = 'sun';
    var storeHoursRangeSunObj = {};
    var sunOpen = data[sunDay + 'open'].replace(':00', ' ');
    var sunClose = data[sunDay + 'close'].replace(':00', ' ');
    storeHoursRangeSunObj.endDay = dayOfWeekTranslation[sunDay];
    storeHoursRangeSunObj.openTime = sunOpen;
    storeHoursRangeSunObj.closeTime = sunClose;
    if (startDay === 'sun') {
        storeHoursRangeSunObj.startDay = dayOfWeekTranslation[sunDay];
    } else {
        storeHoursRangeSunObj.startDay = dayOfWeekTranslation[startDay];
    }
    storeHoursRange.push(storeHoursRangeSunObj);
    return storeHoursRange;
}

/**
 * returns next available day for a store
 * @param {string} today - Day of week
 * @param {Object} storeHours - storeHoursJson
 * @returns {Object} returns next available day
 */
function getNextWorkingDay(today, storeHours) {
    var nextWorkingDay;
    let nextDay = { storeOpen: null };
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (var i = 0; i < 14; i++) {
        let next = (today + 1 + i) % 7;
        nextDay = getStoreHours(next, storeHours);
        if (!empty(nextDay.storeOpen)) {
            nextWorkingDay = next;
            break;
        }
    }
    if ((nextWorkingDay - today) === 1) {
        return 'Tomorrow';
    } else if ((nextWorkingDay - today) > -7){ // eslint-disable-line
        return days[nextWorkingDay];
    } else { // eslint-disable-line
        return false;
    }
}

/**
 * sets availability status for each store
 * @param {Object} storeModels storeModels
 * @returns {Object} a plain object containing updated storeModels
 */
function getProductAvailabilityOnStoreHours(storeModels) {
    var Resource = require('dw/web/Resource');
    var StringUtils = require('dw/util/StringUtils');
    var pickupAvailableDuration = Site.getCurrent().getCustomPreferenceValue('pickupAvailableDuration');
    try {
        if (storeModels) {
            storeModels.stores.forEach(function (store) {
                if ('productInStoreInventory' in store && store.productInStoreInventory && 'storeHoursJson' in store && store.storeHoursJson) {
                    var storeHours = JSON.parse(store.storeHoursJson);
                    let storeTZ = 'storeTimeZone' in store && store.storeTimeZone.value ? store.storeTimeZone.value : require('dw/system/Site').getCurrent().getTimezone();
                    var current = getCalendarInStoreTimeZone(storeTZ); // hh:mm aa
                    var today = current.get(current.DAY_OF_WEEK) - 1; // monday = 1
                    var currentDay = getStoreHours(today, storeHours);
                    var currentTime = StringUtils.formatCalendar(current, 'HH.mm'); // formatted to HH.mm
                    if (currentDay && !empty(currentDay.storeOpen) && !empty(currentDay.storeClose) && (currentDay.storeClose - currentTime) > pickupAvailableDuration) {
                        store.availabilityMessage = Resource.msg('store.pickup.today', 'storeLocator', null); // eslint-disable-line no-param-reassign
                        store.orderby = get12HourTimeformat(minsToStr(strToMins(currentDay.storeClose) - strToMins(parseFloat(pickupAvailableDuration).toFixed(2)))); // eslint-disable-line
                    } else {
                        // find next working day.
                        var nextWorkingDay = getNextWorkingDay(today, storeHours);
                        if (nextWorkingDay) store.availabilityMessage = Resource.msgf('store.pickup', 'storeLocator', null, nextWorkingDay); // eslint-disable-line
                    }
                } else if (!('productInStoreInventory' in store) || !store.productInStoreInventory) {
                    store.availabilityMessage = Resource.msg('store.variant.unavailable', 'storeLocator', null); // eslint-disable-line no-param-reassign
                }
            });
        }
    } catch (e) {
        Logger.error('Error while executing getProductAvailabilityOnStoreHours :: {0}', e.message);
    }
    return storeModels;
}

/**
 * prepares an array for storeIDs in storesModel
 * @param {Object} storesModel storesModel
 * @returns {Object} location locationArray
 */
function getAllStoresID(storesModel) {
    var location = [];
    try {
        if (storesModel) {
            storesModel.stores.forEach(function (store) {
                if (store && store.enableStore !== false) {
                    location.push(store.ID);
                }
            });
        }
    } catch (e) {
        Logger.error('Error while executing getAllStoresID :: {0}', e.message);
    }
    return location;
}
/**
 * sets a flag to indicate if product is instock in SFCC store inventory
 * @param {Object} store store from store model
 * @param {Object} products product
 */
function isItemInSFCCStoreInventory(store, products) {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    try {
        if (store && store.enableStore !== false) {
            var storeInventoryListId = store.inventoryListId;
            if (storeInventoryListId) {
                var storeInventory = ProductInventoryMgr.getInventoryList(storeInventoryListId);
                var inventoryRecord = !empty(storeInventory) ? storeInventory.getRecord(products[0].id) : '';
                store.productInStoreInventory = !empty(inventoryRecord) && inventoryRecord.ATS.value > 0; // eslint-disable-line no-param-reassign
            }
        }
    } catch (e) {
        Logger.error('Error while executing isItemInSFCCStoreInventory :: {0}', e.message);
    }
    return;
}
/**
 * Find stores availability & store pickup timing
 * @param {Object} storesModel storesModel
 * @param {List} products products
 * @returns {Object} storesModel storesModel
 */
function getStoreAvailability(storesModel, products) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
    const AvailabilityHelper = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper') : {};
    var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
    if (products) {
        // introducing MAO check and checkpoint check.
        var isCheckPointEnabled = isMAOEnabled ? AvailabilityHelper.isCheckPointEnabled('BOPIS') : false;
        var maoBOPISAvailability = null;
        var items = null;

        if (realTimeInventoryCallEnabled && isCheckPointEnabled) {
            var product = ProductMgr.getProduct(products[0].id);
            var locations = getAllStoresID(storesModel);

            if (product && Object.prototype.hasOwnProperty.call(product.custom, 'sku') && product.custom.sku) {
                items = [product.custom.sku];
            } else {
                Logger.getLogger('mao_availability').info('MAOEmptySKU (storeHelpers.js) : Product {0} has empty sku', product.ID);
            }

            if (!empty(items) && !empty(locations)) {
                maoBOPISAvailability = Availability.getMaoAvailability(items, locations);
            }
        }
        // Below code considers response from MAO if service call is successful and response has data for a particular product, else defaults to store inventory.
        if (maoBOPISAvailability && maoBOPISAvailability[items]) {
            maoBOPISAvailability = JSON.parse(maoBOPISAvailability[items]);
            for (var i = 0; i < maoBOPISAvailability.storeId.length; i++) {
                storesModel.stores.forEach(function (store) { // eslint-disable-line
                    if (store && store.enableStore !== false) {
                        // If the response from MAO doesn't have data for a specific store then defaults to SFCC store inventory
                        if (store.ID === maoBOPISAvailability.storeId[i]) {
                            store.productInStoreInventory = maoBOPISAvailability.quantity[i] > 0 ? true : false; // eslint-disable-line
                        } else {
                            isItemInSFCCStoreInventory(store, products);
                        }
                    }
                });
            }
        } else {
            storesModel.stores.forEach(function (store) {
                isItemInSFCCStoreInventory(store, products);
            });
        }
    }
    getProductAvailabilityOnStoreHours(storesModel);

    return storesModel;
}

/**
 * Updates stores with distance from the given postal code or Lat/long
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {Object} storesModel storesModel
 * @returns {Object} storesModel storesModel
 */
function updateStoreDistance(radius, postalCode, lat, long, geolocation, storesModel) {
    var storeMgr = require('dw/catalog/StoreMgr');
    var distanceUnit = geolocation.countryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;
    var result;
    var location = {};
    if (postalCode && postalCode !== '') {
        result = storeMgr.searchStoresByPostalCode(geolocation.countryCode, postalCode, distanceUnit, resolvedRadius);
    } else {
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;

        result = storeMgr.searchStoresByCoordinates(location.lat, location.long, distanceUnit, resolvedRadius);
    }
    if (result) {
        storesModel.stores.forEach(function (store) {
            for (var key in result) { // eslint-disable-line
                if (store && store.ID === key.ID) {
                    store.distance = result.get(key).toFixed(2) + ' ' + distanceUnit; // eslint-disable-line
                }
            }
        });
    }
    return storesModel;
}

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @param {[Object]} products - an array of product ids to quantities that needs to be filtered by.
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, geolocation, showMap, url, products) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    geolocation.countryCode = Locale.getLocale(request.locale).country; // site country code
    var storesModel = base.getStores(radius, postalCode, lat, long, geolocation, showMap, url);
    updateStoreDistance(radius, postalCode, lat, long, geolocation, storesModel);
    if (products && products[0].id !== 'undefined') {
        storesModel = getStoreAvailability(storesModel, products);
    }
    return storesModel;
}

/**
 * Find stores by ID
 * @param {string} storeID store id
 * @returns {Object} store model
 */
function findStoreById(storeID) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var store = storeID ? StoreMgr.getStore(storeID) : null;
    if (!store) {
        return null;
    }
    var StoreModel = require('*/cartridge/models/store');
    return new StoreModel(store);
}

/**
 * Find stores by geolocation
 * @param {string} lat latitude
 * @param {string} long longitude
 * @param {string} postalCode postalCode
 * @returns {Object} storesModel storeModel
 */
function preSelectStoreByLocation(lat, long, postalCode) {
    var Locale = require('dw/util/Locale');
    var geolocation = {}; // eslint-disable-next-line
    geolocation.countryCode = Locale.getLocale(request.locale).country; // site country code
    var storesModel = base.getStores(null, postalCode, lat, long, geolocation); // eslint-disable-line
    return storesModel;
}

/**
 * Find cookie for pre-selected store
 * @returns {Object} preSelectedStoreCookie preSelectedStoreCookie
 */
function getPreSelectedStoreCookie() {
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
    if (preSelectedStoreCookie) {
        preSelectedStoreCookie = JSON.parse(preSelectedStoreCookie);
    }
    return preSelectedStoreCookie;
}

/**
 * Get selected radius or default radius
 * @param {string} radius radius
 * @returns {string} radiusSelected radiusSelected
 */
function getDefaultRadius(radius) {
    var radiusSelected = radius;
    if (!radiusSelected) {
        if ('inStorePickUpRadiusOptions' in Site.current.preferences.custom && !empty(Site.current.getCustomPreferenceValue('inStorePickUpRadiusOptions'))) {
            var radiusOptions = JSON.parse(Site.current.getCustomPreferenceValue('inStorePickUpRadiusOptions'));
            if (radiusOptions && radiusOptions.length > 0) {
                radiusSelected = radiusOptions[0];
            } else {
                radiusSelected = 15;
            }
        }
    }
    return radiusSelected;
}

/**
 * Get selected radius or default radius
 * @param {Object} store store
 * @param {string} availabilityMessage availabilityMessage
 * @param {boolean} bopisSelected bopisSelected
 * @param {boolean} bopisStock bopisStock
 */
function updateSelectedStoreCookie(store, availabilityMessage, bopisSelected, bopisStock) {
    // update cookie on store selection
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
    if (preSelectedStoreCookie) {
        cookieHelper.deleteCookie('preSelectedStore');
    }
    var storeData = {};
    var Resource = require('dw/web/Resource');
    if (store) {
        storeData.ID = store.ID;
        storeData.name = store.name;
        storeData.address1 = store.address1;
        storeData.availableMsg = availabilityMessage;
        storeData.bopisSelected = bopisSelected;
        storeData.bopisStock = bopisStock;
    } else {
        storeData.noStoreAvailable = true;
        storeData.availableMsg = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
        storeData.bopisSelected = bopisSelected;
        storeData.bopisStock = bopisStock;
    }
    storeData = JSON.stringify(storeData);
    var cookieExpirationInSecs = Site.getCurrent().getCustomPreferenceValue('selectStorecookieExpirationTime');
    cookieHelper.create('preSelectedStore', storeData, cookieExpirationInSecs);
}

/**
 * returns store open and close hours
 * @param {Object} storeHoursJsonData - storeHours
 * @returns {array} returns store open and store close hours data
 */
function getStoreOpenHours(storeHoursJsonData) {
    var arr = [];
    JSON.parse(storeHoursJsonData).forEach(function (item) {
        Object.keys(item).forEach(function (itemKey) {
            arr[itemKey] = item[itemKey];
        });
    });
    return formatStoreHours(arr);
}
/**
 * returns store open and close hours
 * @param {Object} storeHours - storeHours
 * @returns {array} returns store open and store close hours data
 */
function getStoreHoursforSFMC(storeHours) {
    var storeOpenRangeSFMC = [];
    try {
        var storeHoursArray = getStoreOpenHours(storeHours);
        storeHoursArray.forEach(function (storeHourObj) {
            var storeOpen = {
                startDay: storeHourObj.startDay,
                EndDay: storeHourObj.endDay,
                openTime: storeHourObj.openTime,
                endTime: storeHourObj.closeTime,
                IsOpen: true
            };
            storeOpenRangeSFMC.push(storeOpen);
        });
    } catch (e) {
        Logger.error(e.message);
    }
    return storeOpenRangeSFMC;
}

/**
 * returns bopis skus and bopis store ID in object
 * @param {Object} basket currentBasket
 * @returns {Object} bopisData bopisData
 */
function getBopisData(basket) {
    var bopisData = {};
    var items = [];
    try {
        if (basket && basket.shipments) {
            const collections = require('*/cartridge/scripts/util/collections');
            var bopisShipment = collections.find(basket.shipments, function (item) { // eslint-disable-line
                if (item.custom.fromStoreId) {
                    return item;
                }
            });
            if (bopisShipment) {
                var selectedStoreID = bopisShipment.custom.fromStoreId;
                if (selectedStoreID) var location = [selectedStoreID];
                collections.forEach(basket.productLineItems, function (PLI) {
                    if (PLI.shipment.custom.fromStoreId) {
                        if (Object.prototype.hasOwnProperty.call(PLI.product.custom, 'sku') && PLI.product.custom.sku) {
                            items.push(PLI.product.custom.sku);
                        } else {
                            Logger.getLogger('mao_availability').info('MAOEmptySKU (storeHelpers) : Product {0} has empty sku', PLI.product.ID);
                        }
                    }
                });
                bopisData.locations = location;
                bopisData.items = items;
            }
        }
    } catch (e) {
        Logger.error('Error while executing getProductAvailabilityOnStoreHours :: {0}', e.message);
    }
    return bopisData;
}

/**
 * returns bopis skus and bopis store ID in object
 * @param {Object} basketResponse - basket response to ocapi call
 * @returns {Object} bopisData bopisData
 */
function getBopisDataOCAPI(basketResponse) {
    const bopisData = {};
    const items = [];
    try {
        if (basketResponse && basketResponse.shipments) {
            const collections = require('*/cartridge/scripts/util/collections');
            const bopisShipment = collections.find(basketResponse.shipments, function (item) { // eslint-disable-line
                if (item.c_fromStoreId) {
                    return item;
                }
            });
            if (bopisShipment) {
                const ProductMgr = require('dw/catalog/ProductMgr');
                const selectedStoreID = bopisShipment.c_fromStoreId;
                if (selectedStoreID) var location = [selectedStoreID];
                const productItems = basketResponse.product_items;
                collections.forEach(productItems, function (productItem) {
                    const productID = productItem.product_id;
                    const product = ProductMgr.getProduct(productID);
                    if (Object.prototype.hasOwnProperty.call(product.custom, 'sku') && product.custom.sku) {
                        items.push(product.custom.sku);
                    } else {
                        Logger.getLogger('mao_availability').info('MAOEmptySKU (storeHelpers) : Product {0} has empty sku', product.ID);
                    }
                });
                bopisData.locations = location;
                bopisData.items = items;
            }
        }
    } catch (e) {
        Logger.error('Error while executing getProductAvailabilityOnStoreHours :: {0}', e.message);
    }
    return bopisData;
}

/**
 * Get selected radius or default radius
 * @param {Object} product Product
 * @param {Object} variantProduct Product
 * @param {boolean} isVIP Is a VIP customer
* @returns {Object} storeInfo selected Store information
 */
function updateSelectedStore(product, variantProduct, isVIP) {
    var storeInfo = {
        selectedStore: null
    };
    if (!variantProduct && !variantProduct.ID) {
        return storeInfo;
    }

    var pickUpInStoreEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') && (product.custom.availableForInStorePickup !== false || variantProduct.custom.availableForInStorePickup !== false);
    if (pickUpInStoreEnabled && !isVIP) {
        // get selectedStoreID
        var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
        var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
        if (preSelectedStoreCookie) {
            var storeData = JSON.parse(preSelectedStoreCookie);
            var storeID = storeData && storeData.ID;
            if (storeID) {
                var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                storeInfo.selectedStore = storeHelpers.findStoreById(storeID);
                var productList = [{ id: variantProduct.ID, quantity: 1 }];
                var storeModel = { stores: [storeInfo.selectedStore] };
                var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
                var availabilityMessage = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ? storeAvailabilityObj.stores[0].availabilityMessage : null;
                var Resource = require('dw/web/Resource');
                var bopisSelected = false;
                var bopisStock = false;
                if (storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] && 'productInStoreInventory' in storeAvailabilityObj.stores[0] && storeAvailabilityObj.stores[0].productInStoreInventory) {
                    bopisSelected = true;
                    bopisStock = true;
                } else {
                    availabilityMessage = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
                }
                storeHelpers.updateSelectedStoreCookie(storeData, availabilityMessage, bopisSelected, bopisStock);
            }
        }
    }
    return storeInfo;
}

module.exports = exports = {
    createStoresResultsHtml: base.createStoresResultsHtml,
    getStores: getStores,
    findStoreById: findStoreById,
    preSelectStoreByLocation: preSelectStoreByLocation,
    getStoreAvailability: getStoreAvailability,
    getProductAvailabilityOnStoreHours: getProductAvailabilityOnStoreHours,
    getPreSelectedStoreCookie: getPreSelectedStoreCookie,
    getDefaultRadius: getDefaultRadius,
    updateSelectedStoreCookie: updateSelectedStoreCookie,
    getBopisData: getBopisData,
    getStoreOpenHours: getStoreOpenHours,
    getStoreHoursforSFMC: getStoreHoursforSFMC,
    getStoreGoogleMapLink: getStoreGoogleMapLink,
    getBopisDataOCAPI: getBopisDataOCAPI,
    updateSelectedStore: updateSelectedStore
};
