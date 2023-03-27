#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');

const gitRepo = path.resolve(process.cwd(), '.git');
const gitHooksDir = path.resolve(gitRepo, 'hooks');

/*
 * Check `.git/hooks` folder
 */
if (fs.existsSync(gitHooksDir)) {
    /*
    * If it's there, Remove old hooks to make way for the new ones
    */
    const removeDir = function(path) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path);

        if (files.length > 0) {
            files.forEach(function(filename) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename);
                } else {
                    fs.unlinkSync(path + "/" + filename);
                }
            })
            fs.rmdirSync(path);
        } else {
            fs.rmdirSync(path);
        }
        } else {
            console.log("Directory path not found.");
        }
    }

    removeDir(gitHooksDir)
}