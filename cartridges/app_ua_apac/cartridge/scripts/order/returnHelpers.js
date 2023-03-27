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

module.exports = {
    setReturnDetails: base.setReturnDetails,
    getReturnDetails: base.getReturnDetails,
    createAuthFormObj: createAuthFormObj,
    sendReturnCreatedConfirmationEmail: base.sendReturnCreatedConfirmationEmail,
    orderReturnReasonModel: base.orderReturnReasonModel
};
