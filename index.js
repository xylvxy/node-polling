/**
 * @license
 * Node-polling 0.0.1 <http://github.com/xylvxy/node-polling>
 * Copyright (c) 2013-2014 James Loo
 * Available under MIT license
 */
(function(){
    var Uuid = require('node-uuid');
    var Http = require('http');
    var EventEmitter = require('events').EventEmitter;
    var Util = require('util');
    var Url  = require('url');
    function HttpConnMgt(){
        EventEmitter.call(this);
        this._httpConnAry = [];//{uid:{req:*, res:*, t:unix_time}, ....}
        this._timer = null;
        this._timeout = 15000;
    }
    Util.inherits(HttpConnMgt, EventEmitter);
    HttpConnMgt.prototype.start = function(port, ip, timeoutMS){
        this._timer = setInterval(_HttpMgt.onTimer.bind(_HttpMgt), 1000);
        this._server = Http.createServer(_HttpMgt.onConn.bind(_HttpMgt));
        this._server.listen(port, ip);
        this._timeout = (timeoutMS==undefined)?15000:timeoutMS;
    };
    HttpConnMgt.prototype.stop = function(){
        if(!this._timer)
            return;
        clearInterval(this._timer);
        this._timer =  null;
    };
    HttpConnMgt.prototype.SendByUid = function(uid, dataStr){
        if(this._httpConnAry[uid]){
            this._httpConnAry[uid].res.end(dataStr);
            delete this._httpConnAry[uid];
            this.emit('close', uid);
        }
    };
    HttpConnMgt.prototype.onTimer = function(){
        //console.log('timer', Object.keys(this._httpConnAry));
        var tNow = new Date().getTime();
        for(var p in this._httpConnAry){
            var conn = this._httpConnAry[p];
            if((this._timeout+conn.t)<tNow){
                conn.res.end();
                delete this._httpConnAry[p];
            }
        }
    };
    HttpConnMgt.prototype.onConn = function(req, res){
        var dataStr  = '';
        var curUid = Uuid.v1();
        req.on('error', function (e) {
            console.log('request error', e)
        });
        req.on('data',function(buf){
            dataStr+=buf;
        });
        req.on('end', function(){
            console.log('conn', curUid);
            this._httpConnAry[curUid] = {req:req, res:res, t:new Date().getTime()};
            var urlObj = Url.parse(req.url, true);
            this.emit('conn', curUid, urlObj.query, dataStr);
        }.bind(this));
        req.on('close',function(){
            console.log('req close');
            if(this._httpConnAry[curUid]){
                this._httpConnAry[curUid].res.end();
                delete this._httpConnAry[curUid];
                this.emit('close', curUid);
            }
        }.bind(this));
    };
    //--------------------------------------------------
    var _HttpMgt = null;
    exports.create = function(){
        if(_HttpMgt==null)
            _HttpMgt = new HttpConnMgt();
        return _HttpMgt;
    };
})();