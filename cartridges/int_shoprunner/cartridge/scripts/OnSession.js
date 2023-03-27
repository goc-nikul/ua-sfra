var Status = require('dw/system/Status');
var Site = require('dw/system/Site');

exports.onSession = function () {
    if (Site.getCurrent().getCustomPreferenceValue('sr_enabled')) {
        require('int_shoprunner/cartridge/scripts/DeleteShopRunnerCookie.ds').deleteCookie();
    }
    return new Status(Status.OK);
};
