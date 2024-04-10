import Component from '../core/Component';
import Swiper from 'swiper/bundle';

var layout = require('../../layout').init();

var slidesPerViewPort;
var spaceBetween;
var spaceBetweenFitGuide;
var sliderPerViewDefault;

export default class Carousel extends Component {
    init() {
        slidesPerViewPort = 1;
        spaceBetween = 1;
        spaceBetweenFitGuide = 32;
        sliderPerViewDefault = 4;
        if ($('.b-cart-content.cart').length > 0 || $('.b-account-dashboard_recommended').length > 0 || $('.js-csrf-fail-carousel').length > 0) {
            slidesPerViewPort = 3;
        }

        if ($('.b-account-dashboard_recommended').length > 0) {
            spaceBetween = 16;
        }

        if ($('.fitguide-container').length > 0) {
            spaceBetweenFitGuide = 0;
            if ($(window).width() > 767) {
                sliderPerViewDefault = 3;
            } else if ($(window).width() > 480 && $(window).width() < 768) {
                sliderPerViewDefault = 1;
            }
        }

        this.settings = {
            blank: {},
            default: {
                direction: 'horizontal',
                loop: false,
                navigation: {
                    nextEl: '.js-swiper-button-next',
                    prevEl: '.js-swiper-button-prev'
                },
                slidesPerView: slidesPerViewPort,
                spaceBetween: spaceBetween,
                breakpoints: {
                    // Swiper breakpoint configs are applied when the viewport width >= the object key
                    767: {
                        slidesPerView: sliderPerViewDefault,
                        spaceBetween: spaceBetweenFitGuide
                    }
                }
            },
            pdpMainImage: {
                direction: 'horizontal',
                loop: false,
                draggable: false,
                simulateTouch: false,
                navigation: {
                    nextEl: '.js-swiper-button-next',
                    prevEl: '.js-swiper-button-prev'
                },
                breakpoints: {
                    // Swiper breakpoint configs are applied when the viewport width >= the object key
                    1023: {
                        draggable: true,
                        simulateTouch: true
                    }
                },
                pagination: {
                    el: '.b-product_carousel-pagination',
                    clickable: true,
                    dynamicBullets: true,
                    dynamicMainBullets: 3
                },
                slidesPerView: 1,
                spaceBetween: 1
            },
            shopImage: {
                direction: 'horizontal',
                loop: false,
                navigation: {
                    nextEl: '.js-swiper-button-next',
                    prevEl: '.js-swiper-button-prev'
                },
                slidesPerView: 2,
                spaceBetween: 12,
                breakpoints: {
                    // Swiper breakpoint configs are applied when the viewport width >= the object key
                    640: {
                        slidesPerView: 3,
                        spaceBetween: 16
                    }
                }
            }
        };

        this.initConfig(this.settings[this.$el.data('carousel-type')] || this.settings.default);
        if (this.eligibleOnDevice() && (this.hasSlides() || this.config.initWithLowQty)) {
            this.$el.removeClass('is--hidden');
            this.$el.find('.js-carousel-title').removeClass('is--hidden');

            if (this.$el.closest('.hidden').length > 0 || !(this.hasSlidesToScroll() || this.config.initWithLowQty)) {
                if (this.$el[0].swiper && this.$el[0].initialized) {
                    this.$el[0].swiper.destroy(this.$el[0], true);
                }
                this.$el.addClass('carousel-disabled');
            } else {
                this.$el.removeClass('carousel-disabled');
                this.initCarousel();
                this.eventMgr('window.modechanged', this.reInit);
                this.event('mainCarousel:update', this.mainCarouselInit.bind(this), this.$el);
            }
        } else {
            this.initializationDeclined();
        }
    }

    mainCarouselInit() {
        if (this.swiperInstance) {
            this.swiperInstance.destroy(this.swiperInstance, true);
            this.initCarousel();
            this.swiperInstance.update();
            if (this.$el.closest('.sf-page__silho').length > 0 && $(window).width() > 767) {
                this.swiperInstance.destroy(this.swiperInstance, true);
            }
            return;
        }
    }

