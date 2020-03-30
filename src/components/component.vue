<template>
    <component
        :is="innerComponent"
        v-if="innerComponent"
        :options="options"
        :events="events"
        :slots="slots"
        :vp-component-name="innerComponentName"
        :remoteComponent="!!remoteComponent"
        ref="component"
    ></component>
</template>
<script>
import { getProxyComponent } from '../utils';

export default {
    props: {
        options: {
            type: Object
        },
        events: {
            type: Object
        },
        slots: {
            type: Object
        },
        component: {
            type: String
        },
        remoteComponent: {
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
            innerComponentName: ''
        };
    },

    watch: {
        component() {
            this.innerComponent = this.component;
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

        this.innerComponent = this.component;
        let url = this.remoteComponent;

        this.innerComponentName = this.innerComponent || url;

        if (url) {
            getProxyComponent(url).then(name => {
                this.innerComponent = name;
                this.$emit('on-component-ready');
            });
        }
    },

    methods: {
        getInstance() {
            return this.$refs.component;
        }
    }
};
</script>
