'use strict';

$(document).ready(function () {
    $.spinner().start();

    var $mobileAuthReturnContainer = $('#mobile-auth-return');

    if ($mobileAuthReturnContainer) {
        var triggerRegistration = $mobileAuthReturnContainer.data('trigger-registration');
        var containerHTML = $mobileAuthReturnContainer.html();
        var reloadPage = $mobileAuthReturnContainer.data('reload-page');
        var disableOuterClose = $mobileAuthReturnContainer.data('disable-outer-close');
        var decryptedRetData = JSON.parse(decodeURIComponent($mobileAuthReturnContainer.data('decrypted-return-data')));

        window.opener.postMessage({
            triggerRegistration: triggerRegistration,
            containerHTML: containerHTML,
            reloadPage: reloadPage,
            disableOuterClose: disableOuterClose,
            decryptedRetData: decryptedRetData
        }, window.location.origin);
    }
});
