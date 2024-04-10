'use strict';

const browserSpescificEvents = require('./browserSpescificEvents');
const scrollBlock = require('./scrollBlock');
const bootstrap = require('./bootstrap');

var $cache = {};

/**
* @description initialize Cache
*/
function initializeCache() {
    $cache.document = $(document);
    $cache.window = $(window);
    $cache.html = $('html');
    $cache.body = $('body');
}

/**
* @description Add Accessibility Listeners
*/
function initializeAccessibilityListeners() {
    $cache.document
        // Add class for disabling focus styles during mouse use
        .on('keyup', function (e) {
            if (e.keyCode === 9) { // check on Tab press key
                $cache.body.addClass('m-accessible-on');
            }
            if (e.keyCode === 27) { // check on Escape press key
                $cache.body.removeClass('gallery-show');
            }
        })
        .on('mousedown', function () {
            $cache.body.removeClass('m-accessible-on');
        })
        // Simulate click event for Enter key press
        .on('keyup', '[role="button"]', function (e) {
            if (e.keyCode === 13) {
                $(this).click();
            }
        });
}

module.exports = {
    init: function () {
        initializeCache();
        initializeAccessibilityListeners();
        browserSpescificEvents.init();
        scrollBlock.init();
        bootstrap.modalEvents();
    }
};
