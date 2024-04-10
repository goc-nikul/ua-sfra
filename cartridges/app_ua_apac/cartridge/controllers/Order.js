var page = module.superModule; // inherits functionality
var server = require('server');

server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

/**
 * Order-Confirm : Append this method to add zip reciept number after order is placed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {category} - sensitive
 * @param {serverfunction} - append
 */
server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

    var token = req.form.orderToken ? req.form.orderToken : null;

    if (!order
        || !token
        || token !== order.orderToken
        || order.customer.ID !== req.currentCustomer.raw.ID
    ) {
        res.setStatusCode(404);
        res.render('error/notFound');

        return next();
    }

    session.custom.currentOrder = null;
    var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();

    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;

    if (isKRCustomCheckoutEnabled) {
        session.custom.sameasship = false;
    }

    var viewData = res.getViewData();
    if (viewData.order) {
        order = OrderMgr.getOrder(viewData.order.orderNumber);
    }
    if (zippayEnabled) {
        if (viewData.order) {
            viewData.zipReceipt = order.custom.ZipReceiptNumber;
        }
    }

    if (!viewData.error) {
        var profileForm = server.forms.getForm('profile');
        var showBirthYearField = require('*/cartridge/config/preferences').ShowBirthYearField;
        var minimumAgeRestriction = require('*/cartridge/config/preferences').MinimumAgeRestriction;
        var isShowSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
        var isShowSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;

        if (showBirthYearField) {
            if (profileForm && profileForm.customer && profileForm.customer.birthYear && profileForm.customer.birthYear.options) {
                profileForm.customer.birthYear.options = accountHelpers.getBirthYearRange(profileForm.customer.birthYear.options);
            }
        }
        if (isShowSplitEmailField) {
            if (order && order.custom && profileForm && profileForm.customer) {
                if (order.custom.emailaddressName && profileForm.customer.emailaddressName) {
                    profileForm.customer.emailaddressName.htmlValue = order.custom.emailaddressName;
                }
                if (order.custom.emailaddressDomain && profileForm.customer.emailaddressDomain) {
                    profileForm.customer.emailaddressDomain.htmlValue = order.custom.emailaddressDomain;
                }
                if (order.custom.emailaddressDomainSelect && profileForm.customer.emailaddressDomain) {
                    if (profileForm.customer.emailaddressDomainSelect.options.length) {
                        for (var j = 0; j < profileForm.customer.emailaddressDomainSelect.options.length; j++) {
                            if (profileForm.customer.emailaddressDomainSelect.options[j].id === order.custom.emailaddressDomainSelect) {
                                profileForm.customer.emailaddressDomainSelect.options[j].selected = true;
                            }
                        }
                    }
                }
            }
        }

        if (isShowSplitPhoneMobileField) {
            if (order && order.billingAddress && order.billingAddress.custom && profileForm && profileForm.customer) {
                if (order.billingAddress.custom.phone1 && profileForm.customer.phoneMobile1) {
                    if (profileForm.customer.phoneMobile1.options.length) {
                        for (var i = 0; i < profileForm.customer.phoneMobile1.options.length; i++) {
                            if (profileForm.customer.phoneMobile1.options[i].id === order.billingAddress.custom.phone1) {
                                profileForm.customer.phoneMobile1.options[i].selected = true;
                            }
                        }
                    }
                }
                if (order.billingAddress.custom.phone2 && profileForm.customer.phoneMobile2) {
                    profileForm.customer.phoneMobile2.htmlValue = order.billingAddress.custom.phone2;
                }
                if (order.billingAddress.custom.phone2 && profileForm.customer.phoneMobile3) {
                    profileForm.customer.phoneMobile3.htmlValue = order.billingAddress.custom.phone3;
                }
            }
        } else if (order && order.billingAddress && profileForm && profileForm.customer) {
            if (order.billingAddress.phone && profileForm.customer.phone) {
                profileForm.customer.phone.htmlValue = order.billingAddress.phone;
            }
        }

        viewData.profileForm = profileForm;
        viewData.passwordRules = passwordRequirements;
        viewData.minimumAgeRestriction = minimumAgeRestriction;
        viewData.isKRCustomCheckoutEnabled = isKRCustomCheckoutEnabled;
        var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
        viewData.mobileAuthEnabled = mobileAuthProvider.mobileAuthEnabled;
        res.setViewData(viewData);
    }

    return next();
});

