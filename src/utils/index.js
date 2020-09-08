import {getConfig, getVue} from '../config';
import proxy from './proxy';
import _endsWith from 'lodash/endsWith';
import {RemoteComponent} from './RemoteComponent';

let loadedModules = {};

function typeOf(obj) {
    const toString = Object.prototype.toString;
    const map = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object'
    };
    return map[toString.call(obj)];
}

export function deepCopy(obj) {
    // hash表，记录所有的对象的引用关系
    let map = new WeakMap();

    function dp(data) {
        let existobj = map.get(data);
        // 如果这个对象已经被记录则直接返回
        if (existobj) {
            return existobj;
        }

        const t = typeOf(data);
        let o;

        if (t === 'array') {
            o = [];
        } else if (t === 'object') {
            o = {};
        } else {
            return data;
        }

        map.set(data, o);

        if (t === 'array') {
            for (let i = 0; i < data.length; i++) {
                o.push(dp(data[i]));
            }
        } else if (t === 'object') {
            for (let i in data) {
                o[i] = dp(data[i]);
            }
        }
        return o;
    }

    return dp(obj);
}

export function getNames(config) {
    let names = [];
    getNames_(config.componentList, names);

    return names;
}

function getNames_(componentList, names) {
    for (let component of componentList) {
        if (component.componentList) {
            getNames_(component.componentList, names);
        } else if (component.type === 'row') {
            for (let item of component.componentList) {
                if (item.componentList && item.componentList.length > 0) {
                    getNames_(item.componentList, names);
                }
            }
        } else {
            if (component.name) {
                if (checkLayoutNameRepeat(names, component.name)) {
                    // eslint-disable-next-line no-console
                    console && console.error('layout.js中name重复，重复name名称：' + component.name);
                }
                if (component.hidden === undefined) {
                    component.hidden = false;
                }
                names.push(component.name);
            }
        }
    }
}

function checkLayoutNameRepeat(names, name) {
    let hasOne = false;
    names.forEach(function (item) {
        if (item === name) {
            hasOne = true;
        }
    });

    return hasOne;
}

export function mergeRows(componentList, options, events, slots) {
    for (const component of componentList) {
        if (component.componentList) {
            mergeRows(component.componentList, options, events, slots);
        } else if (component.type === 'row') {
            for (const item of component.componentList) {
                mergeRows(item.componentList, options, events, slots);
            }
        } else {
            if (component.name && options[component.name]) {
                let val = options[component.name];
                Object.defineProperty(options, component.name, {
                    get(){
                        return val;
                    },
                    set(newValue){
                        component.options = newValue;
                    }
                });
                component.options = options[component.name];
            }

            if (component.name && slots[component.name]) {
                component.slots = slots[component.name];
            }

            if (component.name && events[component.name]) {
                component.events = events[component.name];
            } else {
                component.events = {};
            }
        }
    }
}

export function loadComponent(layout, pageConfig, pageName) {
    return loadComponent_(layout.componentList, pageConfig, pageName);
}

async function loadComponent_(componentList, pageConfig, pageName) {
    const appConfig = getConfig();
    for (let component of componentList) {
        if (component.componentList) {
            await loadComponent_(component.componentList, pageConfig, pageName);
        } else if (component.component || component.remoteComponent) {
            component.componentName = component.component || component.remoteComponent;
            await getProxyComponent(component.componentName, !!component.remoteComponent, pageConfig, pageName).then(proxyName => {
                component.component = proxyName;
            });
        }
    }
}

export function isRemoteComponent(name) {
    const appConfig = getConfig();

    return !!appConfig.remoteComponents[name];
}

function getRemoteComponentUrl(name) {
    const appConfig = getConfig();

    return appConfig.remoteComponents[name];
}

