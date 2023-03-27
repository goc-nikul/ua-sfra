var processInclude = require('base/util');
processInclude(require('../../product/quickView'));

import Component from '../core/Component';

export default class ProductTile extends Component {

    init() {
        if (this.eligibleOnDevice()) {
            this.settings = {
                mainImage: '.js-tile-carousel_image',
                swatchesWrapper: '.js-tile-swatches',
                swatchSelector: '.js-swatch-link'
            };
            this.rolloverDelay = 100; // ms
            this.rolloverToken = null;

            this.initConfig(this.settings);
            this.initializeCache();
            this.initializeEvents();
        }
    }

    initializeCache() {
        this.cache = {};
        this.cache.$mainImage = $(this.config.mainImage, this.$el);
        this.cache.$swatchesWrapper = $(this.config.swatchesWrapper, this.$el);
        this.cache.$defaultImage = this.cache.$mainImage.data('src');
    }

    rollover(event) {
        this.rolloverToken = setTimeout(function () {
            this.rolloverToken = null; // clear the timeout
            this.changeImage(event);
        }.bind(this), this.rolloverDelay);
    }

    changeImage(event) {
        let $swatch = $(event.target);
        let swatchImageUrl = $swatch.data('rollover') || $swatch.data('product-img'); // rollover: main img; product-img: swatches
        if (swatchImageUrl) {
            this.cache.$mainImage[0].src = swatchImageUrl;
        }
    }

    changeToDefault() {
        clearTimeout(this.rolloverToken);
        this.cache.$mainImage[0].src = this.cache.$defaultImage;
    }

    initializeEvents() {
        this.eventDelegate('mouseenter', this.settings.mainImage, this.rollover.bind(this));
        this.eventDelegate('mouseleave', this.settings.mainImage, this.changeToDefault.bind(this));
        this.eventDelegate('mouseenter', this.settings.swatchSelector, this.changeImage.bind(this), this.cache.$swatchesWrapper);
        this.eventDelegate('mouseleave', this.settings.swatchesWrapper, this.changeToDefault.bind(this));
        this.eventDelegate('click', this.settings.swatchSelector, this.changeImage.bind(this), this.cache.$swatchesWrapper);
    }
}
