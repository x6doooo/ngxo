_ = {};

/**
 * nginx version
 */
_['ver'] = '1.6.0'

/**
 * defines a directory that will keep server files. 
 * This same directory will also be used for all relative paths set by configure (except for paths to libraries sources) and in the nginx.
 * conf configuration file. It is set to the current directory by default.
 */
_['--prefix'] = __dirname + '/nginx-' + _['ver']

/**
 * sets the name of an nginx executable file. 
 * This name is used only during installation. 
 * By default the file is named prefix/sbin/nginx.
 */
//_['--sbin-path'] = _['--prefix'] + '/sbin/nginx'
    
    
/**
 * sets the name of an nginx.conf configuration file. 
 * If needs be, nginx can always be started with a different configuration file, 
 * by specifying it in the command-line parameter -c file. 
 * By default the file is named prefix/conf/nginx.conf.
 */
//_['--conf-path'] = _['--prefix'] + '/conf/nginx.conf'

/**
 * sets the name of an nginx.pid file that will store the process ID of the main process. 
 * After installation, the file name can always be changed in the nginx.conf configuration file using the pid directive. 
 * By default the file is named prefix/logs/nginx.pid.
 */
//_['--pid-path'] = _['--prefix'] + '/logs/nginx.pid'

/**
 * sets the name of the primary error, warnings, and diagnostic file. 
 * After installation, the file name can always be changed in the nginx.conf configuration file using the error_log directive. 
 * By default the file is named prefix/logs/error.log.
 */
//_['--error-log-path'] = _['--prefix'] + '/logs/error.log'

/**
 * sets the name of the primary request log file of the HTTP server. 
 * After installation, the file name can always be changed in the nginx.conf configuration file using the access_log directive. 
 * By default the file is named prefix/logs/access.log.
 */
//_['--http-log-path'] = _['--prefix'] + '/logs/access.log'

/**
 * sets the name of an unprivileged user whose credentials will be used by worker processes. 
 * After installation, the name can always be changed in the nginx.conf configuration file using the user directive. 
 * The default user name is nobody.
 */
//_['--user'] = null

/**
 * sets the name of a group whose credentials will be used by worker processes. 
 * After installation, the name can always be changed in the nginx.conf configuration file using the user directive.
 * By default, a group name is set to the name of an unprivileged user.
 */
//_['--group']= null

/**
 * enables or disables building a module that allows the server to work with the select() method.
 * This module is built automatically if the platform does not appear to support more appropriate methods such as kqueue, epoll, rtsig, or /dev/poll.
 */
//_['--with-select_module'] = true
//or
//_['--without-select_module'] = true

/**
 * enables or disables building a module that allows the server to work with the poll() method.
 * This module is built automatically if the platform does not appear to support more appropriate methods such as kqueue, epoll, rtsig, or /dev/poll.
 */
//_['--with-poll_module'] = true
//or
//_['--without-poll_module'] = true

/**
 * disables building a module that compresses responses of an HTTP server.
 * The zlib library is required to build and run this module.
 */
//_['--without-http_gzip_module'] = true

/**
 * disables building a module that allows an HTTP server to redirect requests and change URI of requests. 
 * The PCRE library is required to build and run this module.
 */
//_['--without-http_rewrite_module'] = true

/**
 * disables building an HTTP server proxying module.
 */
//_['--without-http_proxy_module'] = true

/**
 * enables building a module that adds the HTTPS protocol support to an HTTP server.
 * This module is not built by default. The OpenSSL library is required to build and run this module.
 */
//_['--with-http_ssl_module'] = true

/**
 * sets the path to the sources of the PCRE library.
 * The library distribution (version 4.4 — 8.32) needs to be downloaded from the PCRE site and extracted.
 * The rest is done by nginx’s ./configure and make. 
 * The library is required for regular expressions support in the location directive and for the ngx_http_rewrite_module module.
 */
//_['--with-pcre'] = '' //=> eg: /usr/local/pcre-8.32

/**
 * builds the PCRE library with “just-in-time compilation” support (1.1.12, the pcre_jit directive).
 */
//_['--with-pcre-jit'] = true

/**
 * sets the path to the sources of the zlib library. 
 * The library distribution (version 1.1.3 — 1.2.7) needs to be downloaded from the zlib site and extracted.
 * The rest is done by nginx’s ./configure and make. 
 * The library is required for the ngx_http_gzip_module module.
 */
//_['--with-zlib'] = '' //=> eg: /user/include

/**
 * sets additional parameters that will be added to the CFLAGS variable.
 * When using the system PCRE library under FreeBSD, --with-cc-opt="-I /usr/local/include" should be specified. 
 * If the number of files supported by select() needs to be increased it can also be specified here such as this: --with-cc-opt="-D FD_SETSIZE=2048".
 */
_['--with-cc-opt'] = [] //=> eg: ['-D FD_SETSIZE=2048']

/**
 *  sets additional parameters that will be used during linking.
 *  When using the system PCRE library under FreeBSD, --with-ld-opt="-L /usr/local/lib" should be specified.
 */
//_['--with-ld-opt'] = [] //=> eg: ['-L /usr/local/lib']

/**
 * status page
 */
//_['--with-http_stub_status_module'] = true

module.exports = _;

