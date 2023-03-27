import Component from '../core/Component';

export default class HeaderMenuAccessibility extends Component {
    init() {
        this.settings = {
            menuLevel1: '.js-accessibility-nav',
            menuLevel2: '.js-accessibility-navLevel2',
            menuLevel3: '.js-accessibility-navLevel3',
            menuItemLevel1: '.js-accessibility-nav-item',
            menuItemLevel2: '.js-accessibility-navLevel2-item',
            menuLinkLevel1: '.js-accessibility-nav-link',
            menuLinkLevel2: '.js-accessibility-navLevel2-link',
            menuLinkLevel3: '.js-accessibility-navLevel3-link'
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
    }

    keydownEvent(event) {
        var $el = $(event.currentTarget);
        var $nav = $el.parents(this.config.menuLevel1);
        var $navItem = $el.parents(this.config.menuItemLevel1);
        var $parentItem = $el.parents(this.config.menuItemLevel1);
        var $navItemPrev = $navItem.prevAll(this.config.menuItemLevel1 + ':first').find(this.config.menuLinkLevel1);
        var $navItemNext = $navItem.nextAll(this.config.menuItemLevel1 + ':first').find(this.config.menuLinkLevel1);
        var $subNav = $el.next(this.config.menuLevel2);

        /* eslint-disable default-case, no-fallthrough */
        switch (event.keyCode) {
            case 39:
                // if we are on last => activate first
                if ($navItem.is(this.config.menuItemLevel1 + ':last')) {
                    $nav.find(this.config.menuItemLevel1 + ':first').children(this.config.menuLinkLevel1).focus();
                } else {
                    // else activate next
                    $navItemNext.focus();
                }
                event.preventDefault();

                break;
            case 37:
                // if we are on first => activate last
                if ($navItem.is(this.config.menuItemLevel1 + ':first')) {
                    $nav.find(this.config.menuItemLevel1 + ':last').children(this.config.menuLinkLevel1).focus();
                } else {
                    // else activate previous
                    $navItemPrev.focus();
                }
                event.preventDefault();

                break;
            case 40:
                // select first nav-system-subNav-link
                if ($subNav.length === 1) {
                    // if subMenu has been closed => reopen
                    $subNav.find(this.config.menuItemLevel2 + ':first').children(this.config.menuLinkLevel2).focus();
                }
                event.preventDefault();

                break;

            case 9 && event.shiftKey:
                // if on first
                var $prevNavLink = $parentItem.prev(this.config.menuItemLevel1).children(this.config.menuLinkLevel1);
                var $subNavPrev = $prevNavLink.next(this.config.menuLevel2);

                // hide current subNav, show previous and select last element
                if ($subNavPrev.length === 1) {
                    $subNavPrev.find(this.config.menuItemLevel2 + ':last-child').children(this.config.menuLinkLevel2).focus();
                    event.preventDefault();
                }

                break;
        }
        /* eslint-enable default-case, no-fallthrough */
    }

    keydownEventSubList(event) {
        var $el = $(event.currentTarget);
        var $navItem = $el.parents(this.config.menuItemLevel1);
        var $subNav = $el.parents(this.config.menuLevel2);
        var $prevSubNavItem = $el.parents(this.config.menuItemLevel2).prev();
        var $nextSubNavItem = $el.parents(this.config.menuItemLevel2).next();
        var $firstSubNavItem = $subNav.find(this.config.menuItemLevel2).first();
        var $lastSubNavItem = $subNav.find(this.config.menuItemLevel2).last();

        /* eslint-disable default-case, no-fallthrough */
        switch (event.keyCode) {
            case 39:
                // if we are on last => activate first
                if (!$nextSubNavItem.hasClass('js-accessibility-navLevel2-item')) {
                    $firstSubNavItem.children(this.config.menuLinkLevel2).focus();
                } else {
                    // else activate next
                    $nextSubNavItem.children(this.config.menuLinkLevel2).focus();
                }
                event.preventDefault();

                break;
            case 37:
                // if we are on first => activate last
                if (!$prevSubNavItem.hasClass('js-accessibility-navLevel2-item')) {
                    $lastSubNavItem.children(this.config.menuLinkLevel2).focus();
                } else {
                    // else activate previous
                    $prevSubNavItem.children(this.config.menuLinkLevel2).focus();
                }
                event.preventDefault();

                break;
            case 38:
                $navItem.find(this.config.menuLinkLevel1).focus();
                event.preventDefault();

                break;
            case 40:
                $el.next().find(this.config.menuLinkLevel3).first().focus();
                event.preventDefault();

                break;
        }
        /* eslint-enable default-case, no-fallthrough */
    }

    keydownEventSubItem(event) {
        var $el = $(event.currentTarget);
        var $subMenu = $el.parents(this.config.menuLevel3);
        var $subMenuItemLink = $subMenu.prev(this.config.menuLinkLevel2);
        var $subMenuItem = $subMenuItemLink.parent(this.config.menuItemLevel2);
        var $nextSubMenuItem = $subMenuItem.next();
        var $prevSubMenuItem = $subMenuItem.prev();
        var $nextSubMenuItemSubLinks = $nextSubMenuItem.find(this.config.menuLinkLevel3);
        var $prevSubMenuItemSubLinks = $prevSubMenuItem.find(this.config.menuLinkLevel3);
        var $allSubLinks = $subMenu.find('a:visible');
        var $currentSubLink = $subMenu.find($el);
        var $currentIndex = $allSubLinks.index($currentSubLink);
        var $lastSubMenuItem = $el.parents(this.config.menuLevel2).find(this.config.menuLevel3).last().find(this.config.menuLinkLevel3);
        var $firstSubMenuItem = $el.parents(this.config.menuLevel2).find(this.config.menuLevel3).first().find(this.config.menuLinkLevel3);

        /* eslint-disable default-case, no-fallthrough */
        switch (event.keyCode) {
            case 39:
                // if we are on last => activate first
                if (!$nextSubMenuItem.hasClass('js-accessibility-navLevel2-item') && $nextSubMenuItemSubLinks[$currentIndex] === undefined && $firstSubMenuItem[$currentIndex] === undefined) {
                    $firstSubMenuItem.last().focus();
                } else if (!$nextSubMenuItem.hasClass('js-accessibility-navLevel2-item')) {
                    $firstSubMenuItem[$currentIndex].focus();
                } else if ($nextSubMenuItemSubLinks[$currentIndex] === undefined) {
                    $nextSubMenuItemSubLinks.last().focus();
                } else {
                    $nextSubMenuItemSubLinks[$currentIndex].focus();
                }
                event.preventDefault();

                break;
            case 38:
                // if on first go to top
                if ($currentIndex === 0) {
                    $subMenuItemLink.focus();
                } else {
                    $allSubLinks.eq($currentIndex - 1).focus();
                    event.preventDefault();
                }

                $currentIndex--;

                break;
            case 40:
                $allSubLinks.eq($currentIndex + 1).focus();
                event.preventDefault();

                $currentIndex++;

                break;
            case 37:
                if (!$prevSubMenuItem.hasClass('js-accessibility-navLevel2-item') && $prevSubMenuItemSubLinks[$currentIndex] === undefined && $lastSubMenuItem[$currentIndex] === undefined) {
                    $lastSubMenuItem.last().focus();
                } else if (!$prevSubMenuItem.hasClass('js-accessibility-navLevel2-item')) {
                    $lastSubMenuItem[$currentIndex].focus();
                } else if ($prevSubMenuItemSubLinks[$currentIndex] === undefined) {
                    $prevSubMenuItemSubLinks.last().focus();
                } else {
                    $prevSubMenuItemSubLinks[$currentIndex].focus();
                }
                event.preventDefault();
                break;
        }
        /* eslint-disable default-case, no-fallthrough */
    }

    initializeEvents() {
        this.eventDelegate('keydown', this.config.menuLinkLevel1, this.keydownEvent.bind(this), this.cache.$document);
        this.eventDelegate('keydown', this.config.menuLinkLevel2, this.keydownEventSubList.bind(this), this.cache.$document);
        this.eventDelegate('keydown', this.config.menuLinkLevel3, this.keydownEventSubItem.bind(this), this.cache.$document);
    }
}
