const I = actor();

module.exports = {
    locators: {
        consentTrackModal: '.modal-content',
        consentTrackAffirm: '.affirm',
        searchField: 'input.form-control.search-field',
        searchedImage: 'a>img.swatch-circle',
        stickyHeader: 'header.is_stuck',
        backToTopButton: 'button.back-to-top',
        backToTopButtonHidden: 'button.back-to-top.is--show'
    },
    accept() {
        I.waitForElement(this.locators.consentTrackModal);
        within(this.locators.consentTrackModal, () => {
            I.click(this.locators.consentTrackAffirm);
        });
    },
    search(product) {
        I.fillField(this.locators.searchField, product);
        I.waitForElement(this.locators.searchedImage);
        I.click(this.locators.searchedImage);
    },
    checkStickyHeader() {
        I.scrollPageToBottom();
    },
    checkBackToTopButton() {
        I.click(this.locators.backToTopButton);
    }
};
