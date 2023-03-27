import EventEmitter from 'events';

var emitter = new EventEmitter();
var emitters = [];
var actions = {};

emitter.setMaxListeners(3000);

const eventMgr = {
    getEmitter: (namespace) => {
        if (emitters.indexOf(namespace) > -1) {
            if (window.console) {
                window.console.log('EventMgr: Given namespace "' + namespace +
                    '" already exists. Event emitter creation failed.');
            }
            return {
                emit: () => false
            };
        }
        emitters.push(namespace);
        return {
            emit: function (eventName) {
                arguments[0] = namespace + '.' + eventName;
                return emitter.emit(...arguments);
            }
        };
    },
    on: (eventName, cb) => emitter.on(eventName, cb),
    off: (eventName, cb) => emitter.removeListener(eventName, cb),
    once: (eventName, cb) => emitter.once(eventName, cb),
    registerAction: (actionName, handler) => {
        if (actions[actionName] && window.console) {
            window.console.warn(`Overriding "${actionName}"!`);
        }
        actions[actionName] = handler;
    }
};

// make it global
window.eventMgr = eventMgr;

export default eventMgr;