server.append('PrintEmailLabel', function (req, res, next) {
    var order = req.querystring.orderNumber ? require('dw/order/OrderMgr').getOrder(req.querystring.orderNumber) : null;
    if (order) {
        var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
        var returnsUtil = new ReturnsUtils();
        var returnService = returnsUtil.getPreferenceValue('returnService', order.custom.customerLocale);
        res.setViewData({
            returnService: returnService
        });
        if (returnService === 'RntEmail') {
            var rmaNumber = req.querystring.returnNumber;
            var returnCase = order.getReturnCase(rmaNumber);
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var shipmentLabelHtml = renderTemplateHelper.getRenderedHtml({ order: order, orderNumber: order.currentOrderNo, ReturnCase: returnCase, orderEmail: order.getCustomerEmail(), orderBillingZip: order.getBillingAddress().getPostalCode() }, '/refund/rntPrintLabel');
            res.setViewData({
                isRnTEmailReturnService: true,
                shipLabel: shipmentLabelHtml
            });
        }
    }
    next();
});

server.replace(
    'CreateAccount',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) { // eslint-disable-line consistent-return
        // Wislist's prepend code
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var viewData = res.getViewData();
        var list = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
        viewData.list = list;
        res.setViewData(viewData);
        // actual businness logic
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var OrderMgr = require('dw/order/OrderMgr');
        var HookMgr = require('dw/system/HookMgr');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var idmPreferences = require('*/cartridge/scripts/idmPreferences');
        var showBirthYearField = require('*/cartridge/config/preferences').ShowBirthYearField;
        var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();
        var passwordForm = server.forms.getForm('newPasswords');
        var newPassword = passwordForm.newpassword.htmlValue;
        var confirmPassword = passwordForm.newpasswordconfirm.htmlValue;
        if (newPassword !== confirmPassword) {
            passwordForm.valid = false;
            passwordForm.newpasswordconfirm.valid = false;
            passwordForm.newpasswordconfirm.error =
                Resource.msg('error.message.mismatch.newpassword', 'forms', null);
        }
        // form validation
        if (passwordForm.valid && !idmPreferences.isIdmEnabled && !CustomerMgr.isAcceptablePassword(passwordForm.newpassword.value)) {
            passwordForm.newpassword.valid = false;
            passwordForm.newpassword.error = passwordRequirements.errorMsg;
            passwordForm.valid = false;
        }

        if (passwordForm.valid) {
            var order = OrderMgr.getOrder(req.querystring.ID);
            if (!order || order.customer.ID !== req.currentCustomer.raw.ID || order.getUUID() !== req.querystring.UUID) {
                res.json({ error: [Resource.msg('error.message.unable.to.create.account', 'login', null)] });
                return next();
            }
            res.setViewData({ orderID: req.querystring.ID });
            var registrationObj = {
                email: order.customerEmail,
                password: newPassword
            };
            res.setViewData(registrationObj);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var registrationData = res.getViewData();
                var login = registrationData.email;
                var password = registrationData.password;
                var newCustomer;
                var errorObj = {};
                var newOrder = OrderMgr.getOrder(res.getViewData().orderID);
                delete registrationData.email;
                delete registrationData.password;
                var registrationFormObj = {
                    firstName: '',
                    lastName: '',
                    phone: ''
                };
                var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
                var countryConfig;
                if (HookMgr.hasHook('app.memberson.CountryConfig')) {
                    countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
                }
                var profObj = null;
                if (dw.system.Site.getCurrent().getCustomPreferenceValue('additionalRegFields') || countryConfig.membersonEnabled) {
                    var registrationForm = server.forms.getForm('profile');
                    var profileObj = registrationForm.toObject();
                    registrationFormObj = {
                        firstName: newOrder.billingAddress.firstName,
                        lastName: newOrder.billingAddress.lastName,
                        countryDialingCode: newOrder.custom.countryDialingCode,
                        phone: newOrder.billingAddress.phone,
                        month: profileObj.customer.birthMonth,
                        day: profileObj.customer.birthDay,
                        gender: profileObj.customer.gender
                    };
                    var bdyYear = profileObj.customer && profileObj.customer.birthYear ? profileObj.customer.birthYear : 0;
                    if (bdyYear === 0) {
                        bdyYear = null;
                    }
                    var bdyMonth = profileObj.customer && profileObj.customer.birthMonth ? profileObj.customer.birthMonth : 0;
                    if (bdyMonth === 0) {
                        bdyMonth = null;
                    }
                    var bdyDay = profileObj.customer && profileObj.customer.birthDay ? profileObj.customer.birthDay : 0;
                    if (bdyDay === 0) {
                        bdyDay = null;
                    }
                    var gender = null;
                    if (profileObj.customer && profileObj.customer.gender == 1) {// eslint-disable-line
                        gender = 'MALE';
                    } else if (profileObj.customer && profileObj.customer.gender == 2) {// eslint-disable-line
                        gender = 'FEMALE';
                    }
                    var preferences = accountHelpers.getPreferences(profileObj);
                    var birthDateObj = {};
                    profObj = {};
                    profObj.firstName = newOrder && newOrder.billingAddress.firstName ? newOrder.billingAddress.firstName : '';
                    profObj.lastName = newOrder.billingAddress.lastName ? newOrder.billingAddress.lastName : '';
                    profObj.phone = newOrder && 'countryDialingCode' in newOrder.custom && newOrder.custom.countryDialingCode ? newOrder.custom.countryDialingCode + '-' + newOrder.billingAddress.phone : newOrder.billingAddress.phone;
                    profObj.gender = gender;

                    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
                    var mobileAuthCI;
                    if (mobileAuthProvider.mobileAuthEnabled && session.privacy.mobileAuthCI) {
                        var mobileAuthData = mobileAuthProvider.getDataFromSession();
                        mobileAuthCI = mobileAuthData.mobileAuthCI;
                        profObj.lastName = mobileAuthData.name;
                        registrationFormObj.phone = profObj.phone = mobileAuthData.phone;
                        profObj.gender = mobileAuthData.gender === '0' ? 'FEMALE' : 'MALE';
                        profileObj.customer.birthYear = bdyYear = mobileAuthData.birthYear;
                        bdyMonth = mobileAuthData.birthMonth;
                        bdyDay = mobileAuthData.birthDay;
                        registrationFormObj.lastName = registrationForm.customer.lastname.value = mobileAuthData.name;
                        registrationForm.customer.phoneMobile1.value = mobileAuthData.phone1;
                        registrationForm.customer.phoneMobile2.value = mobileAuthData.phone2;
                        registrationForm.customer.phoneMobile3.value = mobileAuthData.phone3;
                        registrationForm.customer.birthYear.value = mobileAuthData.birthYear;
                        registrationForm.customer.birthMonth.value = mobileAuthData.birthMonth;
                        registrationForm.customer.birthDay.value = mobileAuthData.birthDay;
                    }

                    if (showBirthYearField) {
                        registrationFormObj.year = profileObj.customer.birthYear;
                        birthDateObj.year = bdyYear;
                    }
                    birthDateObj.month = bdyMonth;
                    birthDateObj.day = bdyDay;
                    profObj.birthdate_obj = birthDateObj;
                    profObj.preferences = preferences;
                    profObj.locale = request.locale; // eslint-disable-line no-undef
                }
                // attempt to create a new user and log that user in.
                try {
                    Transaction.wrap(function () {
                        var error = {};
                        passwordForm = res.getViewData();
                        var authenticatedCustomer = (idmPreferences.isIdmEnabled)
                                                    ? accountHelpers.createIDMAccount(login, password, profObj)
                                                    : accountHelpers.createSFCCAccount(login, password, registrationFormObj);
                        if (authenticatedCustomer.duplicateCustomer) {
                            error = {
                                authError: true,
                                duplicateCustomer: authenticatedCustomer.duplicateCustomer,
                                status: authenticatedCustomer.errorMessage
                            };
                            throw error;
                        }
                        if (!authenticatedCustomer.authCustomer) {
                            error = {
                                authError: true,
                                status: authenticatedCustomer.errorMessage
                            };
                            throw error;
                        }
                        // assign values to the profile
                        newCustomer = authenticatedCustomer.authCustomer;
                        newOrder.setCustomer(newCustomer);
                        var paymentForm = server.forms.getForm('billing');
                        var profile = customer.getProfile();
                        if (mobileAuthProvider.mobileAuthEnabled && !empty(mobileAuthCI)) { // eslint-disable-line block-scoped-var
                            profile.custom.CI = mobileAuthCI; // eslint-disable-line block-scoped-var
                        }
                        if (COHelpers.smsOptInEnabled()) {
                            var addToemaolList = order.defaultShipment.shippingAddress.custom.addToSMSList ? order.defaultShipment.shippingAddress.custom.addToSMSList : false;
                            if (addToemaolList) {
                                Transaction.wrap(function () {
                                    if (customer.registered && (profile.phoneMobile === paymentForm.contactInfoFields.phone.value || profile.phoneHome === paymentForm.contactInfoFields.phone.value)) {
                                        customer.getProfile().custom.smsOptIn = true;
                                    }
                                });
                            }
                        }
                        // save birth year in SFCC profile
                        if (authenticatedCustomer.authCustomer && authenticatedCustomer.authCustomer.profile) {
                            var profileForm = server.forms.getForm('profile');
                            accountHelpers.saveBirthYear(profileForm, authenticatedCustomer.authCustomer.profile);
                            accountHelpers.saveSplitFields(profileForm, authenticatedCustomer.authCustomer.profile);
                        }
                        // save all used shipping addresses to address book of the logged in customer
                        var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
                        var allAddresses = addressHelpers.gatherShippingAddresses(newOrder);
                        allAddresses.forEach(function (address) {
                            addressHelpers.saveAddress(address, { raw: newCustomer }, addressHelpers.generateAddressName(address));
                        });
                    });
                } catch (e) {
                    errorObj.error = true;
                    errorObj.duplicateCustomer = e.duplicateCustomer;
                    errorObj.errorMessage = e.authError
                        ? Resource.msg('error.message.unable.to.create.account', 'login', null)
                        : Resource.msg('error.message.account.create.error', 'forms', null);
                }
                // wishlist append code
                var listGuest = viewData.list;
                if (viewData.success && newOrder) {
                    var listLoggedIn = productListHelper.getList(newCustomer, { type: 10 });
                    productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
                }
                // render json
                if (errorObj.error) {
                    // clearing other info
                    res.viewData = {}; // eslint-disable-line
                    res.json({
                        error: [errorObj.errorMessage],
                        duplicateCustomer: errorObj.duplicateCustomer

                    });
                    return;
                }
                // clearing other info
                res.viewData = {}; // eslint-disable-line
                res.json({
                    newCustomer: newCustomer || null,
                    success: true,
                    redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
                });
            });
        } else {
            // clearing other info
            res.viewData = {}; // eslint-disable-line
            res.json({
                fields: formErrors.getFormErrors(passwordForm)
            });
        }
        next();
    }
);

