'use strict';

var base = module.superModule;

/**
 * Function that prepares JSON object for AuthForm
 * @param {dw.order.ReturnCase} returnCase - return case object
 * @return {Object} Return params
 */
function createAuthFormObj(returnCase) {
    var params = base.createAuthFormObj(returnCase);

    // Check if customer have selected Courier Pickup option
    if (Object.prototype.hasOwnProperty.call(returnCase.custom, 'pickupOption') && !empty(returnCase.custom.pickupOption) && returnCase.custom.pickupOption === 'Courier Pickup') {
        params.fullName = returnCase ? (returnCase && returnCase.custom.pickupFirstName ? returnCase.custom.pickupFirstName : '') + (returnCase && returnCase.custom.pickupLastName ? ' ' + returnCase.custom.pickupLastName : '') : params.fullName;
        params.firstName = returnCase && returnCase.custom.pickupFirstName ? returnCase.custom.pickupFirstName : params.firstName;
        params.lastName = returnCase && returnCase.custom.pickupLastName ? returnCase.custom.pickupLastName : params.lastName;
        params.address1 = returnCase && returnCase.custom.pickupAddress1 ? returnCase.custom.pickupAddress1 : params.address1;
        params.city = returnCase && returnCase.custom.pickupCity ? returnCase.custom.pickupCity : params.city;
        params.postalCode = returnCase && returnCase.custom.pickupPostalCode ? returnCase.custom.pickupPostalCode : params.postalCode;
        params.phone = returnCase && returnCase.custom.pickupMobile ? returnCase.custom.pickupMobile : params.phone;
        params.email = returnCase && returnCase.custom.pickupEmail ? returnCase.custom.pickupEmail : params.email;
    }
    return params;
}

/**
 * Update the time field on the pickUp form
 * @param {Object} timeRangeOptions is field of the pickUp form
 * @param {Object} pickUpTimeSlot is field of the pickUp form
 * @returns {Object} updated time field pickUp
 */
function getTimeRange(timeRangeOptions, pickUpTimeSlot) {   // eslint-disable-line no-unused-vars
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var pickupTimeSlots = !empty(pickUpTimeSlot) ? pickUpTimeSlot : PreferencesUtil.getValue('pickupTimeSlots');
    var timeOptions = timeRangeOptions;
    pickupTimeSlots.forEach(function (pickupTimeSlot) {
        var optionsObj = {};
        optionsObj.checked = false;
        optionsObj.htmlValue = pickupTimeSlot;
        optionsObj.id = pickupTimeSlot;
        optionsObj.label = pickupTimeSlot;
        optionsObj.selected = false;
        optionsObj.value = pickupTimeSlot;
        timeOptions.push(optionsObj);
    });
    return timeOptions;
}

/**
 * Update the date field on the pickUp form
 * @param {Object} dateRaneOptions is field of the pickUp form
 * @param {Object} pickupDateRange is field of the pickUp form
 * @param {Object} publicHolidays is field of the pickUp form
 * @returns {Object} updated date field pickUp
 */
function getDateRange(dateRaneOptions, pickupDateRange, publicHolidays) {   // eslint-disable-line no-unused-vars
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var dateOptions = dateRaneOptions;
    var dateConfig = !empty(pickupDateRange) ? JSON.parse(pickupDateRange) : JSON.parse(PreferencesUtil.getValue('pickupDateRange'));
    if (!empty(dateConfig)) {
        var start = dateConfig.daysstartFrom || '2';
        var endTill = dateConfig.daysEndTill || '7';
        var weekendsOff = dateConfig.weekendsoff;
        var cal = new Calendar();

        for (var i = 1; i <= endTill; i++) {
            cal.add(Calendar.DAY_OF_MONTH, 1);
            var dayOfWeek = (cal.get(cal.DAY_OF_WEEK) - 1).toString();
            var weekDay = daysOfWeek[dayOfWeek];
            if (i >= start && (!weekendsOff || (dayOfWeek !== '6' && dayOfWeek !== '0'))) {
                var date = StringUtils.formatCalendar(cal, 'dd MMM yyy');
                var publicHolidayList = !empty(publicHolidays) ? publicHolidays : PreferencesUtil.getValue('publicHolidayList');
                var isPublicHoliday = publicHolidayList.some(function (holiday) {   // eslint-disable-line
                    var holidayDayDate = StringUtils.formatCalendar(new Calendar(new Date(holiday)), 'dd MM yyy');
                    return StringUtils.formatCalendar(cal, 'dd MM yyy') === holidayDayDate;
                });
                if (!isPublicHoliday) {
                    var optionsObj = {};
                    optionsObj.checked = false;
                    optionsObj.htmlValue = StringUtils.formatCalendar(cal, 'yyyy-MM-dd');
                    optionsObj.id = date;
                    optionsObj.label = weekDay + ', ' + date;
                    optionsObj.selected = false;
                    optionsObj.value = StringUtils.formatCalendar(cal, 'yyyy-MM-dd');
                    dateOptions.push(optionsObj);
                }
            }
        }
    }
    return dateOptions;
}

/**
 * Function to get configurations for Return methods
 * @param {Object} customObj - customobject for returnmethod configs
 * @returns {Object} return object for return methods
 */
