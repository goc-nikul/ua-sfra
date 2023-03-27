import InputSelect from './InputSelect';

const util = require('../../util');
const loadSelectricPlugin = () => util.loadScript('/lib/jquery/jquery.selectric.min.js');

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const emitter = eventMgr.getEmitter('customSelect');

export default class CustomSelect extends InputSelect {
    get configDefault() {
        return {
            disableOnMobile: false,
            nativeOnMobile: false,
            maxHeight: 200,
            customClass: {
                prefix: 'g-selectric',
                camelCase: false
            }
        };
    }

    init() {
        super.init();
        this.$body = $('body');
        this.initEvents();
    }

    async initEvents() {
        await loadSelectricPlugin();
        if (this.$el.parents('.g-selectric-container').hasClass('b-cancelReasons-selectric')) {
            this.config.maxHeight = 700;
        }
        this.$el.selectric(this.config);
        emitter.emit('inited');

        this.$el.on('change', this.onChange.bind(this));
        this.event('Update:CustomSelect', this.update.bind(this), this.$body);

        // Add a hidden label around the selectric input for accessibility.
        this.$el.parents('.g-selectric-wrapper').find('.g-selectric-input').wrap("<label class='g-selectric-input' aria-hidden='true'>Hidden Label</label>");
    }

    onChange() {
        this.$el.trigger('focusout');
        this.$el.selectric('refresh');
    }

    update() {
        this.$el.selectric('refresh');
        emitter.emit('updated');
    }
}
