/* eslint-disable no-console */
'use strict';

const page = {
    ns: window.pageContext.ns
};
const componentsConfig = require('./components-config');
const config = componentsConfig.configuration;
const references = componentsConfig.references;

/**
 * @description Specific page components getter
 * @param {string} name, component Name
 * @returns {Object} config for current page
 */
function getPageComponents(name) {
    return (name && config[name] && config[name].components) || {};
}

/**
 * @description init one component
 *
 * @param {Object} Module, Component instance
 * @param {Object} configuration, current component configuration
 * @param {string} name, component name
 * @param {Object} $container, jQuery object, container to search components in
 */
function initComponent(Module, configuration, name, $container) {
    var $elements;

    $elements = ($container || $(document)).find(`[data-cmp="${name}"]`);

    $elements.each(function () {
        var $el = $(this);

        if (!$el.data('cmp-instance')) {
            var cmp = new Module(this, configuration);

            cmp.items = [];
            $el.addClass('js-cmp-inited ' + (name ? 'js-cmp-' + name : '')).data('cmp-instance', cmp);
            cmp.init.call(cmp);
        }
    });
}

/**
 * @description init all components
 * @param {Object} $container, optional parameter, container to search components in
 */
function initComponents($container) {
    var components = $.extend({}, getPageComponents('global'), getPageComponents(page.ns));

    Object.keys(components).forEach((name) => {
        if (!components[name].disabled) {
            try {
                initComponent.call(null, references[name], components[name].options, name, $container);
            } catch (e) {
                console.error(e);
            }
        }
    });
}

/**
 * @description init all components manager events
 */
function initEvents() {
    $('body').on('components:init', () => {
        initComponents();
    });
}

$(document).ajaxStop(() => {
    setTimeout(function () {
        initComponents();
    }, 300);

    $.spinner().stop();
});

module.exports = {
    init: function () {
        initEvents();
        initComponents();
    }
};
