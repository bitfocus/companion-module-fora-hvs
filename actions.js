let protocol_hvs100 = require('./protocol_hvs100')
let protocol_hvs390 = require('./protocol_hvs390')
let protocol_hvs2000 = require('./protocol_hvs2000')

let protocol = {
	...protocol_hvs100,
	...protocol_hvs390,
	...protocol_hvs2000,
}

module.exports = {
	/**
	 * Send a command to the switcher
	 * @param {string} command - The command to send
	 */
	sendCommand(command) {
		if (!this.isConnected) {
			this.log('warn', 'Switcher not connected')
			this.reconnect.bind(this, true)
			return
		}
		this.log('info', 'Sending command: ' + command)
		this.ws.send(command)
	},
	buildCommand(action, options) {
		//this.log('warn', action)
		let command = this.getCommandForAction(this.config.model, action, options)
		if (command !== '') {
			this.sendCommand(command)
		} else {
			this.log('warn', `Unknown command "${action.action}" for model ${this.config.model}.`)
		}
	},
	
	/**
	 * Return the command string fot the provided action
	 * @param {string} model - The model of switcher to get the command for
	 * @param {string} action - The id of the action we want a command for
	 * @param {Object} options - Any options from the action
	 * @returns {string} - The command string
	*/
	getCommandForAction(model, action, options) {
		let command = ''

		switch (action) {
			// Global actions
			case 'get_state':
				command = protocol[model].COMMANDS.GET_STATE || ''
				break
			case 'reboot':
				command = protocol[model].COMMANDS.REBOOT || ''
				break
			case 'recall_event':
				let eventInt = parseInt(options.event) + 1 // Although the switcher labels them starting at 0, they are recalled with a 1 base...
				let eventHex = ('0' + eventInt.toString(16)).slice(-2) // The switcher expects the event Id as a 2-digit hexidecimal
				command = (protocol[model].COMMANDS.RECALL_EVENT || '').replace('{event}', eventHex)
				break
			case 'recall_macro':
				let macroInt = parseInt(options.macro)
				let macroHex = ('0' + macroInt.toString(16)).slice(-2) // Some switchers expects the macro Id as a 2-digit hexidecimal
				command = (protocol[model].COMMANDS.RECALL_MACRO || '')
					.replace('{macroInt}', macroInt)
					.replace('{macroHex}', macroHex)
				break
			case 'trans_me':
				command = (protocol[model].COMMANDS[`TRANS_ME_${options.type}`] || '').replace('{me}', options.me)
				break
			case 'trans_key':
				let key = options.key.split(',')
				command = (protocol[model].COMMANDS[`TRANS_KEY_${options.type}`] || '')
					.replace('{me}', key[0])
					.replace('{key}', key[1])
				break
			case 'xpt_me':
				command = (protocol[model].COMMANDS.XPT_ME || '')
					.replace('{me}', options.me)
					.replace('{layer}', protocol[model].ME_LAYERS[options.layer])
					.replace('{source}', options.source)
				break
			case 'xpt_aux':
				command = (protocol[model].COMMANDS.XPT_AUX || '')
					.replace('{aux}', options.aux)
					.replace('{source}', options.source)
				break

			// HVS2000 only actions
			case 'trans_mel':
				command = (protocol[model].COMMANDS[`TRANS_MEL_${options.type}`] || '').replace('{mel}', options.mel)
				break
			case 'xpt_mel':
				command = (protocol[model].COMMANDS.XPT_MEL || '')
					.replace('{mel}', options.mel)
					.replace('{layer}', protocol[model].ME_LAYERS[options.layer])
					.replace('{source}', options.source)
				break
			case 'trans_flex_key':
				command = (protocol[model].COMMANDS[`TRANS_FLEX_KEY_${options.type}`] || '').replace('{key}', options.key)
				break

			// Allow for custom commands
			case 'custom':
				command = options.command.trim()
				break
		}

		return command
	},
	
	/**
	 * Build the list of actions
	 * @param {string} model - The model we are requesting actions for
	 * @returns {Object} - The actions
	 */
	updateActions()  {
		console.log("info", "udpate actions")
		// Global actions
		let actions = {}
		actions.custom = {
			name: 'Send Custom Command',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: '',
					required: true,
				},
			],
			callback: async (event) => {
				this.buildCommand('custom', event.options)
			},
		}
		actions.reboot = {
			name: 'Reboot Switcher',
			options : [{}],
			callback: async (event) => {
				this.sendCommand(this.getCommandForAction(this.config.model, 'reboot', null))
				this.disconnect()
				this.connect_timeout(this.REBOOT_WAIT_TIME)
			},
		}
		actions.recall_event = {
			name: 'Recall Event',
			options: [
				{
					type: 'number',
					label: 'Event Number',
					id: 'event',
					default: 0,
					min: 0,
					max: 99,
					required: true,
				},
			],
			callback: async (event) => {
				this.buildCommand('recall_event', event.options)
			},
		}
		actions.recall_macro = {
			name: 'Recall Macro',
			options: [
				{
					type: 'number',
					label: 'Macro Number',
					id: 'macro',
					default: 0,
					min: 0,
					max: 99,
					required: true,
				},
			],
			callback: async (event) => {
				this.buildCommand('recall_macro', event.options)
			},
		}
		actions.reconnect = {
			name: 'Reconnect',
			tooltip: 'If the switcher drops the connection, this action will reconnect.',
			options : [{}],
			callback: async (event) => {
				this.reconnect()
			},
		}
		actions.trans_me = {
			name: 'Transition ME',
			options: [
				{
					type: 'dropdown',
					label: 'Type',
					id: 'type',
					required: true,
					default: 'CUT',
					choices: [
						{ id: 'AUTO', label: 'Auto' },
						{ id: 'CUT', label: 'Cut' },
					],
				},
				{
					type: 'dropdown',
					label: 'ME',
					id: 'me',
					required: true,
					default: 1,
					choices: protocol[this.config.model].MES,
				},
			],
			callback: async (event) => {
				this.buildCommand('trans_me', event.options)
			},
		}
		actions.trans_key = {
			name: 'Transition Key',
			options: [
				{
					type: 'dropdown',
					label: 'Type',
					id: 'type',
					required: true,
					default: 'CUT',
					choices: [
						{ id: 'AUTO', label: 'Auto' },
						{ id: 'CUT', label: 'Cut' },
					],
				},
				{
					type: 'dropdown',
					label: 'Key',
					id: 'key',
					required: true,
					default: '1,1',
					choices: protocol[this.config.model].KEYS,
				},
			],
			callback: async (event) => {
				this.buildCommand('trans_key', event.options)
			},
		}
		actions.xpt_aux = {
			name: 'Set AUX',
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					required: true,
					default: 1,
					choices: protocol[this.config.model].AUXES,
				},
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					required: true,
					default: 1,
					choices: protocol[this.config.model].SOURCES_AUX,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				this.buildCommand('xpt_aux', event.options)
			},
		}
		actions.xpt_me = {
			name: 'Set ME',
			options: [
				{
					type: 'dropdown',
					label: 'ME',
					id: 'me',
					required: true,
					default: 1,
					choices: protocol[this.config.model].MES,
				},
				{
					type: 'dropdown',
					label: 'Layer',
					id: 'layer',
					required: true,
					default: 'A',
					choices: [
						{ id: 'A', label: 'A / PGM' },
						{ id: 'B', label: 'B / PVW' },
					],
				},
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					required: true,
					default: 1,
					choices: protocol[this.config.model].SOURCES_ME,
					minChoicesForSearch: 1,
				},
			],
			callback: async (event) => {
				this.buildCommand('xpt_me', event.options)
			},
		}

		// HVS2000 only actions
		if (this.config.model === 'HVS2000') {
			actions.xpt_mel = {
				name: 'Set MELite',
				options: [
					{
						type: 'dropdown',
						label: 'MELite',
						id: 'mel',
						required: true,
						default: 1,
						choices: protocol[this.config.model].MELS,
					},
					{
						type: 'dropdown',
						label: 'Layer',
						id: 'layer',
						required: true,
						default: 'A',
						choices: [
							{ id: 'A', label: 'A / PGM' },
							{ id: 'B', label: 'B / PVW' },
						],
					},
					{
						type: 'dropdown',
						label: 'Source',
						id: 'source',
						required: true,
						default: 1,
						choices: protocol[this.config.model].SOURCES_ME,
						minChoicesForSearch: 1,
					},
				],
				callback: async (event) => {
					this.buildCommand('xpt_mel', event.options)
				},
			}
			actions.trans_mel = {
				name: 'Transition MELite',
				options: [
					{
						type: 'dropdown',
						label: 'Type',
						id: 'type',
						required: true,
						default: 'CUT',
						choices: [
							{ id: 'AUTO', label: 'Auto' },
							{ id: 'CUT', label: 'Cut' },
						],
					},
					{
						type: 'dropdown',
						label: 'MELite',
						id: 'mel',
						required: true,
						default: 1,
						choices: protocol[this.config.model].MELS,
					},
				],
				callback: async (event) => {
					this.buildCommand('trans_mel', event.options)
				},
			}
			actions.trans_flex_key = {
				name: 'Transition Flex Key',
				options: [
					{
						type: 'dropdown',
						label: 'Type',
						id: 'type',
						required: true,
						default: 'CUT',
						choices: [
							{ id: 'AUTO', label: 'Auto' },
							{ id: 'CUT', label: 'Cut' },
						],
					},
					{
						type: 'dropdown',
						label: 'Key',
						id: 'key',
						required: true,
						default: 1,
						choices: protocol[this.config.model].FLEX_KEYS,
					},
				],
				callback: async (event) => {
					this.buildCommand('trans_flex_key', event.options)
				},
			}
		}
		this.setActionDefinitions(actions)
	},

	/**
	 * Process data recieved from the switcher
	 * @param {string} data - The data that was recieved
	 */
	dataRecieved: (data) => {
		// TODO: Process this data to populate feedbacks
	},

	/**
	 * Process data recieved from the switcher to update variables
	 * @param {string} data - The data that was recieved
	 */
	parseVariable: (data) => {
		let [key, value] = data.split(':')
		let aux
		// HVS100 Events
		if (key === 'EVT_SETUP_LAST_RCL_NO') {
			key = 'event_recall'
		}
		// HVS2000 Global Events
		else if (key === 'EVENT_LASTRECALL_NO') {
			key = 'global_event_recall'
		}
		// HVS2000 Local Events
		else if ((aux = key.match('^ME([1-3])_EVENT_LASTRECALL_NO$')) !== null) {
			key = `me_${aux[1]}_event_recall`
		}
		// HVS100, HVS390 & HVS2000 ME Keys
		else if ((aux = key.match('^M([1-3])K([1-4])_KEYONAIR$')) !== null) {
			key = `me_${aux[1]}_key_${aux[2]}`
			value = value === '0' ? 'off' : 'on'
		}
		// HVS100, HVS390 & HVS2000 ME Keys (Startup check)
		// TODO: Determine difference between M1K1_KEYONAIR and ME_XPT_ME1_KEY1_XPT_PGM_OUT
		else if ((aux = key.match('^ME_XPT_ME([1-3])_KEY([1-4])_XPT_PGM_OUT$')) !== null) {
			key = `me_${aux[1]}_key_${aux[2]}`
			value = value === '0' ? 'off' : 'on'
		}
		// HVS2000 Flex Keys
		else if ((aux = key.match('^FLX([1-4])_KEYONAIR$')) !== null) {
			key = `flex_key_${aux[1]}`
			value = value === '0' ? 'off' : 'on'
		} else {
			return null
		}

		return [key, value]
	},

	/**
	 * Get the list of possible variables
	 * @param {string} model - The model we are requesting variables for
	 */
	getVariableList: (model) => {
		return protocol[model].VARIABLES
	},

}
