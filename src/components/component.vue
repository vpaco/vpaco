<template>
    <component
        :is="innerComponent"
        v-if="innerComponent"
        :options="options"
        :slots="slots"
        :vp-component-name="name"
        :remoteComponent="!!isRemote"
        ref="component"
    ></component>
</template>
<script>
import { addRenderStack, getProxyComponent, getUid, isRemoteComponent, removeRenderStackItem } from '../utils';

export default {
    props: {
        options: {
            type: Object,
            default() {
                return {};
            }
        },
        slots: {
            type: Object
        },
        name: {
            type: String
        }
    },

    data: function() {
        return {
            innerComponent: '',
            vpIsComponent: true,
            isRemote: false,
            vpId: getUid(),
            pid: undefined
        };
    },

    watch: {
        name() {
            this.isRemote = isRemoteComponent(this.name);
            getProxyComponent(this.name, this.isRemote, this.vpId).then(name => {
                this.innerComponent = name;
            });
        }
    },

    created() {
        if (this.pid === undefined) {
            let parent = this.$parent;
            do {
                if (parent.vpId) {
                    break;
                } else {
                    parent = parent.$parent;
                }
            } while (parent);

            if (parent) {
                this.pid = parent.vpId;
            } else {
                this.pid = 0;
            }
        }
        addRenderStack({
            id: this.vpId,
            pid: this.pid,
            type: 'component',
            instance: this,
            name: this.name
        });
        this.isRemote = isRemoteComponent(this.name);
        this.$nextTick(() => {
            getProxyComponent(this.name, this.isRemote, this.vpId).then(name => {
                this.innerComponent = name;
                this.$emit('on-component-ready');
            });
        });
    },

    methods: {
        getInstance() {
            return this.$refs.component;
        }
    },
    destroyed() {
        removeRenderStackItem(this.vpId);
    }
};
</script>
