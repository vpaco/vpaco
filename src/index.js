import {
    register as _register,
    setVue, addPage as _addPage
} from './config';
import {
    loadRemoteModule as _loadRemoteModule,
    parseModule as _parseModule,
    getComponent as _getComponent
} from './utils';
import Page from './components/page';
import Component from './components/component';

export const VpPage = Page;
export const VpComponent = Component;
export const register = _register;
export const addPage = _addPage;
export const loadRemoteModule = _loadRemoteModule;
export const parseModule = _parseModule;
export const getComponent = _getComponent;
export const install = function (Vue, opts = {}) {
    Vue.component('VpPage', VpPage);
    Vue.component('VpComponent', VpComponent);
    setVue(Vue);
};

// auto install
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

export default {
    install,
    register,
    VpPage,
    VpComponent,
    addPage,
    loadRemoteModule,
    parseModule,
    getComponent
};
