/* global adobe, defined in Adobe Target */
import Component from '../core/Component';

var $mBoxID;
var $this;
export default class LoadProducts extends Component {
    init() {
        $this = this;
        $('.recommendations-section').each(function () {
            $mBoxID = $(this).attr('data-mboxID');
            if ($mBoxID) {
                $this.loadAdobeRecommendations($(this));
            } else {
                const products = $(this).data('products') + '';
                let url = $(this).data('productsUrl');
                if (products && url) {
                    const self = this;
                    const swatches = $(this).attr('data-swatches');
                    const ratings = $(this).attr('data-ratings');

                    url += url.indexOf('?') !== -1 ?
                        `&pids=${products}&swatches=${swatches}&ratings=${ratings}` :
                        `?pids=${products}&swatches=${swatches}&ratings=${ratings}`;

                    $(this).find('.js-swiper-wrapper').load(url, function () {
                        // Removing the product tile element if no image configured
                        $(self).find('.b-tile.hide').parent('.g-carousel-slide').remove();

                        $(self).find('[data-cmp=carousel]').trigger('mainCarousel:update');
                    });
                }
            }
        });
    }

    loadAdobeRecommendations($content) {
        const wrapper = $content.find('.js-swiper-wrapper');
        let url = $content.data('productsUrl');
        const mBoxID = $content.attr('data-mboxID');
        const pid = $('.m-slot_4').attr('data-styleid');
        const siteID = $content.attr('data-siteID');
        const swatches = $content.attr('data-swatches');
        const ratings = $content.attr('data-ratings');

        adobe.target.getOffer({
            mbox: mBoxID,
            params: {
                site: siteID,
                'entity.id': pid || '',
                at_property: window.targetPageParams().at_property
            },
            success: function (offers) {
                adobe.target.applyOffer({
                    mbox: mBoxID,
                    offer: offers
                });

                var styleIds = (offers[0] && offers[0].content && JSON.parse(offers[0].content)) || [];
                console.info('Style IDs: ' + styleIds);
                if (styleIds) {
                    url += url.indexOf('?') !== -1 ?
                        `&pids=${styleIds}&swatches=${swatches}&ratings=${ratings}` :
                        `?pids=${styleIds}&swatches=${swatches}&ratings=${ratings}`;

                    wrapper.load(url, function () {
                        // Removing the product tile element if no image configured
                        wrapper.find('.b-tile.hide').parent('.g-carousel-slide').remove();

                        wrapper.closest('[data-cmp=carousel]').trigger('mainCarousel:update');
                    });
                }
            },
            error: function (status, error) {
                console.error(status, error);
            }
        });
    }
}
