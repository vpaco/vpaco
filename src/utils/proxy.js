import {defineComponent, h, ref, toRefs, reactive} from 'vue'

export default function (component) {
    return defineComponent({
        props: {
            props: {
                type: Object
            },
            slots: {
                type: Object
            },
            vpIsPageComponent: Boolean,

            vpPageComponentName: String,

            vpComponentName: String,

            remoteComponent: Boolean
        },
        setup(props){
            const root = ref(null)
            const state = reactive(props.props)
            return {root, ...toRefs(state), state}
        },
        render() {
            const Component = component;
            const slots = {},
                childrenEl = [];

            Object.keys(this.slots || {}).forEach(it => {
                slots[it] = props => {
                    return this.slots[it](h, props);
                };

                childrenEl.push(
                    h('div', slots)
                );
            });

            window.zzzz = this

            const elRoot = h(
                Component,
                {
                    ...this.state,
                    style: this.props.$style,
                    class: this.props.$class
                },
                childrenEl
            );

            this.root = elRoot
            return elRoot
        },

        mounted() {
            let comp = this.root;
            if (component.methods) {
                Object.keys(component.methods).forEach(it => {
                    this[it] = component.methods[it].bind(comp);
                });
            }
        }
    });
}