export async function getProxyComponent(name, isRemote, pageConfig, pageName) {
    const Vue = getVue();
    const appConfig = getConfig();

    if (!appConfig.components[name] &&
        !appConfig.remoteComponents[name] &&
        !(pageConfig.components && pageConfig.components[name]) &&
        !(pageConfig.remoteComponents && pageConfig.remoteComponents[name])
    ) {
        // eslint-disable-next-line no-console
        console.error(`组件"${name}"不存在！`);
    }

    if (!isRemote) {
        const component = appConfig.components[name] ||  pageConfig && pageConfig.components[name];
        let proxyName;

        if(pageConfig && pageConfig.components && pageConfig.components[name]){
            proxyName = pageName + name + '_proxy';
        }else if(appConfig.components[name]) {
            proxyName = name + '_proxy';
        }
        if (!Vue.component(proxyName)) {
            Vue.component(proxyName, proxy(component.__esModule ? component.default : component));
        }

        return proxyName;
    }

    let url = name;
    if (!_endsWith(url, '.js')) {
        url = appConfig.remoteComponents[name] || pageConfig && pageConfig.remoteComponents[name];
    }

    const component = await loadRemoteModule(url);

    let proxyName = btoa(url).replace(/\=/g, '') + '_remote_proxy';

    if (!Vue.component(proxyName)) {
        Vue.component(proxyName, proxy(component));
    }

    return proxyName;
}

function formatDate(date) {
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    let d = date.getDate();
    d = d < 10 ? '0' + d : d;
    let h = date.getHours();
    h = h < 10 ? '0' + h : h;
    let minute = date.getMinutes();
    minute = minute < 10 ? '0' + minute : minute;
    let second = date.getSeconds();
    second = second < 10 ? '0' + second : second;
    let millisecond = date.getMilliseconds();
    millisecond = millisecond < 10 ? '00' + millisecond : millisecond < 100 ? '0' + millisecond : millisecond;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second + ':' + millisecond;
}

export const log = {
    debug: function (msg, sys) {
        let appConfig = getConfig();

        if (appConfig.debug) {
            if (sys) {
                // eslint-disable-next-line no-console
                console && console.debug && console.debug(`[${sys ? 'SYS LOG' : 'DEV LOG'}] ${formatDate(new Date())}  ${msg}`);
            } else {
                if (this.vpIsPage) {
                    // eslint-disable-next-line no-console
                    console &&
                    // eslint-disable-next-line no-console
                    console.debug &&
                    // eslint-disable-next-line no-console
                    console.debug(`[${sys ? 'SYS LOG' : 'DEV LOG'}] [pageName: ${this.page}] ${formatDate(new Date())}  ${msg}`);
                } else {
                    // eslint-disable-next-line no-console
                    console && console.debug && console.debug(`[${sys ? 'SYS LOG' : 'DEV LOG'}] ${formatDate(new Date())}  ${msg}`);
                }
            }
        }
    }
};

export function toString(b) {
    if (b === null || b === undefined) {
        return '';
    }
    let cache = [];
    return JSON.stringify(
        b,
        function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        },
        4
    );
}

export function loadRemoteModule(url) {
    if (loadedModules[url]) {
        return Promise.resolve(loadedModules[url]);
    }

    let rc = new RemoteComponent();

    loadedModules[url] = rc.fetch(url).then(component => {
        loadedModules[url] = component;
        return component;
    });

    return loadedModules[url];
}

function getParentPageList(vm) {
    let res = [];
    let parent = vm;

    do {
        if (parent.vpIsPage) {
            res.push(parent);
            parent = parent.$parent;
        } else {
            parent = parent.$parent;
        }
    } while (parent && parent.$parent);

    return res;
}

export function getPageConfig(pageName, vm) {
    let appConfig = getConfig();
    let pageConfig;

    const parentPageList = getParentPageList(vm);

    for(const page of parentPageList) {
        if(page.rawPageConfig && page.rawPageConfig.pages && page.rawPageConfig.pages[pageName]){
            pageConfig = page.rawPageConfig.pages[pageName];
            break;
        }
    }

    if(!pageConfig && appConfig.pages[pageName]){
        pageConfig = appConfig.pages[pageName];
    }

    return pageConfig;
}
