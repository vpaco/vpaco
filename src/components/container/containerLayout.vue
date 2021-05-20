<template>
    <div>
        <template v-for="(comp, index) in componentList">
            <template v-if="!comp.hidden">
                <template v-if="comp.type == 'body'">
                    <container-layout
                        class="vp-component-list"
                        :key="index"
                        :class="getComponentWrapClass(comp)"
                        :data-comp-id="comp.id"
                        :style="comp.style"
                        v-if="!comp.hidden"
                        :refs="refs"
                        :componentList="comp.componentList"
                    />
                </template>
                <template v-else-if="comp.type == 'component'">
                    <container-layout
                        class="vp-component-list"
                        :key="index"
                        :class="getComponentWrapClass(comp)"
                        :data-comp-id="comp.id"
                        :style="comp.style"
                        v-if="!comp.hidden"
                        :refs="refs"
                        :componentList="comp.componentList"
                    />
                </template>
                <template v-else-if="!!comp.componentList">
                    <container-layout
                        v-if="!comp.hidden"
                        class="vp-component-list"
                        :class="getComponentWrapClass(comp)"
                        :data-comp-id="comp.id"
                        :refs="refs"
                        :style="comp.style"
                        :componentList="comp.componentList"
                    />
                </template>
                <div
                    v-else-if="comp.component || comp.page"
                    class="vp-component-wrap"
                    :class="getComponentWrapClass(comp)"
                    :data-comp-id="comp.id"
                    :key="comp.name + '_' + index"
                    :style="comp.style"
                >
                    <component
                        v-if="comp.component"
                        :is="comp.component"
                        :props="comp.props || {}"
                        :slots="comp.slots || {}"
                        :vp-is-page-component="true"
                        :vp-page-component-name="comp.name"
                        :remote-component="!!comp.remoteComponent"
                        :vp-component-name="comp.component"
                        :ref="(el)=>{componentRefs.push(el)}"
                        :class="getComponentContentStyle(comp)"
                    />
                    <VpPage
                        v-if="comp.page || comp.remotePage"
                        :name="comp.page || comp.remotePage"
                        :props="comp.props || {}"
                        :isRemote="!!comp.remotePage"
                        :class="getComponentContentStyle(comp)"
                        :vp-page-component-name="comp.name"
                        :ref="(el)=>{pageRefs.push(el)}"
                        :vp-is-page-component="true"
                    />
                </div>
            </template>
        </template>
    </div>
</template>
<script>
import {ref, onBeforeUpdate, onUpdated, onMounted, watchEffect, nextTick} from 'vue'
export default {
    props: {
        componentList: Array,
        refsUpdated: Function
    },
    name: 'containerLayout',

    setup(props, context){
        const componentRefs = ref([])
        const pageRefs = ref([])

        onBeforeUpdate(()=>{
            componentRefs.value = []
            pageRefs.value = []
            console.log('updatexx')
        })

        watchEffect(()=>{
            nextTick(()=>{
                const refs = {}
                for (const it of componentRefs.value ?? []) {
                    refs[it.vpPageComponentName] = it;
                }
                for (const it of pageRefs.value ?? []) {
                    refs[it.vpPageComponentName] = it.$refs.page.outerMethods;
                }

                props.refsUpdated(refs)
            })
        })


        return {componentRefs, pageRefs}
    },

    methods: {
        getComponentContentStyle(col) {
            const style = {};
            if (col.name) {
                style['comp-name-' + col.name] = true;
            }
            return style;
        },

        getComponentWrapClass(component) {
            let className = component.class;
            if (className) {
                if (typeof className === 'string') {
                    return component.name ? 'vp-component-' + component.name + '-wrap' + (className ? ' ' + className : '') : className;
                } else if (typeof className === 'object') {
                    if (component.name) {
                        className['vp-component-' + component.name + '-wrap'] = true;
                    }
                    return className;
                }
            } else if (component.name) {
                return 'vp-component-' + component.name + '-wrap';
            }
        }
    }
};
</script>
