import {getConfig, getVue} from '../config';
import proxy from './proxy';
import {RemoteComponent} from './RemoteComponent';

let uid = 1000;

let loadedModules = {};
let renderStack = [

];

function getStackItemById(id){
    return renderStack.find(it => it.id === id);
}

function getStackComponentById(id){
    const item  = renderStack.find(it => it.id === id);
    let instance = item.instance;

    if(instance  && instance.vpIsComponent){
        instance = instance.$refs.component;
    }
    if(instance && instance.vpComponentWrapper){
        instance = instance.$children[0];
    }
    return instance;
}

export function getUid(){
    uid = uid + 1;
    return uid;
}

export function addRenderStack(one){
    renderStack.push(one);
}

export function removeRenderStackItem(id){
    const index = renderStack.findIndex(it=>it.id === id);
    renderStack.splice(index, 1);
}

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
    });
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
                    component.options = options[component.name]();
                    vm.$watch(options[component.name], (val)=>{
                        component.options = val;
                    });
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

export function loadComponent(layout, pageConfig, pageName, vpId) {
    return getRemoteComponents().then(()=>{
        return loadComponent_(layout.componentList, pageConfig, pageName, vpId);
    });
}

function loadComponent_(componentList, pageConfig, pageName, vpId) {
    const appConfig = getConfig();
    let defs = [];
    componentList.forEach((component)=>{
        if (component.componentList) {
            defs.push(loadComponent_(component.componentList, pageConfig, pageName, vpId));
        } else if (component.component || component.remoteComponent) {
            component.componentName = component.component || component.remoteComponent;
            defs.push(getProxyComponent(component.componentName, component.isRemote, vpId).then(proxyName => {
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
        if(appConfig.remoteUrlLoading){
            setInterval(()=>{
                if(!appConfig.remoteUrlLoading){
                    resolve(appConfig.remoteComponents);
                }
            }, 30);
        }else{
            resolve(appConfig.remoteComponents);
        }
    });

}

function getResource(name, isRemote, type, id, level){
    const appConfig = getConfig();
    if(!id || id === 0){
        return;
    }
    const typeMap = {
        page: ['pages','remotePages'],
        component: ['components', 'remoteComponents']
    };

    const remote = typeMap[type][1], local = typeMap[type][0];
    const item = getStackItemById(id);
    let result;
    const  lev = level;

    if(item.type === 'page'){
        const pageInstance = getStackComponentById(id);
        const config = pageInstance.rawPageConfig || {};
        if(isRemote && config[remote] &&  config[remote][name]){
            result = {resource: config[remote][name], from: 'remote', scoped: true, page: item.name};
        }else if(!isRemote && config[local] &&  config[local][name]){
            result = {resource: config[local][name], from: 'local', scoped: true, page: item.name};
        }else if(!isRemote && config[remote] &&  config[remote][name]){
            result = {resource: config[remote][name], from: 'remote', scoped: true, page: item.name};
        }else {
            result = getResource(name, isRemote, type,  item.pid, ++level);
        }
    }else {
        result = getResource(name, isRemote, type,  item.pid, ++level);
    }

    if(lev === 0 && !result){
        if(isRemote && appConfig[remote] && appConfig[remote][name]){
            result = {resource: appConfig[remote][name], from: 'remote', scoped: false};
        }else if(!isRemote && appConfig[local] && appConfig[local][name]){
            result = {resource: appConfig[local][name], from: 'local', scoped: false};
        }else if(!isRemote && appConfig[remote] && appConfig[remote][name]){
            result = {resource: appConfig[remote][name], from: 'remote', scoped: false};
        }
    }

    return  result;
}

export function getProxyComponent(name, isRemote, vpId) {
    const Vue = getVue();
    const {resource, from, scoped, page} = getResource(name, isRemote, 'component', vpId, 0);

    if(!resource){
        throw Error(`组件"${name}"不存在！`);
    }
    let proxyName;

    if(typeof resource === 'object'){
        if(scoped && page){
            proxyName = page + name + '_proxy';
        }else {
            proxyName = name + '_proxy';
        }
        if (!Vue.component(proxyName)) {
            Vue.component(proxyName, proxy(resource.__esModule ? resource : resource, name));
        }
        return Promise.resolve(proxyName);
    }

    if(typeof resource === 'string'){
        proxyName = btoa(resource).replace(/\=/g, '') + '_remote_proxy';
        return loadRemoteModule(resource).then((component)=>{
            Vue.component(proxyName, proxy(component,name));
            return proxyName;
        });
    }
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
        return Promise.resolve(loadedModules[url]);
    }

    let rc = new RemoteComponent();

    loadedModules[url] = rc.fetch(url).then(component => {
        const res = component.__esModule ? component[name] : component;
        loadedModules[url] = res;
        return res;
    });

    return loadedModules[url];
}

export function parseModule(content){
    let rc = new RemoteComponent();
    return rc.parse(content);
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

export function getPageConfig(pageName, vpId, isRemote) {
    let appConfig = getConfig();
    let pageConfig;

    const {resource, from, scoped, page} = getResource(pageName, isRemote, 'page', vpId, 0);

    if(!resource){
        throw Error(`页面"${pageName}"不存在！`);
    }

    if(typeof resource === 'object'){
        return Promise.resolve(resource);
    }

    if(typeof resource === 'string'){
        return loadRemoteModule(resource);
    }
}

export function createLayout(ele, config, children){
    if(ele === 'container'){
        return {
            ...config || {},
            componentList: children
        };
    }else if (ele === 'component'){
        config = {...config.attrs || {}, ...config};
        const {alias, name, ...others} = config;
        return {name: alias, component: name, ...others || {}};
    }else if (ele === 'remoteComponent'){
        const {alias, name, ...others} = config;
        return {name: alias, remoteComponent: name, ...others || {}};
    }
}
