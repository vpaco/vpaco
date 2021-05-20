<template>
    <Container :config="pageConfig" :refsUpdated="refsUpdated" v-if="pageConfig && visible" :class="getPageClass"/>
</template>
<script>
    import {log, deepCopy, loadComponent, toString, getPageConfig} from '../utils';
    import Container from './container/container';
    import {getConfig} from '../config';
    import isArray from 'isarray';
    import {reactive, ref, watch, onUnmounted, nextTick, toRefs} from 'vue'

    export default {
        components: {Container},
        props: {
            page: {
                type: String
            },
            props: {
                type: Object
            },
            config: {
                type: Function
            },
            isRemote: {
                type: Boolean
            },
            updatePage: {
                type: Function
            }
        },

        setup(props, context){
            watch([()=>props.page, ()=>props.config], ()=>{
                reloadPage()
            })

            watch(()=>{return props.props}, (val, oldVal)=>{
                propsChangeCallback && propsChangeCallback(val, oldVal);
            })

            const appConfig = getConfig();

            const pageConfig = ref({})
            const visible = ref(false)
            const outerMethods = reactive({})

            let lastPage = null,
                destroyCallback = null,
                propsChangeCallback = null,
                historyList = [],
                pageContext = {
                    ancestorRefs: {},
                    refs: {},
                    layoutRefs: {}
                }

            const refsUpdated = (t) => {
                pageContext.refs = t
            }

            const getPageClass = ()=>{
                const pageName = props.page || (props.config && props.config.name)
                if(pageName){
                    return 'vp-page-' + pageName;
                }else{
                    return '';
                }
            }

            const pushPage = (page, _props) => {
                if (page === -1) {
                    const last = historyList.pop();

                    if (!last) {
                        return -1;
                    }

                    page = last.page;
                    _props = last.props;
                } else {
                    historyList.push({page: page, props: _props});
                }

                props.updatePage(page, _props)
            }

            const popPage = () => {
                const last = historyList.pop();

                if (!last) {
                    return -1;
                }

                const page = last.page;
                const props = last.props;

                props.updatePage(page, props)
            }

            const getParentPageList = () => {
                let res = [];
                let parent = context;

                do {
                    if (parent.vpIsPage) {
                        res.push(parent);
                        parent = parent.parent;
                    } else {
                        parent = parent.parent;
                    }
                } while (parent && parent.parent);

                return res;
            }

            const initAncestorRefs = () => {
                let ancestorPageList = getParentPageList();

                for (const it of ancestorPageList) {
                    pageContext.ancestorRefs[it.page] = it;
                }
            }

            const initLayoutRefs = (list) => {
                for (const it of list) {
                    if (it.name) {
                        pageContext.layoutRefs[it.name] = it;
                    }
                    if (it.componentList) {
                        initLayoutRefs(it.componentList);
                    }
                }
            }

            const reloadPage = async () => {
                const {page, config, isRemote} = props
                if (lastPage) {
                    destroyCallback && destroyCallback();
                    log.debug(`[page destroy] > pageName: ${lastPage}`, true);
                }
                const appConfig = getConfig();
                lastPage = null;
                if (!page && !config) {
                    pageConfig.value = null;
                    return;
                }

                let pageConfigCallback;

                if(config){
                    pageConfigCallback = config;
                }else {
                    pageConfigCallback = await getPageConfig(page, context, isRemote);
                }

                if (page && !pageConfigCallback) {
                    return;
                }

                initAncestorRefs();

                let pageInstance = pageConfigCallback ? (()=>{
                    return pageConfigCallback(pageContext);
                })() : {};

                let {layout, methods, init, mounted, propsChange, destroy} = pageInstance;

                if(methods){
                    Object.keys(methods).forEach((it)=>{
                        outerMethods[it] = methods[it]
                    })
                }

                if (isArray(layout)) {
                    layout = {componentList: layout};
                } else if (!layout.componentList) {
                    layout = {componentList: [layout]};
                }
                initLayoutRefs([layout]);

                destroyCallback = destroy;
                propsChangeCallback = propsChange;
                visible.value = false;
                pageContext.refs = {};
                // 空页面
                if (!layout) {
                    return;
                }
                // 加载组件
                loadComponent(layout, pageInstance, page).then(() => {
                    context.emit('on-component-ready');

                    const showPage = () => {
                        let logOptions = null;
                        if (appConfig.debug) {
                            logOptions = deepCopy(this.props) || {};
                        }
                        if (init) {
                            if (appConfig.debug) {
                                log.debug(`[page init] > pageName: ${page};  options: ${toString(logOptions)}`, true);
                            }
                            init(() => {
                                visible.value = true;
                                pageConfig.value = layout
                                lastPage = page;
                                if (appConfig.debug) {
                                    log.debug(`[page start] > pageName: ${page};  options: ${toString(logOptions)}`, true);
                                }
                                nextTick(() => {
                                    mounted && mounted();
                                });
                            });
                        } else {
                            visible.value = true;
                            pageConfig.value = layout
                            lastPage = page;
                            if (appConfig.debug) {
                                log.debug(`[page start] > pageName: ${page};  options: ${toString(logOptions)}`, true);
                            }
                        }
                    };

                    if (appConfig.beforePageEnter) {
                        if (appConfig.debug) {
                            log.debug(`[page before enter] > pageName: ${page}`, true);
                        }
                        appConfig.beforePageEnter(
                            {
                                pageName: page,
                            },
                            () => {
                                showPage();
                            }
                        );
                    } else {
                        showPage();
                    }
                });
            }

            const pageKeyword = ['page', 'options', 'refs', 'layoutRefs', 'ancestorRefs', 'vpIsPage', 'pageConfig', 'historyList', 'visible', 'lastPage', 'innerOptions', 'layout', 'reloadPage', '_initAncestorRefs', '_initLayoutRefs', 'emit', 'pushPage', 'popPage', 'getParentPageList']

            for (const key in appConfig.extensions) {
                if (pageKeyword.includes(key)) {
                    // eslint-disable-next-line no-console
                    console.error(`${key}为页面关键字，请更换名称`);
                }
                context[key] = appConfig.extensions[key].bind(context);
            }

            reloadPage();

            onUnmounted(()=>{
                if (lastPage) {
                    destroyCallback && destroyCallback();
                    log.debug(`[page destroy] > pageName: ${lastPage}`, true);
                }
            })

            pageContext.pushPage = pushPage
            pageContext.popPage = popPage

            return {refsUpdated, pageConfig, visible, getPageClass, pushPage, popPage, outerMethods}
        }
    };
</script>
