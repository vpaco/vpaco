<template>
    <vpacoContainerLayout
        :key="index"
        v-if="!comp.hidden && !!comp.list"
        class="vp-component-list"
        :class="getComponentWrapClass(comp)"
        :data-comp-id="comp.id"
        :refs="refs"
        :style="comp.style"
        :vpId="vpId"
        :list="comp.list"
    />
    <div
        v-else-if="!comp.hidden && (comp.component || comp.page)"
        class="vp-component-wrap"
        :class="getComponentWrapClass(comp)"
        :data-comp-id="comp.id"
        :key="comp.ref + '_' + index"
        :style="comp.style"
    >
        <component
            v-if="comp.component"
            :is="comp.component"
            :options="comp.props || {}"
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
            :options="comp.props || {}"
            :isRemote="!!comp.remotePage"
            :parentId="vpId"
            :class="getComponentContentStyle(comp)"
            :vp-page-component-name="comp.name || comp.ref"
            ref="page"
            :vp-is-page-component="true"
        />
    </div>
    <div
        v-else-if="!comp.hidden && (comp.render || (comp.props && comp.props.render))"
        class="vp-component-wrap"
        :key="comp.ref + '_' + index"
        :class="getComponentWrapClass(comp)"
        :style="comp.style"
    >
        <renderComponent :render="comp.render || comp.props.render" :parent-id="vpId"></renderComponent>
    </div>
</template>
<script>
import renderComponent from './renderComponent';
export default {
    components: {renderComponent},
    name: 'layoutItem',
    props: {
        comp: {
            type: [Object, Array]
        },
        refs: Object,
    },
    mounted() {
        this.setComponentRefs();
        this.$watch(
            () => {
                return this.comp.hidden;
            },
            () => {
                this.setComponentRefs();
            }
        );
    },
    methods: {
        setComponentRefs() {
            if(this.$refs.component && this.$refs.component.vpPageComponentName){
                this.refs[this.$refs.component.vpPageComponentName] = this.$refs.component;
            }
            if(this.$refs.page && this.$refs.page.vpPageComponentName){
                this.refs[this.$refs.page.vpPageComponentName] = this.$refs.page.$children[0];
            }
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