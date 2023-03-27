/* eslint-disable spellcheck/spell-checker */
'use script';

var Calendar = require('dw/util/Calendar');
var JSONUtils = require('int_customfeeds/cartridge/scripts/util/JSONUtils');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');


/**
 * Return Min number of Delivery Days from Shipping Method
 * @param {Object} shippingMethod shipping methods
 * @return {Object} - Returns delivery preferences object
 */
function getMinDeliveryDays(shippingMethod) {
    var minDeliveryDays = (!empty(shippingMethod) && 'minDeliveryDays' in shippingMethod.custom) ? shippingMethod.custom.minDeliveryDays : 0;
    return minDeliveryDays;
}

/**
 * Return Max number of Delivery Days from Shipping Method
 * @param {Object} shippingMethod shipping methods
 * @return {Object} - Returns delivery preferences object
 */
function getMaxDeliveryDays(shippingMethod) {
    var maxDeliveryDays = (!empty(shippingMethod) && 'maxDeliveryDays' in shippingMethod.custom) ? shippingMethod.custom.maxDeliveryDays : 0;
    return maxDeliveryDays;
}

/**
 * Return the shipping cutoff time from the site preferece
 * @return {Object} - Returns delivery preferences object
 */
function getShippingCutOffTime() {
    var shippingCutOffTime = Site.getCurrent().getCustomPreferenceValue('shippingCutOffTime');
    return shippingCutOffTime;
}

/**
 * Return JSON parsed scheduledDeliveryDateMapping text from storefront configuration
 *
 * @return {Object} - Returns delivery preferences object
 */
function getScheduledDeliveryPreference() {
    var scheduledDeliveryPreferenceJson = Site.getCurrent().getCustomPreferenceValue('scheduledDeliveryDateMapping');
    return JSONUtils.parse(scheduledDeliveryPreferenceJson, {});
}

/**
 * Return startDateOffset from storefront preferences
 *   if the preferences are empty, return the property 'scheduleddelivery.startdateoffset' configuration
 *   if the backup is empty, return 30
 * @return {number} - Delivery start date offset
 */
function getDeliveryStartDateOffset() {
    var deliveryDateMapping = getScheduledDeliveryPreference();

    if (empty(deliveryDateMapping) || empty(deliveryDateMapping.startDateOffset)) {
        Logger.warn("DeliveryHelper.ds: site custom preference 'startDateOffset' is empty or not defined. Using config.properties value.");

        return parseInt(Resource.msg('scheduleddelivery.startdateoffset', 'config', 30), 10);
    }

    return deliveryDateMapping.startDateOffset;
}

/**
 * Return endDateOffset from storefront preferences
 *   if the preferences are empty, return the property 'scheduleddelivery.enddateoffset' configuration
 *   if the backup is empty, return 60
 * @return {number} - Returns delivery end offset date
 */
function getDeliveryEndDateOffset() {
    var deliveryDateMapping = getScheduledDeliveryPreference();

    if (empty(deliveryDateMapping) || empty(deliveryDateMapping.endDateOffset)) {
        Logger.warn("DeliveryHelper.ds: site custom preference 'endDateOffset' is empty or not defined. Using config.properties value.");

        return parseInt(Resource.msg('scheduleddelivery.enddateoffset', 'config', 60), 10);
    }

    return deliveryDateMapping.endDateOffset;
}

/**
 * Return endDateOffset from storefront preferences
 *   if the preferences are empty, return the property 'scheduleddelivery.enddateoffset' configuration
 *   if the backup is empty, return 60
 * @return {number} - Returns holidays
 */
function getDeliveryBlackoutDates() {
    var deliveryDateMapping = getScheduledDeliveryPreference();

    if (empty(deliveryDateMapping) || empty(deliveryDateMapping.holidays)) {
        Logger.warn("DeliveryHelper.ds: site custom preference 'holidays' is empty or not defined. Using empty Array");

        var configValue = [];

        return configValue;
    }

    return deliveryDateMapping.holidays;
}

/**
 * Return the available date value to loop through
 *   test to make sure date range is positive
 *   if not, set to config values
 * @param {number} startDateOffset - Startdateoofset
 * @param {number} endDateOffset - endDateOffset
 * @return {number} availableDateRange
 */
