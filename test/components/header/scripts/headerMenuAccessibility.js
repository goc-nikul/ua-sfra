/* global jQuery $ */
var headerMenuAccessibility = new test.Component('headerMenuAccessibility');

headerMenuAccessibility.add('eligibleOnDevice', function () {
    return this.eligibleOnDevice();
});

headerMenuAccessibility.add('initializedCache', function () {
    return this.cache && this.cache.$document && true;
});

headerMenuAccessibility.add('hasUninitializedEvents', function () {
    var expectedEvents = [
        `keydown:${this.config.menuLinkLevel1}`,
        `keydown:${this.config.menuLinkLevel2}`,
        `keydown:${this.config.menuLinkLevel3}`
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

headerMenuAccessibility.add('hasErrorsInKeyDownEvents', async function () {
    var $firstMenuItem = this.cache.$document.find(this.config.menuLinkLevel1 + ':first');
    var $lastMenuItem = this.cache.$document.find(this.config.menuLinkLevel1 + ':last');
    var $firstMenuItemLevel2 = $firstMenuItem.next().find(this.config.menuLinkLevel2 + ':first');
    var $lastMenuItemLevel2 = $firstMenuItem.next().find(this.config.menuLinkLevel2 + ':last');
    var $firstMenuItemLevel3 = $firstMenuItemLevel2.next().find(this.config.menuLinkLevel3 + ':first');

    // Check if given element is focused on the page.
    var isFocused = ($element) => {
        return document.activeElement === $element[0];
    };

    // Create event with testing data to test keydownEvent method.
    var createKeyPressEvent = (keyCode, $target) => {
        var event = jQuery.Event('keydown'); // eslint-disable-line
        event.keyCode = keyCode;
        event.which = keyCode;
        event.delegateTarget = this.cache.$document.get(0);
        event.currentTarget = $target.get(0);

        return event;
    };

    var waitFor = function (selector) {
        return new Promise((resolve, reject) => {
            var pool = setInterval(function () {
                var $jObject = $(selector);
                if ($jObject.length < 1) {
                    return;
                }
                clearInterval(pool);
                resolve(true);
            }, 100);
            setTimeout(()=> {
                reject('Waiting timeout error');
            }, 3000);
        });
    };

    var testingKey40Press = async () => {
        // When we are on the first menu item, should be selected a next item.
        var checkWithFirstItemLevel1 = async () => {
            // Create event when we are on the first menu item.
            var event = createKeyPressEvent(40, $firstMenuItem);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItem
                .parents(this.config.menuItemLevel1)
                .find(this.config.menuItemLevel2 + ':first')
                .find(this.config.menuLinkLevel2)
                ;

            // Run method keydownEvent.
            await waitFor($expectedFocusedItem);

            this.keydownEvent(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #40 press, if we on the first item level1: focused item should be a next item below';
        };

        var checkWithFirstItemLevel2 = async () => {
            // Create event when we are on the first menu item.
            $firstMenuItem.focus();

            var event = createKeyPressEvent(40, $firstMenuItemLevel2);

            var $expectedFocusedItem = $firstMenuItemLevel2
                .next(this.config.menuLevel3)
                .find(this.config.menuLinkLevel3)
                .first()
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubList(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #40 press, if we on the first item of level2: focused item should be a next item below';
        };

        var checkWithFirstItemLevel3 = async () => {
            // Create event when we are on the first menu item.
            $firstMenuItem.focus();

            var event = createKeyPressEvent(40, $firstMenuItemLevel3);

            var $expectedFocusedItem = $firstMenuItemLevel3
                .parents(this.config.menuItemLevel3)
                .next()
                .find(this.config.menuLinkLevel3)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubItem(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #40 press, if we on the first item of level2: focused item should be a next item below';
        };

        // Returns false if without errors or error message.
        return await checkWithFirstItemLevel1() || await checkWithFirstItemLevel2() || await checkWithFirstItemLevel3();
    };

    var testingKey39Press = async () => {
        // When we are on the first menu item, should be selected a next item.
        var checkWithFirstItemLevel1 = () => {
            // Create event when we are on the first menu item.
            var event = createKeyPressEvent(39, $firstMenuItem);
            // Run method keydownEvent.
            this.keydownEvent(event);
            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItem
                .parents(this.config.menuItemLevel1)
                .nextAll(this.config.menuItemLevel1 + ':first')
                .find(this.config.menuLinkLevel1)
            ;

            return !isFocused($expectedFocusedItem) && 'Key #39 press, if we on the first item level1: focused item should be a next item level1';
        };
        // When we are on the last menu item, should be selected a first item.
        var checkWithLastItemLevel1 = () => {
            // Create event when we are on the last menu item.
            var event = createKeyPressEvent(39, $lastMenuItem);
            // Run method keydownEvent.
            this.keydownEvent(event);
            // Check changes in DOM.
            var $expectedFocusedItem = $lastMenuItem
                .parents(this.config.menuLevel1)
                .find(this.config.menuItemLevel1 + ':first')
                .find(this.config.menuLinkLevel1)
            ;

            return !isFocused($expectedFocusedItem) && 'Key #39 press, if we on the last item level1: focused item should be a first item level1';
        };

        var checkWithFirstItemLevel2 = async () => {
            // Create event when we are on the first menu item.
            var event = createKeyPressEvent(39, $firstMenuItemLevel2);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItemLevel2
                .parents(this.config.menuItemLevel2)
                .nextAll(this.config.menuItemLevel2 + ':first')
                .find(this.config.menuLinkLevel2)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubList(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #39 press, if we on the first item level2: focused item should be a next item level2';
        };

        var checkWithLastItemLevel2 = async () => {
            // Create event when we are on the last menu item.
            var event = createKeyPressEvent(39, $lastMenuItemLevel2);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $lastMenuItemLevel2
                .parents(this.config.menuLevel2)
                .find(this.config.menuItemLevel2 + ':first')
                .find(this.config.menuLinkLevel2)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubList(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #39 press, if we on the last item level2: focused item should be a first item level2';
        };

        var checkWithFirstItemLevel3 = async () => {
            // Create event when we are on the first menu item.
            var event = createKeyPressEvent(39, $firstMenuItemLevel3);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItemLevel3
                .parents(this.config.menuItemLevel2)
                .nextAll(this.config.menuItemLevel2 + ':first')
                .find(this.config.menuLinkLevel3 + ':first')
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubItem(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #39 press, if we on the first item level3: focused item should be a next item level3';
        };

        // Returns false if without errors or error message.
        return await checkWithFirstItemLevel1() || await checkWithLastItemLevel1() ||
            await checkWithFirstItemLevel2() || await checkWithLastItemLevel2() || await checkWithFirstItemLevel3();
    };

    var testingKey37Press = async () => {
        // When we are on the first menu item, should be selected a next item.
        var checkWithFirstItemLevel1 = () => {
            // Create event when we are on the first menu item.

            var event = createKeyPressEvent(37, $firstMenuItem);
            // Run method keydownEvent.
            this.keydownEvent(event);
            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItem
                .parents(this.config.menuLevel1)
                .find(this.config.menuItemLevel1 + ':last')
                .find(this.config.menuLinkLevel1)
                ;

            return !isFocused($expectedFocusedItem) && 'Key #37 press, if we on the first item level1: focused item should be a next item level1';
        };
        // When we are on the last menu item, should be selected a first item.
        var checkWithLastItemLevel1 = () => {
            // Create event when we are on the last menu item.
            var event = createKeyPressEvent(37, $lastMenuItem);
            // Run method keydownEvent.
            this.keydownEvent(event);
            // Check changes in DOM.
            var $expectedFocusedItem = $lastMenuItem
                .parents(this.config.menuItemLevel1)
                .prevAll(this.config.menuItemLevel1 + ':first')
                .find(this.config.menuLinkLevel1)
                ;

            return !isFocused($expectedFocusedItem) && 'Key #37 press, when we on the last item level1: focused item should be a first item level1';
        };

        var checkWithFirstItemLevel2 = async () => {
            // Create event when we are on the first menu item.
            var event = createKeyPressEvent(37, $firstMenuItemLevel2);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItemLevel2
                .parents(this.config.menuLevel2)
                .find(this.config.menuItemLevel2 + ':last')
                .find(this.config.menuLinkLevel2)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubList(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #39 press, if we on the first item level2: focused item should be a next item level2';
        };

        var checkWithLastItemLevel2 = async () => {
            // Create event when we are on the last menu item.
            var event = createKeyPressEvent(37, $lastMenuItemLevel2);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $lastMenuItemLevel2
                .parents(this.config.menuItemLevel2)
                .prevAll(this.config.menuItemLevel2 + ':first')
                .find(this.config.menuLinkLevel2)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubList(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #39 press, if we on the last item level2: focused item should be a first item level2';
        };

        var checkWithFirstItemLevel3 = async () => {
            // Create event when we are on the first menu item.
            var event = createKeyPressEvent(37, $firstMenuItemLevel3);

            $firstMenuItem.focus();

            // Check changes in DOM.
            var $expectedFocusedItem = $firstMenuItemLevel3
                .parents(this.config.menuLevel2)
                .find(this.config.menuItemLevel2 + ':last')
                .find(this.config.menuLinkLevel3 + ':first')
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubItem(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #39 press, if we on the first item level3: focused item should be a next item level3';
        };

        // Returns false if without errors or error message.
        return await checkWithFirstItemLevel1() || await checkWithLastItemLevel1() ||
            await checkWithFirstItemLevel2() || await checkWithLastItemLevel2() || await checkWithFirstItemLevel3();
    };

    var testingKey38Press = async () => {
        var checkWithFirstItemLevel2 = async () => {
            // Create event when we are on the first menu item.
            $firstMenuItem.focus();

            var event = createKeyPressEvent(38, $firstMenuItemLevel2);

            var $expectedFocusedItem = $firstMenuItemLevel2
                .parents(this.config.menuLevel1)
                .find(this.config.menuItemLevel1)
                .find(this.config.menuLinkLevel1)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubList(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #38 press, if we on the first item of level2: focused item should be a prev item above';
        };

        var checkWithFirstItemLevel3 = async () => {
            // Create event when we are on the first menu item.
            $firstMenuItem.focus();

            var event = createKeyPressEvent(38, $firstMenuItemLevel3);

            var $expectedFocusedItem = $firstMenuItemLevel3
                .parents(this.config.menuLevel2)
                .find(this.config.menuItemLevel2)
                .find(this.config.menuLinkLevel2)
                ;

            await waitFor($expectedFocusedItem);

            // Run method keydownEvent.
            this.keydownEventSubItem(event);

            var isFocusState = isFocused($expectedFocusedItem);

            return !isFocusState && 'Key #38 press, if we on the first item of level3: focused item should be a prev item above';
        };

        return await checkWithFirstItemLevel2() || await checkWithFirstItemLevel3();
    };

    // Returns false if without errors or error message.
    return await testingKey37Press() || await testingKey39Press() || await testingKey40Press() || await testingKey38Press();
});

test.extend(headerMenuAccessibility);
