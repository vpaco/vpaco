<template>
    <component
        :is="innerComponent"
        v-if="innerComponent"
        :options="options"
        :events="events"
        :slots="slots"
        :vp-component-name="name"
        :remoteComponent="!!isRemote"
        ref="component"
    ></component>
</template>
<script>
    import {getProxyComponent, isRemoteComponent} from '../utils';

    export default {
        props: {
            options: {
                type: Object,
                default() {
                    return {};
                }
            },
            events: {
                type: Object
            },
            slots: {
                type: Object
            },
            name: {
                type: String
            },
        },

        data: function () {
            return {
                innerComponent: '',
                vpIsComponent: true,
                isRemote: false
            };
        },

        watch: {
            name() {
                this.isRemote = isRemoteComponent(this.name)
                getProxyComponent(this.name, this.isRemote).then(name => {
                    this.innerComponent = name;
                });
            },
        },

        created() {
            this.isRemote = isRemoteComponent(this.name)
            getProxyComponent(this.name, this.isRemote).then(name => {
                this.innerComponent = name;
                this.$emit('on-component-ready');
            });
        },

        methods: {
            getInstance() {
                return this.$refs.component;
            }
        }
    };
</script>
