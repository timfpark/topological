class Log {
    constructor(options) {
        for (let key in options) {
            this[key] = options[key];
        }
    }

    debug(message) {
        if (['debug'].indexOf(this.level) !== -1)
            this.log('DEBUG', message);
    }

    info(message) {
        if (['debug','info'].indexOf(this.level) !== -1)
            this.log('INFO', message);
    }

    warn(message) {
        if (['debug','info','warn'].indexOf(this.level) !== -1)
            this.log('WARN', message);
    }

    error(message) {
        if (['debug', 'info', 'warn', 'error'].indexOf(this.level) !== -1)
            this.log('ERROR', message);
    }

    log(severity, message) {
        console.log(`${new Date().toISOString()}: ${severity}: ${this.id}: ${message}`);
    }

    clone(id) {
        return new Log({
            id,
            level: this.level
        });
    }
}

module.exports = Log;