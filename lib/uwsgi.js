var net = require('net');

var http_codes = {
    200: 'OK',
};

var SocketWrapper = function(s) {
    this.socket = s;
    this.headerNotSend = true;
    //this.status = 200;
    this.headers = {
        'Content-Type': 'text/html'
    };
};

SocketWrapper.prototype = {
    constructor: SocketWrapper,
    send: function(content) {
        var self = this;
        var h = '';
        if (self.headerNotSend) {
            h = '\r\n';
            self.headerNotSend = false;
        }
        h += content;
        self.socket.write(h, function() {
            self.socket.destroy();
        });
    },
    end: function() {
        //this.socket.end();
        this.socket.destroy();
    },
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
                if (self.parseBuffer(bufferCache, socket) == -1) {
                    socket.destroy();
                }
            });
        });
    },
    listen: function(port) { 
        this.tcpServer.listen(port);
    },
    parseBuffer: function(buf, socket) {
        var self = this;
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
            return self.trigger(args, socket);
        }
        return 0;
    },
    
    get: function(path, callback) {
        this.register('GET', path, callback);
    },
    post: function(path, callback) {
        this.register('POST', path, callback);
    },
    on: function(method, path, callback) {
        var self = this;
        var m = method.toUpperCase();
        self.register(m, path, callback);
    },
    register: function(method, path, callback) {
        var self = this;
        var t = Object.prototype.toString.call(path);
        var store = method + 'CallbacksBy' + t.replace(/\[object\s|\]/g, '');
        if (!self[store]) {
            self[store] = {};
            self[store][path] = [callback];
            return;
        } 
        if (!self[store][path]) {
            self[store][path] = [callback];
            return;
        }
        self[store][path].push(callback);
    },
    callbackGenerator: function *(args) {
        var self = this;
        var method = args.REQUEST_METHOD;
        var path = args.PATH_INFO;
        
        var cbs;
        var i, len;
        
        // reg
        var regCbStore = self[method + 'CallbacksByRegExp'];
        for (var reg in regCbStore) {
            if (reg.test(path)) {
                cbs = regCbStore[reg];
                for (i = 0, len = cbs.length; i < len; i++) {
                    yield cbs;
                }
            }
        }

        // str
        var strCbStore = self[method + 'CallbacksByString'];
        cbs = strCbStore[path];
        if (cbs) {
            for (i = 0, len = cbs.length; i < len; i++) {
                yield cbs[i];
            }
        }
    },
    trigger: function(args, socket) {
        var self = this;
        var g = self.callbackGenerator(args);

        var wapper = new SocketWrapper(socket);
        
        queque();
        
        function queque() {
            var o = g.next();
            if (o.done) {
                console.log(11);
                wapper.destroy();
                return;
            }
            o.value(args, wapper, queque);
        }
        
    }
};

function create() {
    return new UwsgiController;
}
exports.create = create;

