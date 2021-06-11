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
                return this.module && this.module.exports;
            });
    }

    parse(moduleContent){
        this.runScript('!!' + moduleContent);
        return this.module && this.module.exports;
    }

    runScript(text) {
        let module = {},
            exports = {},
            globalThis = this,
            self = this;

        eval(text);
        this.module = module
    }
}
