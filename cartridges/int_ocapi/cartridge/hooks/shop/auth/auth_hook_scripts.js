var Status = require('dw/system/Status');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * This method modifies the OCAPI response for customer auth
 *
 * @param {dw.customer.Customer} customer - the auth customer
 * @param {Object} customerResponse - customer response object
 * @returns{dw.system.Status} - OK to continue further hook processing, ERROR to abort
 */
function updateResponse(customer, customerResponse) {
    /* Assign response arg to local variable to prevent eslint no-param-reassign
    * errors.  Object args are passed by reference, so changes will still apply.
    */
    var response = customerResponse;

    /* Add customer groups to response document. */
    var responseArr = [];
    var customerGroups = customer.getCustomerGroups();
    collections.forEach(customerGroups, function (customerGroup) {
        responseArr.push({ id: customerGroup.ID, UUID: customerGroup.UUID });
    });
    response.c_customerGroups = responseArr;
    return new Status(Status.OK);
}

exports.modifyPOSTResponse = function (customer, customerResponse, authRequestType) {
    return updateResponse(customer, customerResponse, authRequestType);
};