/**
 * Update the time field on the pickUp form
 * @param {Object} timeRangeOptions is field of the pickUp form
 * @returns {Object} updated time field pickUp
 */
function getTimeRange(timeRangeOptions) {
    var pickupTimeSlots = PreferencesUtil.getValue('pickupTimeSlots');
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
 * @returns {Object} updated date field pickUp
 */
function getDateRange(dateRaneOptions) {
    var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var dateOptions = dateRaneOptions;
    var dateConfig = JSON.parse(PreferencesUtil.getValue('pickupDateRange'));
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
                var publicHolidayList = PreferencesUtil.getValue('publicHolidayList');
                var isPublicHoliday = publicHolidayList.some(function (holiday) {   // eslint-disable-line
                    return date.indexOf(holiday) > -1;
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

server.append(
    'ReturnItems',
    function (req, res, next) {
        var viewData = res.getViewData();
        var order = viewData.order;
        // Display the items in order of return eligibility.
        var OrderMgr = require('dw/order/OrderMgr');
        var orderObj = OrderMgr.getOrder(order.orderNo);
        viewData.isBonusProductAvailable = orderObj.getBonusLineItems().length > 0;
        res.setViewData(viewData);
        order.orderItems.sort(function (item1, item2) {
            return (item1.isEligibleForReturn === item2.isEligibleForReturn) ? 0 : item1.isEligibleForReturn ? -1 : 1;
        });
        return next();
    }
);

server.append(
    'ReturnGuestItems',
    function (req, res, next) {
        var viewData = res.getViewData();
        var order = viewData.order;
        // Display the items in order of return eligibility.
        var OrderMgr = require('dw/order/OrderMgr');
        var orderObj = OrderMgr.getOrder(order.orderNo);
        viewData.isBonusProductAvailable = orderObj.getBonusLineItems().length > 0;
        res.setViewData(viewData);
        order.orderItems.sort(function (item1, item2) {
            return (item1.isEligibleForReturn === item2.isEligibleForReturn) ? 0 : item1.isEligibleForReturn ? -1 : 1;
        });
        return next();
    }
);

server.replace(
    'ContinueReason',
    userLoggedIn.validateLoggedInAjax,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        if (res.getViewData().loggedin) {
            var Locale = require('dw/util/Locale');
            var Site = require('dw/system/Site');
            var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
            var OrderMgr = require('dw/order/OrderMgr');
            var URLUtils = require('dw/web/URLUtils');
            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var order = OrderMgr.getOrder(req.querystring.orderID);
            var printLabelURL = URLUtils.url('Order-PrintLabel', 'orderID', order.orderNo);
            var returnObj = req.form.reason_value;
            var analyticsProductObj = req.form.analytics_reason_value;
            returnHelpers.setReturnDetails(returnObj);
            var template = 'account/order/orderReturnPrintCard';
            if (dw.system.Site.getCurrent().getID() !== 'OC' && dw.system.Site.getCurrent().getID() !== 'KR') {
                template = 'account/order/orderDynamicReturnMethodSEA';
            }
            var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
            var generateLabel = Resource.msg('order.generate.button', 'account', null);
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: order, customerEmail: req.currentCustomer.profile.email, printLabelURL: printLabelURL, isExchangeItems: req.form.isExchangeItems, exchangeTealiumItems: analyticsProductObj, returnInstructionText: returnInstructionText, generateLabel: generateLabel }, template);
            if (dw.system.Site.getCurrent().getID() === 'SEA' || dw.system.Site.getCurrent().getID() === 'TH') {
                var orderReturnForm = server.forms.getForm('return');
                var orderCountryCode = order.getDefaultShipment().shippingAddress.countryCode.value;
                var customObjectdefinition = returnHelpers.getCustomObject('ReturnMethodsConfigurations', orderCountryCode);
                var isDropDownCity = false;
                var dependencyOnState = false;
                var dependencyOnCity = false;
                var isPostalCodeDropDown = false;
                var isDistrictDropDown = false;
                var countryFields;
                if (!empty(Site.current.getCustomPreferenceValue('countryFields'))) {
                    countryFields = Site.current.getCustomPreferenceValue('countryFields');
                }
                var currentCountryFields;
                var currentCF = [];
                if (!empty(countryFields)) {
                    var currentCountry = session.custom.currentCountry || require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
                    currentCountryFields = JSON.parse(countryFields);
                    currentCF = currentCountryFields[currentCountry];
                }
                if (currentCF && currentCF.fields) {
                    for (var i = 0; i < currentCF.fields.length; i++) {
                        var field = currentCF.fields[i];
                        if (field.id === 'state') {
                            dependencyOnState = field.dependency;
                        } else if (field.id === 'city') {
                            dependencyOnCity = field.dependency;
                            isDropDownCity = true;
                            isDropDownCity = isDropDownCity;    // eslint-disable-line no-self-assign
                        } else if (field.id === 'postalCode') {
                            isPostalCodeDropDown = true;
                            isPostalCodeDropDown = isPostalCodeDropDown;    // eslint-disable-line no-self-assign
                        } else if (field.id === 'district') {
                            isDistrictDropDown = true;
                            isDistrictDropDown = isDistrictDropDown;    // eslint-disable-line no-self-assign
                        }
                    }
                }
                if (!empty(customObjectdefinition)) {
                    var returnMethodConfigs = returnHelpers.getReturnMethodsConfigurations(customObjectdefinition, orderReturnForm);
                    renderedTemplate = renderTemplateHelper.getRenderedHtml({ dependencyOnState: dependencyOnState, dependencyOnCity: dependencyOnCity, isDropDownCity: isDropDownCity, isPostalCodeDropDown: isPostalCodeDropDown, isDistrictDropDown: isDistrictDropDown, orderReturnItems: 'print', order: order, customerEmail: req.currentCustomer.profile.email, printLabelURL: printLabelURL, isExchangeItems: req.form.isExchangeItems, exchangeTealiumItems: analyticsProductObj, returnInstructionText: returnInstructionText, generateLabel: generateLabel, returnForm: orderReturnForm, returnType: 'registered', returnMethodDetails: returnMethodConfigs }, template);
                } else {
                    template = 'account/order/orderStaticReturnMethodSEA';
                    getTimeRange(orderReturnForm.returnTime.options);
                    getDateRange(orderReturnForm.returnDate.options);
                    renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: order, customerEmail: req.currentCustomer.profile.email, printLabelURL: printLabelURL, isExchangeItems: req.form.isExchangeItems, exchangeTealiumItems: analyticsProductObj, returnInstructionText: returnInstructionText, generateLabel: generateLabel, returnForm: orderReturnForm, returnType: 'registered' }, template);
                }
            }
            var resources = {
                return_page_header: Resource.msg('heading.returns.print', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources });
        }
        next();
    }
);

