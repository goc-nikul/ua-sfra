import Component from '../core/Component';
var layout = require('../../layout').init();
import util from '../../util';

export default class HeaderMobileMenu extends Component {
    init() {
        this.settings = {
            toggleMenuElement: '.js-hamburger',
            menuContainer: '.js-header-menu-container',
            menuOverlay: '.js-header-menu-overlay',
            menuClose: '.js-menu-close',
            menuHeader: '.js-header-menu',
            listShow: '.js-list-show',
            accountListShow: '.js-account-list-show',
            listHide: '.js-list-hide',
            menuWrapper: '.js-header-menu-wrapper',
            listWrapper: '.js-list-wrapper',
            menuTitle: '.js-menu-title',
            listItem: '.js-list-item',
            sectionTitle: '.js-menu-section-title',
            menuListLink: '.js-menu-list-link',
            menuUtilityBlock: '.js-header-utility',
            openSortButton: '.js-sort-label',
            sortElement: '.js-mob_sort',
            shownMenuClass: 'm-menu-show',
            shownSubMenuClass: 'm-show',
            noScrollClass: 'm-no-scroll',
            subCategoryListClass: 'm-subcategory-list',
            fixedPositionClass: 'm-position-fixed',
            activeLabel: 'm-active',
            noScrollBodyClass: 'm-dropdown-open',
            shownClass: 'm-show'
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
        this.cache.$toggleMenuElement = this.cache.$document.find(this.config.toggleMenuElement);
        this.cache.$menuContainer = this.cache.$document.find(this.config.menuContainer);
        this.cache.$menuOverlay = this.cache.$document.find(this.config.menuOverlay);
        this.cache.$menuHeader = this.cache.$document.find(this.config.menuHeader);
        this.cache.$menuWrapper = this.cache.$document.find(this.config.menuWrapper);
        this.cache.$menuTitle = this.cache.$document.find(this.config.menuTitle);
        this.cache.$listShow = this.cache.$document.find(this.config.listShow);
        this.cache.$listHide = this.cache.$document.find(this.config.listHide);
        this.cache.$menuClose = this.cache.$document.find(this.config.menuClose);
        this.cache.$menuUtilityBlock = this.cache.$document.find(this.config.menuUtilityBlock);
        this.cache.$openSortButton = this.cache.$document.find(this.config.openSortButton);
        this.cache.$sortElement = this.cache.$document.find(this.config.sortElement);

        this.currentCat = this.cache.$menuTitle.data('menu-title');
        this.currentLevel = 0;
        this.prevCat = '';

        this.lastTargetList = null;
        this.scrollPosition = null;
    }

    mobileMenuOpen() {
        this.scrollPosition = this.cache.$document.scrollTop();
        this.cache.$menuContainer.addClass(this.config.shownMenuClass);
        this.cache.$menuOverlay.addClass(this.config.shownMenuClass);
        this.cache.$body.addClass(this.config.noScrollClass);
        this.cache.$body.removeClass(this.config.noScrollBodyClass);
        this.cache.$sortElement.removeClass(this.config.shownClass);
        this.cache.$openSortButton.toggleClass(this.config.activeLabel);
        this.cache.$body.css('top', '-' + this.scrollPosition + 'px');
        if (this.currentLevel === 0) {
            this.cache.$menuUtilityBlock.addClass(this.config.fixedPositionClass);
        }
        util.branchCloseJourney();
    }

    mobileMenuClose() {
        this.cache.$menuContainer.removeClass(this.config.shownMenuClass);
        this.cache.$menuOverlay.removeClass(this.config.shownMenuClass);
        this.cache.$body.removeClass(this.config.noScrollClass);
        this.cache.$menuUtilityBlock.removeClass(this.config.fixedPositionClass);
        this.cache.$body.css('top', '0');
        this.cache.$document.scrollTop(this.scrollPosition);
    }

    pullLeft(el, event) {
        if (layout.isMobileView()) {
            event.preventDefault();
        }

        if (layout.isTablet() && layout.isLandscape()) {
            if ($(event.currentTarget).data('level') === 0) {
                event.preventDefault();
            }
            this.mobileMenuOpen();
            this.lastTargetList = this.$el.find(`${this.config.listWrapper}[data-cat='${this.currentCat}']`);
            this.lastTargetList.removeClass(this.config.shownSubMenuClass);
            this.lastTargetList.parents(this.config.listWrapper).removeClass(this.config.shownSubMenuClass);
        }

        var $el = $(event.currentTarget);
        var catData = $el.data('cat');
        var nextListWrapper = $el.closest(this.config.listItem, this.$el).find(this.config.listWrapper).first();
        var currentLevel = $el.data('level');

        this.currentCat = catData;
        this.currentLevel = currentLevel;
        this.currentLevel++;

        if (this.currentLevel > 0) {
            this.cache.$menuHeader.addClass(this.config.subCategoryListClass);
            this.cache.$menuUtilityBlock.removeClass(this.config.fixedPositionClass);
        }

        nextListWrapper.addClass(this.config.shownSubMenuClass);

        this.cache.$menuWrapper.css('left', `-${100 * this.currentLevel}%`);
    }

    toggleSub(el, event) {
        if (layout.isMobileView()) {
            event.preventDefault();
        }

        var $el = $(event.currentTarget);
        var $parentListItem = $el.closest(this.config.listItem, this.$el);

        if ($parentListItem.hasClass(this.config.shownSubMenuClass)) {
            $parentListItem.removeClass(this.config.shownSubMenuClass);
        } else {
            $parentListItem.addClass(this.config.shownSubMenuClass);
        }
    }

    pullRight() {
        var $targetList = this.$el.find(`${this.config.listWrapper}[data-cat='${this.currentCat}']`);

        this.currentLevel--;

        if (this.currentLevel === 0) {
            this.cache.$menuHeader.removeClass(this.config.subCategoryListClass);
            this.cache.$menuUtilityBlock.addClass(this.config.fixedPositionClass);
        }

        this.cache.$menuWrapper.css('left', `-${100 * this.currentLevel}%`);

        $targetList.removeClass(this.config.shownSubMenuClass);

        var $targetLink = this.$el.find(`${this.config.listShow}[data-cat='${this.currentCat}']`);
        var $prevList = $targetLink.closest(this.config.listWrapper, this.$el);

        this.prevCat = $prevList.data('cat');

        this.currentCat = this.prevCat;
    }

    updateShopAllUrl() {
        $('.b-shopall_link').each(function () {
            var shopAllParam = $(this).data('shopall-attr');
            var shopAllUrl = $(this).attr('href');
            $(this).attr('href', util.appendParamToURL(shopAllUrl, shopAllParam, true));
        });
    }

    initializeEvents() {
        this.eventDelegate('click', this.config.toggleMenuElement, this.mobileMenuOpen.bind(this), this.cache.$document);
        this.eventDelegate('click', this.config.menuClose, this.mobileMenuClose.bind(this), this.cache.$document);

        var firstLevelListShow = `${this.config.menuWrapper} > ${this.config.listWrapper} > ${this.config.listItem} > ${this.config.listShow}`;
        var secondLevelListToggle = `${this.settings.listItem} ${this.settings.listItem} ${this.settings.listShow}`;
        var firstLevelListHide = `${this.config.menuHeader} ${this.config.listHide}`;
        this.eventDelegate('click', firstLevelListHide, this.pullRight.bind(this), this.cache.$document);
        this.eventDelegate('click', firstLevelListShow, this.pullLeft.bind(this, this.$el), this.cache.$document);
        this.eventDelegate('click', this.config.accountListShow, this.pullLeft.bind(this, this.$el), this.cache.$document);
        this.eventDelegate('click', secondLevelListToggle, this.toggleSub.bind(this, this.$el), this.cache.$document);

        this.event('focusout', () => {
            if (layout.isTablet() && layout.isLandscape()) {
                this.mobileMenuClose.call(this);
            }
        });
        if ($(window).width() < 1024) {
            this.updateShopAllUrl();
        }
    }
}
