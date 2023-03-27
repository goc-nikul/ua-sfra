
module.exports = function customerLogic(logicArgs) {
    var checkoutPrepopulatedFields = [];
    const customerObj =logicArgs.currentCustomerProfile ? logicArgs.currentCustomerProfile.customer : {};
    const customerProfile = customerObj ? customerObj.profile : {};
    if (customerProfile) {
        if (customerProfile.addressBook && customerProfile.addressBook.addresses && customerProfile.addressBook.addresses.length) {
            checkoutPrepopulatedFields.push('shipping');
            checkoutPrepopulatedFields.push('billing');
        }
        if (customerProfile.wallet && customerProfile.wallet.paymentInstruments && customerProfile.wallet.paymentInstruments.length) {
            checkoutPrepopulatedFields.push('payment');
        }
        if (customerProfile.email) {
            checkoutPrepopulatedFields.push('contact');
        }
    }
    return {
        checkout_prepopulatedFields : checkoutPrepopulatedFields.length ? checkoutPrepopulatedFields : undefined
    };
};