function getAvailableDateRange(startDateOffset, endDateOffset) {
    var availableDateRange = endDateOffset - startDateOffset;
    if (availableDateRange <= 0) {
        Logger.warn('DeliveryHelper.js: available delivery date range is negative. Using config value.');
        availableDateRange = parseInt(Resource.msg('scheduleddelivery.defaultrange', 'config', 30), 10);
    }

    // subtract one day to offset adding one immediately during date loop
    availableDateRange--;

    return availableDateRange;
}
/**
 * Return an array of date for possible delivery
 * @return {Object} - Returns delivery preferences object
 */
function getAvailableDeliveryDates() {
    var timezoneHelper = new TimezoneHelper();
    var calendar = new Calendar(timezoneHelper.getCurrentSiteTime());
    var startDateOffset = getDeliveryStartDateOffset();
    var endDateOffset = getDeliveryEndDateOffset();
    var blackoutDates = getDeliveryBlackoutDates();
    var availableDateRange = getAvailableDateRange(startDateOffset, endDateOffset);
    var availableDates = [];

        // array of dates in string format to send to isloop

        // add the start date offset to the calendar object
    calendar.add(calendar.DATE, startDateOffset);

        /*
         * loop through the difference of start and end days
         * need to offset the date by one to deal with the increment
         */
    for (let x = 0; x <= availableDateRange; x++) {
            // set default show date value
        let showDate = true;

            // increment the date by one
        calendar.add(calendar.DATE, 1);

            // check if this day is a weekend
        const dayOfWeek = calendar.get(calendar.DAY_OF_WEEK);
        if (dayOfWeek === calendar.SATURDAY || dayOfWeek === calendar.SUNDAY) {
            showDate = false;
        }

            // check if this day is a holiday or blackout date
        const blackoutDateToTest = StringUtils.formatCalendar(calendar, 'dd-MM');
        if (blackoutDates.indexOf(blackoutDateToTest) > -1) {
            showDate = false;
        }

            // add the date to the date array
        if (showDate) {
            const dateToPush = {};
            dateToPush.value = StringUtils.formatCalendar(calendar, 'yyy-MM-dd');
            dateToPush.label = StringUtils.formatCalendar(calendar, 'dd/MM/yyy - EEE');
            availableDates.push(dateToPush);
        }
    }
    return availableDates;
}

/**
 * Return an array of date for possible delivery
 * @param {Object} objectID - shippingMethod ID
 * @param {boolean} modifyGetResponse - from modifyGetResponse method
 * @return {Object} - Returns delivery preferences object
 */
function getCustomObject(objectID, modifyGetResponse) {
    var com = require('dw/object/CustomObjectMgr');
    const customObjectName = 'ShippingMethodDeliveryDate';
    var siteId = Site.getCurrent().ID;
    var keyId = objectID + '_' + siteId;
    var objectDefinition = com.getCustomObject(customObjectName, keyId);
    try {
        if ((empty(objectDefinition) && !modifyGetResponse)) {
            require('dw/system/Transaction').wrap(function () {
                objectDefinition = com.createCustomObject(customObjectName, keyId);
            });
        }
    } catch (e) {
        Logger.error('DeliveryHelper.js error in createCustomObject : {0}', e.message);
    }
    return objectDefinition ? objectDefinition.getCustom() : null;
}

/**
 * Set the Delivery Date and expire time in custom object
 * @param {Object} shippingMethod - shippingMethod
 * @param {Array} availableDates - availableDates
 * @param {boolean} modifyGetResponse - from modifyGetResponse method
 */
