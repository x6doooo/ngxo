var assert = require('assert');
var con = require('../lib/cmd');

describe('command-line argv parse test', function() {

    con.on('hello')
        .desc('say hello to somebody')
        .args([
            ['who', true, 'who is that?'],
            ['sex', false, 'girl or boy']
        ])
        .option('-f | --full | autoload zlip, openSSL, PCRE')
        .option('-m | --demo | test')
        .action(function() {
            assert.equal(arguments.length, 1);
            assert.equal(arguments[0].who, '長沢まさみ');
            assert.equal(this.set.f, true);
            assert.equal(this.set.m, true);
            assert.equal(this.set.n, undefined);
        });

    it('parse order & args & options', function() {
        var args = [        
            'hello',
            '長沢まさみ',
            '-f',
            '-m',
            '-nbc'
        ];

        con.parse(args);
    });

    it('show order\'s help message', function() {
        
        var args = [
            'hello',
            '-h'
        ];

        con.parse(args);

    });

});




