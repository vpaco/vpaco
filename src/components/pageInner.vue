<template>
    <Container :config="pageConfig" :refs="refs" v-if="pageConfig && visible" :class="getPageClass"/>
</template>
<script>
    import {mergeRows, log, deepCopy, loadComponent, toString, getPageConfig} from '../utils';
    import Container from './container/container';
    import {getConfig} from '../config';
    import isArray from 'isarray';

    export default {
        components: {Container},
        props: {
            page: {
                type: String
            },
            options: {
                type: Object
            },
            events: {
                type: Object
            },
            config: {
                type: Object
            },
            isRemote: {
                type: Boolean
            },
        },

        data: function () {
            return {
                vpIsPage: true,
                pageConfig: null,
                historyList: [],
                visible: false,
                lastPage: null,
                innerOptions: null,
                layout: null
            };
        },

        watch: {
            page: function () {
                this.reloadPage();
            },

            config: function(){
                this.reloadPage();
            },

            options: {
                deep: true,
                handler(val, oldVal) {
                    this.$nextTick(() => {
                        this.optionsChange && this.optionsChange(val, oldVal);
                    });
                }
            }
        },

        created() {
            const appConfig = getConfig();

            this.refs = {};
            this.layoutRefs = {};
            this.ancestorRefs = {};

            const pageKeyword = ['page', 'options', 'events', 'refs', 'layoutRefs', 'ancestorRefs', 'vpIsPage', 'pageConfig', 'historyList', 'visible', 'lastPage', 'innerOptions', 'layout', 'merge', 'reloadPage', '_initAncestorRefs', '_initLayoutRefs', 'emit', 'pushPage', 'popPage', 'getParentPageList']

            for (const key in appConfig.extensions) {
                if (pageKeyword.includes(key)) {
                    // eslint-disable-next-line no-console
                    console.error(`${key}为页面关键字，请更换名称`);
                }
                this[key] = appConfig.extensions[key].bind(this);
            }

            this.reloadPage();
        },

        methods: {
            getPageClass(){
                const pageName = (this.page || (this.config && this.config.name))
                if(pageName){
                    return 'vp-page-' + pageName;
                }else{
                    return '';
                }
            },
            merge(layout, {slots = {}, events = {}, options = {}, methods = {}}) {
                if (!layout) {
                    return null;
                }
                for (const key in methods) {
                    this[key] = methods[key];
                }

                if (layout.componentList) {
                    mergeRows(layout.componentList, options, events, slots);
                }

                return layout;
            },
            async reloadPage() {
                if (this.lastPage) {
                    this.destroy && this.destroy();
                    log.debug(`[page destroy] > pageName: ${this.lastPage}`, true);
                }
                const appConfig = getConfig();
                this.lastPage = null;
                if (!this.page && !this.config) {
                    this.pageConfig = null;
                    return;
                }

                let rawPageConfig;

                if(this.config){
                    rawPageConfig = this.config;
                }else {
                    rawPageConfig = await getPageConfig(this.page, this, this.isRemote);
                }

                if (this.page && !rawPageConfig) {
                    return;
                }

                let layout = rawPageConfig.layout;

                this.rawPageConfig = rawPageConfig;

                layout = deepCopy(layout);
                if (isArray(layout)) {
                    layout = {componentList: layout};
                } else if (!layout.componentList) {
                    layout = {componentList: [layout]};
                }
                this._initLayoutRefs([layout]);

                this._initAncestorRefs();

                let configCallback = rawPageConfig.config;
                let config = configCallback ? (()=>{
                    return configCallback.bind(this)(this);
                })() : {};

                let {options, events, methods, init, mounted, optionsChange, destroy} = config;

                this.destroy = destroy;
                this.optionsChange = optionsChange;
                this.pageConfig = null;
                this.visible = false;
                let pageConfig = this.merge(layout, config);
                this.innerPageConfig = pageConfig;
                this.$nextTick(() => {
                    this.refs = {};
                    // 空页面
                    if (!layout) {
                        return;
                    }
                    // 加载组件
                    loadComponent(layout, rawPageConfig, this.page).then(() => {
                        this.$emit('on-component-ready');

                        const showPage = () => {
                            let logOptions = null;
                            if (appConfig.debug) {
                                logOptions = deepCopy(this.options) || {};
                            }
                            if (init) {
                                if (appConfig.debug) {
                                    log.debug(`[page init] > pageName: ${this.page};  options: ${toString(logOptions)}`, true);
                                }
                                init(() => {
                                    this.visible = true;
                                    this.pageConfig = pageConfig;
                                    this.innerOptions = options;
                                    this.lastPage = this.page;
                                    if (appConfig.debug) {
                                        log.debug(`[page start] > pageName: ${this.page};  options: ${toString(logOptions)}`, true);
                                    }
                                    this.$nextTick(() => {
                                        this.$parent.$emit('on-rendered');
                                        this._page_rendered = true;
                                        mounted && mounted();
                                    });
                                });
                            } else {
                                this.visible = true;
                                this.pageConfig = pageConfig;
                                this.innerOptions = options;
                                this.lastPage = this.page;
                                this.$nextTick(() => {
                                    this._page_rendered = true;
                                    this.$parent.$emit('on-rendered');
                                });
                                if (appConfig.debug) {
                                    log.debug(`[page start] > pageName: ${this.page};  options: ${toString(logOptions)}`, true);
                                }
                            }
                        };

                        if (appConfig.beforePageEnter) {
                            if (appConfig.debug) {
                                log.debug(`[page before enter] > pageName: ${this.page}`, true);
                            }
                            appConfig.beforePageEnter(
                                {
                                    pageName: this.page,
                                    options: options
                                },
                                () => {
                                    showPage();
                                }
                            );
                        } else {
                            showPage();
                        }
                    });
                });
            },

            _initAncestorRefs() {
                let ancestorPageList = this.getParentPageList();

                for (const it of ancestorPageList) {
                    this.ancestorRefs[it.page] = it;
                }
            },

            _initLayoutRefs(list) {
                for (const it of list) {
                    if (it.name) {
                        this.layoutRefs[it.name] = it;
                    }
                    if (it.componentList) {
                        this._initLayoutRefs(it.componentList);
                    }
                }
            },

            emit(a, b, c, d, e) {
                this.$parent.$emit(a, b, c, d, e);
            },

            pushPage(page, options) {
                if (page === -1) {
                    const last = this.historyList.pop();

                    if (!last) {
                        return -1;
                    }

                    page = last.page;
                    options = last.options;
                } else {
                    this.historyList.push({page: this.page, options: this.options});
                }

                this.$emit('update:page', '');

                this.$nextTick(() => {
                    this.$emit('update:options', options);
                    this.$nextTick(() => {
                        this.$emit('update:page', page);
                    });
                });
            },

            popPage() {
                const last = this.historyList.pop();

                if (!last) {
                    return -1;
                }

                const page = last.page;
                const options = last.options;

                this.$emit('update:page', '');

                this.$nextTick(() => {
                    this.$emit('update:options', options);
                    this.$emit('update:page', page);
                });
            },

            getParentPageList() {
                let res = [];
                let parent = this;

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
        },

        destroyed() {
            if (this.lastPage) {
                this.destroy && this.destroy();
                log.debug(`[page destroy] > pageName: ${this.lastPage}`, true);
            }
        }
    };
</script>
