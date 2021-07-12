<template>
    <div>
        <template v-for="(comp, index) in list">
            <template v-if="isArray(comp)">
                <layoutItem v-for="(item, index) in comp" :comp="item" :key="index" :refs="refs"></layoutItem>
            </template>
            <template v-else>
                <layoutItem :comp="comp" :refs="refs" :key="index"></layoutItem>
            </template>
        </template>
    </div>
</template>
<script>
import renderComponent from './renderComponent';
import layoutItem from './layoutItem.vue';
export default {
    components: { renderComponent, layoutItem },
    props: {
        list: Array,
        refs: Object,
        vpId: Number
    },
    name: 'containerLayout',

    mounted() {},

    methods: {
        isArray(item) {
            return Array.isArray(item);
        },
        setComponentRefs() {
            (this.$refs.component || []).forEach(it => {
                this.refs[it.vpPageComponentName] = it;
            });
            (this.$refs.page || []).forEach(it => {
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