function setDeliveryDateCustomObj(shippingMethod, availableDates, modifyGetResponse) {
    var shippingDeliveryDateObj = getCustomObject(shippingMethod.ID, modifyGetResponse);
    var customObjExpiryHour = getShippingCutOffTime();

    if (shippingDeliveryDateObj === null || availableDates.length === 0) {
        return;
    }

    var timezoneHelper = new TimezoneHelper();
    var currentTime = timezoneHelper.getCurrentSiteTime();
    var cutoffTime = timezoneHelper.getCurrentSiteTime();

    cutoffTime.setHours(customObjExpiryHour);
    cutoffTime.setMinutes(0);
    cutoffTime.setSeconds(0, 0);

    var currentTimeCalendar = new Calendar(currentTime);
    var cutoffTimeCalendar = new Calendar(cutoffTime);

    // For Ex. If in case cutoff time is 06/16 9pm EST and this method executes at 06/16 10pm EST
    // then we should set the cutoff time by increasing the day by 1 so that it should not set
    // again 06/16 9pm, it should be 06/17 9pm. else save the cutoff time without incrementing the Date.
    if (cutoffTimeCalendar.before(currentTimeCalendar)) {
        cutoffTimeCalendar.add(cutoffTimeCalendar.DATE, 1);
    }
    if (!modifyGetResponse) {
        try {
            require('dw/system/Transaction').wrap(function () {
                shippingDeliveryDateObj.expiryTime = cutoffTimeCalendar.getTime();
                shippingDeliveryDateObj.minDeliveryDate = availableDates[0].getTime();
                shippingDeliveryDateObj.maxDeliveryDate = availableDates[1].getTime();
            });
        } catch (e) {
            Logger.error('DeliveryHelper.js error in createCustomObject : {0}', e.message);
        }
    }
    return;
}

/**
 * Return the cached delivery date
 * @param {Object} shippingMethod - shippingMethod
 * @param {boolean} modifyGetResponse - from modifyGetResponse method
 * @return {Object} - Returns cached delivery dates
 */
function getCachedDeliveryDate(shippingMethod, modifyGetResponse) {
    var caschedAvailableDates = {};
    var customObj = getCustomObject(shippingMethod.ID, modifyGetResponse);

    if (customObj === null) {
        return caschedAvailableDates;
    }

    var timezoneHelper = new TimezoneHelper();
    var currentTime = new Calendar(timezoneHelper.getCurrentSiteTime());
    var expiryTime = customObj.expiryTime ?
        new Calendar(customObj.expiryTime) : null;

    if (expiryTime &&
        currentTime.before(expiryTime) &&
        customObj.minDeliveryDate &&
        customObj.maxDeliveryDate) {
        caschedAvailableDates.minDeliveryDate = new Calendar(customObj.minDeliveryDate);
        caschedAvailableDates.maxDeliveryDate = new Calendar(customObj.maxDeliveryDate);
    }

    return caschedAvailableDates;
}
/**
 * Calculate the blackout dated
 * @param {string} devDate - delivery Date
 * @param {string} typeDate - delivery Date Type
 * @param {Object} blackoutDates - blackout dates
 * @param {Object} minDeliveryDate - minimum delivery date
 * @param {Object} maxDeliveryDate - maximum delivery date
 * @return {void} - Returns void
 */
function blackOutDaYTest(devDate, typeDate, blackoutDates, minDeliveryDate, maxDeliveryDate) {
    var dateMax = new Date(devDate);
    var dateCurrent = new Date();
    var differenceInTime = dateMax.getTime() - dateCurrent.getTime();
    var differenceInDays = differenceInTime / (1000 * 3600 * 24);
    for (var index = 1; index <= differenceInDays; index++) {
        var numberOfDaysToAdd = index;
        var currDate = new Date();
        currDate.setDate(currDate.getDate() + numberOfDaysToAdd);
        var blackDateToTest = new Calendar(currDate);
        blackDateToTest = StringUtils.formatCalendar(blackDateToTest, 'dd-MM');
        if (blackoutDates.indexOf(blackDateToTest) > -1 && typeDate === 'minDate') {
            minDeliveryDate.add(minDeliveryDate.DATE, 1);
            break;
        } else if (blackoutDates.indexOf(blackDateToTest) > -1 && typeDate === 'maxDate') {
            maxDeliveryDate.add(maxDeliveryDate.DATE, 1);
            break;
        }
    }
    return;
}
/**
 * Return the date range for deliveries
 * @param {Object} shippingMethod shipping methods
 * @param {boolean} modifyGetResponse - from modifyGetResponse method
 * @return {Object} - Returns delivery preferences object
 */
