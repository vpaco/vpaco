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
            Object.keys(data).forEach((i)=>{
                o[i] = dp(data[i]);
            });
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
    componentList.forEach((component)=>{
        if (component.componentList) {
            getNames_(component.componentList, names);
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
    })
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

export function mergeRows(componentList, options, events, slots, vm) {
    const Vue = getVue();
    componentList.forEach((component)=>{
        if (component.componentList) {
            mergeRows(component.componentList, options, events, slots);
        } else {
            if (component.name && options[component.name]) {
                if(typeOf(options[component.name]) === 'function'){
                    component.options = options[component.name]()
                    vm.$watch(options[component.name], (val)=>{
                        component.options = val
                    })
                }else{
                    let val = options[component.name];
                    Object.defineProperty(options, component.name, {
                        get(){
                            return val;
                        },
                        set(newValue){
                            val = newValue;
                            component.options = newValue;
                        }
                    });
                    component.options = options[component.name];
                }
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
    });
}

export function loadComponent(layout, pageConfig, pageName) {
    return getRemoteComponents().then(()=>{
        return loadComponent_(layout.componentList, pageConfig, pageName);
    });
}

function loadComponent_(componentList, pageConfig, pageName) {
    const appConfig = getConfig();
    let defs = [];
    componentList.forEach((component)=>{
        if (component.componentList) {
            defs.push(loadComponent_(component.componentList, pageConfig, pageName));
        } else if (component.component || component.remoteComponent) {
            component.componentName = component.component || component.remoteComponent;
            defs.push(getProxyComponent(component.componentName, !!component.remoteComponent, pageConfig, pageName).then(proxyName => {
                component.component = proxyName;
            }));
        }
    });

    return Promise.all(defs);
}

export function isRemoteComponent(name) {
    const appConfig = getConfig();

    return !!appConfig.remoteComponents[name];
}

function getRemoteComponentUrl(name) {
    const appConfig = getConfig();

    return appConfig.remoteComponents[name];
}

function getRemoteComponents(){
    const appConfig = getConfig();

    return new Promise((resolve, reject)=>{
        if(appConfig.remoteComponentsUrlLoading){
            setInterval(()=>{
                if(!appConfig.remoteComponentsUrlLoading){
                    resolve(appConfig.remoteComponents);
                }
            }, 30);
        }else{
            resolve(appConfig.remoteComponents);
        }
    });

}

export function getProxyComponent(name, isRemote, pageConfig, pageName) {
    const Vue = getVue();
    const appConfig = getConfig();

    return getRemoteComponents().then((remoteComponents)=>{
        if (!appConfig.components[name] &&
            !remoteComponents[name] &&
            !(pageConfig.components && pageConfig.components[name]) &&
            !(pageConfig.remoteComponents && pageConfig.remoteComponents[name])
        ) {
            // eslint-disable-next-line no-console
            console.error(`组件"${name}"不存在！`);
        }

        if (!isRemote || (isRemote && remoteComponents && typeof remoteComponents[name] === 'object')) {
            const components = isRemote ? remoteComponents : appConfig.components;
            const pageComponents = isRemote ? (pageConfig && pageConfig.remoteComponents) : (pageConfig && pageConfig.components);
            const component = (pageComponents || components)[name];
            let proxyName;

            if(pageComponents && pageComponents[name]){
                proxyName = pageName + name + '_proxy';
            }else if(components  && components[name]) {
                proxyName = name + '_proxy';
            }
            if (!Vue.component(proxyName)) {
                Vue.component(proxyName, proxy(component.__esModule ? (component.default || component) : component));
            }

            return Promise.resolve(proxyName);
        }

        let url = name;
        let defs = [];
        if (!_endsWith(url, '.js')) {
            url = remoteComponents[name] || pageConfig && pageConfig.remoteComponents[name];
        }

        let proxyName = btoa(url).replace(/\=/g, '') + '_remote_proxy';

        if (!Vue.component(proxyName)) {
            defs.push(loadRemoteModule(url).then((component)=>{
                Vue.component(proxyName, proxy(component));
            }));
        }

        return Promise.all(defs).then(()=>{
            return proxyName;
        });
    });

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

export function getComponent (name, isRemote = true) {
    let appConfig = getConfig();

    return getRemoteComponents().then((remoteComponents)=>{
        if(isRemote){
            const url = remoteComponents[name];
            if(!url){
                throw new Error('远程组件' + name + '不存在');
            }
            return loadRemoteModule(url);
        }else{
            const comp = appConfig.components[name];
            if(!comp){
                throw new Error('本地组件' + name + '不存在');
            }
            return Promise.resolve(appConfig.components[name]);
        }
    });
}

export function loadRemoteModule(url, name = 'default') {
    if (loadedModules[url]) {
        return Promise.resolve(loadedModules[url][name]);
    }

    let rc = new RemoteComponent();

    loadedModules[url] = rc.fetch(url).then(component => {
        loadedModules[url] = component;
        return component[name];
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

export function getPageConfig(pageName, vm, isRemote = false) {
    let appConfig = getConfig();
    let pageConfig;

    const parentPageList = getParentPageList(vm);

    if(isRemote === false){
        parentPageList.forEach((page)=>{
            if(!pageConfig && page.rawPageConfig && page.rawPageConfig.pages && page.rawPageConfig.pages[pageName]){
                pageConfig = page.rawPageConfig.pages[pageName];
            }
        });

        if(!pageConfig && appConfig.pages[pageName]){
            pageConfig = appConfig.pages[pageName];
        }
    }

    parentPageList.forEach((page)=>{
        if(!pageConfig && page.rawPageConfig && page.rawPageConfig.remotePages && page.rawPageConfig.remotePages[pageName]){
            isRemote = true;
            pageConfig = page.rawPageConfig.remotePages[pageName];
        }
    });

    if(!pageConfig && appConfig.remotePages && appConfig.remotePages[pageName]){
        isRemote = true;
        pageConfig = appConfig.remotePages[pageName];
    }

    if(!pageConfig){
        // eslint-disable-next-line no-console
        console.error(`页面${pageName}不存在！`);
    }

    return new Promise((resolve, reject)=>{
        if (isRemote) {
            loadRemoteModule(pageConfig).then((config)=>{
                resolve(config);
            });
        } else {
            resolve(pageConfig);
        }
    });
}

export function createLayout(ele, config, children){
    if(ele === 'container'){
        return {
            ...config || {},
            componentList: children
        }
    }else if (ele === 'component'){
        config = {...config.attrs || {}, ...config};
        const {alias, name, ...others} = config;
        return {name: alias, component: name, ...others || {}};
    }else if (ele === 'remoteComponent'){
        const {alias, name, ...others} = config;
        return {name: alias, remoteComponent: name, ...others || {}};
    }
}
