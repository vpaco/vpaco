<template>
    <div>
        <template v-for="(comp, index) in componentList">
            <template v-if="!comp.hidden">
                <template v-if="!!comp.componentList">
                    <container-layout
                        :key="index"
                        v-if="!comp.hidden"
                        class="vp-component-list"
                        :class="getComponentWrapClass(comp)"
                        :data-comp-id="comp.id"
                        :refs="refs"
                        :style="comp.style"
                        :vpId="vpId"
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
                        :options="comp.options || {}"
                        :slots="comp.slots || {}"
                        :parentId="vpId"
                        :vp-is-page-component="true"
                        :vp-page-component-name="comp.name || comp.ref"
                        :remote-component="!!comp.remoteComponent"
                        :vp-component-name="comp.component"
                        ref="component"
                        :class="getComponentContentStyle(comp)"
                    />
                    <VpPage
                        v-if="comp.page || comp.remotePage"
                        :name="comp.page || comp.remotePage"
                        :options="comp.options || {}"
                        :isRemote="!!comp.remotePage"
                        :parentId="vpId"
                        :class="getComponentContentStyle(comp)"
                        :vp-page-component-name="comp.name || comp.ref"
                        ref="page"
                        :vp-is-page-component="true"
                    />
                </div>
                <div
                    v-else-if="comp.render || (comp.options && comp.options.render)"
                    class="vp-component-wrap"
                    :key="comp.name + '_' + index"
                    :class="getComponentWrapClass(comp)"
                    :style="comp.style"
                >
                  <renderComponent :render="comp.render || comp.options.render" :parent-id="vpId"></renderComponent>
                </div>
            </template>
        </template>
    </div>
</template>
<script>
import renderComponent from './renderComponent';
export default {
    components: {renderComponent},
    props: {
        componentList: Array,
        refs: Object,
        vpId: Number
    },
    name: 'containerLayout',

    mounted() {
        this.setComponentRefs();
        (this.componentList || []).forEach((component)=>{
            this.$watch(
                () => {
                    return component.hidden;
                },
                () => {
                    this.setComponentRefs();
                }
            );
        });
    },

    methods: {
        setComponentRefs() {
            (this.$refs.component || []).forEach((it)=>{
                this.refs[it.vpPageComponentName] = it;
            });
            (this.$refs.page || []).forEach((it)=>{
                this.refs[it.vpPageComponentName] = it.$children[0];
            });
        },
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
