import Component from '../core/Component';
import { scrollTo } from '../../util';

var util = require('../../util');

export default class SearchMobile extends Component {
    init() {
        this.settings = {
            openSearchButton: '.js-search-toggle',
            searchClose: '.js-search-close',
            shownSearchClass: 'm-search-show',
            noScrollClass: 'm-no-scroll'
        };

        this.initConfig(this.settings);
        this.initializeCache();
        this.initializeEvents();
    }

    initializeCache() {
        this.cache = {};
        this.cache.$document = $(document);
        this.cache.$body = $('body');

        this.scrollPosition = null;
    }

    mobileSearchOpen() {
        util.branchCloseJourney();
        this.scrollPosition = this.cache.$document.scrollTop();

        this.$el.addClass(this.config.shownSearchClass);
        this.cache.$body.addClass(this.config.noScrollClass);
    }

    mobileSearchClose() {
        this.$el.removeClass(this.config.shownSearchClass);
        this.cache.$body.removeClass(this.config.noScrollClass);

        scrollTo(this.scrollPosition, 0);
    }

    initializeEvents() {
        this.eventDelegate('click', this.config.openSearchButton, this.mobileSearchOpen.bind(this), this.cache.$document);
        this.eventDelegate('click', this.config.searchClose, this.mobileSearchClose.bind(this), this.cache.$document);
    }
}
