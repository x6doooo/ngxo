//var com = require('commander');
var cmd = require('./cmd');
var fs = require('fs');

// 配置文件名
var install_conf_file = '/ngx_install_conf.js';
// 当前目录
var target_path = process.cwd();
// 源目录
var src_path = __dirname;

/**
 *  初始化配置文件
 */
function initHandle(cb) {
    // 读取源文件
    fs.readFile(src_path + install_conf_file, function(err, data) {
        if (err) throw err;
        // 在当前目录下生成配置文件
        fs.writeFile(target_path + install_conf_file, data, function(err2, data2) {
            if (err2) throw err2;
            console.log('[Success] ngx_install_config.js initialized');
            if (cb && typeof cb == 'function') cb();
        });
    });
}

cmd.on('init')
    .desc('to create a nginx installer configuration file')
    .action(initHandle);


/**
 *  安装
 */
cmd.on('install')
    .desc('install nginx')
    //.option('-a | --default | auto load the packages of zlib, openSSL and PCRE')
    .option('-s | --system | load zlib, openSSL and PCRE from system')
    .option('-d | --download | download zlib, openSSl and PCRE form their sites')
    .option('-p | --path | load zlib, openSSL and PCRE by configuration in ngx_install_conf.js')
    .action(function() {
        var self = this;
        var set = self.set;
        var methodName = 'go';
        if (set.s || set.p) {
            methodName = 'goSystem';
        }
        if (set.d) {
            methodName = 'goDownload';
        }

        var hasConf = fs.existsSync(target_path + install_conf_file);
        if (!hasConf) {
            initHandle(function() {
                require('./ngx_installer')[methodName]();
            });
            return;
        }
        require('./ngx_installer')[methodName]();

    });

///////// 基本命令

/**
 *  运行
 */
cmd.on('run')
    .desc('nginx run')
    .action(function() {
        
    });

/**
 *  重启
 */
/**
 *  停止
 */
/**
 *  检查nginx.conf
 */

cmd.parse();

