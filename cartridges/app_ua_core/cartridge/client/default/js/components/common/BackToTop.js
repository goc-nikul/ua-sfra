import Component from '../core/Component';
import { scrollTo } from '../../util';

export default class BackToTop extends Component {
    init() {
        this.settings = {
            backToTopBottomElement: '.js-back_to_top-button',
            footer: '.js-footer',
            shownClass: 'm-shown',
            animationSpeed: 700
        };

        this.initConfig(this.settings);

        if (this.eligibleOnDevice()) {
            this.initializeCache();
            this.initializeEvents();
        }
    }

    initializeCache() {
        this.cache = {};
        this.cache.$window = $(window);
        this.cache.$document = $(document);
        this.cache.$html = $('html');
        this.cache.$footer = this.cache.$document.find(this.config.footer);
        this.cache.$backToTopBottomElement = this.cache.$document.find(this.config.backToTopBottomElement);
    }

    onWindowScroll() {
        var scrollTop = this.cache.$window.scrollTop();
        var windowInnerHeight = this.cache.$window.innerHeight();

        this.$el.toggleClass('m-shown', scrollTop > windowInnerHeight);
    }

    onClick() {
        scrollTo(0, this.config.animationSpeed);
    }

    trackChatSize(iframeNode) {
        this.cache.$html.addClass('chat-initialized');
        var self = this;

        // track if chat iframe was removed
        const removeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach((node) => {
                        if (node.tagName === 'IFRAME' && node.className.includes('__cb_plugin_chat')) {
                            removeObserver.disconnect();

                            self.cache.$html.removeClass('chat-initialized chat-maximized');
                            self.trackChatInitialization();
                        }
                    });
                }
            });
        });
        removeObserver.observe(document.body, { childList: true });

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    self.cache.$html.toggleClass('chat-maximized', mutation.target.className.includes('maximized'));
                }
            });
        });

        observer.observe(iframeNode, { attributes: true, attributeFilter: ['class'], subtree: true });
    }


    trackChatInitialization() {
        var chatIframeNode = document.getElementsByClassName('__cb_plugin_chat');
        if (chatIframeNode[0]) {
            this.trackChatSize(chatIframeNode[0]);
            return;
        }
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Loop through the added nodes and check if any are iframes.__cb_plugin_chat
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName === 'IFRAME' && node.className.includes('__cb_plugin_chat')) {
                            this.trackChatSize(node);
                            observer.disconnect();
                        }
                    });
                }
            });
        });
        // Start observing changes in the body element
        observer.observe(document.body, { childList: true });
    }

    initializeEvents() {
        this.trackChatInitialization();
        this.eventMgr('window.scroll', this.onWindowScroll.bind(this));
        this.event('click', this.onClick.bind(this), this.cache.$backToTopBottomElement);
    }
}
