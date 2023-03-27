'use strict';

$(document).ready(function () {
    var $cache = {
        dnaPrevious: '',
        dnaNext: '',
        stickyNavTop: '',
        stickyDateTop: '',
        kp1994: '',
        date1996: '',
        date2002: '',
        date2011: '',
        mobAdj: '',
        navOffset: 35
    };

    /**
     * to clear the results
     * @param {number} fl - scrolled to this position
    **/
    function setDNAdata(fl) {
        var dt = 5;
        if (window.matchMedia('(min-width: 768px)').matches) {
            // desktop
            $cache.stickyNavTop = Math.round(($('.dna-kp').offset().top + $('.dna-kp').height()) - 55);
            $cache.mobAdj = -6;
        } else {
            // mobile
            $cache.stickyNavTop = Math.round(($('.dna-kp').offset().top + $('.dna-kp').height()) - 35);
            $cache.mobAdj = -27;
            dt += 20;
        }
        $cache.stickyDateTop = Math.round($('.dna-kp').offset().top + $('.dna-kp').height() + $('.dna-first-date').offset().top);
        // sets the top values for the decade navigation:
        $cache.kp1994 = Math.round($('.dna-kp').offset().top - 152);
        $cache.date1996 = Math.round($('.dna-1996').offset().top - 152);
        $cache.date2002 = Math.round($('.dna-2002').offset().top - 152);
        $cache.date2011 = Math.round($('.dna-2011').offset().top - 152);
        if ($('.dna-2018').length > 0) {
            $cache.date2018 = Math.round($('.dna-2018').offset().top - 152);
        }
        if ($('.dna-future').length > 0) {
            $cache.dateFuture = Math.round($('.dna-future').offset().top - 152);
        }
        $cache.dnaNext = $cache.stickyDateTop;

        // sets distance-to-top value to the data attribute for each year
        $('section, .dna-subsection').each(function () {
            var $this = $(this);
            $this.attr('data-top', Math.round(($this.offset().top - 152) + dt));
        });

        // sets distance-to-top value to data attribute
        $('.LiveclickerVideoDiv-dna').each(function () {
            var $this = $(this);
            $this.attr('data-top', Math.round($this.offset().top) - 1200);
        });

        /**
         * scroll top
         * @param {number} scrollTop - scrolled to this position
        **/
        function grayOut(scrollTop) {
            if (scrollTop <= $cache.date2002) {
                $('.next').removeClass('grayOut');
                $('.prev').addClass('grayOut');
            } else if (scrollTop >= $cache.dateFuture || scrollTop >= $cache.date2018) {
                // $('.dna-nav-buts').addClass('navfut');
                $('.next').addClass('grayOut');
                $('.prev').removeClass('grayOut');
            } else {
                $('.prev').removeClass('grayOut');
                $('.next').removeClass('grayOut');
                // $('.dna-nav-buts').removeClass('navfut');
            }
        }

        /**
         * sticky nav for the bottom section
        **/
        function stickyNav() {
            var scrollTop = $(window).scrollTop();
            var $navDiv = $('.dna-nav .navs');
            if (scrollTop + $cache.navOffset > $cache.stickyNavTop) {
                $('.dna-nav').addClass('dna-menu-sticky');
                $('.dna-kp').css('marginBottom', 53);
            } else {
                $('.dna-nav').removeClass('dna-menu-sticky');
                $('.dna-kp').css('marginBottom', 0);
            }

            if (scrollTop + $cache.navOffset > $cache.stickyDateTop) {
                $('.dna-first-date').addClass('date-sticky');
            } else {
                $('.dna-first-date').removeClass('date-sticky');
            }

            if (scrollTop > $cache.date1996) {
                $navDiv.removeClass('dna-hot-decade');
                $navDiv.eq(0).addClass('dna-hot-decade');
            }

            if (scrollTop > $cache.date2002) {
                $navDiv.removeClass('dna-hot-decade');
                $navDiv.eq(1).addClass('dna-hot-decade');
            }

            if (scrollTop > $cache.date2011 - 5) {
                $navDiv.removeClass('dna-hot-decade');
                $navDiv.eq(2).addClass('dna-hot-decade');
            }

            if (scrollTop > $cache.dateFuture) {
                $navDiv.removeClass('dna-hot-decade');
                $navDiv.eq(3).addClass('dna-hot-decade');
            }

            if (scrollTop > $cache.date1996) {
                $('.dna-nav-buts').css('display', 'block');
            } else {
                $('.dna-nav-buts').css('display', 'none');
            }

            if (scrollTop > $cache.date2018 || scrollTop > $cache.dateFuture) {
                var dnaBtnsCorectPos2018 = 175;
                var dnaBtnsCorectPos = 170;
                var top;
                if (window.matchMedia('(max-width: 767px)').matches) {
                    dnaBtnsCorectPos2018 = 220;
                    dnaBtnsCorectPos = 220;
                } else if (window.matchMedia('(max-width: 1024px)').matches) {
                    dnaBtnsCorectPos2018 = 245;
                }

                if ($cache.date2018 > 0) {
                    top = $cache.date2018 + dnaBtnsCorectPos2018 + 'px';
                } else {
                    top = $cache.dateFuture + dnaBtnsCorectPos + 'px';
                }

                $('.dna-nav-buts').css({
                    'position': 'absolute',// eslint-disable-line
                    'top': top// eslint-disable-line
                });

                $('.dna-date').addClass('dna-date--stop_scroll date-sticky--last');
                $('.dna-nav-buts').removeClass('dna-nav-buts--position_scrolling');
            } else {
                $('.dna-nav-buts').addClass('dna-nav-buts--position_scrolling');
                $('.dna-date').removeClass('dna-date--stop_scroll date-sticky--last');
            }

            $('.DNA section, .dna-subsection').each(function (i) {
                var $this = $(this);
                if (scrollTop + $cache.navOffset > $this.attr('data-top')) {
                    $this.find('.dna-date').addClass('date-sticky');
                    $this.prev().find('.dna-first-date, .dna-date').css('display', 'none');
                    $cache.dnaPrevious = Number($('.DNA section, .dna-subsection').eq(i - 1).attr('data-top')) - $cache.mobAdj;
                    $cache.dnaNext = Number($('.DNA section, .dna-subsection').eq(i + 1).attr('data-top')) - $cache.mobAdj;
                } else {
                    $this.find('.dna-date').removeClass('date-sticky');
                    $this.prev().find('.dna-first-date, .dna-date').css('display', 'block');
                }
            });

            grayOut(scrollTop);
        }

        $(window).scroll(function () {
            stickyNav();
        });

        /**
         * jumps to the date section defined in the query string
        **/
        function goParam() {
            if (window.location.search) {
                var x = 0;
                if (window.matchMedia('(max-width: 767px)').matches) {
                    x = 20;
                }
                // var scrollTop = $(window).scrollTop();
                var scrollTarget = window.location.search.toString().replace(/\?/, '');
                $('section').each(function () {
                    var $this = $(this);
                    if ($this.find('.dna-date').html() === scrollTarget) {
                        var added = Number($this.attr('data-top')) + Number(x);
                        $('html, body').animate({
                            scrollTop: added
                        }, 500);
                    }
                });
            }
        }

        /**
         * Load DNA video
         * @param {number} me - scrolled to this position
        **/
        /* function loadDNAvideo(me) {
            if (me.attr('data-loaded') !== 'true') {
                lc.settings = { account_id: 387 };
                var playerInstance;
                var idArr;
                var wid;
                var pid;
                var wwidth;
                wwidth = $(window).width();
                playerInstance = me.attr('id');
                idArr = me.attr('data-video').split(',');
                wid = idArr[0];
                pid = idArr[1];
                lc({ widget_id: wid }).isReady(function () {
                    lc(this).getByIndex(0).getPlayer({ player_id: pid, 'width': wwidth, 'height': $(window).width() / 1.776 }).appendPlayerTo({ 'id': playerInstance });
                });

                me.attr('data-loaded', 'true');
                me.parent().siblings('.dna-overlay').attr('id', 'overlay' + idArr[0]);
            }
        } */

        // detects the date in the query string
        if (fl === true && window.location.search) {
            setTimeout(function () {
                goParam();
            }, 500);
        }

        stickyNav();

        if (window.matchMedia('(max-width: 767px)').matches) {
            $('.dna-overlay').removeAttr('style');
        }

        /* $('.LiveclickerVideoDiv-dna').each(function () {
            var $this = $(this);
            loadDNAvideo($this);
        }); */
    }

    /**
     * detect video play
    **/
    /* function detectVideoPlay() {
        if (window.matchMedia('(min-width: 767px)').matches) {
            try {
                players = getLCPlayers();
                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    var $vid;
                    var settings = player.getSettings();

                    if ($('#overlay' + player.iframeDiv).length > 0) {
                        $vid = $('#overlay' + player.iframeDiv.toString().replace(/video_/, ''));
                    } else if ($('#overlay' + settings.widgetId).length > 0) {
                        $vid = $('#overlay' + settings.widgetId);
                    } else {
                        $vid = $('#overlay' + settings.id);
                    }

                    if ($('video').length > 0 && $('video').css('margin-top') !== '40px' && navigator.userAgent.indexOf('android') === -1) {
                        $('video').css('margin-top', '40px');
                    }

                    if (player.getSettings().playerState === 'PLAYING') {
                        if ($vid.attr('data-vis') === '1') {
                            $vid.attr('data-vis', '0');
                            $vid.animate({
                                opacity: 0,
                                top: '+=1.5%'
                            }, 200);
                        }
                    } else {
                        if ($vid.attr('data-vis') === '0') { // eslint-disable-line
                            $vid.attr('data-vis', '1');
                            $vid.animate({
                                opacity: 1,
                                top: '-=1.5%'
                            }, 200);
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    } */

    /**
     * stop all the videos
    **/
    /* function stopAllVideos() {
        var players = getLCPlayers();
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            player.sendEvent('pause');
        }
    } */

    $(document).on('click touchstart', '.dna-nav-buts .next, .dna-nav-buts .prev', function () {
        var $this = $(this);
        // var toTop = $(window).scrollTop();
        var scrollTo;
        if ($this.hasClass('next') && $this.hasClass('grayOut') === false) {
            scrollTo = $cache.dnaNext;
        } else if ($this.hasClass('prev') && $this.hasClass('grayOut') === false) {
            scrollTo = $cache.dnaPrevious;
        }

        $('html, body').animate({
            scrollTop: scrollTo
        }, 500);

        // stopAllVideos();
    });

    $(document).on('click touchstart', '.dna-nav .navs', function () {
        var $this = $(this);
        $('.dna-' + $this.attr('data-decade')).find('.dna-date').css('marginLeft', 150).css('opacity', 0);
        $('html, body').animate({
            scrollTop: $('.dna-' + $this.attr('data-decade')).offset().top - 130 - $cache.mobAdj
        }, 500, function () {
            $('.dna-' + $this.attr('data-decade')).find('.dna-date').animate({
                marginLeft: 0,
                opacity: 1
            }, 300);
        });

        // stopAllVideos();

        $('.dna-nav .navs').removeClass('dna-hot-decade');
        $this.addClass('dna-hot-decade');
    });

    /**
     * loading players
     * @param {number} player - scrolled to this position
    var players = new Array();
    function onLCPlayerLoaded(player) {
        players.push(player);
    }

    setTimeout(function () {
        var intrv = window.setInterval(function () {
            detectVideoPlay();
        }, 500);
    }, 1000); **/

    $(document).on('click touch', '.scroll-icon, .dna-1 .t4', function () {
        $('html, body').animate({
            scrollTop: $(this).offset().top - 35
        }, 500);
    });

    /**
     * debounce method
     * @param {number} func - call back function
     * @param {number} timeout - timeout value
     * @returns {number} - a JSON object with all values
    **/
    function debouncer(func, timeout) {
        var timeoutID, timeout = timeout || 200; // eslint-disable-line
        return function () {
            var scope = this;
            var args = arguments;
            clearTimeout(timeoutID);
            timeoutID = setTimeout(function () {
                func.apply(scope, Array.prototype.slice.call(args));
            }, timeout);
        };
    }

    $(window).resize(debouncer(function () {
        setDNAdata();
    }));

    setTimeout(function () {
        setDNAdata(true);
    }, 1000);

    /* var DNATimer = window.setInterval(function () {
        setDNAdata();
    }, 5000); */
});
