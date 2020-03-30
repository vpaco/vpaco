export class RemoteComponent {
    fetch(url) {
        return fetch(url, {
            mode: 'cors',
            method: 'GET',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        })
            .then(async function (response) {
                return await response.text();
            })
            .then(text => {
                this.runScript('!!' + text);
                return this.default;
            });
    }

    runScript(text) {
        let module = undefined,
            exports = undefined;
        eval(text);
    }
}
