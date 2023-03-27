import Component from '../core/Component';
import { scrollTo } from '../../util';

export default class BackToTop extends Component {
    init() {
        this.settings = {
            backToTopBottomElement: '.js-back_to_top-button',
            footer: '.js-footer',
            shownClass: 'm-shown',
            animationSpeed: 700
        };

        this.initConfig(this.settings);

        if (this.eligibleOnDevice()) {
            this.initializeCache();
            this.initializeEvents();
        }
    }

    initializeCache() {
        this.cache = {};
        this.cache.$window = $(window);
        this.cache.$document = $(document);
        this.cache.$footer = this.cache.$document.find(this.config.footer);
        this.cache.$backToTopBottomElement = this.cache.$document.find(this.config.backToTopBottomElement);
    }

    onWindowScroll() {
        var scrollTop = this.cache.$window.scrollTop();
        var windowInnerHeight = this.cache.$window.innerHeight();

        this.$el.toggleClass('m-shown', scrollTop > windowInnerHeight);
    }

    onClick() {
        scrollTo(0, this.config.animationSpeed);
    }

    initializeEvents() {
        this.eventMgr('window.scroll', this.onWindowScroll.bind(this));
        this.event('click', this.onClick.bind(this), this.cache.$backToTopBottomElement);
    }
}
