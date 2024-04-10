const $html = $('html');
const $document = $(document);

const blockScrollIos = function () {
    let scrollPosition = 0;
    $html
        .on('lock:enable', function enableLock() {
            scrollPosition = scrollPosition || window.pageYOffset;
            $html.css({
                position: 'fixed',
                width: '100%',
                top: `-${scrollPosition}px`
            });
        })
        .on('lock:disable', function disableLock() {
            $html.css({
                position: '',
                width: '',
                top: ''
            });
            window.scrollTo(0, scrollPosition);
            scrollPosition = 0;
        });
};

const identifyBrowser = function () {
    $html.toggleClass(
        'isMobile',
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    $html.toggleClass(
        'isIos',
        (/iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
            !window.MSStream
    );
    $html.toggleClass(
        'isAndroid',
        /Android/.test(window.navigator.userAgent));
};

const limitMaxLength = function () {
    $document.on('keyup', 'input[maxlength]', function () {
        const $this = $(this);
        const value = $this.val();
        const maxLength = parseInt($this.attr('maxlength'), 10);

        if (value.length > maxLength) {
            const maxLengthValue = value.substr(0, maxLength);
            $this.val(maxLengthValue);
            return;
        }
    });
};

module.exports = {
    init: function () {
        identifyBrowser();
        if ($html.hasClass('isMobile') && $html.hasClass('isIos')) {
            blockScrollIos();
        }
        if ($html.hasClass('isMobile') && $html.hasClass('isAndroid')) {
            limitMaxLength();
        }
    }
};
