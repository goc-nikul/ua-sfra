/* global jQuery $ */
var productTile = new test.Component('productTile');

productTile.add('initializedCache', function () {
    return this.cache && this.cache.$hoverImage &&
        this.cache.$swatchesWrapper && this.cache.$defaultImage && true;
});

productTile.add('hasUninitializedEvents', function () {
    var expectedEvents = [
        `mouseenter:${this.settings.swatchSelector}`
    ];

    var checkedEvents = [];

    for (const listenedEvent of this.listeners) {
        if (listenedEvent[0] !== this.cache.$swatchesWrapper) {
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

productTile.add('changeImageOnHover', function () {
    var $lastImageLink = $('.b-swatches_circle-item:last').find('a');
    var $lastImageUrl = $lastImageLink.data('product-img');

    $lastImageLink.mouseenter();

    return this.cache.$hoverImage[0].src === $lastImageUrl;
});

productTile.add('changeToDefault', function () {
    var $lastImageLink = $('.b-swatches_circle-item:last').find('a');
    $lastImageLink.mouseleave();

    return this.cache.$defaultImage === this.cache.$hoverImage[0].src;
});

test.extend(productTile);
