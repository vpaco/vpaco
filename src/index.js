import { register as _register, setApp, addPage as _addPage } from './config';
import Page from './components/page';
import Component from './components/component';

export const VpPage = Page;
export const VpComponent = Component;
export const register = _register;
export const addPage = _addPage;
export const install = function (App, opts = {}) {
    setApp(App)
    App.component('VpPage', VpPage);
    App.component('VpComponent', VpComponent);
};

export default {
    install,
    register,
    VpPage,
    VpComponent,
    addPage
};
