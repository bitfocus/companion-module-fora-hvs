let protocol_hvs100 = require('./protocol_hvs100')
let protocol_hvs2000 = require('./protocol_hvs2000')

let protocol = {
	...protocol_hvs100,
	...protocol_hvs2000,
}

module.exports = {
	/**
	 * Build the list of actions
	 * @param {string} model - The model we are requesting actions for
	 * @returns {Object} - The actions
	 */
	getActions: (model) => {
		// Global actions
		let actions = {}
		actions['custom'] = {
			label: 'Send Custom Command',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: '',
					required: true,
				},
			],
		}
		actions['reboot'] = { label: 'Reboot Switcher' }
		actions['recall_event'] = {
			label: 'Recall Event',
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
		}
		actions['recall_macro'] = {
			label: 'Recall Macro',
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
		}
		actions['reconnect'] = {
			label: 'Reconnect',
			tooltip: 'If the switcher drops the connection, this action will reconnect.',
		}
		actions['trans_me'] = {
			label: 'Transition ME',
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
					choices: protocol[model].MES,
				},
			],
		}
		actions['trans_key'] = {
			label: 'Transition Key',
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
					choices: protocol[model].KEYS,
				},
			],
		}
		actions['xpt_aux'] = {
			label: 'Set AUX',
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					required: true,
					default: 1,
					choices: protocol[model].AUXES,
				},
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					required: true,
					default: 1,
					choices: protocol[model].SOURCES_AUX,
					minChoicesForSearch: 1,
				},
			],
		}
		actions['xpt_me'] = {
			label: 'Set ME',
			options: [
				{
					type: 'dropdown',
					label: 'ME',
					id: 'me',
					required: true,
					default: 1,
					choices: protocol[model].MES,
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
					choices: protocol[model].SOURCES_ME,
					minChoicesForSearch: 1,
				},
			],
		}

		// HVS2000 only actions
		if (model === 'HVS2000') {
			actions['xpt_mel'] = {
				label: 'Set MELite',
				options: [
					{
						type: 'dropdown',
						label: 'MELite',
						id: 'mel',
						required: true,
						default: 1,
						choices: protocol[model].MELS,
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
						choices: protocol[model].SOURCES_ME,
						minChoicesForSearch: 1,
					},
				],
			}
			actions['trans_mel'] = {
				label: 'Transition MELite',
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
						choices: protocol[model].MELS,
					},
				],
			}
			actions['trans_flex_key'] = {
				label: 'Transition Flex Key',
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
						choices: protocol[model].FLEX_KEYS,
					},
				],
			}
		}
		return actions
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
		// HVS100 & HVS2000 ME Keys
		else if ((aux = key.match('^M([1-3])K([1-4])_KEYONAIR$')) !== null) {
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

	/**
	 * Return the command string fot the provided action
	 * @param {string} model - The model of switcher to get the command for
	 * @param {string} action - The id of the action we want a command for
	 * @param {Object} options - Any options from the action
	 * @returns {string} - The command string
	 */
	getCommandForAction: (model, action, options) => {
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
}
