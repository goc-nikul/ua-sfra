/* global jQuery $ */
var headerMobileMenu = new test.Component('headerMobileMenu');

headerMobileMenu.add('eligibleOnDevice', function () {
    return this.eligibleOnDevice();
});

headerMobileMenu.add('initializedCache', function () {
    return this.cache && this.cache.$document
        && this.cache.$body && this.cache.$toggleMenuElement
        && this.cache.$menuContainer && this.cache.$menuOverlay
        && this.cache.$menuHeader && this.cache.$menuWrapper
        && this.cache.$menuTitle && this.cache.$listShow
        && this.cache.$listHide && this.cache.$menuClose
        && this.cache.$menuUtilityBlock && true;
});

headerMobileMenu.add('hasUninitializedEvents', function () {
    var expectedEvents = [
        `click:${this.config.toggleMenuElement}`,
        `click:${this.config.menuClose}`,
        `click:${this.config.listHide}`,
        `click:${this.config.listShow}`,
        'focusout'
    ];

    var checkedEvents = [];

    for (const listenedEvent of this.listeners) {
        var eventKey = typeof (listenedEvent[2]) === 'string' ? `${listenedEvent[1]}:${listenedEvent[2]}` : `${listenedEvent[1]}`;

        if (expectedEvents.indexOf(eventKey) > -1) {
            checkedEvents.push(eventKey);
        }
    }

    if (checkedEvents.length !== expectedEvents.length) {
        return `${expectedEvents.length - checkedEvents.length} of expected events is not added to listeners.`;
    }
    return false;
});

headerMobileMenu.add('mobileMenuOpen', function () {
    this.cache.$toggleMenuElement.click();

    var checkMenuContainerClass = this.cache.$menuContainer.hasClass(this.config.shownMenuClass);
    var checkMenuOverlayClass = this.cache.$menuOverlay.hasClass(this.config.shownMenuClass);
    var checkNoScrollClass = this.cache.$body.hasClass(this.config.noScrollClass);

    return checkMenuContainerClass && checkMenuOverlayClass && checkNoScrollClass;
});

headerMobileMenu.add('pullLeft', function () {
    var $currentElement = this.cache.$document.find(this.config.listItem + ':first');
    var $el = $currentElement.find(this.config.listShow + ':first');
    var nextListWrapper = $el.closest(this.config.listItem, this.$el).find(this.config.listWrapper).first();
    var catLevel = $el.data('level');

    $el.click();

    var subListHasActiveClass = nextListWrapper.hasClass(this.config.shownSubMenuClass);

    catLevel++;

    return `-${100 * catLevel}%` === this.cache.$menuWrapper[0].style.left && subListHasActiveClass;
});

headerMobileMenu.add('pullRight', function () {
    this.cache.$listHide.click();

    var subListHasNotActiveClass = this.$el.find('.' + this.config.shownSubMenuClass);

    return `${0}%` === this.cache.$menuWrapper[0].style.left && !!subListHasNotActiveClass;
});

headerMobileMenu.add('mobileMenuClose', function () {
    this.cache.$menuClose.click();

    var checkMenuContainerClass = this.cache.$menuContainer.hasClass(this.config.shownMenuClass);
    var checkMenuOverlayClass = this.cache.$menuOverlay.hasClass(this.config.shownMenuClass);
    var checkNoScrollClass = this.cache.$body.hasClass(this.config.noScrollClass);

    return !checkMenuContainerClass && !checkMenuOverlayClass && !checkNoScrollClass;
});

test.extend(headerMobileMenu);
