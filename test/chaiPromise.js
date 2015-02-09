(function (require, chai) {
    'use strict';
    chai.use(require('chai-as-promised'));
    chai.use(require('dirty-chai'));
    chai.config.includeStack = true;
    module.exports = chai;
}(require, require('chai')));