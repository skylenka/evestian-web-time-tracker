
// @todo add tests
// "chai": "~4.1.2",
// "jsdom": "~12.0.0",
// "mocha": "~5.2.0",
// "mocha-logger": "~1.0.6",
// "sinon": "~6.3.2",
// "sinon-chrome": "~2.3.2"
// "test": "mocha --recursive"

const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
const chrome = require('sinon-chrome');
const mlog = require('mocha-logger');

chrome.runtime.getManifest.returns({
    version: '0.0.1',
    debug: true
});

global.window = window;
global.document = window.document;
global.chrome = chrome;
global.mlog = mlog;
global.MAIN_DIR = '../../../..';

function copyProps(src, target) {
    const props = Object.getOwnPropertyNames(src)
        .filter((prop) => typeof target[prop] === 'undefined')
        .reduce((result, prop) => ({
            result,
            [prop]: Object.getOwnPropertyDescriptor(src, prop),
        }), {});
    Object.defineProperties(target, props);
}
copyProps(window, global);
