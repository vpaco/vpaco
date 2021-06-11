<template>
    <page-inner
        :page.sync="innerPage"
        :options.sync="innerOptions"
        :isRemote="isRemote"
        ref="page"
        :config="config"
        :parent-id="pid"
        @on-component-ready="remoteLoaded"
    />
</template>
<script>
import pageInner from './pageInner';

export default {
    components: { pageInner },
    props: {
        options: {
            type: Object
        },
        name: {
            type: String
        },
        config: {
            type: Object
        },
        isRemote: {
            type: Boolean,
            default: false
        },
        vpIsPageComponent: {
            type: Boolean
        },
        vpPageComponentName: {
            type: String
        },
        parentId: {
            type: Number
        }
    },

    data() {
        return {
            vpIsPageWrapper: true,
            innerOptions: this.options || {},
            innerPage: this.name,
            pid: this.parentId
        };
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
    },
    watch: {
        name: function() {
            this.innerPage = this.name;
        },
        options: {
            deep: true,
            handler() {
                this.innerOptions = this.options || {};
            }
        }
    },

    methods: {
        pushPage(page, options) {
            this.$refs.page.pushPage(page, options);
        },

        getPage() {
            return this.$refs.page;
        },

        getInstance() {
            return this.$refs.page;
        },

        remoteLoaded() {
            this.$emit('on-component-ready');
        }
    }
};
</script>
