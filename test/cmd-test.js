var assert = require('assert');
var con = require('../lib/cmd');

describe('command-line argv parse test', function() {

    it('parse order & args & options', function() {
        var args = [        
            'helo',
            '-f',
            '-m',
            '-nbc',
            'rwww'
        ];

        con.on('helo')
            .option('-f | --full, autoload zlip, openSSL, PCRE')
            .option('-m | --demo, test')
            .action(function() {
                assert.equal(arguments.length, 1);
                assert.equal(arguments[0], 'rwww');
                assert.equal(this.set.f, true);
                assert.equal(this.set.m, true);
                assert.equal(this.set.n, undefined);
            });

        con.parse(args);
    });

});




