(function (require, chai) {
    'use strict';
    module.exports = {
        getExpect: function () {
            chai.use(require('chai-as-promised'));
            chai.use(require('dirty-chai'));
            chai.config.includeStack = true;

            return chai.expect;
        }
    };
}(require, require('chai')));