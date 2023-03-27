/* global jQuery $ */
var customSelect = new test.Component('customSelect');

customSelect.add('customSelectInit', function () {
    var initElement = this.$el.parents('.g-selectric-wrapper');

    return !!initElement;
});

test.extend(customSelect);
