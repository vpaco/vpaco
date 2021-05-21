export default {
    name: 'functional',
    functional: true,
    props: {
        render: Function,
    },
    render: (h, ctx) => {
        return ctx.props.render(h);
    }
};
