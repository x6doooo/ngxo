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
 *        .option('-d | --dev, just show the dev documents list')
 *        .option('-a | --admin, just show the admin documents list')
 *        .action(function() {
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
     *  添加命令参数
     *  可以链式调用多次
     */
    option: function(op) {
        op = op.trim().split(/\s*\|\s*/);
        this.options[op[0].substr(1)] = op[1];
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
    run: function(ops, args) {
        var self = this;
        if (!self.cb) return;
        self.set = {};
        ops.forEach(function(v, i, a) {
            if (self.options[v]) {
                self.set[v] = true;
            }
        });
        self.cb.apply(self, args);
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
            return;
        }
        var c = args.shift();

        // show help message
        if (c == '-h' || c == 'help') {
            self.help();
            return;
        }

        var o = [];
        var a = [];
        args.forEach(function(v, i, arr) {
            if (v.indexOf('-') == 0) {
                v = v.substr(1);
                if (v.length > 1) {
                    o = o.concat(v.split(''));
                } else {
                    o.push(v);
                }
            } else {
                a.push(v);
            }
        });
        self.run(c, o, a);
    },
    /**
     *  运行命令
     */
    run: function(c, ops, args) {
        var objCom = this.commandSet[c];
        if (!objCom) {
            //TODO: 没有命令
            return;
        }
        objCom.run(ops, args);
    },
    /**
     *  show help message
     */
    help: function() {
        //TODO: format order info
    }
};

var cmd = new Con;


module.exports = cmd;