function getShippingDeliveryDates(shippingMethod, modifyGetResponse) {
    var availableDates = [];

    if (empty(shippingMethod)) {
        return availableDates;
    }

    var cachedDeliveryDate = getCachedDeliveryDate(shippingMethod, modifyGetResponse);

    if ((Object.keys(cachedDeliveryDate).length > 0) &&
        cachedDeliveryDate.minDeliveryDate &&
        cachedDeliveryDate.maxDeliveryDate) {
        availableDates.push(cachedDeliveryDate.minDeliveryDate);
        availableDates.push(cachedDeliveryDate.maxDeliveryDate);
        return availableDates;
    }

    var timezoneHelper = new TimezoneHelper();
    var calendar = new Calendar(timezoneHelper.getCurrentSiteTime());
    var shippingCalendar = new Date(timezoneHelper.getCurrentSiteTime());

    var minDeliveryDate = new Calendar(timezoneHelper.getCurrentSiteTime());
    var maxDeliveryDate = new Calendar(timezoneHelper.getCurrentSiteTime());
    var currentDate = minDeliveryDate.time;
    var dateMin = new Date(currentDate);
    var blackoutDates = getDeliveryBlackoutDates();
    var maxDeliveryDays = getMaxDeliveryDays(shippingMethod);
    var minDeliveryDays = getMinDeliveryDays(shippingMethod);
    var currentDay = new Date();
    var blackDateToTest = StringUtils.formatCalendar(minDeliveryDate, 'dd-MM');
    currentDay = currentDay.getDay();
    // Check the time and if we are after the cut off add a day :TODO this isnt counting mins. -1 hour, adding one day extra if order place on saturday or sunday
    if (shippingCalendar.getHours() >= getShippingCutOffTime() || (currentDay === 0 || currentDay === 6)) {
        if (blackoutDates.indexOf(blackDateToTest) === -1) {
            minDeliveryDate.add(minDeliveryDate.DATE, 1);
            maxDeliveryDate.add(maxDeliveryDate.DATE, 1);
        }
    }
    if (blackoutDates.indexOf(blackDateToTest) > -1) {
        minDeliveryDate.add(minDeliveryDate.DATE, 1);
        maxDeliveryDate.add(maxDeliveryDate.DATE, 1);
    }
        // add days for the min range
    minDeliveryDate.add(minDeliveryDate.DATE, minDeliveryDays);
    maxDeliveryDate.add(maxDeliveryDate.DATE, maxDeliveryDays);
    var conditionCheck = false;
    var minDeliveryDateDayOfWeek = minDeliveryDate.get(calendar.DAY_OF_WEEK);
    // If weekends push dates by 2 days.
    if (minDeliveryDateDayOfWeek === minDeliveryDate.SATURDAY) {
        minDeliveryDate.add(minDeliveryDate.DATE, 2);
        maxDeliveryDate.add(maxDeliveryDate.DATE, 2);
        conditionCheck = true;
    }

    if (minDeliveryDateDayOfWeek === minDeliveryDate.SUNDAY) {
        minDeliveryDate.add(minDeliveryDate.DATE, 2);
        maxDeliveryDate.add(maxDeliveryDate.DATE, 2);
        conditionCheck = true;
    }
    var minDevDate;
    if (!conditionCheck) {
        minDevDate = minDeliveryDate.time;
        var dateMax = new Date(minDevDate);
        var differenceInTime = dateMax.getTime() - dateMin.getTime();
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);
        for (var index = 1; index <= differenceInDays; index++) {
            var numberOfDaysToAdd = index;
            var currDate = new Date();
            currDate.setDate(currDate.getDate() + numberOfDaysToAdd);
            if (currDate.getDay() === 6 || currDate.getDay() === 0) { // Logic to add buffer days if there are saturday or sunday between the Min and Max Delivery day
                minDeliveryDate.add(minDeliveryDate.DATE, 1);     // Example : Min delivery day Friday and Max Delivery day Monday
                maxDeliveryDate.add(maxDeliveryDate.DATE, 1);
            }
        }
    }
    var minDilvTime = minDeliveryDate.time; // Final Check for min delievry dates should not be sat or sun day
    var minDilvDate = new Date(minDilvTime);
    var minDilvDay = minDilvDate.getDay();
    if ((minDilvDay === 6) || (minDilvDay === 0)) {
        minDeliveryDate.add(minDeliveryDate.DATE, 2);
        maxDeliveryDate.add(maxDeliveryDate.DATE, 2);
    }

    var maxDilvTime = maxDeliveryDate.time; // Final Check for min delievry dates should not be sat or sun day
    var maxDilvDate = new Date(maxDilvTime);
    var maxDilvDay = maxDilvDate.getDay();
    if ((maxDilvDay === 6) || (maxDilvDay === 0)) {
        maxDeliveryDate.add(maxDeliveryDate.DATE, 2);
    }
    minDevDate = minDeliveryDate.time;
    var dateType = 'minDate';
    blackOutDaYTest(minDevDate, dateType, blackoutDates, minDeliveryDate, null);
    var maxDevDate = maxDeliveryDate.time;
    dateType = 'maxDate';
    blackOutDaYTest(maxDevDate, dateType, blackoutDates, null, maxDeliveryDate);
    minDilvTime = minDeliveryDate.time; // Final Check for min delievry dates should not be sat or sun day
    minDilvDate = new Date(minDilvTime);
    minDilvDay = minDilvDate.getDay();
    if ((minDilvDay === 6) || (minDilvDay === 0)) {
        minDeliveryDate.add(minDeliveryDate.DATE, 2);
    }

    maxDilvTime = maxDeliveryDate.time; // Final Check for min delievry dates should not be sat or sun day
    maxDilvDate = new Date(maxDilvTime);
    maxDilvDay = maxDilvDate.getDay();
    if ((maxDilvDay === 6) || (maxDilvDay === 0)) {
        maxDeliveryDate.add(maxDeliveryDate.DATE, 2);
    }

    // Updated the logic to calculate the delivery days in a dynamic way
    var weekendBlackout = [6, 0];

    for (var i = 0; i < blackoutDates.length; i++) {
        var minDayToCheck = StringUtils.formatCalendar(minDeliveryDate, 'dd-MM');
        if (minDayToCheck === blackoutDates[i]) {
            minDeliveryDate.add(minDeliveryDate.DATE, 1);

            minDilvTime = minDeliveryDate.time;
            minDilvDate = new Date(minDilvTime);
            minDilvDay = minDilvDate.getDay();

            for (var j = 0; j < weekendBlackout.length; j++) {
                if (minDilvDay === weekendBlackout[j]) {
                    minDeliveryDate.add(minDeliveryDate.DATE, 2);
                }
            }
        }

        var maxDayToCheck = StringUtils.formatCalendar(maxDeliveryDate, 'dd-MM');
        if (maxDayToCheck === blackoutDates[i]) {
            maxDeliveryDate.add(maxDeliveryDate.DATE, 1);

            maxDilvTime = maxDeliveryDate.time;
            maxDilvDate = new Date(maxDilvTime);
            maxDilvDay = maxDilvDate.getDay();

            for (var p = 0; p < weekendBlackout.length; p++) {
                if (maxDilvDay === weekendBlackout[p]) {
                    maxDeliveryDate.add(maxDeliveryDate.DATE, 2);
                }
            }
        }
    }

    availableDates.push(minDeliveryDate);
    availableDates.push(maxDeliveryDate);

    // Set the DeliveryDates and the Expire Time in Custom Object
    setDeliveryDateCustomObj(shippingMethod, availableDates, modifyGetResponse);

    return availableDates;
}

