'use strict';

/**
 * Show a spinner inside a given element
 * @param {element} $target - Element to block by the veil and spinner.
 *                            Pass body to block the whole page.
 */
function addSpinner($target) {
    var $loader = $(`<ul class="b-loader">
                        <li class="b-loader-icon"></li>
                        <li class="b-loader-icon"></li>
                        <li class="b-loader-icon"></li>
                        <li class="b-loader-hidden_text">Loading</li>
                    </ul>`);
    if ($target.get(0).tagName === 'BODY') {
        $target.append($loader);
    } else if ($target.get(0).tagName === 'IMG') {
        $loader.addClass('m-absolute');
        $target.after($loader);
    } else {
        $target.append($loader);
    }
}

// element level spinner:
$.fn.spinner = function () {
    var $element = $(this);
    var Fn = function () {
        this.start = function () {
            if ($element.length) {
                addSpinner($element);
            }
        };
        this.stop = function () {
            if ($element.length) {
                $('.js-spinner').remove();
                $('.b-loader').remove();
            }
        };
    };
    return new Fn();
};

// page-level spinner:
$.spinner = function () {
    var Fn = function () {
        this.start = function () {
            addSpinner($('body'));
        };
        this.stop = function () {
            $('.js-spinner').remove();
            $('.b-loader').remove();
        };
    };
    return new Fn();
};
