document.addEventListener('DOMContentLoaded', function jqueryloaded() {
if (!window.jQuery) return setTimeout(jqueryloaded, 50);
    $(document).ready(function(){
        $('.shipping__q-and-a').each(function(i){
            if (i < 4){
                $(this).addClass('shipping__q-and-a--open');
            }
            $('.shipping__q-and-a-title span').html('(' + $('.shipping__q-and-a').length + ')');
        })
        $('.g-button_base').on('click', function () {
            $('.shipping__q-and-a').addClass('shipping__q-and-a--open');
            $('button.g-button_base').hide();
        })
        $('h3').on('click', function () {
            if ( $(this).closest('.shipping__q-and-a').hasClass('shipping__q-and-a--open') ) {
                $(this).closest('.shipping__q-and-a').removeClass('shipping__q-and-a--open');
            } else {
                $(this).closest('.shipping__q-and-a').addClass('shipping__q-and-a--open');
            }
        })
    });

}, false);