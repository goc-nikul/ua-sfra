import Component from '../core/Component';

/* eslint-disable consistent-return */

export default class InputGeneric extends Component {
    init() {
        super.init();
        this.$field = this.$el.find('.js-input_field');
        this.$label = this.$el.find('.js-input-label');

        this.event('change', this.update, this.$field);
        this.event('paste', () => {
            setTimeout(this.update.bind(this), 10);
        }, this.$field);

        this.initValue = this.getValue();
        if (!this.id && this.$field.first().attr('name')) {
            this.id = this.$field.first().attr('name');
        }

        this.shown = true;
        this.disabled = false;
        this.skipValidation = false;

        this.disableEnterSubmit();
    }

    getValue() {
        return this.$field.val();
    }

    disableEnterSubmit() {
        if (this.config.disableEnterSubmit) {
            this.event('keydown', '.js-input_field', (el, ev) => {
                if (ev && ev.keyCode === 13) {
                    ev.preventDefault();
                    return false;
                }
            });
        }
    }

    preventEmptyString() {
        if ((typeof this.$field.val()) === 'string' && !this.$field.val().match(/\S/)) {
            this.$field.val('');
        }
    }

    update() {
        this.preventEmptyString();
        this.emitter.emit('change', this);
    }
}
