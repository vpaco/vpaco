<template>
    <page-inner
        :page="pageName"
        :props="pageProps"
        :isRemote="isRemote"
        ref="page"
        :config="config"
        :updatePage="updatePage"
        @on-component-ready="remoteLoaded" />
</template>
<script>
import pageInner from './pageInner';
import {ref} from 'vue'

export default {
    components: { pageInner },
    props: {
        props: {
            type: Object
        },
        name: {
            type: String
        },
        config: {
            type: Function
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
        }
    },

    setup(props,context){
        const pageName = ref(props.name)
        const pageProps = ref(props.props)
        const page = ref(null)

        const updatePage = (page, props)=>{
            pageName.value = page
            pageProps.value = props
        }

        return {pageName, pageProps, updatePage, page}
    },

    methods: {
        pushPage(page, props) {
            this.$refs.page.pushPage(page, props);
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
