/* global jQuery $ */
var searchRefinement = new test.Component('searchRefinement');

searchRefinement.add('initializedCache', function () {
    return this.cache && this.cache.$document &&
        this.cache.$body && this.cache.$openFilterButton &&
        this.cache.$filterElement && this.cache.$closeFilterButton &&
        this.cache.$openSortButton && this.cache.$sortElement && true;
});

searchRefinement.add('hasUninitializedEvents', function () {
    var expectedEvents = [
        'click',
        'click'
    ];

    var checkedEvents = [];

    for (const listenedEvent of this.listeners) {
        var eventKey = `${listenedEvent[1]}`;

        if (expectedEvents.indexOf(eventKey) > -1) {
            checkedEvents.push(eventKey);
        }
    }

    if (checkedEvents.length !== expectedEvents.length) {
        return `${expectedEvents.length - checkedEvents.length} of expected events is not added to listeners.`;
    }
    return false;
});

searchRefinement.add('mobileFilterOpen', function () {
    var activeLabelState = this.cache.$openSortButton.hasClass(this.config.activeLabel);

    this.cache.$openFilterButton.click();

    var showFilterClass = this.cache.$filterElement.hasClass(this.config.shownClass);
    var shownDropdownOpenClass = this.cache.$body.hasClass(this.config.dropdownOpenClass);
    var shownNoScrollBodyClass = this.cache.$body.hasClass(this.config.noScrollClass);
    var showSortClass = this.cache.$sortElement.hasClass(this.config.shownClass);
    var activeLabelClass = this.cache.$openSortButton.hasClass(this.config.activeLabel);

    return showFilterClass && !shownDropdownOpenClass &&
        shownNoScrollBodyClass && !showSortClass &&
        (activeLabelState !== activeLabelClass);
});

searchRefinement.add('mobileFilterClose', function () {
    this.cache.$closeFilterButton.click();

    var showFilterClass = this.cache.$filterElement.hasClass(this.config.shownClass);
    var shownNoScrollBodyClass = this.cache.$body.hasClass(this.config.noScrollClass);

    return !showFilterClass && !shownNoScrollBodyClass;
});

searchRefinement.add('categoryOpen', function () {
    this.cache.$closeFilterButton.click();

    var showFilterClass = this.cache.$filterElement.hasClass(this.config.shownClass);

    return !showFilterClass;
});

test.extend(searchRefinement);
