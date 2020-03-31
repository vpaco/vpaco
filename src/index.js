import { register as _register, setVue } from './config';
import Page from './components/page';
import Component from './components/component';

export const VpPage = Page;
export const VpComponent = Component;
export const register = _register;
export const install = function (Vue, opts = {}) {
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
    VpComponent
};
