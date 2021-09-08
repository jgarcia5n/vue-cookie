"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var defaultConfig = {
  expires: '1d',
  path: '; path=/',
  domain: '',
  secure: '',
  sameSite: '; SameSite=Lax'
};
var _default = {
  // install of Vue
  reactive: null,
  install: function install(Vue) {
    Vue.prototype.$cookies = this;
    Vue.$cookies = this;
    var oldFetch = fetch;
    this.reactive = new Vue({
      data: function data() {
        return {
          docCookie: ''
        };
      },
      computed: {
        cookies: {
          get: function get() {
            var c = this.docCookie.split('; ');
            var cookies = {};

            for (var i = c.length - 1; i >= 0; i--) {
              var k = c[i].split('=');
              var v = decodeURI(k[1]);

              try {
                cookies[k[0]] = JSON.parse(v);
              } catch (e) {
                cookies[k[0]] = decodeURI(v);
              }
            }

            return cookies;
          },
          set: function set(cookie) {
            document.cookie = cookie;
            this.refresh();
          }
        }
      },
      created: function created() {
        this.refresh();
      },
      methods: {
        refresh: function refresh() {
          this.docCookie = document.cookie;
        }
      }
    });
    var resetCookies = this.reactive.refresh.bind(this); // Listen for any http request to update cookies when they are done
    // eslint-disable-next-line no-global-assign

    fetch = function fetch() {
      return oldFetch.apply(this, arguments).then(resetCookies());
    };

    var open = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function () {
      var _this = this;

      setTimeout(function () {
        var old = _this.onreadystatechange;

        _this.onreadystatechange = function () {
          resetCookies();
          old.apply(this, arguments);
        };
      }, 0);
      return open.apply(this, arguments);
    };
  },
  config: function config(expireTimes, path, domain, secure, sameSite) {
    defaultConfig.expires = expireTimes || '1d';
    defaultConfig.path = path ? '; path=' + path : '; path=/';
    defaultConfig.domain = domain ? '; domain=' + domain : '';
    defaultConfig.secure = secure ? '; Secure' : '';
    defaultConfig.sameSite = sameSite ? '; SameSite=' + sameSite : '; SameSite=Lax';
  },
  get: function get(key) {
    return key !== undefined ? this.reactive.cookies[key] : this.reactive.cookies;
  },
  set: function set(key, value, expireTimes, path, domain, secure, sameSite) {
    if (/^(?:expires|max-age|path|domain|secure|SameSite)$/i.test(key)) {
      throw new Error('Cookie key name illegality, Cannot be set to ["expires","max-age","path","domain","secure","SameSite"]\t current key name: ' + key);
    } // support json object


    if (value && value.constructor === Object) {
      value = JSON.stringify(value);
    }

    var _expires = '';
    expireTimes = expireTimes === undefined ? defaultConfig.expires : expireTimes;

    if (expireTimes) {
      switch (expireTimes.constructor) {
        case Number:
          if (expireTimes === Infinity || expireTimes === -1) _expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT';else _expires = '; max-age=' + expireTimes;
          break;

        case String:
          if (/^(?:\d+(y|m|d|h|min|s))$/i.test(expireTimes)) {
            // get capture number group
            var _expireTime = expireTimes.replace(/^(\d+)(?:y|m|d|h|min|s)$/i, '$1'); // get capture type group , to lower case


            switch (expireTimes.replace(/^(?:\d+)(y|m|d|h|min|s)$/i, '$1').toLowerCase()) {
              // Frequency sorting
              case 'm':
                _expires = '; max-age=' + +_expireTime * 2592000;
                break;
              // 60 * 60 * 24 * 30

              case 'd':
                _expires = '; max-age=' + +_expireTime * 86400;
                break;
              // 60 * 60 * 24

              case 'h':
                _expires = '; max-age=' + +_expireTime * 3600;
                break;
              // 60 * 60

              case 'min':
                _expires = '; max-age=' + +_expireTime * 60;
                break;
              // 60

              case 's':
                _expires = '; max-age=' + _expireTime;
                break;

              case 'y':
                _expires = '; max-age=' + +_expireTime * 31104000;
                break;
              // 60 * 60 * 24 * 30 * 12

              default:
                throw new Error('unknown exception of "set operation"');
            }
          } else {
            _expires = '; expires=' + expireTimes;
          }

          break;

        case Date:
          _expires = '; expires=' + expireTimes.toUTCString();
          break;
      }
    }

    this.reactive.cookies = encodeURIComponent(key) + '=' + encodeURIComponent(value) + _expires + (domain ? '; domain=' + domain : defaultConfig.domain) + (path ? '; path=' + path : defaultConfig.path) + (secure === undefined ? defaultConfig.secure : secure ? '; Secure' : '') + (sameSite === undefined ? defaultConfig.sameSite : sameSite ? '; SameSite=' + sameSite : '');
    return this;
  },
  remove: function remove(key, path, domain) {
    if (!key || !this.isKey(key)) {
      return false;
    }

    this.reactive.cookies = encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (domain ? '; domain=' + domain : defaultConfig.domain) + (path ? '; path=' + path : defaultConfig.path) + '; SameSite=Lax';
    return this;
  },
  isKey: function isKey(key) {
    return key in this.reactive.cookies;
  },
  keys: function keys() {
    return Object.keys(this.reactive.cookies);
  },
  refresh: function refresh() {
    this.reactive.refresh();
    return this;
  }
};
exports.default = _default;
