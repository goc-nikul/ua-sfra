/**
 *
 * customer_lists_hook_scripts.js
 *
 * Handles OCAPI hooks for Data API CustomerList resource actions
 */

/**
 * Hook method for OCAPI calls that create a new customer, suitable for afterPOST,
 * afterPUT, and afterPATCH hooks.
 * Adds an externally-authenticated customer profile to the newly-created customer
 * if external provider ID and user ID are provided as request parameters:
 * - externalAuthProviderId
 * - externalAuthUserId
 *
 * @param {Object} customer - the newly created or modified customer
 * @returns {Object} Status - Status Object
 */
function addExternalProfile(customer) {
    const Status = require('dw/system/Status');

    // If the request specifies URL parameters for externalAuthProviderId
    // and externalUserId, add an externally-authenticated customer profile.

    // eslint-disable-next-line no-undef
    const params = request.getHttpParameters();
    if (params.containsKey('externalAuthProviderId') && params.containsKey('externalAuthUserId')) {
        const externalAuthProviderId = params.get('externalAuthProviderId')[0];
        const externalAuthUserId = params.get('externalAuthUserId')[0];

        // Check whether a duplicate external profile already exists for this customer
        const existingExternalProfile = customer.getExternalProfile(externalAuthProviderId, externalAuthUserId);

        // If no duplicate external profile, add external profile to customer.
        if (!existingExternalProfile) {
            customer.createExternalProfile(externalAuthProviderId, externalAuthUserId);
        }
    }

    return new Status(Status.OK);
}

module.exports = {
    afterPost: addExternalProfile,
    afterPut: addExternalProfile,
    afterPatch: addExternalProfile
};
