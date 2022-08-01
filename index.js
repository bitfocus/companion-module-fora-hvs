const instance_skel = require('../../instance_skel')
const WebSocket = require('websocket').client

let actions = require('./actions')
let upgradeScripts = require('./upgrades')

/**
 * Companion instance for controling For.A Hanabi Switchers
 *
 * @extends instance_skel
 * @author Michael Allen <michael.allen@barefootchurch.com>
 */
class instance extends instance_skel {
	/**
	 * @param {EventEmitter} system - The brains of the operation
	 * @param {string} id - The instance ID
	 * @param {Object} config - Saved user configuration parameters
	 */
	constructor(system, id, config) {
		super(system, id, config)

		this.RECONNECT_TIMEOUT = 15 // Number of seconds to wait before reconnect
		this.REBOOT_WAIT_TIME = 120 // Number of seconds to wait until next login after reboot
		this.MODELS = [
			{ id: 'HVS100', label: 'HVS 100/110' },
			{ id: 'HVS2000', label: 'HVS 2000' },
		]

		this.reconnecting = null

		Object.assign(this, {
			...actions,
		})
	}

	static GetUpgradeScripts() {
		return upgradeScripts
	}

	/**
	 * Executes the provided action
	 * @param {Object} action - The action to be executed
	 */
	action(action) {
		switch (action.action) {
			case 'reboot':
				this.sendCommand(this.getCommandForAction(this.config.model, 'reboot', null))
				this.disconnect()
				this.connect_timeout(this.REBOOT_WAIT_TIME)
				break
			case 'reconnect':
				this.reconnect()
				break
			default:
				let command = this.getCommandForAction(this.config.model, action.action, action.options)
				if (command !== '') {
					this.sendCommand(command)
				} else {
					this.log('warn', `Unknown command "${action.action}" for model ${this.config.model}.`)
				}
		}
	}

	/**
	 * Configuration fields that can be used
	 * @returns {Array}
	 */
	config_fields() {
		return [
			{
				type: 'dropdown',
				id: 'model',
				label: 'Model',
				width: 6,
				choices: this.MODELS,
				default: 'HVS100',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP,
			},
		]
	}

	/**
	 * Process configuration updates
	 * @param {Object} newConfig - New configuration
	 */
	updateConfig(newConfig) {
		let oldConfig = this.config
		this.config = newConfig

		// If the ip or model changed, reinitalize the module
		if (newConfig.host !== oldConfig.host || newConfig.model !== oldConfig.model) {
			this.debug('IP or Model changed. Reinitalizing module.')
			this.setActions(this.getActions(this.config.model))

			this.connect()
		}
	}

	/**
	 * Main initialization
	 */
	init() {
		if (!this.config.host || !this.config.model) {
			this.status(this.STATUS_ERROR)
			return
		}

		this.setActions(this.getActions(this.config.model))

		this.connect()
	}

	initVariables() {
		this.setVariableDefinitions(this.getVariableList(this.config.model))
	}

	/**
	 * Initialize the websocket connection to the server
	 */
	connect() {
		this.status(this.STATUS_UNKNOWN)
		this.log('info', 'Attempting to connect to switcher')
		if (this.reconnecting) {
			// existing reconnect attempt
			clearTimeout(this.reconnecting)
			this.reconnecting = null
		}
		if (this.socket && this.socket.connected) {
			// already connected
			this.disconnect()
		}

		this.initVariables()

		this.socketClient = new WebSocket()

		this.socketClient
			.on('connect', (webSocketConnection) => {
				this.debug('Websocket connected')
				this.log('info', 'Switcher conected')
				this.status(this.STATUS_OK)

				this.socket = webSocketConnection
				this.socket
					.on('message', (message) => {
						if (message.type == 'utf8') {
							message.utf8Data
								.split(',')
								.map((item) => item.trim())
								.forEach((item) => {
									this.debug(`Data recieved: "${item}"`)
									if (item.match('^[A-Za-z0-9_:]*$') !== null) {
										let result = this.parseVariable(item)
										if (result !== null) {
											this.setVariable(result[0], result[1])
										}
									} else {
										this.dataRecieved(item)
									}
								})
						}
					})
					.on('error', (error) => {
						this.debug(`Socket error: ${error}`)
						this.log('warn', 'Switcher communication error')
						this.status(this.STATUS_ERROR)
						this.reconnect.bind(this, true)
					})
					.on('close', (reasonCode, description) => {
						this.debug(`Socket closed: [${reasonCode}]-${description}`)
						this.log('warn', 'Disconnected from switcher')
						this.status(this.STATUS_ERROR)
						this.reconnect.bind(this, true)
					})
				// Get the initial state data
				this.socket.send(this.getCommandForAction(this.config.model, 'get_state', null))
			})
			.on('connectFailed', (errorDescription) => {
				this.debug(`Websocket connection failed: ${errorDescription}`)
				this.log('warn', 'Connection to switcher failed')
				this.status(this.STATUS_ERROR)
			})

		this.socketClient.connect(`ws://${this.config.host}:8621/`, null, `http://${this.config.host}`)
	}

	/**
	 * Attempt a reconnect on connection lost/logout
	 * @param {Boolean} retry_immediately - Immediately try reconnecting, useful if the session may have ended
	 */
	reconnect(retry_immediately = false) {
		this.log('info', 'Attempting to reconnect to switcher')
		this.disconnect()

		if (retry_immediately) {
			this.connect()
		} else {
			this.connect_timeout(this.RECONNECT_TIMEOUT)
		}
	}

	/**
	 * Try to commect again after timeout
	 * @param {Int} timeout - Timeout to try reconnection (seconds)
	 */
	connect_timeout(timeout) {
		if (this.reconnecting) {
			return
		}
		this.log('info', `Attempting to reconnect in ${timeout} seconds.`)
		this.reconnecting = setTimeout(this.connect.bind(this, true), timeout * 1000)
	}

	/**
	 * Send a command to the switcher
	 * @param {string} command - The command to send
	 */
	sendCommand(command) {
		if (!this.socket || !this.socket.connected) {
			this.log('warn', 'Switcher not connected')
			this.reconnect.bind(this, true)
			return
		}
		this.debug(`Sending command: ${command}`)
		this.socket.sendUTF(command)
	}

	/**
	 * Disconccect from device
	 */
	disconnect() {
		this.log('info', 'Disconnecting from switcher')
		this.status(this.STATUS_UNKNOWN)
		if (this.socket && this.socket.connected) {
			this.socket.close()
		}
	}

	/**
	 * Ends session if connected
	 */
	destroy() {
		this.disconnect()
	}
}

exports = module.exports = instance
