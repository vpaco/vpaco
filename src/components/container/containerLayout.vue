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
                <template v-else-if="comp.type == 'row'">
                    <vp-row :class="getComponentWrapClass(comp)" :data-comp-id="comp.id" :key="index" :style="comp.style" :gutter="comp.gutter">
                        <template v-for="col in comp.componentList">
                            <vp-col :span="col.span" :class="col.class" :style="col.style">
                                <container-layout
                                    :componentList="col.componentList"
                                    class="vp-component-list"
                                    :data-comp-id="col.id"
                                    v-if="!col.hidden"
                                    :refs="refs"
                                />
                            </vp-col>
                        </template>
                    </vp-row>
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
                        :options="comp.options || {}"
                        :events="comp.events || {}"
                        :slots="comp.slots || {}"
                        :vp-is-page-component="true"
                        :vp-page-component-name="comp.name"
                        :remote-component="!!comp.remoteComponent"
                        :vp-component-name="comp.component"
                        ref="component"
                        :class="getComponentContentStyle(comp)"
                    />
                    <VpPage
                        v-if="comp.page || comp.remotePage"
                        :name="comp.page || comp.remotePage"
                        :options="comp.options || {}"
                        :events="comp.events || {}"
                        :isRemote="!!comp.remotePage"
                        :class="getComponentContentStyle(comp)"
                        :vp-page-component-name="comp.name"
                        ref="page"
                        :vp-is-page-component="true"
                    />
                </div>
            </template>
        </template>
    </div>
</template>
<script>
import { vpRow, vpCol } from '../layout';

export default {
    components: { vpRow, vpCol },
    props: {
        componentList: Array,
        refs: Object
    },
    name: 'containerLayout',

    mounted() {
        this.setComponentRefs();
        for (const component of this.componentList ?? []) {
            this.$watch(
                () => {
                    return component.hidden;
                },
                () => {
                    this.setComponentRefs();
                }
            );
        }
    },

    methods: {
        setComponentRefs() {
            for (const it of this.$refs.component ?? []) {
                this.refs[it.vpPageComponentName] = it;
            }
            for (const it of this.$refs.page ?? []) {
                this.refs[it.vpPageComponentName] = it.$children[0];
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
