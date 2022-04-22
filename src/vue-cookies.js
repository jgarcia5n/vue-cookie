const defaultConfig = {
  expires: '1d',
  path: '; path=/',
  domain: '',
  secure: '',
  sameSite: '; SameSite=Lax',
};

export default {
  // install of Vue
  reactive: null,
  install(Vue) {
    Vue.prototype.$cookies = this;
    Vue.$cookies = this;
    const oldFetch = fetch;
    this.reactive = new Vue({
      data() {
        return {
          internalCookies: {}
        };
      },
      computed: {
        cookies: {
          get() {
            return this.internalCookies;
          },
          set(cookie) {
            document.cookie = cookie;
            this.refresh();
          },
        },
      },
      created() {
        this.refresh();
      },
      methods: {
        refresh() {
          let keys = Object.keys(this.internalCookies);
          const c = document.cookie.split('; ');
          const cookies = {};

          for (let i = c.length - 1; i >= 0; i--) {
            const s = c[i].split('=');
            const k = decodeURIComponent(s[0]);
            let v;
            try {
              v = decodeURIComponent(s[1]);
            } catch {
              v = null;
            }
            try {
              if (JSON.stringify(this.internalCookies[k]) !== v) {
                const val = JSON.parse(v);
                this.$set(this.internalCookies, k, val);
              }
            } catch (e) {
              if (v !== this.internalCookies[k]) {
                this.$set(this.internalCookies, k, v);
              }
            }
            keys = keys.filter((ke) => ke !== k);
          }
          keys.forEach((k) => {
            this.$delete(this.internalCookies, k);
          })
          return cookies;
        },
      },
    });
    const resetCookies = this.reactive.refresh.bind(this);
    // Listen for any http request to update cookies when they are done
    // eslint-disable-next-line no-global-assign
    fetch = function() {
      return oldFetch.apply(this, arguments).then(resetCookies());
    };
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      setTimeout(() => {
        const old = this.onreadystatechange;
        this.onreadystatechange = function() {
          resetCookies();
          if (old) {
            old.apply(this, arguments);
          }
        };
      }, 0);
      return open.apply(this, arguments);
    };
  },
  config(expireTimes, path, domain, secure, sameSite) {
    defaultConfig.expires = expireTimes || '1d';
    defaultConfig.path = path ? '; path=' + path : '; path=/';
    defaultConfig.domain = domain ? '; domain=' + domain : '';
    defaultConfig.secure = secure ? '; Secure' : '';
    defaultConfig.sameSite = sameSite ? '; SameSite=' + sameSite : '; SameSite=Lax';
  },
  get(key) {
    return key !== undefined ? this.reactive.cookies[key] : this.reactive.cookies;
  },
  set(key, value, expireTimes, path, domain, secure, sameSite) {
    if (/^(?:expires|max-age|path|domain|secure|SameSite)$/i.test(key)) {
      throw new Error('Cookie key name illegality, Cannot be set to ["expires","max-age","path","domain","secure","SameSite"]\t current key name: ' + key);
    }
    // support json object
    if (value && value.constructor === Object) {
      value = JSON.stringify(value);
    }
    let _expires = '';
    expireTimes = expireTimes === undefined ? defaultConfig.expires : expireTimes;
    if (expireTimes) {
      switch (expireTimes.constructor) {
        case Number:
          if (expireTimes === Infinity || expireTimes === -1) _expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
          else _expires = '; max-age=' + expireTimes;
          break;
        case String:
          if (/^(?:\d+(y|m|d|h|min|s))$/i.test(expireTimes)) {
            // get capture number group
            const _expireTime = expireTimes.replace(/^(\d+)(?:y|m|d|h|min|s)$/i, '$1');
            // get capture type group , to lower case
            switch (expireTimes.replace(/^(?:\d+)(y|m|d|h|min|s)$/i, '$1').toLowerCase()) {
              // Frequency sorting
              case 'm':
                _expires = '; max-age=' + +_expireTime * 2592000;
                break; // 60 * 60 * 24 * 30
              case 'd':
                _expires = '; max-age=' + +_expireTime * 86400;
                break; // 60 * 60 * 24
              case 'h':
                _expires = '; max-age=' + +_expireTime * 3600;
                break; // 60 * 60
              case 'min':
                _expires = '; max-age=' + +_expireTime * 60;
                break; // 60
              case 's':
                _expires = '; max-age=' + _expireTime;
                break;
              case 'y':
                _expires = '; max-age=' + +_expireTime * 31104000;
                break; // 60 * 60 * 24 * 30 * 12
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
    this.reactive.cookies =
      encodeURIComponent(key) + '=' + encodeURIComponent(value) +
      _expires +
      (domain ? '; domain=' + domain : defaultConfig.domain) +
      (path ? '; path=' + path : defaultConfig.path) +
      (secure === undefined ? defaultConfig.secure : secure ? '; Secure' : '') +
      (sameSite === undefined ? defaultConfig.sameSite : (sameSite ? '; SameSite=' + sameSite : ''));
    return this;
  },
  remove(key, path, domain) {
    if (!key || !this.isKey(key)) {
      return false;
    }
    this.reactive.cookies = encodeURIComponent(key) +
      '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
      (domain ? '; domain=' + domain : defaultConfig.domain) +
      (path ? '; path=' + path : defaultConfig.path) +
      '; SameSite=Lax';
    return this;
  },
  isKey(key) {
    return key in this.reactive.cookies;
  },
  keys() {
    return Object.keys(this.reactive.cookies);
  },
  refresh() {
    this.reactive.refresh();

    return this;
  },
};

