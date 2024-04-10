/**
 *
 * customer_address_hook_script.js
 *
 * Handles OCAPI hooks for customer address calls
 */

/* DW API Includes */
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger').getLogger('OCAPI_CUSTOMER');

/* Script Includes */
const collections = require('*/cartridge/scripts/util/collections');
const AddressHelper = require('*/cartridge/scripts/addressHelper');
const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

/* Constants*/
const EnableDeleteInvalidCustomerAddress = PreferencesUtil.getValue('enableDeleteInvalidCustomerAddress') === true;
/**
 *
 * @param {Object} customerAddressResultResponse - object to be returned in request.
 * @return {dw.system.Status} Status - status
 */
exports.modifyGETResponse = function (customerAddressResultResponse) {
    try {
        if (EnableDeleteInvalidCustomerAddress) {
            let response = customerAddressResultResponse;
            let addresses = [];

            collections.forEach(response.data, function (address) {
                // validate address
                let errors = AddressHelper.validateAddress(address);

                // add valid address to resopnse
                if (Object.keys(errors).length === 0) {
                    addresses.push(address);
                } else {
                    let sessionCustomer = request && request.session && request.session.customer ? request.session.customer : null;
                    Logger.info('Invalid address found for customer {0}. Omitted from response and deletion needed. Address ID: {1}, Address validation error: {2}', sessionCustomer && 'ID' in sessionCustomer ? sessionCustomer.ID : 'NOT_FOUND', 'addressId' in address ? address.addressId : 'NOT_FOUND', JSON.stringify(errors));
                }
            });
            response.data = addresses;
        }
    } catch (e) {
        Logger.error('Error for getting customer addressbook: {0} {1}', e.message, e.stack);
    }

    return new Status(Status.OK);
};

/**
 *
 * @param {dw.customer.Customer} customer - customer to add address to
 * @param {string} addressName - name of address to add
 * @param {CustomerAddress} customerAddress - address object
 * @return {dw.system.Status} Status - status
 */
// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (customer, addressName, customerAddress) {
    if (EnableDeleteInvalidCustomerAddress && customer && customer.profile) {
        AddressHelper.deleteInvalidAddressFromProfile(customer.profile);
    }

    return new Status(Status.OK);
};