server.replace(
    'ContinueGuestReason',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Locale = require('dw/util/Locale');
        var Site = require('dw/system/Site');
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var OrderMgr = require('dw/order/OrderMgr');
        var URLUtils = require('dw/web/URLUtils');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var order = OrderMgr.getOrder(req.querystring.trackOrderNumber);
        var returnObj = req.form.reason_value;
        returnHelpers.setReturnDetails(returnObj);
        var printLabelGuestURL = URLUtils.url('Order-PrintLabelGuest', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var emailLabelGuestURL = URLUtils.url('Order-EmailLabelGuest', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var template = 'account/order/orderReturnPrintCard';
        if (dw.system.Site.getCurrent().getID() !== 'OC' && dw.system.Site.getCurrent().getID() !== 'KR') {
            template = 'account/order/orderDynamicReturnMethodSEA';
        }
        var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
        var generateLabel = Resource.msg('order.generate.button', 'account', null);
        var renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: order, printLabelGuestURL: printLabelGuestURL, emailLabelGuestURL: emailLabelGuestURL, isExchangeItems: req.form.isExchangeItems, returnInstructionText: returnInstructionText, generateLabel: generateLabel, returnType: 'guest' }, template);
        if (dw.system.Site.getCurrent().getID() === 'SEA' || dw.system.Site.getCurrent().getID() === 'TH') {
            var orderReturnForm = server.forms.getForm('return');
            var orderCountryCode = order.getDefaultShipment().shippingAddress.countryCode.value;
            var customObjectdefinition = returnHelpers.getCustomObject('ReturnMethodsConfigurations', orderCountryCode);
            var isDropDownCity = false;
            var dependencyOnState = false;
            var dependencyOnCity = false;
            var isPostalCodeDropDown = false;
            var isDistrictDropDown = false;
            var countryFields;
            if (!empty(Site.current.getCustomPreferenceValue('countryFields'))) {
                countryFields = Site.current.getCustomPreferenceValue('countryFields');
            }
            var currentCountryFields;
            var currentCF = [];
            if (!empty(countryFields)) {
                var currentCountry = session.custom.currentCountry || require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
                currentCountryFields = JSON.parse(countryFields);
                currentCF = currentCountryFields[currentCountry];
            }
            if (currentCF && currentCF.fields) {
                for (var i = 0; i < currentCF.fields.length; i++) {
                    var field = currentCF.fields[i];
                    if (field.id === 'state') {
                        dependencyOnState = field.dependency;
                    } else if (field.id === 'city') {
                        dependencyOnCity = field.dependency;
                        isDropDownCity = true;
                        isDropDownCity = isDropDownCity;    // eslint-disable-line no-self-assign
                    } else if (field.id === 'postalCode') {
                        isPostalCodeDropDown = true;
                        isPostalCodeDropDown = isPostalCodeDropDown;    // eslint-disable-line no-self-assign
                    } else if (field.id === 'district') {
                        isDistrictDropDown = true;
                        isDistrictDropDown = isDistrictDropDown;    // eslint-disable-line no-self-assign
                    }
                }
            }
            if (!empty(customObjectdefinition)) {
                var returnMethodConfigs = returnHelpers.getReturnMethodsConfigurations(customObjectdefinition, orderReturnForm);
                renderedTemplate = renderTemplateHelper.getRenderedHtml({ dependencyOnState: dependencyOnState, dependencyOnCity: dependencyOnCity, isDropDownCity: isDropDownCity, isPostalCodeDropDown: isPostalCodeDropDown, isDistrictDropDown: isDistrictDropDown, orderReturnItems: 'print', order: order, customerEmail: order.customerEmail, printLabelGuestURL: printLabelGuestURL, emailLabelGuestURL: emailLabelGuestURL, isExchangeItems: req.form.isExchangeItems, returnInstructionText: returnInstructionText, generateLabel: generateLabel, returnForm: orderReturnForm, returnType: 'guest', returnMethodDetails: returnMethodConfigs }, template);
            } else {
                template = 'account/order/orderStaticReturnMethodSEA';
                getTimeRange(orderReturnForm.returnTime.options);
                getDateRange(orderReturnForm.returnDate.options);
                renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: order, customerEmail: order.customerEmail, printLabelGuestURL: printLabelGuestURL, emailLabelGuestURL: emailLabelGuestURL, isExchangeItems: req.form.isExchangeItems, returnInstructionText: returnInstructionText, generateLabel: generateLabel, returnForm: orderReturnForm, returnType: 'guest' }, template);
            }
        }

        var resources = {
            return_page_header: Resource.msg('heading.returns.print', 'confirmation', null)
        };
        res.json({ renderedTemplate: renderedTemplate, resources: resources });
        next();
    }
);