/**
 * Return the date range for available deliveries dates
 * @param {Object} shippingMethod shipping methods
 * @return {Object} - Returns delivery preferences object
 */
function getAvailableDeliveryDatesFormated(shippingMethod) {
    var availableDates = getShippingDeliveryDates(shippingMethod, false);
    var formatedDates = [];
    availableDates.forEach(function (date) {
        const dateToPush = {};
        dateToPush.value = StringUtils.formatCalendar(date, 'yyy-MM-dd');
        dateToPush.label = StringUtils.formatCalendar(date, 'dd/MM/yyy - EEE');
        formatedDates.push(dateToPush);
    });
    return formatedDates;
}

/**
 * Return the date range for shipping deliveries dates
 * @param {Object} shippingMethod shipping methods
 * @return {Object} - Returns delivery preferences object
 */
function getShippingDeliveryDatesFormated(shippingMethod) {
    var availableDates = getShippingDeliveryDates(shippingMethod);
    var formatedDates = [];
    availableDates.forEach(function (date) {
        formatedDates.push(StringUtils.formatCalendar(date, 'MM/dd'));
    });
    return formatedDates;
}

module.exports = {
    getAvailableDeliveryDates: getAvailableDeliveryDates,
    getShippingDeliveryDates: getShippingDeliveryDates,
    getShippingDeliveryDatesFormated: getShippingDeliveryDatesFormated,
    getAvailableDeliveryDatesFormated: getAvailableDeliveryDatesFormated
};
