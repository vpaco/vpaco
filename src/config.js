import { loadRemoteModule } from './utils';

let globalConfig = null;

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

export async function register(config) {
    globalConfig = config;

    config.components = config.components || {}
    config.remoteComponents = config.remoteComponents || {}

    for (let key in config.components) {
        const component = config.components[key];

        if (component.__esModule) {
            Vue.component(`vpaco_${key}`, component.default);
        } else {
            Vue.component(`vpaco_${key}`, component);
        }
    }

    if (globalConfig.remoteComponentsUrl) {
        globalConfig.remoteComponents = await loadRemoteModule(globalConfig.remoteComponentsUrl);
    }
}
