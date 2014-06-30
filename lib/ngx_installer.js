var os = require('os');
var conf = require(process.cwd() + '/ngx_install_conf');
var download = require('download');
var colors = require('colors');
var sleep = require('./sleep');
var child_process = require('child_process');
var spawn = child_process.spawn;
var exec = child_process.exec;
var fs = require('fs');
var path = require('path');

/**
 *  安装器
 *  ngx和pcre的安装器的父类
 */
var Installer = function() {
    Installer.prototype.init.apply(this, arguments);
};

Installer.prototype = {
    constructor: Installer,
    init: function(cfg) {
        this.cfg = cfg || {};
    },
    start: function() {
        var self = this;
        var cfg = self.cfg;
        process.stdout.write('ngxo start installing ' + cfg.name + '.');
        sleep(1);
        process.stdout.write('.');
        sleep(1);
        process.stdout.write('.\n');
        sleep(1);
    },
    // 虚函数
    checkConf: function() {
        return [];
    },
    download: function() {
        var self = this;
        var cfg = self.cfg;
        console.log(('=> download ' + cfg.name).green);
        var d = download(cfg.download_path, cfg.tmp_dir, { extract: true });
        var content = {
            total: 0,
            done: 0
        };

        d.on('response', function(res) {
            content.total = res.headers['content-length'] * 1;
            process.stdout.write('[                    ] 0% ');
        });

        d.on('data', function(d) {
            content.done += d.length;
            var percent = (content.done / content.total * 100).toFixed(1);
            var bar = '[';
            var l = ~~(percent / 5);
            var i;
            for (i = 0; i < l; i++) {
                bar += '=';
            }
            for (i = 0, l = 20 - l; i < l; i++) {
                bar += ' ';
            }
            bar += '] ' + percent + '% ';
            process.stdout.clearLine(); 
            process.stdout.cursorTo(0);
            process.stdout.write(bar);
        });

        d.on('close', function() {
            process.stdout.write('\n');
            if(self.afterDownload) {
                self.afterDownload();
            }
        });

        d.on('error', function(err) {
            throw err;
        });
    },
    spawn_listener: function(child, name, next, handleError) {
        var self = this;
        var notFound = [];
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', function(data) {
            if (data.indexOf('with nginx by using --with-pcre=<path> option') >= 0) {
                notFound.push('pcre');
            }
            if (data.indexOf('with nginx by using --with-zlib=<path> option') >= 0) {
                notFound.push('zlib');
            }
            if (data.indexOf('with nginx by using --with-openssl=<path> option') >= 0) {
                notFound.push('openssl');
            }
            if (data.indexOf('error:') >= 0) {
                console.log(data.red);
                return;
            }
            process.stdout.write(data);
        });
        
        child.stderr.on('data', function(data) {
            process.stdout.write(data);
        });

        child.on('close', function(code) {
            if (code !== 0) {
                console.log(('[ERR] ' + name + ' process exited with code ' + code).red);
                if (notFound.length) {
                    notFound.forEach(function(v, i, a) {
                        //TODO: 提示使用命令进行完全安装
                        //console.log('[Tip] ')
                    });
                }
                return;
            }
            next();
        });
    },
};


var NgxInstaller = function() {
    Installer.apply(this, arguments);
};

NgxInstaller.prototype = new Installer;
NgxInstaller.prototype.contructor = NgxInstaller;
NgxInstaller.prototype.afterDownload = function() {
    var self = this;
    var cf = self.checkConf();
    self.configure(cf);
};
NgxInstaller.prototype.checkConf = function() {
    var self = this;
    var cfg = self.cfg;
    var params = [];
    var tem;
    for (var k in cfg.make_conf) {
        
        tem = cfg.make_conf[k];
        
        if (tem === true) {
            params.push(k);
            continue;
        }

        if (Object.prototype.toString.call(tem) == '[object Array]') {
            if (k == '--with-cc-opt' && os.platform() == 'darwin') {
                tem.push('-Wno-deprecated-declarations');
            }
            if (tem.length === 0) continue;
            tem = tem.join(' ');
            params.push(k + '=' + tem + '');
            continue;
        }

        if (tem === null) continue;
        
        params.push(k + '=' + tem);
    }

    return params;
};

/**
 * nginx configure
 */
