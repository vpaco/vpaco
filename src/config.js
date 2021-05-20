import { loadRemoteModule } from './utils';

let globalConfig = {
    components: {},
    remoteComponents: {},
    pages: {},
    extendsions: {}
};

let App = null;

export function getConfig() {
    return globalConfig;
}

export function setApp(app) {
    App = app;
}

export function getApp() {
    return App;
}

export function addPage(key, value) {
    if(globalConfig.pages[key]){
        // eslint-disable-next-line no-console
        console.error(`${key} 页面已存在!, 请更换页面名称`);
        return;
    }

    globalConfig.pages[key] = value;
}

export async function register(config) {
    globalConfig = config;

    config.components = config.components || {};
    config.remoteComponents = config.remoteComponents || {};
    config.pages = config.pages || {};

    for (let key in config.components) {
        const component = config.components[key];

        if (component.__esModule) {
            App.component(`vpaco_${key}`, component.default);
        } else {
            App.component(`vpaco_${key}`, component);
        }
    }

    if (globalConfig.remoteComponentsUrl) {
        globalConfig.remoteComponents = await loadRemoteModule(globalConfig.remoteComponentsUrl);
    }
}
