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
    .desc('to create a configuration file that the Nginx\'s installer will load')
    .action(initHandle);

cmd.on('install')
    .desc('install nginx')
    .option('-a | --auto, auto load zlib, openSSL and pcre')
    .action(function() {
        var self = this;
        var set = self.set;
        console.log(set);
    });

cmd.parse();

/*
com.command('init')
    .description('to create a configuration file that the Nginx\'s installer will load.')
    .action(initHandle);
*/

/**
 *  安装nginx
 */
/*
com.command('install')
    .description('install nginx.')
    .action(function(arg) {
        var methodName = 'go';
        if (arg == 'full') {
            methodName = 'goFull';
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

 com
   .command('setup')
   .description('run remote setup commands')
   .action(function(a){
    console.log(process.argv.slice(2));
    console.log(a.options);
     console.log('setup');
   });

com.parse(process.argv);
*/
