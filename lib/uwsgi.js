var net = require('net');

var SocketWrapper = function(s) {
    this.socket = s;
};

SocketWrapper.prototype = {
    constructor: SocketWrapper
};

var UwsgiController = function() {
    UwsgiController.prototype.init.apply(this, arguments);
};

UwsgiController.prototype = {
    constructor: UwsgiController,
    init: function(socketHandler) {
        var self = this;
        self.tcpServer = net.createServer(function(socket) {
            var bufferCache = new Buffer(0);
            socket.on('data', function(data) {
                bufferCache = Buffer.concat([bufferCache, data]);
                if (self.parseBuffer(bufferCache) == -1) {
                    socket.destroy();
                }
            });
        });
    },
    listen: function(port) { 
        this.tcpServer.listen(port);
    },
    parseBuffer: function(buf, socket) {
        if (buf.length >= 4) {
            var modifier1 = buf.readUInt8(0);
            var pktsize = buf.readUInt16LE(1);
            var modifier2 = buf.readUInt8(3);

            if (buf.length - 4 < pktsize) return 0;

            var args = {};
            var item_len;
            var base;
            var items;
            var i, j;
            for(i = 0; i < pktsize; ) {
                items = [];
                for (j = 0; j < 2; j++) {
                    item_len = buf.readUInt16LE(4 + i);
                    base = 4 + i + 2;
                    items.push(buf.toString('utf8', base, base + item_len));
                    i += 2 + item_len;
                }
                args[items[0]] = items[1];
            }
        }
        return 0;
    },
    
    getCallbacksByString: {},
    getCallbacksByRegExp: {},
    
    postCallbacksByString: {},
    postCallbacksByRegExp: {},

    get: function(path, callback) {
        this.register('get', path, callback);
    },
    post: function(path, callback) {
        this.register('post', path, callback);
    },
    register: function(method, path, callback) {
        var self = this;
        var t = Object.prototype.toString.call(path);
        var store = method + 'CallbacksBy' + t.replace(/\[object\s|\]/g, '');
        self[store][path] = callback;
    },

    trigger: function(method, args, socket) {
    }
};

function create() {
    return new UwsgiController;
}
exports.create = create;

