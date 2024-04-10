'use strict';

// import EditBasketProduct from '../common/components/EditBasketProduct';

$(() => {
    /**  Add items to cart after having selected them and submitted*/
    function addToCart() {
        const cbProducts = document.getElementsByClassName('cbProduct');
        var itemsToAdd = [];

        for (var i = 0; i < cbProducts.length; i++) {
            if (cbProducts[i].checked || document.getElementById('cbSelectAll').checked) {
                var quantitySelector = document.getElementById('quantity-' + cbProducts[i].id);
                itemsToAdd.push({ id: cbProducts[i].id, quantity: quantitySelector.options[quantitySelector.selectedIndex].value });
            }
        }

        if (itemsToAdd.length === 0) {
            document.getElementsByClassName('sharedbasket-add-error')[0].classList.remove('d-none');
        } else {
            const url = document.getElementById('addBtn').getAttribute('data-action-url');
            document.location.href = url + '?items=' + JSON.stringify(itemsToAdd);
        }
    }

    /** Update page with new country and language if changed*/
    function changeLocale() {
        const cbProducts = document.getElementsByClassName('cbProduct');
        var currLang = document.getElementById('currLang').textContent;
        var currCountry = document.getElementById('current-country').textContent;
        var selectedCountry = document.getElementById('new-country').textContent;
        var selectedLang = document.getElementById('new-language').textContent.toLowerCase();
        var targetUrl = document.getElementById('new-country').dataset.url;
        var products = [];

        for (var i = 0; i < cbProducts.length; i++) {
            var quantitySelector = document.getElementById('quantity-' + cbProducts[i].id);
            products.push({ id: cbProducts[i].id, quantity: quantitySelector.options[quantitySelector.selectedIndex].value });
        }

        products = JSON.stringify(products);

        if (currCountry !== selectedCountry || currLang !== selectedLang) {
            document.location.href = targetUrl + '?lang=' + selectedLang + '&country=' + selectedCountry + '&products=' + products;
        }
    }

    /** Disable other checkboxes when select all is selected*/
    function handleSelectAll() {
        this.checked = !!(this.checked);
        var cbProducts = document.getElementsByClassName('cbProduct');
        var i;

        if (this.checked) {
            for (i = 0; i < cbProducts.length; i++) {
                cbProducts[i].checked = true;
                cbProducts[i].setAttribute('checked', 'true');
            }
        } else {
            for (i = 0; i < cbProducts.length; i++) {
                cbProducts[i].checked = false;
                cbProducts[i].setAttribute('checked', 'false');
            }
        }
    }

    /** Deselect select All checkbox when user deselect a product*/
    function deselectSelectAll() {
        var selectAll = document.getElementById('cbSelectAll');

        if (selectAll && !this.checked) {
            selectAll.checked = false;
            selectAll.setAttribute('checked', 'false');
        }
    }

    /** Make the country selector list visible*/
    function collapseCountry() {
        var selector = document.getElementById('countrySelector');

        if (selector.style.display === 'block') {
            selector.style.display = 'none';
        } else {
            selector.style.display = 'block';
        }
    }

    /** Make the country selector list visible*/
    function collapseLangs() {
        var selector = document.getElementById('localeSelector');

        if (selector.style.display === 'block') {
            selector.style.display = 'none';
        } else {
            selector.style.display = 'block';
        }
    }

    /** Change language
     * @param {*} event language selected
     */
    function switchLang(event) {
        const currCountry = document.getElementById('new-country').textContent;
        const countries = document.getElementsByClassName('countries');
        var lang = event.target.innerText;
        var selectedLocale = event.target.dataset.language;
        document.getElementById('langBtnText').innerHTML = lang[0].toUpperCase() + lang.substring(1);

        collapseLangs();

        for (var i = 0; i < countries.length; i++) {
            if (countries[i].getElementsByClassName('countryCode')[0].textContent === currCountry) {
                var locales = JSON.parse(document.getElementsByClassName(currCountry + '-locales')[0].textContent);

                locales.forEach(locale =>{
                    if (locale.split('_')[0].toLowerCase() === selectedLocale.toLowerCase()) {
                        document.getElementById('new-language').innerHTML = locale.split('_')[0];
                        return;
                    }
                });
            }
        }
    }

    /**
     * @param {*} event country selected
     */
    function switchCountry(event) {
        var target;
        if (event.target.getElementsByClassName('countryCode').length > 0) {
            target = event.target;
        } else {
            target = event.target.parentElement;
        }
        var locale = (target.getElementsByClassName('countryCode'))[0].textContent;
        var targetUrl = (target.getElementsByClassName('countryCode'))[0].dataset.url;
        var langList = document.getElementById('langList');
        var availableLangs = JSON.parse(target.getElementsByClassName(locale + '-languages')[0].textContent);
        var availableLocales = JSON.parse(target.getElementsByClassName(locale + '-locales')[0].textContent);

        var counter = 0;
        while (langList.children.length > 1) {
            langList.removeChild(langList.children[counter]);
            counter++;
        }

        for (var j = 0; j < availableLangs.length; j++) {
            if (j === 0) {
                langList.children[0].innerHTML = availableLangs[j];
                langList.children[0].dataset.language = availableLocales[j].split('_')[0];
            } else {
                const langNode = document.createElement('li');
                langNode.classList.add('b-header_utility-subitem');
                langNode.classList.add('locales');
                langNode.dataset.language = availableLocales[j].split('_')[0];
                langNode.appendChild(document.createTextNode(availableLangs[j]));
                langNode.addEventListener('click', switchLang);
                langList.appendChild(langNode);
            }
        }

        document.getElementById('langBtnText').innerHTML = 'English';
        document.getElementById('new-language').innerHTML = 'en';
        document.getElementById('countryBtnText').innerHTML = '<i class="b-header_utility-toggle_icon fflag fflag-' + locale + '"></i>' + locale;
        document.getElementById('new-country').innerHTML = locale;
        document.getElementById('new-country').dataset.url = targetUrl;
        collapseCountry();
    }


    /** Update quantity message when updating quantity
     * @param {*} productID: the id of the product selected
     */
    function updateQuantityMsg(productID) {
        var quantitySelector = document.getElementById('quantity-' + productID);
        var availabilityCard = document.getElementsByClassName(`availability-${productID}`)[0];
        var elementMaxQuantity = document.getElementById(`max-quantity-${productID}`).textContent;
        var maxQuantity = Number(elementMaxQuantity);
        var elementSelectedQuantity = quantitySelector.options[quantitySelector.selectedIndex].value;
        var selectedQuantity = Number(elementSelectedQuantity);

        if (maxQuantity >= selectedQuantity) {
            availabilityCard.innerHTML = `<span id="max-quantity-${productID}" hidden>${maxQuantity}</span>`;
            quantitySelector.options.length = maxQuantity;
        }
    }

    /** Close open modals/dropdowns when clicking outside
     * @param {*} event the target of the click
     */
    function close(event) {
        const countrySelector = document.getElementById('countrySelector');
        const localeSelector = document.getElementById('localeSelector');

        if (countrySelector && countrySelector.style.display === 'block' && !event.target.closest('.country-selector-btn-wrapper')) {
            collapseCountry();
        }
        if (localeSelector && localeSelector.style.display === 'block' && !event.target.closest('.language-selector-btn-wrapper')) {
            collapseLangs();
        }
    }

    /** Update the modal */
    function updateProduct() {
        const modal = document.querySelector('.js-shared-basket-edit-modal');
        const cbProducts = document.getElementsByClassName('cbProduct');
        const newProductId = modal.getAttribute('data-pid');
        const oldProductQty = parseInt(modal.getAttribute('data-qty'), 10);
        const oldProductId = document.querySelector('.js-update-btn').getAttribute('data-attr-id');

        var itemsToAdd = [];
        var oldProductIndex = -1;
        var newProductIndex = -1;

        for (let i = 0; i < cbProducts.length; i++) {
            const quantitySelector = document.getElementById('quantity-' + cbProducts[i].id);
            itemsToAdd.push({ id: cbProducts[i].id, quantity: parseInt(quantitySelector.options[quantitySelector.selectedIndex].value, 10) });
            if (cbProducts[i].id === oldProductId) oldProductIndex = i;
            if (cbProducts[i].id === newProductId) newProductIndex = i;
        }

        if (oldProductIndex > -1) {
            if (newProductIndex > -1) {
                itemsToAdd[newProductIndex] = {
                    id: newProductId,
                    quantity: oldProductQty + itemsToAdd[newProductIndex].quantity
                };
                itemsToAdd.splice(oldProductIndex, 1);
            } else {
                itemsToAdd[oldProductIndex] = {
                    id: newProductId,
                    quantity: oldProductQty
                };
            }
        }
        const url = document.querySelector('.js-update-btn').getAttribute('data-action-url');
        document.location.href = url + '?products=' + JSON.stringify(itemsToAdd);
    }

    const modalShown = () => {
        var siteValue = $('#size-selected').attr('data-attr-site') ? $('#size-selected').attr('data-attr-site') : '';
        var num = $('.b-size_outer .js-sizeAttributes a.selected').parent('li');
        var lengthSelected = $('.b-length_outer .js-sizeAttributes a.selected').parent('li');
        var sizeSelectValue = $('.b-size_outer .js-sizeAttributes a.selected').attr('data-size-attr');
        var sizeSelected = num.index();
        var numOfSizes = $(this).index();
        if (numOfSizes > 29) {
            $(this).addClass('hideNow');
        } else if (numOfSizes > 19) {
            $(this).addClass('hideNowMobile');
        }

        if ($(window).width() > 1024) {
            if (sizeSelected > 29) {
                if ($('.js-show-less.show:visible').length > 0) {
                    $('.js-show-more').trigger('click');
                }
            } else {
                $('.js-show-less.show:visible').trigger('click');
            }
        } else if (sizeSelected > 19) {
            if ($('.js-show-less.show:visible').length > 0) {
                $('.js-show-more').trigger('click');
            }
        } else {
            $('.js-show-less.show:visible').trigger('click');
        }
        if (siteValue === 'EU' || siteValue === 'UKIE') {
            if (sizeSelectValue !== undefined && ((lengthSelected.length > 0 && num.length > 0) || num.length > 0)) {
                $('#size-not-selected').hide();
                $('#size-selected').show();
                $('.js-selected-size-emea').html(sizeSelectValue);
            } else if (sizeSelectValue !== undefined && num.length === 0) {
                $('#size-not-selected').hide();
                $('#size-selected').show();
                $('.js-selected-size-emea').html('');
            }
        } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && lengthSelected.length > 0 && num.length > 0) {
            $('.js-selected-size').html(sizeSelectValue);
        } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && num.length > 0) {
            $('.js-selected-size').html(sizeSelectValue);
        } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && num.length === 0) {
            $('.js-selected-size').html('');
        }
        const updateBtn = document.querySelector('.js-update-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', updateProduct);
        }
    };

    $(document).ready(() => {
        const ElmChangeLocale = document.getElementById('changeLocaleBtn');

        if (ElmChangeLocale) {
            ElmChangeLocale.addEventListener('click', changeLocale);
            document.getElementById('countryBtn').addEventListener('click', collapseCountry);
            document.getElementById('langBtn').addEventListener('click', collapseLangs);
        }

        document.getElementsByTagName('body')[0].addEventListener('click', close);
        document.getElementById('addBtn').addEventListener('click', addToCart);
        document.getElementById('cbSelectAll').addEventListener('change', handleSelectAll);

        const cbProducts = document.getElementsByClassName('cbProduct');
        const countries = document.getElementsByClassName('countries');
        const locales = document.getElementsByClassName('locales');
        var i = 0;

        for (i = 0; i < cbProducts.length; i++) {
            cbProducts[i].addEventListener('change', deselectSelectAll);
            var id = cbProducts[i].id;
            document.getElementById('quantity-' + cbProducts[i].id).addEventListener('change', updateQuantityMsg.bind(null, id));
        }

        for (i = 0; i < countries.length; i++) {
            countries[i].addEventListener('click', switchCountry);
        }

        for (i = 0; i < locales.length; i++) {
            locales[i].addEventListener('click', switchLang);
        }

        var $body = $('body');
        $body.on('editModalShown', modalShown);
    });
});
