/**
 *  cmd.js
 *  用于解析命令行下的调用参数
 *
 *  Usage:
 *      
 *      var cmd = require('./cmd');
 *
 *      cmd
 *        .on('docs')
 *        .args([
 *          //name      required   desc
 *          ['which',    true,      'description'],
 *          ['where',    false,     'description']
 *        ])
 *        .option('-d | --dev, just show the dev documents list')
 *        .option('-a | --admin, just show the admin documents list')
 *        .action(function() {
 *          var args = arguments[0]
 *          // if run `node this.js docs theFirstOne onTheTable`
 *          // args => 
 *          //  {
 *          //      which: 'theFirstOne',
 *          //      wherr: 'onTheTable'
 *          //  }
 *          var self = this;
 *          var set = self.set;
 *          // if run `node this.js docs -d`
 *          //  set.d => true 
 *          //  and
 *          //  set.a => undefined
 *        });
 *
 *      cmd.parse();    //parse process.argv
 *
 */

var colors = require('colors');
var Table = require('cli-table');

// 单条命令
var Command = function(name) {

    this.name = name;
    this.options = {};
    this.set = {};

};
Command.prototype = {
    constructor: Command,
    /** 
     *  添加命令描述
     */
    desc: function(txt) {
        this.descTxt = txt;
        return this;
    },
    /**
     *  添加参数
     *  argsArr =>
     *  [
     *      [name, require, desc],
     *      [name, require, desc],
     *      ...
     *  ]
     */
    args: function(argsArr) {
        this.argsArr = argsArr; 
        return this;
    },
    /**
     *  添加命令参数
     *  可以链式调用多次
     */
    option: function(op) {
        op = op.trim().split(/\s*\|\s*/);
        this.options[op[0].substr(1)] = {
            tit: op[1],
            dsc: op[2]
        };
        return this;
    },
    /**
     *  添加命令动作
     *  cb是命令要触发的function
     *  一个命令只能有一个动作
     */
    action: function(cb) {
        if (typeof cb !== 'function') {
            throw 'order ' + this.name + ' \'s action should be a function!';
        }
        this.cb = cb;
        return this;
    },
    /**
     *  运行命令动作
     */
    run: function(args, opts) {
        var self = this;
        if (!self.cb) return;
        self.set = {};
        opts.forEach(function(v, i, a) {
            if (self.options[v]) {
                self.set[v] = true;
            }
        });
        var argsObj = {};
        var argsArr = self.argsArr;
        var argValue;
        if (argsArr) {
            argsArr.forEach(function(v, i, a) {
                argValue = args[i];
                if (typeof argValue === 'undefined' && v[1]) {
                    throw 'wrong params: ' + v[0] + ' is undefined';
                }
                if (typeof argValue === 'undefined') return;
                argsObj[v[0]] = argValue;
            });
        }
        self.cb.call(self, argsObj);
    }
};

// 主控
var Con = function() {
    Con.prototype.init.apply(this, arguments);
};
Con.prototype = {
    constructor: Con,
    init: function() {
        this.commandSet = {};
    },
    /**
     *  监听命令
     *  返回一个单条命令的实例
     *  可以通过链式操作，继续给命令添加option和action
     */
    on: function(c) {
        return this.commandSet[c] = new Command(c);
    },
    /**
     *  解析命令行参数
     */
    parse: function(args) {
        var self = this;
        args = args || Array.prototype.slice.call(process.argv, 2);
        if (!args || args.length == 0) {
            self.run('help', [], []);
            return;
        }
        var c = args.shift();
        if (c == '-h') {
            self.run('help', [], []);
            return;
        }

        var o = [];
        var a = [];

        var v;
        for (var i = 0, len = args.length; i < len; i++) {
            v = args[i];
            if (v.indexOf('-') == 0) {
                // 输出当前命令的help
                if (v == '-h') {
                    self.showOrderHelp(c);
                    return;
                }

                v = v.substr(1);
                if (v.length > 1) {
                    o = o.concat(v.split(''));
                } else {
                    o.push(v);
                }
            } else {
                a.push(v);
            }
        }
        self.run(c, a, o);
    },
    /**
     *  取出命令
     *  if 命令不存在 then 报错
     */
    getCommand: function(c) {
        var objCom = this.commandSet[c];
        if (!objCom) {
            //TODO: 没有命令
            throw 'wrong order: ' + c + ' is undefined!';
        }
        return objCom;
    },
    /**
     *  运行命令
     */
    run: function(c, args, opts) {
        var objCom = this.getCommand(c);
        objCom.run(args, opts);
    },
    /**
     *  输出某条命令的help
     */
    showOrderHelp: function(c) {
        var objCom = this.getCommand(c);
        //console.log(objCom);
        console.log('\nDescription: ' + objCom.descTxt);
        console.log('\nUsage:\n');
        var line_usage = [];
        line_usage.push('  ngxo');
        line_usage.push(objCom.name);
        // 参数
        var t_args = table();
        if (objCom.argsArr) {
            var argsArr = objCom.argsArr;
            for (var i = 0, len = argsArr.length; i < len; i++) {
                var arg = argsArr[i];
                var argName;
                if (arg[1]) {
                    argName = '<' + arg[0] + '>';
                } else {
                    argName = '[' + arg[0] + ']';
                }
                line_usage.push(argName);
                t_args.push([
                    ' ',
                    arg[1] ? '*' : ' ',
                    arg[0],
                    '=>',
                    arg[2]
                ]);
            }
        }
        // 选项
        var opts = objCom.options;

        var t_opts = table();
        var theOpt;
        for (var key in opts) {
            theOpt = opts[key];
            t_opts.push([
                '  -' + key,
                '  ',
                '[' + theOpt.tit + ']',
                '  ',
                '# ' + theOpt.dsc
            ]);
        }

        if (theOpt) {
            line_usage.push('[-options]');
        }

        var t_usage = table();
        t_usage.push(line_usage);
        console.log(t_usage.toString());

        if (objCom.argsArr) {
            console.log('\nargs: ( * -> required field )\n');
            console.log(t_args.toString());
        }

        if (theOpt) {
            console.log('\noptions:\n')
            console.log(t_opts.toString());
        }
        
        console.log('');

    }
};


function table() {

    return new Table({
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
         , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
         , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
         , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 0, 'padding-right': 0 }
    });

}

var cmd = new Con;

cmd.on('help')
    .desc('show the help message.')
    .action(function() {

        var self = this;
    
        process.stdout.write('\nUsage:');
        console.log('\tngxo COMMAND [ARGS] [OPTIONS]\n'.green);

        console.log('The most common ngxo commands are:');

        var commandSet = cmd.commandSet;

        var t = table();

        for (var key in commandSet) {
            if (key == 'help') continue;
            t.push([
                '  ' + key,
                '   =>',
                commandSet[key].descTxt
            ]);
        }

        console.log(t.toString());

        console.log('\nAll commands can be run with -h for more information\n');
        
    });

module.exports = cmd;

