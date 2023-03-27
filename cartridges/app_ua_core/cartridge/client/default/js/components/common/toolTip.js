'use strict';

module.exports = function () {
    $('.js-tooltip-icon').on('mouseenter focusin', function () {
        var $window = $(window);
        var $this = $(this);
        var $outerWrapper = $this.closest('.js-tooltip-content');
        var $tooltipText = $outerWrapper.find('.js-tooltip-text');
        var $buttonHeight = $('.next-step-button');
        var scrollTop = $window.scrollTop();
        var windowHeight = $window.height();
        var wrapperPosX = $outerWrapper.offset().top;
        var wrapperHeight = $outerWrapper.outerHeight();
        var fitsDown = $(window).width() > 1023 ? (wrapperPosX + wrapperHeight + $tooltipText.outerHeight()) <= (scrollTop + windowHeight) : (wrapperPosX + wrapperHeight + $tooltipText.outerHeight() + $buttonHeight.outerHeight()) <= (scrollTop + windowHeight);
        var fitsAbove = $(window).width() > 1023 ? (wrapperPosX - $tooltipText.outerHeight()) > scrollTop : (wrapperPosX - $tooltipText.outerHeight() - $buttonHeight.outerHeight()) > scrollTop;
        var renderAbove = !fitsDown && fitsAbove;
        var renderBelow = !renderAbove;

        $outerWrapper.toggleClass('top', renderAbove);
        $outerWrapper.toggleClass('bottom', renderBelow);
    });

    $('.js-tooltip-icon').on('mouseleave focusout', function () {
        $(this).closest('.js-tooltip-content').removeClass('top bottom');
    });
};
