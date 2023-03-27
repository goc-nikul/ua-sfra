import Component from '../core/Component';

var util = require('../../util');

export default class SortMobile extends Component {
    init() {
        this.settings = {
            openSortButton: '.js-sort-label',
            closeSortButton: '.js-sort-item',
            sortElement: '.js-mob_sort',
            oldSortElement: '[name=sort-order]',
            shownSortClass: 'm-show',
            noScrollBodyClass: 'm-dropdown-open',
            activeLabel: 'm-active',
            selectedItem: 'm-selected',
            hideClassBanner: 'hide'
        };

        this.initConfig(this.settings);

        if (this.eligibleOnDevice()) {
            this.initializeCache();
            this.initializeEvents();
        }
    }

    initializeCache() {
        this.cache = {};
        this.cache.$document = $(document);
        this.cache.$body = $('body');
        this.cache.$openSortButton = $(this.config.openSortButton, this.$el);
        this.cache.$closeSortButton = $(this.config.closeSortButton, this.$el);
        this.cache.$sortElement = $(this.config.sortElement, this.$el);
        this.cache.$oldSortElement = $(this.config.oldSortElement, this.$el);
    }

    mobileSortToggle() {
        this.cache.$sortElement.toggleClass(this.config.shownSortClass);
        this.cache.$body.toggleClass(this.config.noScrollBodyClass);
        this.cache.$openSortButton.toggleClass(this.config.activeLabel);
        util.branchCloseJourney();
    }

    onMobileSort(event) {
        const sortItem = $(event.target);
        this.cache.$oldSortElement.val(sortItem.data('value')).change();
        this.cache.$openSortButton.text(sortItem.text());
        this.cache.$sortElement.removeClass(this.config.shownSortClass);
        this.cache.$body.removeClass(this.config.noScrollBodyClass);
        this.cache.$openSortButton.removeClass(this.config.activeLabel);
        this.cache.$closeSortButton.removeClass(this.config.selectedItem);
        sortItem.addClass(this.config.selectedItem);
    }

    initializeEvents() {
        this.eventDelegate('click', this.settings.openSortButton, this.mobileSortToggle.bind(this));
        this.eventDelegate('click', this.settings.closeSortButton, this.onMobileSort.bind(this));
    }
}
