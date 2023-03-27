function getCustomerServerData(logicArgs) {
    return logicArgs.customerData || {};
}

function getCustomerType(logicArgs) {
    if (logicArgs.pageType !== 'order-receipt') {
        return undefined;
    }
    const customerServerData = getCustomerServerData(logicArgs);
    return customerServerData.customerNo
        ? 'Existing' // assumed, TODO: determine if logged in user actually has ordered before
        : 'New';
}

function getVisitorType(logicArgs) {
    const isVIP = logicArgs.isVIP;
    const isEmployee = logicArgs.isEmployee;
    const isLoggedIn = !!getCustomerServerData(logicArgs).customerNo;
    const customer = session.customer;
    if (!isLoggedIn) {
        return 'guest';
    } else if (isEmployee) {
        return 'employee';
    } else if (isVIP) {
        return 'vip';
    } else if (customer && customer.authenticated && customer.profile) {
        const creationDate = String(customer.profile.creationDate);
        const lastLoginTime = String(customer.profile.lastLoginTime);
        if (creationDate === lastLoginTime) {
            return 'logged in new';
        } else {
            return 'logged in returning';
        }
    }

    return 'logged in';
}
function getCustomerStatus() {
    var customer = session.customer;
    if (customer && customer.profile) {
        var creationDate = String(customer.profile.creationDate);
        var lastLoginTime = String(customer.profile.lastLoginTime);
        if (customer.authenticated && creationDate === lastLoginTime) {
            return 'New';
        } else if (customer.authenticated && customer.orderHistory && customer.orderHistory.orderCount > 0) {
            return 'Existing';
        } else if (customer.authenticated && creationDate !== lastLoginTime && customer.orderHistory && customer.orderHistory.orderCount === 0) {
            return 'Returning';
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}
function getLoginStatus(customerNo) {
    if (session.privacy.loggedInWithFaceBook) {
        return 'Logged in with Facebook';
    } else if (customerNo) {
        return 'Logged In';
    } else {
        return 'Guest';
    }
}

function getCustomerPref(profileCustomData) {
    try {
        const Site = require('dw/system/Site');
        var tealiumCustomerPreferences = 'tealiumCustomerPreferences' in Site.current.preferences.custom && 
                                           Site.current.getCustomPreferenceValue('tealiumCustomerPreferences');
        tealiumCustomerPreferences = tealiumCustomerPreferences.length ? JSON.parse(tealiumCustomerPreferences) : [];
        const profileLevelPreferences = JSON.parse(profileCustomData.preferences);      
        var genderArray = [];
        var activityArray = [];
        for(let index = 0; index < tealiumCustomerPreferences.length; index++) {
            let obj = tealiumCustomerPreferences[index];
            (profileLevelPreferences && profileLevelPreferences.genders || []).forEach(function(value) {
	            if (obj.gender[value]) {
                    genderArray.push(obj.gender[value]);
                }
            });
            (profileLevelPreferences && profileLevelPreferences.activities || []).forEach(function(value) {
	            if (obj.activities[value]) {    
                    activityArray.push(obj.activities[value]);
                }
            });
        }
        return {
            customer_gender_pref: genderArray,
            customer_activity_pref: activityArray
        };
    } catch(e) {
        return {};
    }
}

module.exports = function customerLogic(logicArgs) {
    const pageType = logicArgs.pageType;
    const customerServerData = getCustomerServerData(logicArgs);
    const customerNo = customerServerData.customerNo;
    const customerProfile = session.customer.profile;
    const customerPref = customerProfile && customerProfile.custom ? getCustomerPref(customerProfile.custom): {};
    return {
        customer_id: customerNo || undefined, // evar11 (global) && evar21 (account creation)
        customer_status: getCustomerStatus(), // prop26 This captures the customers status to our website, either New (never been before) Returning (visited but never purchased) or Existing (visited and purchased before)
        customer_type: getCustomerType(logicArgs), // eVar42 see variables excel sheet (New, return or none) not currently working
        logged_in_status: getLoginStatus(customerNo),
        visitor_type: getVisitorType(logicArgs),
        session_id: customerServerData.sessionID, // evar83
        smartgift_id: undefined, // out of scopr eVar122,
        customer_gender_pref: Object.keys(customerPref).length && customerPref.customer_gender_pref.length? customerPref.customer_gender_pref: undefined,
        customer_activity_pref: Object.keys(customerPref).length && customerPref.customer_activity_pref.length? customerPref.customer_activity_pref: undefined
        
    };
};
