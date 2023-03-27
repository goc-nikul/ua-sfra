/* global jQuery $ */
var sortMobile = new test.Component('sortMobile');

sortMobile.add('eligibleOnDevice', function () {
    return this.eligibleOnDevice();
});

sortMobile.add('initializedCache', function () {
    return this.cache && this.cache.$document &&
        this.cache.$body && this.cache.$openSortButton &&
        this.cache.$closeSortButton && this.cache.$sortElement &&
        this.cache.$oldSortElement && true;
});

sortMobile.add('hasUninitializedEvents', function () {
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

sortMobile.add('mobileSortToggle', async function () {
    var shownSortClass;
    var shownNoScrollBodyClass;
    var activeLabelClass;

    var openSort = () => {
        this.cache.$openSortButton.click();

        shownSortClass = this.cache.$sortElement.hasClass(this.config.shownSortClass);
        shownNoScrollBodyClass = this.cache.$body.hasClass(this.config.noScrollBodyClass);
        activeLabelClass = this.cache.$openSortButton.hasClass(this.config.activeLabel);

        return shownSortClass && shownNoScrollBodyClass && activeLabelClass;
    };

    var closeSort = () => {
        this.cache.$openSortButton.click();

        shownSortClass = this.cache.$sortElement.hasClass(this.config.shownSortClass);
        shownNoScrollBodyClass = this.cache.$body.hasClass(this.config.noScrollBodyClass);
        activeLabelClass = this.cache.$openSortButton.hasClass(this.config.activeLabel);

        return !shownSortClass && !shownNoScrollBodyClass && !activeLabelClass;
    };

    return await openSort() && await closeSort();
});

sortMobile.add('onMobileSort', function () {
    var $expectedElement = $(this.config.closeSortButton + ':first');

    $expectedElement.click();

    var shownSortClass = this.cache.$sortElement.hasClass(this.config.shownSortClass);
    var shownNoScrollBodyClass = this.cache.$body.hasClass(this.config.noScrollBodyClass);
    var activeLabelClass = this.cache.$openSortButton.hasClass(this.config.activeLabel);

    return (this.cache.$openSortButton.text() === $expectedElement.text()) &&
        !shownSortClass && !shownNoScrollBodyClass && !activeLabelClass;
});

test.extend(sortMobile);