NgxInstaller.prototype.configure = function(cf) {
    var self = this;
    var cfg = self.cfg;
    var m = './configure';
    console.log(('=> ' + m).green);
    console.log('--> options: ' + cf);
    sleep(1);
    var child = spawn(m, cf, {
        cwd: cfg.make_path
    });
    self.spawn_listener(child, 'nginx make configure', function() {
        self.make();
    });
};

/**
 *  nginx make
 */
NgxInstaller.prototype.make = function() {
    var self = this;
    var cfg = self.cfg;
    var m = 'make';// -C ' + make_path + '/';
    console.log(('=> ' + m).green);
    sleep(1);
    var child = spawn(m, [], {
        cwd: cfg.make_path
    });
    self.spawn_listener(child, 'nginx make', function() {
        self.makeInstall();
    });
};

/**
 *  nginx make install
 */
NgxInstaller.prototype.makeInstall = function() {
    var self = this;
    var cfg = self.cfg;
    var m = 'make';
    console.log(('=> make install').green);
    sleep(1);
    var child = spawn(m, ['install'], {
        cwd: cfg.make_path
    });
    self.spawn_listener(child, 'nginx make install', function() {
        // 设置配置文件
        //console.log(cfg);
        
        var localConf = {};
        var cnf = cfg.make_conf;

        // 安装路径
        if (cnf['--prefix']) {
            localConf['--prefix'] = cnf['--prefix'];
        } else {
            localConf['--prefix'] = '/usr/local/nginx';
        }
        
        // sbin path
        if (cnf['--sbin-path']) {
            localConf['--sbin-path'] = cnf['--sbin-path'];
        } else {
            localConf['--sbin-path'] = localConf['--prefix'] + '/sbin/nginx';
        }

        // conf path
        if (cnf['--conf-path']) {
            localConf['--conf-path'] = cnf['--conf-path'];
        } else {
            localConf['--conf-path'] = localConf['--prefix'] + '/conf/nginx.conf';
        }

        // pid path
        if (cnf['--pid-path']) {
            localConf['--pid-path'] = cnf['--pid-path'];
        } else {
            localConf['--pid-path'] = localConf['--prefix'] + '/logs/nginx.pid';
        }

        // error log
        if (cnf['--error-log-path']) {
            localConf['--error-log-path'] = cnf['--error-log-path'];
        } else {
            localConf['--error-log-path'] = localConf['--prefix'] + '/logs/error.log';
        }

        // http log
        if (cnf['--http-log-path']) {
            localConf['--http-log-path'] = cnf['--http-log-path'];
        } else {
            localConf['--http-log-path'] = localConf['--prefix'] + '/logs/access.log';
        }

        // 写入配置文件
        var confJSON = JSON.stringify(localConf, null, 4);
        fs.writeFileSync(process.cwd() + '/nginx_base_conf.js', 'module.exports = ' + confJSON + ';');

        // 删除临时文件夹
        exec('rm -r ' + process.cwd() + '/' + cfg.tmp_dir, function() {
            console.log('[Success] ' + cfg.name + ' install done!'.green);
        });
    });
};

/**
 *  nginx安装配置
 */
var ver = conf.ver;
delete conf.ver;
var ngxCfg = {};
ngxCfg.name          = 'nginx-' + ver;
ngxCfg.tmp_dir       = 'nginx-tmp';
ngxCfg.download_path = 'http://nginx.org/download/' + ngxCfg.name + '.tar.gz';
ngxCfg.make_conf     = conf;
ngxCfg.make_path     = process.cwd() + '/' + ngxCfg.tmp_dir + '/' + ngxCfg.name;


/**
 *  pcre
 */

var PcreInstaller = function() {
    Installer.apply(this, arguments);
};

PcreInstaller.prototype = new Installer;
PcreInstaller.prototype.contructor = PcreInstaller;
PcreInstaller.prototype.afterDownload = function() {
    var self = this;
    var cfg = self.cfg;
    ngxCfg.make_conf['--with-pcre'] = cfg.make_path;
    zlibIns.download();
    //nIns.afterDownload();
};


