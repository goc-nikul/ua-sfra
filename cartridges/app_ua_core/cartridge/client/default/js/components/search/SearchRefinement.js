import Component from '../core/Component';

var util = require('../../util');

export default class SearchRefinement extends Component {
    init() {
        this.settings = {
            openFilterButton: '.js-open-filter',
            closeFilterButton: '.js-close-filter',
            filterClass: '.js-plp-sidebar',
            openSortButton: '.js-sort-label:not(.js-categories-label)',
            sortElement: '.js-mob_sort',
            shownClass: 'm-show',
            activeLabel: 'm-active',
            noScrollClass: 'm-no-scroll',
            dropdownOpenClass: 'm-dropdown-open'
        };

        this.initConfig(this.settings);

        this.initializeCache();
        this.initializeEvents();
    }

    initializeCache() {
        this.cache = {};
        this.cache.$document = $(document);
        this.cache.$body = $('body');
        this.cache.$openFilterButton = this.cache.$document.find(this.config.openFilterButton);
        this.cache.$filterElement = this.cache.$document.find(this.config.filterClass);
        this.cache.$closeFilterButton = this.cache.$document.find(this.config.closeFilterButton);
        this.cache.$openSortButton = this.cache.$document.find(this.config.openSortButton);
        this.cache.$sortElement = $(this.config.sortElement, this.$el);
    }

    mobileFilterOpen() {
        this.cache.$filterElement.addClass(this.config.shownClass);
        this.cache.$body.removeClass(this.config.dropdownOpenClass);
        this.cache.$body.addClass(this.config.noScrollClass);
        this.cache.$sortElement.removeClass(this.config.shownClass);
        this.cache.$openSortButton.toggleClass(this.config.activeLabel);
        util.branchCloseJourney();
    }

    mobileFilterClose() {
        this.cache.$filterElement.removeClass(this.config.shownClass);
        this.cache.$body.removeClass(this.config.noScrollClass);
        if ($('.js-mob_sort').is(':visible')) {
            this.cache.$body.addClass(this.config.dropdownOpenClass);
        }
    }

    initializeEvents() {
        this.event('click', this.mobileFilterOpen.bind(this), this.cache.$openFilterButton);
        this.eventDelegate('click', this.settings.closeFilterButton, this.mobileFilterClose.bind(this), this.cache.$document);
    }
}
