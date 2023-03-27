const { I, homePage, uriUtils } = inject();

When('shopper selects yes or no for tracking consent', () => {
    I.amOnPage(uriUtils.uri.homePage);
    homePage.accept();
});

Then('he is able to scroll and see sticky header', () => {
    homePage.checkStickyHeader();
    I.seeElement(homePage.locators.stickyHeader);
});

Then('he click on back to top button', () => {
    homePage.checkBackToTopButton();
    I.dontSeeElement(homePage.locators.backToTopButtonHidden);
});
