import { getVue } from '../config';

export default function (component) {
    const Vue = getVue();
    return Vue.extend({
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
            vpIsPageComponent: Boolean,

            vpPageComponentName: String,

            vpComponentName: String,

            remoteComponent: Boolean
        },
        data() {
            return {
                vpComponentWrapper: true
            };
        },
        render(h) {
            const Component = component;
            const events = {},
                slots = {},
                childrenEl = [];

            Object.keys(this.events || {}).forEach(it => {
                events[it] = this.events[it];
            });

            Object.keys(this.slots || {}).forEach(it => {
                slots[it] = props => {
                    return this.slots[it](h, props);
                };

                if (it === 'default') {
                    childrenEl.push(slots[it]());
                }

                childrenEl.push(
                    h('div', {
                        slot: it
                    })
                );
            });

            return h(
                Component,
                {
                    props: this.options || {},
                    scopedSlots: slots,
                    on: events,
                    style: this.options.$style,
                    class: this.options.$class
                },
                childrenEl
            );
        },

        mounted() {
            let comp = this.$children[0];
            if (component.methods) {
                Object.keys(component.methods).forEach(it => {
                    this[it] = component.methods[it].bind(comp);
                });
            }
        }
    });
}
