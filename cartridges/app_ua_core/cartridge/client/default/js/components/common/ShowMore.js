import Component from '../core/Component';

export default class ShowMore extends Component {
    init() {
        this.settings = {
            parent: '.js-refinements-parent'
        };

        this.initConfig(this.settings);
        this.initializeCache();
        this.initializeEvents();
    }

    initializeCache() {
        this.cache = {};
        this.cache.$parent = $(this.$el).closest(this.config.parent);
    }

    initializeEvents() {
        this.event('click', this.toggleList.bind(this), this.$el);
    }

    toggleList() {
        this.cache.$parent.toggleClass('m-collapsed');
    }
}
