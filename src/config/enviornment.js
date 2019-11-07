const convict = require('convict')
const fs = require('fs')

const convictConfig = convict({
    env: {
        doc: 'Environment',
        format: String,
        default: 'development',
        env: 'NODE_ENV'
    },
    envFilePath: {
        doc: 'Path to .env file',
        format: String,
        default: 'env.json',
        env: 'ENV_FILE_PATH'
    },
    logLevel: {
        doc: 'Bunyan log level',
        format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
        default: 'debug',
        env: 'LOG_LEVEL'
    },
    enableLogs: {
        doc: 'Flag to turn on logging',
        format: Boolean,
        default: true,
        env: 'ENABLE_LOGS'
    },
    phost: {
        doc: 'Hostname or IP address the server will listen on',
        format: String,
        default: '0.0.0.0',
        env: 'HOST'
    },
    pport: {
        doc: 'Port the server will listen on',
        format: 'port',
        default: 8000,
        env: 'PORT'
    },
    mongoUrl: {
        doc: 'Mongodb Url',
        format: '*',
        default:
            'mongodb://app:app@localhost/admin?retryWrites=true&w=majority',
        env: 'MONGO_URL'
    }
})

if (
    convictConfig.get('env') === 'development' &&
    fs.existsSync(convictConfig.get('envFilePath'))
) {
    convictConfig.loadFile(convictConfig.get('envFilePath'))
}

convictConfig.validate({ allowed: 'strict' })

module.exports = {
    config: convictConfig
}
