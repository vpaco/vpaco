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
            value: {
                default: undefined
            }
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

            value() {
                this.options.value = this.value;
            },

            'options.value'() {
                if (this.options.value !== this.value) {
                    this.$emit('input', this.options.value);
                }
            }
        },

        created() {
            if (this.value !== undefined) {
                this.$set(this.options, 'value', this.value);
            }

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
