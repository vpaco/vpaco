<template>
    <Container :config="pageConfig" :refs="refs" v-if="pageConfig && visible" :class="getPageClass" :vpId="vpId" />
</template>
<script>
import {
    mergeRows,
    log,
    deepCopy,
    loadComponent,
    toString,
    getPageConfig,
    createLayout,
    loadRemoteModule,
    parseModule,
    addRenderStack,
    removeRenderStackItem,
    getUid,
    recursive,
    getRefs
} from '../utils';
import Container from './container/container';
import { getConfig } from '../config';
import isArray from 'isarray';

export default {
    components: { Container },
    props: {
        page: {
            type: String
        },
        options: {
            type: Object
        },
        config: {
            type: Object
        },
        isRemote: {
            type: Boolean
        },
        parentId: {
            type: Number
        }
    },

    data: function () {
        return {
            vpIsPage: true,
            pageConfig: null,
            historyList: [],
            visible: false,
            lastPage: null,
            innerOptions: null,
            layout: null,
            vpId: getUid(),
            loadRemoteModule
        };
    },

    watch: {
        page: function () {
            this.reloadPage();
        },

        config: function () {
            this.reloadPage();
        },

        options: {
            deep: true,
            handler(val, oldVal) {
                if (this.optionsChange) {
                    this.optionsChange(val, oldVal);
                } else {
                    if (this.destroy) {
                        this.destroy();
                    }
                    this.renderPage(this.rawPageConfig);
                }
            }
        }
    },

    created() {
        const appConfig = getConfig();

        this.refs = {};
        this.layoutRefs = {};
        this.ancestorRefs = {};

        const pageKeyword = [
            'page',
            'options',
            'events',
            'refs',
            'layoutRefs',
            'ancestorRefs',
            'vpIsPage',
            'pageConfig',
            'historyList',
            'visible',
            'lastPage',
            'innerOptions',
            'layout',
            'merge',
            'reloadPage',
            '_initAncestorRefs',
            '_initLayoutRefs',
            'emit',
            'pushPage',
            'popPage',
            'getParentPageList'
        ];

        Object.keys(appConfig.extensions || {}).forEach(key => {
            if (pageKeyword.includes(key)) {
                // eslint-disable-next-line no-console
                console.error(`${key}为页面关键字，请更换名称`);
            }
        });

        addRenderStack({
            id: this.vpId,
            pid: this.parentId,
            type: 'page',
            instance: this,
            name: this.page
        });

        this.reloadPage();
    },

    methods: {
        getPageClass() {
            const pageName = this.page || (this.config && this.config.name);
            if (pageName) {
                return 'vp-page-' + pageName;
            } else {
                return '';
            }
        },
        merge(layout, { slots = {}, events = {}, options = {}, methods = {} }) {
            if (!layout) {
                return null;
            }
            Object.keys(methods || {}).forEach(key => {
                this[key] = methods[key];
            });

            if (layout.componentList) {
                mergeRows(layout.componentList, options, events, slots, this);
            }

            return layout;
        },
        reloadPage() {
            if (this.lastPage) {
                this.destroy && this.destroy();
                log.debug(`[page destroy] > pageName: ${this.lastPage}`, true);
            }

            this.lastPage = null;
            if (!this.page && !this.config) {
                this.pageConfig = null;
                return;
            }

            if (this.config) {
                this.renderPage(this.config);
            } else if (this.page) {
                getPageConfig(this.page, this.vpId, this.isRemote).then(config => {
                    this.renderPage(config);
                });
            }
        },

        renderPage(rawPageConfig) {
            const appConfig = getConfig();
            const isReload = rawPageConfig === this.rawPageConfig;
            const self = this;
            if (!isReload) {
                this.pageConfig = null;
                this.visible = false;
                this.refs = {};
            }
            if (this.page && !rawPageConfig) {
                return Promise.resolve();
            }

            this.rawPageConfig = rawPageConfig;

            let configCallback = rawPageConfig;
            const options = {};
            let setup, mounted, destroy, layout;
            const route = this.$route || {};
            const info = {
                context: {
                    options: { $params: route.params, $query: route.query, ...this.options },
                    router: this.$router,
                    route: this.$route,
                    pushPage: this.pushPage,
                    popPage: this.popPage,
                    refs: this.refs,
                    layoutRefs: this.layoutRefs,
                    loadRemoteModule,
                    parseModule,
                    reload: ref => {
                        return new Promise((resolve, reject) => {
                            if (!ref) {
                                this.renderPage(this.rawPageConfig).then(()=>{
                                    resolve();
                                });
                            } else if (this.layoutRefs[ref]) {
                                this.layoutRefs[ref].hidden = true;
                                this.$nextTick(() => {
                                    this.layoutRefs[ref].hidden = false;
                                    this.$nextTick(() => {
                                        resolve();
                                    });
                                });
                            }else {
                                resolve();
                            }
                        });
                    },
                    ...(appConfig.extensions || {})
                },
                initState(name, state) {
                    if (arguments.length === 2) {
                        self.$set(options, name, state);
                        return state;
                    } else if (arguments.length === 1) {
                        const attr = 'autoState';
                        self.$set(options, attr, name);
                        return name;
                    }
                },
                useState(name, state) {
                    if (arguments.length === 2) {
                        self.$set(options, name, state);
                        return state;
                    } else if (arguments.length === 1) {
                        const attr = 'autoState';
                        self.$set(options, attr, name);
                        return name;
                    }
                },
                setLayout: layoutConfig => {
                    layout = layoutConfig;
                    layout = this._initLayout(layoutConfig);
                    this.layout = layout;
                },
                render: layoutConfig => {
                    layout = layoutConfig;
                    layout = this._initLayout(layoutConfig);
                },
                setState(name, state) {
                    if (arguments.length === 2) {
                        Object.keys(state).forEach(it => {
                            options[name][it] = state[it];
                        });
                    } else if (arguments.length === 1) {
                        const attr = 'autoState';
                        Object.keys(name).forEach(it => {
                            options[attr][it] = name[it];
                        });
                    }
                },
                setup(callback) {
                    setup = callback;
                },
                optionsChange: callback => {
                    this.optionsChange = callback;
                },
                mounted(callback) {
                    mounted = callback;
                },
                destroy(callback) {
                    destroy = callback;
                }
            };
            let methods = configCallback
                ? (() => {
                      return configCallback.bind(this)(info);
                  })()
                : {};

            if (methods instanceof Promise) {
                return methods.then(methods => {
                    return this._renderPage({ options, methods, destroy, layout, rawPageConfig, setup, mounted });
                });
            } else {
                return this._renderPage({ options, methods, destroy, layout, rawPageConfig, setup, mounted });
            }
        },

        _initLayout(layout) {
            if (typeof layout === 'function') {
                layout = layout(createLayout);
            } else if (!layout) {
                layout = [];
            }

            if (isArray(layout)) {
                layout = { componentList: layout };
            } else if (!layout.componentList) {
                layout = { componentList: [layout] };
            }
            this._initLayoutRefs([layout]);

            this._initAncestorRefs();

            getRefs(layout);

            return layout;
        },

        _renderPage({ options, methods, destroy, layout, rawPageConfig, setup, mounted }) {
            const appConfig = getConfig();
            let config = { options, methods };

            this.destroy = destroy;

            let pageConfig = this.merge(layout, config);
            // 加载组件
            return new Promise((resolve, reject) => {
                loadComponent(layout, rawPageConfig, this.page, this.vpId).then(() => {
                    this.$emit('on-component-ready');

                    const showPage = () => {
                        let logOptions = null;
                        if (appConfig.debug) {
                            logOptions = deepCopy(this.options) || {};
                        }
                        if (setup) {
                            if (appConfig.debug) {
                                log.debug(`[page setup] > pageName: ${this.page};  options: ${toString(logOptions)}`, true);
                            }
                            setup(() => {
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
                                    resolve();
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
                                resolve();
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

            ancestorPageList.forEach(it => {
                this.ancestorRefs[it.page] = it;
            });
        },

        _initLayoutRefs(list) {
            recursive(list, 'componentList', item => {
                if (item.list) {
                    item.componentList = item.list;
                }
                if (item.ref) {
                    this.layoutRefs[item.ref] = item;
                }
            });
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
                this.historyList.push({ page: this.page, options: this.options });
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
        removeRenderStackItem(this.vpId);
    }
};
</script>
