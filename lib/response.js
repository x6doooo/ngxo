var http = require('http');
var util = require('util');
var debug = util.debuglog('http');

/**
 *  覆盖原方法
 *  原方法中会判断chunk块的长度，并把长度写进消息里。
 *  此处删除这些处理，让nginx处理。
 */
http.ServerResponse.prototype.write = function(chunk, encoding, callback) {
    var CRLF = '\r\n';
    var crlf_buf = new Buffer('\r\n');
    if (!this._header) {
        this._implicitHeader();
    }

    if (!this._hasBody) {
        debug('This type of response MUST NOT have a body. ' + 'Ignoring write() calls.');
        return true;
    }

    if (!util.isString(chunk) && ! util.isBuffer(chunk)) {
        throw new TypeError('first argument must be a string or Buffer');
    }

    // If we get an empty string or buffer, then just do nothing, and
    // signal the user to keep writing.
    if (chunk.length === 0) return true;

    var len, ret;
    if (this.chunkedEncoding) {
        if (util.isString(chunk) && encoding !== 'hex' && encoding !== 'base64' && encoding !== 'binary') {
            //len = Buffer.byteLength(chunk, encoding);
            //chunk = len.toString(16) + CRLF + chunk + CRLF;
            chunk = chunk + CRLF;
            ret = this._send(chunk, encoding, callback);
        } else {
            // buffer, or a non-toString-friendly encoding
            //if (util.isString(chunk)) len = Buffer.byteLength(chunk, encoding);
            //else len = chunk.length;

            /*
            if (this.connection && ! this.connection.corked) {
                this.connection.cork();
                var conn = this.connection;
                process.nextTick(function connectionCork() {
                    if (conn) conn.uncork();
                });
            }*/
            //this._send(len.toString(16), 'binary', null);
            //this._send(crlf_buf, null, null);
            this._send(chunk, encoding, null);
            ret = this._send(crlf_buf, null, callback);
        }
    } else {
        ret = this._send(chunk, encoding, callback);
    }

    debug('write ret = ' + ret);
    return ret;
};

function createResponse(socket) {
    var res = new http.ServerResponse(socket);
    res.connection = socket;
    socket._httpMessage = res;
    res.end = function(d) {
        if (d) {
            res.write(d, function() {
                socket.destroy();
            });
            return;
        }
        socket.destroy();
    };
    return res;
}

exports.create = createResponse;
