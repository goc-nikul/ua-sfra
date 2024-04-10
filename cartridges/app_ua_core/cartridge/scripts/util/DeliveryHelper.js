/* eslint-disable spellcheck/spell-checker */
'use script';

/* API Includes */
var Calendar = require('dw/util/Calendar');
var DateUtils = require('dw/util/DateUtils');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var SystemCompat = require('dw/system/System');

/* Script Includes */
var JSONUtils = require('int_customfeeds/cartridge/scripts/util/JSONUtils');
const isRequestTransactional = require('*/cartridge/scripts/helpers/requestHelpers').isRequestTransactional(request);
// Date: Number = 5, Represents Date adding 1 to date
// Day_Of_Month = 5, Represents a day of the month
const CALENDAR_DAY_OF_MONTH = 5;
// Set HOUR_OF_DAY: Number = 11, Represents an hour of the day
const CALENDAR_HOUR_OF_DAY = 11;
const CALENDAR_DAY_OF_WEEK = 7;
const CALENDAR_MINUTE = 12;
const CALENDAR_SECOND = 13;
// DAY OF WEEK for Sunday: 1
const CALENDAR_SUNDAY = 1;
const CALENDAR_SATURDAY = 7;
const COMPATIBILITYMODE_VERSION = SystemCompat.compatibilityMode;
const SITE_TIMEZONE_OFFSET = Site.getCurrent().timezoneOffset;

/* All Internal Only Scripts in Upper Section */
/**
 * Return Minimum or Maximum number of Delivery Days from Shipping Method
 * @param {Object} shippingMethod shipping Methods under Merchant Tools > Ordering > Shipment Methods
 * @param {string} minOrMax Pass 'min' or 'max'
 * @returns {int} - Returns a Min or Max Number of delivery days from the ShippingMethods object
 */
function getDeliveryDays(shippingMethod, minOrMax) {
    let deliveryDays = 0;
    if (minOrMax === 'min') {
        deliveryDays = (!empty(shippingMethod) && 'minDeliveryDays' in shippingMethod.custom) ? shippingMethod.custom.minDeliveryDays : 0;
    } else {
        deliveryDays = (!empty(shippingMethod) && 'maxDeliveryDays' in shippingMethod.custom) ? shippingMethod.custom.maxDeliveryDays : 0;
    }
    if (deliveryDays === 0) {
        if (minOrMax === 'min') {
            Logger.warn("DeliveryHelper.js: ShippingMethod custom preference 'minDeliveryDays' is empty or not defined. Using 0 for ShippingMethod.ID: {0}", shippingMethod.ID);
        } else {
            Logger.warn("DeliveryHelper.js: ShippingMethod custom preference 'maxDeliveryDays' is empty or not defined. Using 0 for ShippingMethod.ID: {0}", shippingMethod.ID);
        }
    }
    return deliveryDays;
}

/**
 * Return the shipping cutoff time from the site preferece stored in Storefront Configs
 * @return {Object} - Returns delivery preferences object
 */
function getShippingCutOffTime() {
    let shippingCutOffTime = 13.0;
    //  If the preference does not exist the method returns null. Test for that
    if (Site.getCurrent().getCustomPreferenceValue('shippingCutOffTime')) {
        shippingCutOffTime = Site.getCurrent().getCustomPreferenceValue('shippingCutOffTime');
    } else {
        // Log message stating value not set...
        Logger.warn('DeliveryHelper.js: getShippingCutOffTime is empty or not defined. Using 13.0');
    }
    return shippingCutOffTime;
}

/**
 * Return JSON parsed scheduledDeliveryDateMapping text from storefront configuration
 *  This currently contains the following information:
 *    startDateOffset: 30
 *    endDateOffset: 60
 *    holidays:  array of strings looking like day-month 01-01, 21-04 etc...
 * @return {Object} - Returns delivery preferences object
 */
function getScheduledDeliveryPreference() {
    let scheduledDeliveryPreferenceJson = {};
    if (Site.getCurrent().getCustomPreferenceValue('scheduledDeliveryDateMapping')) {
        scheduledDeliveryPreferenceJson = Site.getCurrent().getCustomPreferenceValue('scheduledDeliveryDateMapping');
    } else {
        // Scheduled Delivery Date Mapping is empty or doesn't exist!
        Logger.warn('DeliveryHelper.js: getScheduledDeliveryPreference is empty or not defined.');
    }
    return JSONUtils.parse(scheduledDeliveryPreferenceJson, {});
}

