export class RemoteComponent {
    fetch(url) {
        return fetch(url, {
            mode: 'cors',
            method: 'GET',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        })
            .then(function (response) {
                return response.text();
            })
            .then(text => {
                this.runScript('!!' + text);
                return this.default;
            });
    }

    runScript(text) {
        let module = undefined,
            exports = undefined,
            globalThis = this,
            self = this;

        eval(text);
    }
}
