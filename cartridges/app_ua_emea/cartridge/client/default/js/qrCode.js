'use strict';

import QRCode from 'easyqrcodejs';

$(() => {
    let copyTimeout;

    /** generate Qr Code
     * @param {*} sharedBasketURL url for shared basket
     * @param {*} qrCodeDiv div where the qr code will be displayed
     */
    function displayQrCode(sharedBasketURL, qrCodeDiv) {
        const dim = 1000;
        const logo = qrCodeDiv.dataset.logo;
        const division = (dim / 5) / 315;
        const logoWidth = 315 * division;
        const logoHeigth = 186 * division;
        var options = {
            text: sharedBasketURL,
            width: dim,
            height: dim,
            colorDark: '#000001',
            colorLight: '#ffffff',
            logo: logo,
            logoWidth: logoWidth,
            logoHeight: logoHeigth,
            PO: '#797a7a',
            PI: '#cf180e',
            correctLevel: QRCode.CorrectLevel.L
        };
        // eslint-disable-next-line no-new
        new QRCode(qrCodeDiv, options);
    }

    /** modify modal css
     * @param {*} sharedBasketURL url for the shared basket
     */
    function displayModal(sharedBasketURL) {
        const modal = document.getElementById('qrModal');
        const qrCodeDiv = document.getElementById('js-qrcode-placeholder');
        const inputUrl = document.getElementsByName('URLInput')[0];
        const whatsAppShareCTA = document.getElementsByClassName('share-mobile')[0];
        whatsAppShareCTA.href = whatsAppShareCTA.href.replace('product', sharedBasketURL);
        inputUrl.value = sharedBasketURL;
        inputUrl.style.width = 100;
        modal.style.display = 'block';
        qrCodeDiv.innerHTML = '';
        qrCodeDiv.style.display = 'none';
        displayQrCode(sharedBasketURL, qrCodeDiv);
    }

    /** Display modal with Qr Code and shared basket url */
    async function handleClick() {
        const res = await fetch($(this).attr('data-action-url'));
        if (res.ok) {
            const response = await res.json();
            displayModal(response.sharedBasketURL.toString());
        }
    }

    /** Close the modal on click  */
    function closeModal() {
        const modal = document.getElementById('qrModal');
        const showqrbtn = document.querySelector('.js-show-qrbtn');
        modal.style.display = 'none';
        showqrbtn.style.display = '';
    }

    /** Copy URL */
    function copyUrlToClipboard() {
        const clippySvg = document.querySelector('svg.clippy');
        const checkSvg = document.querySelector('svg.check');
        const displayInput = document.querySelector('.js-display-link');
        clippySvg.classList.add('copied');
        checkSvg.classList.add('copied');
        displayInput.select();
        navigator.clipboard.writeText(document.getElementsByName('URLInput')[0].value);

        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
            clippySvg.classList.remove('copied');
            checkSvg.classList.remove('copied');
        }, 1000);
    }

    /** Open whatsapp */
    function shareWithWhatsapp() {
        window.open('https://web.whatsapp.com://send?text=' + document.getElementsByName('URLInput')[0].value, '_blank');
    }

    /**
     * Show QR Code
     * @param {*} event - event
     */
    function showQRCode(event) {
        const showqrbtn = event.target;
        const qrCodeDiv = document.getElementById('js-qrcode-placeholder');
        qrCodeDiv.style.display = 'block';
        showqrbtn.style.display = 'none';
    }

    /**
     * Close Modal
     * @param {*} event - event
     */
    function closeModalOutClick(event) {
        if (event.target.matches('#qrModal')) {
            closeModal();
        }
    }

    $(document).ready(() => {
        document.querySelector('.js-qrbtn').addEventListener('click', handleClick);
        document.getElementById('closeModalBtn').addEventListener('click', closeModal);
        document.getElementById('copyBtn').addEventListener('click', copyUrlToClipboard);
        document.getElementById('whatsappBtn').addEventListener('click', shareWithWhatsapp);
        document.querySelector('.js-show-qrbtn').addEventListener('click', showQRCode);
        document.querySelector('body').addEventListener('click', closeModalOutClick);
    });
});
