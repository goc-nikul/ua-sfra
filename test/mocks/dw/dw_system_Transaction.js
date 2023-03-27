'use strict';

function wrap(item) {
    return item();
}

function begin() {}

function commit() {}

module.exports = {
    wrap: wrap,
    begin: begin,
    commit: commit
};