server.post('SubmitPickUp', function (req, res, next) {
    // Libs
    var OrderMgr = require('dw/order/OrderMgr');
    var Logger = require('dw/system/Logger');
    var Locale = require('dw/util/Locale');
    var URLUtils = require('dw/web/URLUtils');

    // Helpers
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
    var CreateObject = require('*/cartridge/scripts/orders/CreateObject');

    // Order Obj
    var order = OrderMgr.getOrder(req.querystring.orderID);
    var redirectURL = URLUtils.url('Order-ReturnItems', 'orderID', order.orderNo).toString();
    if (req.querystring.returnType === 'guest') {
        redirectURL = URLUtils.url('Order-ReturnGuestItems', 'trackOrderNumber', order.orderNo, 'trackOrderEmail', order.customerEmail).toString();
    }

    // Return Obj
    var returnObj = returnHelpers.getReturnDetails();

    var pickUpForm;
    var pickUpObj;
    var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
    pickUpForm = server.forms.getForm('return');
    pickUpObj = pickUpForm.toObject();

    // Get form Obj and validate for SG
    if ((!empty(pickUpObj) && pickUpObj.pickupOption === 'Courier Pickup')) {
        var tempPhoneNumber = pickUpObj.phone;
        var phoneNumberCombined = tempPhoneNumber ? tempPhoneNumber.split(' ') : tempPhoneNumber;
        var phoneNumber = phoneNumberCombined ? phoneNumberCombined.join('') : tempPhoneNumber;
        phoneNumber = phoneNumber ? phoneNumber.replace(/[^a-z0-9\s]/gi, '') : tempPhoneNumber;
        phoneNumber = phoneNumber ? phoneNumber.replace(/[_\s]/g, '-') : tempPhoneNumber;
        pickUpObj.phone = phoneNumber;
        if ('countryDialingCode' in order.custom && !empty(order.custom.countryDialingCode)) {
            var isValidPhoneNumber = COHelpers.validatephoneNumber(pickUpObj.phone, order.custom.countryDialingCode);
            if (!isValidPhoneNumber) {
                pickUpForm.valid = false;
                pickUpForm.phone.valid = false;
                pickUpForm.phone.error = Resource.msg('error.message.areaCode', 'forms', null);
                res.json({
                    fields: formErrors.getFormErrors(pickUpForm),
                    success: false,
                    error: true,
                    invalidForm: true
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }

        // verify shipping form data
        var pickUpFormErrors = COHelpers.validateFields(pickUpForm);
        if (Object.keys(pickUpFormErrors).length > 0) {
            res.json({
                fields: formErrors.getFormErrors(pickUpForm),
                success: false,
                error: true
            });
        }
    }

    var returnItemsInfo = returnObj.returnArray;
    let caseItems = order.getReturnCaseItems().asMap().values();

    if (caseItems && !caseItems.empty) {
        let caseItemsQuantities = {};
        let orderQuantities = {};

        for (let i = 0; i < caseItems.length; i++) {
            let caseItem = caseItems[i];

            if (!caseItemsQuantities[caseItem.orderItemID]) {
                caseItemsQuantities[caseItem.orderItemID] = 0;
            }

            caseItemsQuantities[caseItem.orderItemID] += caseItem.authorizedQuantity.value;
            orderQuantities[caseItem.orderItemID] = caseItem.orderItem.lineItem.quantityValue;
        }

        for (let i = 0; i < returnItemsInfo.length; i++) {
            let returnItemInfo = returnItemsInfo[i];
            let canReturn = orderQuantities[returnItemInfo.returnOrderItemID] - caseItemsQuantities[returnItemInfo.returnOrderItemID];
            if (returnItemInfo.returnQuantity > canReturn) {
                Logger.error('To many items of {0} to return, failing returnCase creation', returnItemInfo.returnOrderItemID);
                res.json({
                    success: true,
                    redirectUrl: redirectURL
                });
                this.done(req, res);
                return;
            }
        }
    }
    var createReturnCase = require('*/cartridge/scripts/orders/CreateReturnCase');
    var returnCase = createReturnCase.create({
        Order: order,
        ReturnItemsInfo: returnItemsInfo,
        PrintLabel: true
    });

    if (!empty(returnCase)) {
        Transaction.begin();
        returnCase.custom.pickupOption = !empty(pickUpObj) ? pickUpObj.pickupOption || '' : 'Return via mail';
        if (!empty(pickUpObj) && pickUpObj.pickupOption === 'Courier Pickup') {
            returnCase.custom.pickupFirstName = pickUpObj.firstName || '';
            returnCase.custom.pickupLastName = pickUpObj.lastName || '';
            returnCase.custom.pickupMobile = pickUpObj.phone || '';
            returnCase.custom.pickupEmail = pickUpObj.email || '';
            returnCase.custom.pickupAddress1 = pickUpObj.address1 || '';
            returnCase.custom.pickupAddress2 = pickUpObj.address2 || '';
            returnCase.custom.pickupCity = pickUpObj.city || '';
            returnCase.custom.pickupPostalCode = pickUpObj.postalCode || '';
            returnCase.custom.pickupDate = pickUpObj.returnDate || '';
            returnCase.custom.pickupTimeSlot = pickUpObj.returnTime || '';
        } else {
            returnCase.custom.pickupFirstName = '';
            returnCase.custom.pickupLastName = '';
            returnCase.custom.pickupMobile = '';
            returnCase.custom.pickupEmail = '';
            returnCase.custom.pickupAddress1 = '';
            returnCase.custom.pickupAddress2 = '';
            returnCase.custom.pickupCity = '';
            returnCase.custom.pickupPostalCode = '';
            returnCase.custom.pickupDate = '';
            returnCase.custom.pickupTimeSlot = '';
        }
        Transaction.commit();
        CreateObject.createObj(order, returnCase);
    }
    var orderCountryCode = order.getDefaultShipment().shippingAddress.countryCode.value;
    var customObjectdefinition = returnHelpers.getCustomObject('ReturnMethodsConfigurations', orderCountryCode);
    if (!empty(customObjectdefinition)) {
        var returnMethodContent = 'sea-autoreturnconfirmation-' + pickUpObj.pickupOption.split(' ').join('-').toLowerCase();
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var renderedTemplate = renderTemplateHelper.getRenderedHtml({ returnMethodContent: returnMethodContent, redirectUrl: redirectURL }, 'account/order/returnConfirmation');
        res.json({
            success: true,
            renderedTemplate: renderedTemplate,
            responseMsg: Resource.msg('heading.return.confirm', 'confirmation', null)
        });
    } else {
        res.json({
            success: true,
            redirectUrl: redirectURL,
            responseMsg: Resource.msg('heading.return.confirm', 'confirmation', null)
        });
    }

    next();
});

/**
 * Webhook that can be called by OMS with return label.
 * Return label will be emailed to customer and stored in the return case
 */
server.post(
    'ReturnLabelSEA',
    server.middleware.https,
    function (req, res, next) {
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        var auth = printLabelHelpers.checkWebhookAuthentication(req);
        if (!auth) {
            res.setStatusCode(401);
            res.json({
                error: true,
                message: 'Authentication Failed'
            });
            return next();
        }
        var requestBody = JSON.parse(req.httpParameterMap.requestBodyAsString);
        var orderNo = requestBody.orderNo;
        var returnNumber = requestBody.returnNumber;
        var returnLabel = requestBody.returnLabel;
        if (empty(orderNo) || empty(returnNumber) || empty(returnLabel)) {
            res.setStatusCode(400);
            res.json({
                error: true,
                message: 'Expected parameters missing'
            });
            return next();
        }
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(orderNo);
        if (empty(order)) {
            res.setStatusCode(400);
            res.json({
                error: true,
                message: 'Order not found'
            });
            return next();
        }
        var returnCase = order.getReturnCase(returnNumber);
        if (empty(returnCase)) {
            res.setStatusCode(400);
            res.json({
                error: true,
                message: 'Return case not found for this order'
            });
        }
        if (!Object.prototype.hasOwnProperty.call(returnCase.custom, 'emailSentToCustomer') || !returnCase.custom.emailSentToCustomer) {
            Transaction.begin();
            returnCase.custom.shipmentLabel = returnLabel;
            request.setLocale(order.customerLocaleID); // eslint-disable-line no-undef
            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase);
            returnCase.custom.emailSentToCustomer = true;
            Transaction.commit();
        }
        res.json({
            success: true
        });
        return next();
    }
);
module.exports = server.exports();
