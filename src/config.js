import { loadRemoteModule } from './utils';

let globalConfig = {
    components: {},
    remoteComponents: {},
    pages: {},
    extensions: {}
};

let Vue = null;

export function getConfig() {
    return globalConfig;
}

export function setVue(vue) {
    Vue = vue;
}

export function getVue(vue) {
    return Vue;
}

export function addPage(key, value) {
    if(globalConfig.pages[key]){
        // eslint-disable-next-line no-console
        console.error(`${key} 页面已存在!, 请更换页面名称`);
        return;
    }

    globalConfig.pages[key] = value;
}

export function register(config) {
    globalConfig = config;

    config.components = config.components || {};
    config.remoteComponents = config.remoteComponents || {};
    config.pages = config.pages || {};

    Object.keys(config.components || {}).forEach((key)=>{
        const component = config.components[key];

        if (component.__esModule) {
            Vue.component(`vpaco_${key}`, component.default);
        } else {
            Vue.component(`vpaco_${key}`, component);
        }
    });

    if (globalConfig.remoteResourceUrl) {
        globalConfig.remoteUrlLoading = true;
        return loadRemoteModule(globalConfig.remoteResourceUrl).then((res)=>{
            if(config.remoteResourceUrlLoadingSuccess){
                config.remoteResourceUrlLoadingSuccess(res);
            }
            globalConfig.remoteComponents = res.components;
            globalConfig.remotePages = res.pages;
            globalConfig.remoteUrlLoading = false;

            if(res.extensions){
                return loadRemoteModule(res.components[res.extensions]).then((extensions)=>{
                    globalConfig.extensions = {
                        ...extensions,
                        ...globalConfig.extensions || {}
                    };
                    return {appConfig: globalConfig, config: res};
                });
            }else{
                return {appConfig: globalConfig, config: res};
            }
        }).catch(()=>{
            globalConfig.remoteUrlLoading = false;
        });
    }else if(globalConfig.remoteResource){
        globalConfig.remoteComponents = globalConfig.remoteResource.components;
        globalConfig.remotePages = globalConfig.remoteResource.pages;

        if(globalConfig.remoteResource.extensions){
            globalConfig.extensions = {
                ...globalConfig.remoteResource.extensions,
                ...globalConfig.extensions || {}
            };
        }
        return Promise.resolve();
    } else {
        return Promise.resolve();
    }
}
