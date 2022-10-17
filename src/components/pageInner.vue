<template>
    <Container :config="pageConfig" :refs="refs" v-if="pageConfig && visible" :class="getPageClass" :vpId="vpId" />
</template>
<script>
import {
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
    getRefs,
    deepFreeze,
    debounce
} from '../utils';
import Container from './container/container';
import { getConfig } from '../config';
import isArray from 'isarray';
/**
 * 页面中状态分2种：
 * 1、外部传入 props
 * 2、内部组件及页面的state
 *
 * 当1改变时的处理，有2种处理方式可供选择：
 * 1、自动模式：
 *  自动模式时，当检测到页面出入的props改变时，自动再次执行页面配置函数，此时页面内部组件的state将会重新生成。页面内部组件不会销毁，但是状态会置为最新的。
 * 2、手动模式
 *  手动模式时，通过optionsChange接口props的改变，在optionsChange的处理函数中手动对props的改变对页面内部状态做更新。
 *
 * 内部组件及页面的state改变时, 会重新执行render函数，不会重新执行页面配置函数；执行render函数组件不会销毁重建，只是更新状态。
 *
 */
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
            type: Function
        },
        isRemote: {
            type: Boolean
        },
        parentId: {
            type: Number
        }
    },

    data: function() {
        return {
            vpIsPage: true,
            pageConfig: null,
            historyList: [],
            visible: false,
            lastPage: null,
            innerOptions: null,
            vpId: getUid(),
            loadRemoteModule,
            state: {},
            useStateIndex: 0
        };
    },

    watch: {
        page: function() {
            this.reloadPage();
        },

        config: function() {
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
            name: this.page || `no_page_name${this.vpId}`
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

        reReloadPage: debounce(function() {
            if (!this.pageConfig) {
                return;
            }
            this._renderPage(true);
        }, 10),

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
                                this.renderPage(this.rawPageConfig).then(() => {
                                    resolve();
                                });
                            } else if (this.layoutRefs[ref] && this.layoutRefs[ref].visible !== false) {
                                this.layoutRefs[ref].visible = false;
                                this.$nextTick(() => {
                                    this.layoutRefs[ref].visible = true;
                                    this.$nextTick(() => {
                                        resolve();
                                    });
                                });
                            } else {
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
                // 页面reload时 useState会再次调用，$watch会调用多次
                useState(state) {
                    const index = self.useStateIndex++;
                    // let freezeState;
                    if (self.state[index]) {
                        // freezeState = deepFreeze(self.state[index]);
                    } else {
                        // freezeState  = deepFreeze(state);
                        self.$set(self.state, index, state);
                        // $set后如果直接$watch首次也会触发$watch的处理函数，需要加一个nexttick
                        self.$nextTick(() => {
                            self.$watch(
                                () => {
                                    return self.state[index];
                                },
                                () => {
                                    if (self.state[index] === undefined) {
                                        return;
                                    }
                                    self.reReloadPage();
                                },
                                { deep: true, immdiate: false }
                            );
                        });
                    }
                    return self.state[index];
                    // return [realState, (state)=>{
                    //     Object.keys(state).forEach((key)=>{
                    //         self.state[index][key] = state[key];
                    //     });
                    //     self.reReloadPage();
                    // }];
                },
                setLayout: layoutConfig => {
                    layout = layoutConfig;
                    layout = this._initLayout(layoutConfig);
                    this.layout = layout;
                },
                render: layoutConfig => {
                    layout = layoutConfig;
                    this.layout = layoutConfig;
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
                setup: callback => {
                    this.setup = callback;
                },
                optionsChange: callback => {
                    this.optionsChange = callback;
                },
                mounted: callback => {
                    this.mounted = callback;
                },
                destroy: callback => {
                    this.destroy = callback;
                }
            };
            let methods = configCallback
                ? (() => {
                      // this.useStateIndex = 0;
                      this.state = {};
                      return configCallback.bind(this)(info);
                  })()
                : {};

            if (methods instanceof Promise) {
                return methods.then(methods => {
                    return this.registerPageMethodsAndRenderPage(methods);
                });
            } else {
                return this.registerPageMethodsAndRenderPage(methods);
            }
        },

        registerPageMethodsAndRenderPage(methods) {
            this.methods = methods;
            Object.keys(this.methods || {}).forEach(key => {
                this[key] = this.methods[key];
            });
            return this._renderPage();
        },

        _initLayout(layout) {
            if (typeof layout === 'function') {
                layout = layout(createLayout);
            } else if (!layout) {
                layout = [];
            }

            if (isArray(layout)) {
                layout = { list: layout };
            } else if (!layout.list && !layout.list) {
                layout = { list: [layout] };
            }
            this._initLayoutRefs([layout]);

            this._initAncestorRefs();

            getRefs(layout);

            return layout;
        },

        updatePageConfig(pageConfig) {
            this.layoutRefs = {};
            this._updatePageConfig(pageConfig.list, this.pageConfig.list);

            return this.pageConfig;
        },

        _updatePageConfig(newList, originList) {
            newList.forEach((it, index) => {
                if (it.component) {
                    const originIndex = originList.findIndex(
                        it1 => it1 && it1.component === it.component && it1.key === it.key && it1.ref === it.ref && it1.props === it.props
                    );
                    if (originIndex >= 0) {
                        if (originIndex > index) {
                            originList.splice(index, originIndex - index);
                        }
                        originList[index].props = it.props;
                        originList[index].visible = it.visible;
                    } else {
                        originList.splice(index, 0, it);
                    }
                    if (it.ref) {
                        this.layoutRefs[it.ref] = originList[index];
                    }
                } else if (it.page) {
                    const originIndex = originList.findIndex(
                        it1 => it1 && it1.page === it.page && it1.key === it.key && it1.ref === it.ref && it1.props === it.props
                    );
                    if (originIndex >= 0) {
                        if (originIndex > index) {
                            originList.splice(index, originIndex - index);
                        }
                        originList[index].props = it.props;
                        originList[index].visible = it.visible;
                    } else {
                        originList.splice(index, 0, it);
                    }
                    if (it.ref) {
                        this.layoutRefs[it.ref] = originList[index];
                    }
                } else if (it.list) {
                    if (originList[index].list) {
                        originList[index].visible = it.visible;
                        this._updatePageConfig(it.list, originList[index].list);
                    } else {
                        originList.splice(index, 0, it);
                    }
                } else if (Array.isArray(it)) {
                    if (Array.isArray(originList[index])) {
                        this._updatePageConfig(it, originList[index]);
                    } else {
                        originList.splice(index, 1, it);
                    }
                } else {
                    originList.splice(index, 1, it);
                }
            });

            originList.length = newList.length;
        },

        _renderPage(isUpdate) {
            let { options, methods, destroy, layout, rawPageConfig, setup, mounted } = this;
            const appConfig = getConfig();
            let config = { options, methods };

            this.destroy = destroy;
            layout = this._initLayout(layout);

            let pageConfig = layout; // this.merge(layout, config);
            // 加载组件
            return new Promise((resolve, reject) => {
                loadComponent(layout, rawPageConfig, this.page, this.vpId).then(() => {
                    this.$emit('on-component-ready');

                    if (isUpdate) {
                        pageConfig = this.updatePageConfig(pageConfig);
                    }

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
                                this.lastPage = this.page || this.config;
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
                            this.lastPage = this.page || this.config;
                            this.$nextTick(() => {
                                this._page_rendered = true;
                                this.$parent.$emit('on-rendered');
                                if (!isUpdate) {
                                    mounted && mounted();
                                }
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
                                stataList: this.componentStateList || [],
                                config: this.config
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
            this.componentStateList = [];
            recursive(list, 'list', item => {
                if (item.ref) {
                    this.layoutRefs[item.ref] = item;
                }
                if(item.props){
                    this.componentStateList.push(item.props);
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
