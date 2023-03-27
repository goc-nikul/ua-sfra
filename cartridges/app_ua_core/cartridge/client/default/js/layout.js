'use strict';
const eventMgr = require('./components/core/eventMgr').default;
const emitter = eventMgr.getEmitter('window');

const util = require('./util');
const viewportWidth = {
    extraSmall: { maxWidth: 480 },
    small: { maxWidth: 767, minWidth: 320 },
    medium: { maxWidth: 1023, minWidth: 768 },
    large: { maxWidth: 1439, minWidth: 1024 }
};

var $cache = {};
var layout;
var initialized = false;
var currentHTMLClasses = '';
var deviceList;

/**
 * @description Adds jQuery objects to cache
 */
function initializeCache() {
    $cache = {
        $html: $('html')
    };
}

/**
 * @description Adding classes to html tag
 */
function addHTMLClasses() {
    deviceList = deviceList || Object.assign({}, device);
    currentHTMLClasses = Object.keys(Object.getPrototypeOf(deviceList)).filter((item) => {
        return deviceList[item]() ? 1 : 0;
    });
    $cache.$html.addClass(currentHTMLClasses.join(' '));
}

/**
 * @description removing classes from html tag
 */
function cleanupHTMLClasses() {
    currentHTMLClasses.forEach((currentValue) => {
        $cache.$html.removeClass(currentValue);
    });
}

/**
 * @description Binds events to DOM
 */
function initializeEvents() {
    var viewMode = layout.getMode();

    $(window).on('resize', util.eventDelay(() => {
        $(document).trigger('window.resize');
        emitter.emit('resize');
        var layoutView = layout.getMode();

        if (viewMode !== layoutView) {
            viewMode = layoutView;
            cleanupHTMLClasses();
            addHTMLClasses();
            $(document).trigger('window.modechanged', { mode: viewMode });
            emitter.emit('modechanged');
        }
    }, 500));

    $(window).on('scroll', util.eventDelay(() => {
        $(document).trigger('window.scroll', { scrollTop: $(this).scrollTop() });
        emitter.emit('scroll');
    }, 300));
}

layout = {
    getMode: function () {
        var windowWidth = window.innerWidth;

        if (windowWidth <= viewportWidth.extraSmall.maxWidth) {
            return 'extraSmall';
        } else if (windowWidth <= viewportWidth.small.maxWidth) {
            return 'small';
        } else if (windowWidth <= viewportWidth.medium.maxWidth) {
            return 'medium';
        } else if (windowWidth <= viewportWidth.large.maxWidth) {
            return 'large';
        }

        return 'extra-large';
    },
    getCurrentBreakpointWidth: function () {
        return viewportWidth[this.getMode()] && viewportWidth[this.getMode()].maxWidth;
    },
    isExtraSmallView: function () {
        return this.getMode() === 'extraSmall';
    },
    isSmallView: function () {
        return this.getMode() === 'small';
    },
    isMediumView: function () {
        return this.getMode() === 'medium';
    },
    isLargeView: function () {
        return this.getMode() === 'large';
    },
    isExtraLargeView: function () {
        return this.getMode() === 'extra-large';
    },
    isMobileView: function () {
        return this.isExtraSmallView() || this.isSmallView() || this.isMediumView();
    },
    init: function () {
        if (initialized) {
            return this;
        }

        require('./utils/device');
        initializeCache();
        addHTMLClasses();
        initializeEvents();
        initialized = true;
        return this;
    },
    isMobile: function () {
        return typeof device.mobile === 'function' && device.mobile();
    },
    isTablet: function () {
        return typeof device.tablet === 'function' && device.tablet();
    },
    isDesktop: function () {
        return typeof device.desktop === 'function' && device.desktop();
    },
    isIOS: function () {
        return typeof device.ios === 'function' && device.ios();
    },
    isAndroid: function () {
        return typeof device.android === 'function' && device.android();
    },
    isLandscape: function () {
        return typeof device.landscape === 'function' && device.landscape();
    },
    isPortrait: function () {
        return typeof device.portrait === 'function' && device.portrait();
    }
};

module.exports = layout;