    reInit() {
        if (this.swiperInstance) {
            if (this.config.destroyOnModeChange) {
                this.swiperInstance.destroy(this.swiperInstance, true);
                this.initCarouselEvents(true);
            } else {
                this.swiperInstance.update();
                return;
            }
        }
    }

    initCarousel() {
        var slideToSwiper = this.$el.find('.swiper-slide-active').index();
        var activatedSpan = this.$el.find('.swiper-slide-activated');
        if (activatedSpan.length) {
            this.config.activeIndex = activatedSpan.index();
            this.config.initialSlide = activatedSpan.index();
        }
        this.swiperInstance = new Swiper(this.$el[0], this.config);
        this.swiperInstance.on('slideChange', function () {
            if (this.$el.hasClass('js-main-image-carousel')) {
                var dataSpec = this.$el.find('.js-product_carousel-slide[data-index="' + this.activeIndex + '"]').attr('data-spec');
                $('body').find('.model-specification-content').removeClass('hide');
                if (dataSpec && dataSpec === 'notSame') {
                    $('body').find('.model-specification-content').addClass('hide');
                }
            }
            var activeSpan = this.$el.find('.swiper-slide-activated');
            if (activeSpan.length) {
                this.activeIndex = activeSpan.index();
            }
        });

        this.swiperInstance.on('beforeSlideChangeStart', function () {
            var activeSpan = this.$el.find('.swiper-slide-activated');
            if (activeSpan.length) {
                this.activeIndex = activeSpan.index();
            }
        });

        this.swiperInstance.on('reachBeginning', function () {
            this.$el.removeClass('reach-end').addClass('reach-beginning');
        });

        this.swiperInstance.on('reachEnd', function () {
            this.$el.removeClass('reach-beginning').addClass('reach-end');
        });

        this.initCarouselEvents();
        if (this.$el.closest('.sf-page__silho').length > 0) {
            if (activatedSpan.length) {
                slideToSwiper = activatedSpan.index();
                this.swiperInstance.activeIndex = slideToSwiper;
            }
            this.swiperInstance.slideTo(slideToSwiper, 200, true);
        }
    }

    hasSlidesToScroll() {
        let currentBreakpointWidth = layout.getCurrentBreakpointWidth();
        let slidesPerView = this.config.slidesPerView || 1;
        let slidesCount = this.$el.find('.swiper-slide:not(.swiper-slide-duplicate)').length;

        if (slidesPerView === 'auto') {
            return this.$el[0].scrollWidth > this.$el[0].clientWidth || this.$el[0].scrollHeight > this.$el[0].clientHeight;
        }
        if (this.config.breakpoints && this.config.breakpoints[currentBreakpointWidth] &&
            this.config.breakpoints[currentBreakpointWidth].slidesPerView) {
            slidesPerView = this.config.breakpoints[currentBreakpointWidth].slidesPerView;
        }


        return slidesPerView < slidesCount;
    }

    hasSlides() {
        return this.$el.find('.swiper-slide:not(.swiper-slide-duplicate)').length > 0;
    }

    autoplayHandler(detachEvents) {
        if (!this.swiperInstance || !this.swiperInstance.autoplay || !this.config.autoplay) {
            return;
        }

        if (detachEvents) {
            this.$el.off('mouseenter');
            this.$el.off('mouseleave');
        } else {
            this.$el.on('mouseenter', () => {
                this.swiperInstance.autoplay.stop();
            });
            this.$el.on('mouseleave', () => {
                this.swiperInstance.autoplay.start();
            });
        }
    }

    initCarouselEvents(attachEvents) {
        this.autoplayHandler(attachEvents);
        const self = this;
        $('body').on('carousel:reinit', () => {
            self.reInit();
        });
    }
}