var pcreCfg = {};
pcreCfg.ver = '8.35';
pcreCfg.name = 'pcre-' + pcreCfg.ver;
pcreCfg.tmp_dir = 'nginx-tmp';
pcreCfg.download_path = 'http://jaist.dl.sourceforge.net/project/pcre/pcre/' + pcreCfg.ver + '/pcre-' + pcreCfg.ver + '.tar.gz';
pcreCfg.make_path = process.cwd() + '/' + pcreCfg.tmp_dir + '/' + pcreCfg.name;

/**
 *  zlib
 */
var ZlibInstaller = function() {
    Installer.apply(this, arguments);    
};

ZlibInstaller.prototype = new Installer;
ZlibInstaller.prototype.contructor = ZlibInstaller;
ZlibInstaller.prototype.afterDownload = function() {
    var self = this;
    var cfg = self.cfg;
    ngxCfg.make_conf['--with-zlib'] = cfg.make_path;
    opensslIns.download();
    //nIns.afterDownload();
};

var zlibCfg = {};
zlibCfg.ver = '1.2.8';
zlibCfg.name = 'zlib-' + zlibCfg.ver;
zlibCfg.tmp_dir = 'nginx-tmp';
zlibCfg.download_path = 'http://zlib.net/' + zlibCfg.name + '.tar.gz';
zlibCfg.make_path = process.cwd() + '/' + zlibCfg.tmp_dir + '/' + zlibCfg.name;

/**
 *  openSSL
 */
var OpenSSLInstaller = function() {
    Installer.apply(this, arguments);    
};

OpenSSLInstaller.prototype = new Installer;
OpenSSLInstaller.prototype.contructor = OpenSSLInstaller;
OpenSSLInstaller.prototype.afterDownload = function() {
    var self = this;
    var cfg = self.cfg;
    ngxCfg.make_conf['--with-openssl'] = cfg.make_path;
    ngxIns.start();
    ngxIns.download();
    //nIns.afterDownload();
};

var opensslCfg = {};
opensslCfg.ver = '1.0.1h';
opensslCfg.name = 'openssl-' + opensslCfg.ver;
opensslCfg.tmp_dir = 'nginx-tmp';
opensslCfg.download_path = 'https://www.openssl.org/source/' + opensslCfg.name + '.tar.gz';
opensslCfg.make_path = process.cwd() + '/' + opensslCfg.tmp_dir + '/' + opensslCfg.name;

//console.log(opensslCfg.download_path);

var ngxIns = new NgxInstaller(ngxCfg);
var pcreIns = new PcreInstaller(pcreCfg);
var opensslIns = new OpenSSLInstaller(opensslCfg);
var zlibIns = new ZlibInstaller(zlibCfg);

// 使用ngxo打包的包
function go() {

    var s_src_path = path.normalize(__dirname + '/../resources');
    var src_path = process.cwd() + '/nginx_tmp';

    console.log('please wait...');
    exec('cp -r ' + s_src_path + ' ' + src_path, function() {
        //console.log('[Success] ' + cfg.name + ' install done!'.green);
        var dirs_arr = fs.readdirSync(src_path);
        var tem;

        for (var i = 0, len = dirs_arr.length; i < len; i++) {
            tem = dirs_arr[i];
            if (tem.indexOf('nginx') >= 0) {
                ngxIns.cfg.name = tem;
                var p = path.resolve(ngxIns.cfg.make_conf['--prefix'], '../');
                ngxIns.cfg.make_conf['--prefix'] = path.resolve(p, './' + tem);
                ngxIns.cfg.make_path = src_path + '/' + tem;
                continue;
            }
            if (tem.indexOf('pcre') >= 0) {
                ngxIns.cfg.make_conf['--with-pcre'] = src_path + '/' + tem;
                continue;
            }
            if (tem.indexOf('zlib') >= 0) {
                ngxIns.cfg.make_conf['--with-zlib'] = src_path + '/' + tem;
                continue;
            }
            if (tem.indexOf('openssl') >= 0) {
                ngxIns.cfg.make_conf['--with-openssl'] = src_path + '/' + tem;
                continue;
            }
        }
        ngxIns.start();
        ngxIns.afterDownload();
    });

}

// 使用配置文件里的设定
// 使用系统自带的包
function goSystem() {
    ngxIns.start();
    ngxIns.download();
}

// 下载zlib、openSSL、pcre
function goDownload() {
    pcreIns.download();
}

//exports.go = goPCRE;
exports.go = go;
exports.goSystem = goSystem;
exports.goDownload = goDownload;


