import Component from '../core/Component';
import 'sticky-kit/dist/sticky-kit';

export default class StickyElements extends Component {
    init() {
        this.settings = {
            parent: '#bodyPage',
            inner_scrolling: true,
            sticky_class: 'm-sticky',
            offset_top: 0,
            spacer: null,
            bottoming: true,
            recalc_every: null,
            affectingElements: null
        };

        // eslint-disable-next-line
        // TODO: https://github.com/leafo/sticky-kit/issues/179
        this.initConfig(this.settings);
        if (this.eligibleOnDevice()) {
            if (this.$el.outerHeight() <= window.innerHeight) {
                this.adjustAffectingElements();

                if (!this.config.disabledStickyKit) {
                    this.$el.stick_in_parent(this.config);
                    this.eventMgr('gdpr.closed', this.reinit);
                    this.eventMgr('gdpr.shown', this.reinit);
                    this.eventMgr('stickykit.update', this.reinit.bind(this));
                    this.eventMgr('address.addresslist.show', this.init.bind(this));
                    this.eventMgr('address.addresslist.less', this.reinit.bind(this));
                    this.eventMgr('address.addressform.toggle', this.reinit.bind(this));
                }

                this.eventMgr('window.scroll', this.stickyToggle.bind(this));
                this.eventMgr('window.modechanged', this.stickyToggle.bind(this));
                this.eventMgr('window.resize', this.stickyToggle.bind(this));
                this.eventMgr('stickykit.update', this.stickyToggle.bind(this));
                $(document).on('load', this.stickyToggle.bind(this));
            }
        }

        this.eventMgr('window.resize', this.reinit.bind(this));
    }

    stickyToggle() {
        this.$el.trigger('sticky_kit:recalc');

        if (this.config.stickyHideElements) {
            var stickyHideElementsPosition = $(this.config.stickyHideElements).offset().top - $(window).outerHeight();
            var stickyParentHeight = $(this.config.parent).offset().top - this.config.offset_top;

            if ((window.pageYOffset >= stickyParentHeight) && (window.pageYOffset < stickyHideElementsPosition)) {
                this.$el.addClass('is-sticky');
            } else {
                this.$el.removeClass('is-sticky');
            }
        }
    }

    reinit() {
        this.$el.trigger('sticky_kit:detach');
        this.$el.data('sticky_kit', false);

        setTimeout(() => {
            if (this.eligibleOnDevice()) {
                this.adjustAffectingElements();
                this.$el.stick_in_parent(this.config);
            }
        }, 0);
    }

    updateSettings() {
        this.config.offset_top = this.stickyHeaderOffsetTop();
    }

    adjustAffectingElements() {
        this.config.offset_top = 0;
        if (this.config.affectingElements) {
            $(this.config.affectingElements).each(this.increaseOffsetTop.bind(this));
        }
    }

    increaseOffsetTop(index, element) {
        if ($(element).length && $(element).is(':visible')) {
            this.config.offset_top += $(element).outerHeight();
        }
    }
}