/**
 * Returns a value or array from the storefront configs custom preference scheduledDeliveryDateMapping JSON object
 * based on key that you are looking for within that Object
 * If key doesn't exist it will log error and return null
 * If valueName passed is valid it will return the value otherwise it will provide a default value
 * startdateoffset (default value): 30
 * enddateoffset (default value): 60
 * blackoutdates (default value): []  empty array
 * @param {string} valueName - key wanting information for valid keys are (startdateoffset, enddateoffset, blackoutdates)
 * @return {Object} - Returns number value for start and end date offset and array of blackout dates
 */
function getScheduledDeliveryPreferenceValue(valueName) {
    let deliveryDateMapping = getScheduledDeliveryPreference();

    if (valueName.toLowerCase() === 'startdateoffset') {
        if (empty(deliveryDateMapping) || empty(deliveryDateMapping.startDateOffset)) {
            Logger.warn("DeliveryHelper.js: site custom preference (scheduledDeliveryDateMapping) key: 'startDateOffset' is empty or not defined. Using config.properties value.");

            // Otherwise looks at properties file first if doesn't exists defaults to 30
            // The , 10 assumes that this is a decimal value!
            return parseInt(Resource.msg('scheduleddelivery.startdateoffset', 'config', 30), 10);
        }
        return deliveryDateMapping.startDateOffset;
    } else if (valueName.toLowerCase() === 'enddateoffset') {
        if (empty(deliveryDateMapping) || empty(deliveryDateMapping.endDateOffset)) {
            Logger.warn("DeliveryHelper.js: site custom preference (scheduledDeliveryDateMapping) key: 'endDateOffset' is empty or not defined. Using config.properties value.");

            // Otherwise looks at properties file first if doesn't exists defaults to 30
            // The , 10 assumes that this is a decimal value!
            return parseInt(Resource.msg('scheduleddelivery.enddateoffset', 'config', 60), 10);
        }

        return deliveryDateMapping.endDateOffset;
    } else if (valueName.toLowerCase() === 'blackoutdates') {
        if (empty(deliveryDateMapping) || empty(deliveryDateMapping.holidays)) {
            Logger.warn("DeliveryHelper.js: site custom preference (scheduledDeliveryDateMapping) key: 'holidays' is empty or not defined. Using empty Array");

            var configValue = [];

            return configValue;
        }
        return deliveryDateMapping.holidays;
    }
    // Log and return an error.  Not called with correct value name
    Logger.warn("DeliveryHelper.js: site custom preference (scheduledDeliveryDateMapping) key:'{0}' is empty or not defined. Please pass a valid key name.", valueName);
    return null;
}

/**
 * Return the available date range value
 *  This takes endDateOffset - startDateOffset
 *    (** Note: typically these values are coming from storefront configs scheduledDeliveryDateMapping property)
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

    return availableDateRange;
}

/**
 * Return an array of date for possible delivery
 * Get the ShippingMethodDeliveryDate Custom Object and looks for key entries within that Object
 * If one doesn't exist but we want to modifyGetResponse and the Request is Transactional then create the new
 * key.
 * @param {Object} shippingMethodID - shippingMethod ID
 * @param {boolean} modifyGetResponse - from modifyGetResponse method
 * @return {Object} - Returns delivery preferences object
 */
