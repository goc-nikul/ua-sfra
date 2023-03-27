/* global jQuery $ */
var searchMobile = new test.Component('searchMobile');

searchMobile.add('eligibleOnDevice', function () {
    return this.eligibleOnDevice();
});

searchMobile.add('initializedCache', function () {
    return this.cache && this.cache.$document
        && this.cache.$body && true;
});

searchMobile.add('hasUninitializedEvents', function () {
    var expectedEvents = [
        `click:${this.config.openSearchButton}`,
        `click:${this.config.searchClose}`
    ];

    var checkedEvents = [];

    for (const listenedEvent of this.listeners) {
        if (listenedEvent[0] !== this.cache.$document) {
            return 'Invalid event target';
        }

        var eventKey = `${listenedEvent[1]}:${listenedEvent[2]}`;

        if (expectedEvents.indexOf(eventKey) > -1) {
            checkedEvents.push(eventKey);
        }
    }

    if (checkedEvents.length !== expectedEvents.length) {
        return `${expectedEvents.length - checkedEvents.length} of expected events is not added to listeners.`;
    }
    return false;
});

searchMobile.add('mobileSearchOpen', function () {
    this.cache.$document.find(this.config.openSearchButton).click();

    var checkActiveSearchClass = this.$el.hasClass(this.config.shownSearchClass);
    var checkNoScrollClass = this.cache.$body.hasClass(this.config.noScrollClass);

    return checkActiveSearchClass && checkNoScrollClass;
});

searchMobile.add('mobileSearchClose', function () {
    this.cache.$document.find(this.config.searchClose).click();

    var checkActiveSearchClass = this.$el.hasClass(this.config.shownSearchClass);
    var checkNoScrollClass = this.cache.$body.hasClass(this.config.noScrollClass);

    return !checkActiveSearchClass && !checkNoScrollClass;
});

test.extend(searchMobile);
