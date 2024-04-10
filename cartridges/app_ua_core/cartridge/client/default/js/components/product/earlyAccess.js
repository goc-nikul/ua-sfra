'use strict';

exports.updateEarlyAccessAttributes = (earlyAccessObj) => {
    var $earlyAccessIcon = $('.b-product-quickview-images .b-EarlyAccess-Icon, .l-pdp-images .b-EarlyAccess-Icon');
    if ('earlyAccessBadge' in earlyAccessObj && $('.b-EarlyAccess-Icon').length) {
        $earlyAccessIcon.find('.ea-Icon-Text').html(earlyAccessObj.earlyAccessBadge);
        $earlyAccessIcon.removeClass('d-none');
    } else {
        $earlyAccessIcon.addClass('d-none');
    }

    if ($('.ua-early-access').length) {
        var $uaEarlyAccessBlock = $('.ua-early-access');
        $uaEarlyAccessBlock.attr('data-is-ea-product', earlyAccessObj.isEarlyAccessProduct);
        $uaEarlyAccessBlock.attr('data-hide-ea-product', earlyAccessObj.hideProduct);
        $uaEarlyAccessBlock.attr('data-chk-ea-url', earlyAccessObj.earlyAccessUrl);

        if (earlyAccessObj.isEarlyAccessProduct) {
            $uaEarlyAccessBlock.attr('data-is-ea-customer', earlyAccessObj.isEarlyAccessCustomer);
            $uaEarlyAccessBlock.attr('data-is-loggedin', earlyAccessObj.isLoggedIn);
            if (earlyAccessObj.eaContent) {
                $uaEarlyAccessBlock.html(earlyAccessObj.eaContent);
            }
        } else {
            $uaEarlyAccessBlock.removeAttr('data-is-ea-customer');
            $uaEarlyAccessBlock.removeAttr('data-is-loggedin');
        }
    }
};
