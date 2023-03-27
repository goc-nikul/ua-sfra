'use strict';

/** ************* sizechart switch public object ************* **/
function initSizechartSwitch() {
    /**
     * @function
     * @description initialize size chart table control switch
     */
    $(document).off('click', '.sf-guide__switch span').on('click', '.sf-guide__switch span', function () {
        $('.sf-guide__wrapper').prop('className', 'sf-guide__wrapper ' + $(this).prop('className').toLowerCase());
    });
}

module.exports = function () {
    // update carousel on resize:
    var width = $(window).width();
    var height = $(window).height();
    if ($(window).width() > 767) {
        $(window).resize(function () {
            if ($(window).width() !== width && $(window).height() !== height) {
                if ($('.fitguide-container .g-carousel-slide').length <= 3) {
                    $('.g-carousel-control').hide();
                }
            }
        });
    }

    // load from query/cookie param
    $(window).ready(function () {
        initSizechartSwitch();
    });
};