function getReturnMethodsConfigurations(customObj) {
    var returnMethodsConfigurationObj = {};
    var returnMethodsList = [];
    Object.keys(customObj).forEach(function (attr) {
        var customObjectdef = customObj[attr];

        if (attr === 'countryID') {
            returnMethodsConfigurationObj.countryID = customObjectdef;
        }
        if (attr.indexOf('returnMethod-') !== -1 && attr.split('-')[1] && !empty(customObjectdef)) {
            var count = attr.split('-')[1];
            var returnMethodsObj = {};
            var returnFormObj = {};
            returnFormObj.returnTime = [];
            returnFormObj.returnDate = [];
            returnMethodsObj = {
                value: customObjectdef.value,
                displayValue: customObjectdef.displayValue
            };
            if (('returnMethod' + count + 'Courierservice') in customObj && !empty(customObj['returnMethod' + count + 'Courierservice'])) {
                returnMethodsObj.Courierservice = customObj['returnMethod' + count + 'Courierservice'];
            }
            if (('returnMethod' + count + 'TimeSlots') in customObj && customObj['returnMethod' + count + 'TimeSlots'].length > 0) {
                returnMethodsObj.TimeSlots = customObj['returnMethod' + count + 'TimeSlots'];
                getTimeRange(returnFormObj.returnTime, customObj['returnMethod' + count + 'TimeSlots']);
            }
            if (('returnMethod' + count + 'PublicHolidayList') in customObj && customObj['returnMethod' + count + 'PublicHolidayList'].length > 0) {
                returnMethodsObj.PublicHolidayList = customObj['returnMethod' + count + 'PublicHolidayList'];
            }
            if (('returnMethod' + count + 'DateRange') in customObj && !empty(customObj['returnMethod' + count + 'DateRange'])) {
                returnMethodsObj.DateRange = customObj['returnMethod' + count + 'DateRange'];
                getDateRange(returnFormObj.returnDate, customObj['returnMethod' + count + 'DateRange'], customObj['returnMethod' + count + 'PublicHolidayList']);
            }

            returnMethodsObj.orderReturnForm = returnFormObj;
            returnFormObj = {};
            returnMethodsList.push(returnMethodsObj);
        }
    });
    returnMethodsConfigurationObj.returnMethods = returnMethodsList;
    return returnMethodsConfigurationObj;
}

/**
 * Fetches object definition from Custom Object, creating it if not exists
 * @param {string} customObjectName - name of custom object
 * @param {string} objectID - key id for custom object
 * @param {boolean} createIfNotExists - boolean value to create custom object or not
 * @returns {Object} return object on custom attributes
 */
function getCustomObject(customObjectName, objectID) {   // eslint-disable-line consistent-return
    var com = require('dw/object/CustomObjectMgr');
    var objectDefinition = com.getCustomObject(customObjectName, objectID);

    if (!empty(objectDefinition)) {
        return objectDefinition.getCustom();
    }
}

/**
 * Send Created Return Return Confirmation Email
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.ReturnCase} returnCase - Return Case
 */
function sendReturnCreatedConfirmationEmail(order, returnCase) {
    var HookMgr = require('dw/system/HookMgr');
    var URLUtils = require('dw/web/URLUtils');

    const preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var emailHelper = require('app_ua_emea/cartridge/scripts/helpers/SFMCEmailHelper');
    let helpers = require('int_marketing_cloud/cartridge/scripts/util/helpers');
    var returnMethodCustomObjectdefinition = getCustomObject('ReturnMethodsConfigurations', order.custom.customerCountry);
    let hookID = 'app.communication.oms.returnOrderCreated';

    // Check if ReturnMethod configuration custom object is available.
    if (!empty(returnMethodCustomObjectdefinition)) {
        hookID = 'app.communication.oms.returnOrderCreated.' + returnCase.custom.pickupOption.toLowerCase().replace(/\s/g, '');
    }

    let customObjectdefinition = helpers.getCustomObject('MarketingCloudTriggers', hookID, false);
    let countryEnabled = !empty(customObjectdefinition) && customObjectdefinition.enabled && !empty(customObjectdefinition.countriesEnabled)
        ? customObjectdefinition.countriesEnabled.indexOf(order.custom.customerCountry) !== -1 : false;

    if (preferencesUtil.isCountryEnabled('SFMCEnabled') && countryEnabled && HookMgr.hasHook(hookID)) {
        var returnInfoLink = null;
        if (request.locale !== order.customerLocaleID) {// eslint-disable-line
            returnInfoLink = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds').prepareURLForLocale(URLUtils.https('Order-PrintEmailLabel', 'orderNumber', order.orderNo, 'returnNumber', returnCase.returnCaseNumber, 'orderEmail', order.customerEmail).toString(), order.customerLocaleID);
        }
        let params = {
            Order: order,
            returnInfoLink: returnInfoLink || URLUtils.abs('Order-PrintEmailLabel', 'orderNumber', order.orderNo, 'returnNumber', returnCase.returnCaseNumber, 'orderEmail', order.customerEmail).toString(),
            returnCase: returnCase,
            trackingNumber: returnCase.custom && 'trackingNumber' in returnCase.custom ? returnCase.custom.trackingNumber : ''
        };
        emailHelper.sendReturnConfirmationEmail(order, params);
    }
}

module.exports = {
    setReturnDetails: base.setReturnDetails,
    getReturnDetails: base.getReturnDetails,
    createAuthFormObj: createAuthFormObj,
    sendReturnCreatedConfirmationEmail: sendReturnCreatedConfirmationEmail,
    orderReturnReasonModel: base.orderReturnReasonModel,
    getReturnMethodsConfigurations: getReturnMethodsConfigurations,
    getCustomObject: getCustomObject
};