function getShippingMethodDeliveryDateCO(shippingMethodID, modifyGetResponse) {
    var com = require('dw/object/CustomObjectMgr');
    const customObjectName = 'ShippingMethodDeliveryDate';
    var siteId = Site.getCurrent().ID;
    var keyId = shippingMethodID + '_' + siteId;
    var objectDefinition = com.getCustomObject(customObjectName, keyId);
    try {
        if ((empty(objectDefinition) && !modifyGetResponse && isRequestTransactional)) {
            require('dw/system/Transaction').wrap(function () {
                objectDefinition = com.createCustomObject(customObjectName, keyId);
            });
        }
    } catch (e) {
        Logger.error('DeliveryHelper.js error in createCustomObject {0}: {1}', keyId, e.message);
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
    var shippingDeliveryDateObj = getShippingMethodDeliveryDateCO(shippingMethod.ID, modifyGetResponse);
    // This is typically in military time (24 hour basis)
    // Default is typical 13.0
    var customObjExpiryHour = getShippingCutOffTime();

    if (shippingDeliveryDateObj === null || availableDates.length === 0) {
        return;
    }

    // Use Site's Calendar which takes into account Time Zone
    // getCalendar: Returns a new Calendar object in the time zone of the current site.
    let currentSiteTime;
    let cutoffSiteTime;
    if (COMPATIBILITYMODE_VERSION >= 2310) {
        currentSiteTime = Site.getCalendar();
        cutoffSiteTime = Site.getCalendar();
    } else {
        // Time is always in GMT
        // DateUtils.nowForSite(): Returns the current timestamp in the time zone of the current site.
        // However, Calendar displays in GMT Only
        currentSiteTime = new Calendar(DateUtils.nowForSite());
        cutoffSiteTime = new Calendar(DateUtils.nowForSite());
    }
    // Set it to 1 second before the cutoff time!
    cutoffSiteTime.set(CALENDAR_HOUR_OF_DAY, (customObjExpiryHour - 1));
    cutoffSiteTime.set(CALENDAR_MINUTE, 59);
    cutoffSiteTime.set(CALENDAR_SECOND, 59);

    // For Ex. If in case cutoff time is 06/16 9pm EST and this method executes at 06/16 10pm EST
    // then we should set the cutoff time by increasing the day by 1 so that it should not set
    // again 06/16 9pm, it should be 06/17 9pm. else save the cutoff time without incrementing the Date.
    if (cutoffSiteTime.before(currentSiteTime)) {
        cutoffSiteTime.add(CALENDAR_DAY_OF_MONTH, 1);
        // May need to revisit availableDates because they should have been checked for weekends!
    }

    // Since we want to store it into the Database and make sure it is utilizing the correct
    // Timezone during the store we need to adjust the timezone on the cutoffSiteTime
    if (COMPATIBILITYMODE_VERSION < 2310) {
        cutoffSiteTime.set(15, SITE_TIMEZONE_OFFSET);
    }

    if (!modifyGetResponse && isRequestTransactional) {
        try {
            require('dw/system/Transaction').wrap(function () {
                shippingDeliveryDateObj.expiryTime = cutoffSiteTime.getTime();
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
    var cachedAvailableDates = {};
    var customObj = getShippingMethodDeliveryDateCO(shippingMethod.ID, modifyGetResponse);

    if (customObj === null) {
        return cachedAvailableDates;
    }

    let currentSiteTime;
    let expirySiteTime;
    if (COMPATIBILITYMODE_VERSION >= 2310) {
        // Use Site's Calendar which takes into account Time Zone
        // getCalendar: Returns a new Calendar object in the time zone of the current site.
        currentSiteTime = Site.getCalendar();
        expirySiteTime = Site.getCalendar();
    } else {
        // DateUtils.nowForSite(): Returns the current timestamp in the time zone of the current site.
        // However, Calendar displays in GMT Only
        currentSiteTime = new Calendar(DateUtils.nowForSite());
        expirySiteTime = new Calendar(DateUtils.nowForSite());
    }

    if (COMPATIBILITYMODE_VERSION >= 2310) {
        expirySiteTime = customObj.expiryTime ? Site.getCalendar().getTime(customObj.expiryTime) : null;
    } else {
        expirySiteTime = customObj.expiryTime ? new Calendar(customObj.expiryTime) : null;
        if (expirySiteTime !== null) {
            // In Database the expiryTime was increased by offset.  We need to remove that out
            // When pulling it back out so it is inline with currentSiteTime to compare correctly
            // Whether we want to use cached version or not.
            // Get it back to standard GMT Time Zone....
            expirySiteTime.set(15, -SITE_TIMEZONE_OFFSET);
        }
    }

    if (expirySiteTime &&
        currentSiteTime.before(expirySiteTime) &&
        customObj.minDeliveryDate &&
        customObj.maxDeliveryDate) {
        if (COMPATIBILITYMODE_VERSION >= 2310) {
            cachedAvailableDates.minDeliveryDate = Site.getCalendar().setTime(customObj.minDeliveryDate);
            cachedAvailableDates.maxDeliveryDate = Site.getCalendar().setTime(customObj.maxDeliveryDate);
        } else {
            cachedAvailableDates.minDeliveryDate = new Calendar(customObj.minDeliveryDate);
            cachedAvailableDates.maxDeliveryDate = new Calendar(customObj.maxDeliveryDate);
        }
    }

    return cachedAvailableDates;
}

/**
 * This method determines how many days should be added to passed in date based on
 * 1. Did the date make the CutoffTime
 * 2. Did this date land on a blackout date
 * 3. Is this date on a weekend
 * @param {Object} calendarDate - This is dw/system/Site getCalendar() object
 * @param {Object} blackoutDates - Array of Strings of blackout dates dd-MM
 * @param {boolean} checkCutOffTime - True if you want this set of code to run
 * @param {boolean} checkBlackoutDates - True if you want this set of code to run
 * @param {boolean} checkWeekends - True if you want this set of code to run
 * @param {boolean} loopCall - True if this methods is being called within a loop, numberOfDays to add will change
 *                             for blackout and weekend check
 * @returns {number} Returns the number of days to be added to passed in date
 */
function determineNumDaysToAdd(calendarDate, blackoutDates, checkCutOffTime, checkBlackoutDates, checkWeekends, loopCall) {
    let numDaysToAdd = 0;
    let workingDate;
    if (COMPATIBILITYMODE_VERSION >= 2310) {
        workingDate = Site.getCalendar().getTime(calendarDate);
    } else {
        workingDate = new Calendar(calendarDate.getTime());
    }
    // let workingDate = new Calendar(calendarDate);
    // 1. Is this date after the cutoff time?
    //    Then Add 1 Day
    if (checkCutOffTime && workingDate.get(CALENDAR_HOUR_OF_DAY) >= getShippingCutOffTime()) {
        // Time is after CutOffTime Add 1 Day to dates
        workingDate.add(CALENDAR_DAY_OF_MONTH, 1);
        numDaysToAdd += 1;
    }

    if (checkBlackoutDates) {
        // 2. Is this Date one of the Blackout Dates
        //    Add a day
        // This was changed.  You only ever want to add only 1 day for blackout day
        // Even if you have multiple blackout days back to back.
        let blackDateToTest = StringUtils.formatCalendar(workingDate, 'dd-MM');
        if (blackoutDates.indexOf(blackDateToTest) > -1) {
            // Found it in the List
            workingDate.add(CALENDAR_DAY_OF_MONTH, 1);
            numDaysToAdd += 1;
        }
    }

    if (checkWeekends) {
        // 3. Is this date on a Saturday or Sunday
        //    Then add 1 if Sunday add 2 if Saturday
        if (workingDate.get(CALENDAR_DAY_OF_WEEK) === CALENDAR_SUNDAY || workingDate.get(CALENDAR_DAY_OF_WEEK) === CALENDAR_SATURDAY) {
            if (workingDate.get(CALENDAR_DAY_OF_WEEK) === CALENDAR_SATURDAY) {
                if (loopCall) {
                    numDaysToAdd += 1;
                } else {
                    numDaysToAdd += 2;
                }
            } else {
                numDaysToAdd += 1;
            }
        }
    }

    return numDaysToAdd;
}

/**
 * This method determines if delivery date falls between a blackout time.
 * It will iterate over all days between date passed in and current or min date
 * It will only add a max of 1 day to any of the dates.
 * @param {Object} deliveryDate - This is min or max delivery date we want to test against
 * @param {Object} blackoutDates - These are the blackout Date array we are testing against
 * @param {Object} startingDate - This is the date we want to compare against if null use current
 * @return {Object} - returns the number of days to add back to calling method
 */
function iterateBlackoutRangeTest(deliveryDate, blackoutDates, startingDate) {
    let numDaysToAdd = 0;
    let workingDate;
    let currentCalendarSite;
    let currentCalendarDate;
    if (COMPATIBILITYMODE_VERSION >= 2310) {
        workingDate = Site.getCalendar().getTime(deliveryDate);
        currentCalendarSite = Site.getCalendar().getTime(new Calendar());
        currentCalendarDate = Site.getCalendar();
    } else {
        workingDate = new Calendar(deliveryDate.getTime());
        if (startingDate === null || startingDate === undefined) {
            currentCalendarSite = new Calendar(DateUtils.nowForSite());
            currentCalendarDate = new Calendar(DateUtils.nowForSite());
        } else {
            currentCalendarSite = new Calendar(startingDate.getTime());
            currentCalendarDate = new Calendar(startingDate.getTime());
            // Subtract 1 from both days because index below is starting at 1 not zero!
            // Need to account for starting date
            currentCalendarSite.add(CALENDAR_DAY_OF_MONTH, -1);
            currentCalendarDate.add(CALENDAR_DAY_OF_MONTH, -1);
        }
    }
    let differenceInTime = workingDate.getTime() - currentCalendarSite.getTime();
    let differenceInDays = differenceInTime / (1000 * 3600 * 24);

    for (var index = 1; index <= differenceInDays; index++) {
        currentCalendarDate.add(CALENDAR_DAY_OF_MONTH, 1);
        // Is any date in between a weekend
        numDaysToAdd = determineNumDaysToAdd(currentCalendarDate, blackoutDates, false, true, false, false);
        if (numDaysToAdd > 0) {
            break;
        }
    }
    return numDaysToAdd;
}

/* All Scripts that are able to be called from External Routines */

/**
 * Return an array of date for possible delivery
 * @return {Object} - Returns delivery preferences object
 */
function getAvailableDeliveryDates() {
    let calendar;
    if (COMPATIBILITYMODE_VERSION >= 2310) {
        calendar = Site.getCalender();
    } else {
        // DateUtils.nowForSite(): Returns the current timestamp in the time zone of the current site.
        // However, Calendar displays in GMT Only
        calendar = new Calendar(DateUtils.nowForSite());
    }
    let startDateOffset = getScheduledDeliveryPreferenceValue('startDateOffset');
    let endDateOffset = getScheduledDeliveryPreferenceValue('endDateOffset');
    let blackoutDates = getScheduledDeliveryPreferenceValue('blackoutdates');
    let availableDateRange = getAvailableDateRange(startDateOffset, endDateOffset);
    let availableDates = [];

    // array of dates in string format to send to isloop
    // add the start date offset to the calendar object
    calendar.add(CALENDAR_DAY_OF_MONTH, startDateOffset);
        /*
         * loop through the difference of start and end days
         * need to offset the date by one to deal with the increment
         * Removed the <= sign because availableDateRange method was subtracting 1 from itself previously so removed that from method
         */
    for (let x = 0; x < availableDateRange; x++) {
            // set default show date value
        let showDate = true;

            // increment the date by one
        calendar.add(CALENDAR_DAY_OF_MONTH, 1);
        let blackoutDateToTest = StringUtils.formatCalendar(calendar, 'dd-MM');
        // Is this a weekend.
        if (calendar.get(CALENDAR_DAY_OF_WEEK) === CALENDAR_SUNDAY || calendar.get(CALENDAR_DAY_OF_WEEK) === CALENDAR_SATURDAY) {
            // This is a weekend.
            showDate = false;
        } else if (blackoutDates.indexOf(blackoutDateToTest) > -1) {
            // This is a blackout date
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

    // Do we have a cached Object and is it before the shipping cutoff time?
    if ((Object.keys(cachedDeliveryDate).length > 0) &&
        cachedDeliveryDate.minDeliveryDate &&
        cachedDeliveryDate.maxDeliveryDate) {
        availableDates.push(cachedDeliveryDate.minDeliveryDate);
        availableDates.push(cachedDeliveryDate.maxDeliveryDate);
        return availableDates;
    }
    let shippingCalendarSite;
    let minDeliveryDate;
    let maxDeliveryDate;
    if (COMPATIBILITYMODE_VERSION >= 2310) {
        shippingCalendarSite = Site.getCalendar();
        minDeliveryDate = Site.getCalendar();
        maxDeliveryDate = Site.getCalendar();
    } else {
        // DateUtils.nowForSite(): Returns the current timestamp in the time zone of the current site.
        // However, Calendar displays in GMT Only
        shippingCalendarSite = new Calendar(DateUtils.nowForSite());
        minDeliveryDate = new Calendar(DateUtils.nowForSite());
        maxDeliveryDate = new Calendar(DateUtils.nowForSite());
    }
    // Get Values from Site > Custom Object > scheduleDeliveryDateMapping
    let blackoutDates = getScheduledDeliveryPreferenceValue('blackoutdates');
    // Get Values from actual Shipping Method
    let maxDeliveryDays = getDeliveryDays(shippingMethod, 'max');
    let minDeliveryDays = getDeliveryDays(shippingMethod, 'min');

    // Take Current Date and determine number of days to add to it
    // Determine if Current Date past cutoff time, in blackout date, and/or on a weekend.
    let numOfDaysAdd = determineNumDaysToAdd(shippingCalendarSite, blackoutDates, true, true, true, false);
    if (numOfDaysAdd > 0) {
        minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
    }
    // Now Add on the Min and Max Delivery Days from Shipping Method.
    // Example US, Standard Shipping Method Min Delivery Days 4 Max Delivery Days 6
    minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, minDeliveryDays);
    maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, maxDeliveryDays);
    // Check if Min Date falls on Weekend
    let fallsOnWeekend = false;
    numOfDaysAdd = determineNumDaysToAdd(minDeliveryDate, blackoutDates, false, false, true, false);
    if (numOfDaysAdd > 0) {
        minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        fallsOnWeekend = true;
    }
    // If Min Date fell on weekend above, don't rerun checks here
    // If it didn't look at all days in between
    if (!fallsOnWeekend) {
        // Disagree with additional loop here because seems like we are padding the delivery dates but
        // This is based on following tickets:
        // https://underarmour.atlassian.net/browse/PHX-4137
        // https://underarmour.atlassian.net/browse/EPMD-13190
        // Now we have our Min and Max Date Range for Delivery
        // Iterate over every date between that range and if it is a Saturday, Sunday
        let differenceInTime = maxDeliveryDate.getTime() - minDeliveryDate.getTime();
        let differenceInDays = differenceInTime / (1000 * 3600 * 24);
        let startingFinalDate;
        if (COMPATIBILITYMODE_VERSION >= 2310) {
            startingFinalDate = Site.getCalendar();
        } else {
            startingFinalDate = new Calendar(minDeliveryDate.getTime());
        }
        numOfDaysAdd = 0;
        for (var index = 0; index <= differenceInDays; index++) {
            startingFinalDate.add(CALENDAR_DAY_OF_MONTH, index);
            // Is any date in between a weekend
            numOfDaysAdd += determineNumDaysToAdd(startingFinalDate, blackoutDates, false, false, true, true);
        }
        if (numOfDaysAdd > 0) {
            minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
            maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        }
    }
    // One more time through... This seems like overkill for estimated Delivery Date.
    // STAGE 2: CHECK for MINIMUM DELIVERY DATE (Should not be on a weekend)
    numOfDaysAdd = determineNumDaysToAdd(minDeliveryDate, blackoutDates, false, false, true, false);
    if (numOfDaysAdd > 0) {
        minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
    }
    // STAGE 2: CHECK for MAXIMUM DELIVERY DATE (Should not be on a weekend)
    numOfDaysAdd = determineNumDaysToAdd(maxDeliveryDate, blackoutDates, false, false, true, false);
    if (numOfDaysAdd > 0) {
        maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
    }
    // BLACKOUT LOOP ADDITION FOR BOTH MIN AND MAX DATES
    // MINIMUM DELIVERY DATE BLACKOUT
    // If Logic hits for Min it will definitely hit for Max so don't rerun loop
    numOfDaysAdd = iterateBlackoutRangeTest(minDeliveryDate, blackoutDates, null);
    if (numOfDaysAdd > 0) {
        minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
    } else {
        // MAXIMUM DELIVERY DATE BLACKOUT
        // Logic didn't hit for Min just rerun between min and max dates now!
        numOfDaysAdd = iterateBlackoutRangeTest(maxDeliveryDate, blackoutDates, minDeliveryDate);
        if (numOfDaysAdd > 0) {
            maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
        }
    }
    // FINAL: CHECK for MINIMUM DELIVERY DATE (Should not be on a weekend)
    numOfDaysAdd = determineNumDaysToAdd(minDeliveryDate, blackoutDates, false, false, true, false);
    if (numOfDaysAdd > 0) {
        minDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
    }
    // FINAL: CHECK for MAXIMUM DELIVERY DATE (Should not be on a weekend)
    numOfDaysAdd = determineNumDaysToAdd(maxDeliveryDate, blackoutDates, false, false, true, false);
    if (numOfDaysAdd > 0) {
        maxDeliveryDate.add(CALENDAR_DAY_OF_MONTH, numOfDaysAdd);
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
