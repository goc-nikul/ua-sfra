'use strict';

/**
 * Controller that provides functions Business Manager Sessions.
 * @module controllers/Terminal
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var StringWriter = require('dw/io/StringWriter');
var AgentUserMgr = require('dw/customer/AgentUserMgr');
var stringWriter = new StringWriter();


/**
 * Starts a terminal session and renders the terminal UI.
 */
function start() {
    app.getView({}).render('terminal/ui');
}

/**
* Writes response object to the response.
* @param {string} rpcResponse The RPC response
 */
function writeRPCResponse(rpcResponse) {
    response.setContentType('application/json encoding=utf-8');
    response.writer.write(JSON.stringify(rpcResponse));
}

/**
 * Executes terminal commands/expressions.
 */
function evaluate() {
    var rpcRequest = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
    var rpcResponse = { id: rpcRequest.id };

    switch (rpcRequest.method) {
        case 'init':
            session.privacy.terminalCommands = '';
            rpcResponse.result = 'Initialized!';
            break;
        case 'login':
            var login = rpcRequest.params[0];
            var pwd = rpcRequest.params[1];
            var result = AgentUserMgr.loginAgentUser(login, pwd);
            if (!result.error) {
                rpcResponse.result = 'ok';
            }
            break;
        case 'list':
            rpcResponse.result = session.privacy.terminalCommands.replace(';', ';\n');
            break;
        default:
            var currentcmd = rpcRequest.method;
            var commands;
            try {
                // create and execute a new function with the commands
                if (currentcmd.match('^trace') === 'trace') {
                    currentcmd = currentcmd.replace(/^trace/, 'fakeTrace');
                    // currentcmd = currentcmd.replace(/^trace/,'stringWriter.write');
                    commands = session.privacy.terminalCommands + '; ' + currentcmd;
                    // eslint-disable-next-line no-new-func
                    new Function(commands)();
                    rpcResponse.result = stringWriter.toString();
                } else {
                    commands = session.privacy.terminalCommands + '; ' + currentcmd;
                    // eslint-disable-next-line no-new-func
                    new Function(commands)();
                    // if successful, store command in session
                    if (session.privacy.terminalCommands) {
                        session.custom.commands += '; ';
                    }
                    session.privacy.terminalCommands += rpcRequest.method;
                }
            } catch (ex) {
                rpcResponse.result = ' ' + ex;
            }
    }

    writeRPCResponse(rpcResponse);
}

/**
 * Fake trace function to capture the output visible in the terminal;
 */ // eslint-disable-next-line no-unused-vars
function fakeTrace() {
    var result = [];
    for (var i = 0; i < arguments.length; i++) {
        result.push(arguments[i]);
    }
    stringWriter.write(result.join('\n'));
}


/** Starts a terminal session and renders the terminal UI.
 * @see {@link module:controllers/Terminal~start} */
exports.Start = guard.ensure(['https'], start);

/** Executes terminal commands/expressions.
 * @see {@link module:controllers/Terminal~evaluate} */
exports.Eval = guard.ensure(['post', 'https'], evaluate);
