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
    import {reactive, watch, toRefs, ref} from 'vue'
    import {getProxyComponent, isRemoteComponent} from '../utils';

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
            },
        },

        setup(props, context){

            const state = reactive({
                innerComponent: '',
                vpIsComponent: true,
                isRemote: false
            })

            const component = ref(null)

            watch(props.name, ()=>{
                state.isRemote = isRemoteComponent(props.name)
                getProxyComponent(props.name, state.isRemote).then(name => {
                    state.innerComponent = name;
                });
            })

            state.isRemote = isRemoteComponent(props.name)
            getProxyComponent(props.name, state.isRemote).then(name => {
                state.innerComponent = name;
                context.$emit('on-component-ready');
            });

            const getInstance = ()=>{
                return component.value
            }

            return {...toRefs(state), component, getInstance}
        }
    };
</script>
