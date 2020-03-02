const instance_skel = require('../../instance_skel');
const WebSocket = require('websocket').client;

/**
 * Companion instance for controling For.A Hanabi Switchers
 *
 * @extends instance_skel
 * @version 1.0.2
 * @since 1.0.0
 * @author Michael Allen <michael.allen@barefootchurch.com>
 */
class instance extends instance_skel {
	/**
	 * @param {EventEmitter} system - The brains of the operation
	 * @param {string} id - The instance ID
	 * @param {Object} config - Saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(system, id, config) {
		super(system, id, config);

		this.defineConst('RECONNECT_TIMEOUT', 15); // Number of seconds to wait before reconnect
		this.defineConst('REBOOT_WAIT_TIME', 120); // Number of seconds to wait until next login after reboot

		this.COMMAND = {
			'GET_INPUTS'   : 'GET.SIGNAL_GROUP2',
			'GET_STATE'    : 'GET.ALLDATA_ME_XPT',
			'REBOOT'       : 'CMD.020503',
			'RECALL_EVENT' : 'CMD.030502{event}', // event[0-99]: 2-digit hex for the selected event
			'TRANS_AUTO'   : 'SET.ME_XPT_ME1_BKGD_TRS_AUTO_STAT:1',
			'TRANS_CUT'    : 'SET.ME_XPT_ME1_BKGD_TRS_AUTO_STAT:3',
			'XPT_ME1'      : 'SET.ME_XPT_ME1_BKGD_{layer}:{source}', // layer: [A=PGM,B=PVW] which layer to set; source: id of the selected source
			'XPT_AUX'     : 'SET.ME_XPT_AUX{aux}:{source}' // aux[1-8]: which aux to set; source: id of the selected source
		};

		this.STATUS = {
			xpt: {
				pgm: 0,
				pvw: 0,
				aux1: 0,
				aux2: 0,
				aux3: 0,
				aux4: 0,
				key1A: 0,
				key2A: 0,
				key3A: 0,
				key4A: 0,
				key1B: 0,
				key2B: 0,
				key3B: 0,
				key4B: 0
			},
			output: {
				key1: false,
				key2: false,
				key3: false,
				key4: false
			}
		};

		this.SOURCES_ME = [
			// Built-in Inputs
			{ id:  1, label: 'Source 1' },
			{ id:  2, label: 'Source 2' },
			{ id:  3, label: 'Source 3' },
			{ id:  4, label: 'Source 4' },
			{ id:  5, label: 'Source 5' },
			{ id:  6, label: 'Source 6' },
			{ id:  7, label: 'Source 7' },
			{ id:  8, label: 'Source 8' },
			// Optional expansion card inputs
			{ id:  9, label: 'Source 9' },
			{ id: 10, label: 'Source 10' },
			{ id: 11, label: 'Source 11' },
			{ id: 12, label: 'Source 12' },
			{ id: 13, label: 'Source 13' },
			{ id: 14, label: 'Source 14' },
			{ id: 15, label: 'Source 15' },
			{ id: 16, label: 'Source 16' },
			{ id: 17, label: 'Source 17' },
			{ id: 18, label: 'Source 18' },
			{ id: 19, label: 'Source 19' },
			{ id: 20, label: 'Source 20' },
			// System inputs
			{ id:  0, label: 'Black' },
			{ id: 29, label: 'Still 1' },
			{ id: 30, label: 'Still 2' },
			{ id: 37, label: 'Color Bars' },
			{ id: 38, label: 'Matte 1' },
			{ id: 39, label: 'Matte 2' },
			{ id: 40, label: 'Color Key Fill' },
			{ id: 41, label: 'Color Key Key' },
			{ id: 42, label: 'Sub Effect 1' },
			{ id: 43, label: 'Sub Effect 2' }
		];

		this.SOURCES_AUX = [
			//Aux-only input options
			{ id: 46, label: 'Program' },
			{ id: 47, label: 'Preview' },
			{ id: 48, label: 'Clean' },
			{ id: 50, label: 'Multi-View' }
		];

		this.reconnecting = null;
		this.actions(system); // export actions

		return this;
	}

	/**
	 * Setup the actions
	 * @param {Object} system - The brains of the operation
	 * @since 1.0.0
	 */
	actions(system) {
		this.setActions({
			'custom': {
				label: 'Send Custom Command',
				options: [
					{
						type: 'textinput',
						label: 'Command',
						id: 'command',
						default: '',
						required: true
					}
				]
			},
			'reboot': { label: 'Reboot Switcher' },
			'recall_event': {
				label: 'Recall Event',
				options: [
					{
						type: 'number',
						label: 'Event Number',
						id: 'event',
						default: 0,
						min: 0,
						max: 99,
						required: true
					}
				]
			},
			'reconnect': {
				label: 'Reconnect',
				tooltip: 'If the switcher drops the connection, this action will reconnect.',
			},
			'trans_auto': { label: 'Auto Transition'},
			'trans_cut': { label: 'Cut Transition'},
			'xpt_aux': {
				label: 'Set AUX',
				options: [
					{
						type: 'dropdown',
						label: 'Aux',
						id: 'aux',
						required: true,
						default: 1,
						choices: [
							{ id: 1, label: 'Aux 1' },
							{ id: 2, label: 'Aux 2' },
							{ id: 3, label: 'Aux 3' },
							{ id: 4, label: 'Aux 4' },
							{ id: 5, label: 'Aux 5' },
							{ id: 6, label: 'Aux 6' },
							{ id: 7, label: 'Aux 7' },
							{ id: 8, label: 'Aux 8' }
						]
					},
					{
						type: 'dropdown',
						label: 'Source',
						id: 'source',
						required: true,
						default: 1,
						choices: this.SOURCES_ME.concat(this.SOURCES_AUX)
					}
				]
			},
			'xpt_me1': {
				label: 'Set ME1',
				options: [
					{
						type: 'dropdown',
						label: 'Layer',
						id: 'layer',
						required: true,
						default: 'A',
						choices: [
							{ id: 'A', label: 'A / PGM' },
							{id: 'B', label: 'B / PVW' }
					]
					},
					{
						type: 'dropdown',
						label: 'Source',
						id: 'source',
						required: true,
						default: 1,
						choices: this.SOURCES_ME
					}
				]
			}
		});
	}

  /**
	 * Executes the provided action
	 * @param {Object} action - The action to be executed
	 * @since 1.0.0
	 */
	action(action) {
		var opt = action.options;

		switch (action.action) {
			case 'reboot':
				this.reboot();
				break;
			case 'recall_event':
				this.recallEvent(opt.event);
				break;
			case 'trans_auto':
				this.sendCommand(this.COMMAND.TRANS_AUTO);
				break;
			case 'trans_cut':
				this.sendCommand(this.COMMAND.TRANS_CUT);
				break;
			case 'xpt_me1':
				this.setXptMe1(opt.layer, opt.source);
				break;
			case 'xpt_aux':
				this.setXptAux(opt.aux, opt.source);
				break;
			case 'custom':
				this.sendCommand(opt.command);
				break;
			case 'reconnect':
				this.reconnect();
				break;
		}
	}

	/**
	 * Recalls an event by Id #
	 * @param {int} event - Id of the event to recall
	 */
	recallEvent(event) {
		let eventInt = parseInt(event) + 1; // Although the switcher labels them starting at 0, they are recalled with a 1 base...
		let eventHex = ("0" + eventInt.toString(16)).slice(-2); // The switcher expects the event Id as a 2-digit hexidecimal
		let command = this.COMMAND.RECALL_EVENT
			.replace('{event}', eventHex);
		this.sendCommand(command);
	}

	/**
	 * Set the specified layer of ME1 to the specified source
	 * @param {char} layer - [A, B] Indicates which layer to change (A=PGM, B=PVW)
	 * @param {int} source - Id of the source to use
	 */
	setXptMe1(layer, source) {
		let command = this.COMMAND.XPT_ME1
			.replace('{layer}', layer)
			.replace('{source}', source);
		this.sendCommand(command);
	}

	/**
	 * Sets the specified Aux to the specified source
	 * @param {int} aux - [1-8] Indicates which aux to set
	 * @param {int} source - Id of the source to use
	 */
	setXptAux(aux, source) {
		let command = this.COMMAND.XPT_AUX
			.replace('{aux}', aux)
			.replace('{source}', source);
		this.sendCommand(command);
	}

	/**
	 * Configuration fields that can be used
	 * @returns {Array}
	 * @since 1.0.0
	 */
	config_fields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 12,
				regex: this.REGEX_IP
			}
		]
	}

	/**
	 * Initialize the available variables. (These are listed in the module config UI)
	 * @since 1.0.0
	 */
	initVariables() {
		var variables = [ ];
		this.setVariableDefinitions(variables);
	}

	/**
	 * Initialize feedbacks
	 * @since 1.0.0
	 */
	initFeedbacks() {
		const feedbacks = { };

		this.setFeedbackDefinitions(feedbacks);

		for(let feedback in feedbacks) {
			this.checkFeedbacks(feedback);
		}
	}

	/**
	 * Return feedback information
	 * @param {Object} feedback - Feedback data to process
	 * @param {Object} bank - The bank this feedback is from
	 * @returns {Object} - Feedback information
	 * @since 1.0.0
	 */
	feedback(feedback, bank) {
		return { };
	}

	/**
	 * Process configuration updates
	 * @param {Object} config - New configuration
	 * @since 1.0.0
	 */
	updateConfig(config) {
		this.config = config;
		this.status(this.STATUS_UNKNOWN);
		if(this.config.host) {
			this.connect();
		}
	}

	/**
	 * Main initialization
	 * @since 1.0.0
	 */
	init() {
		this.status(this.STATUS_UNKNOWN);
		if(this.config.host) {
			this.connect();
		}
	}

	/**
	 * Initialize the websocket connection to the server
	 * @since 1.0.0
	 */
	connect() {
		if(this.reconnecting) { // existing reconnect attempt
			clearTimeout(this.reconnecting);
			this.reconnecting = null;
		}
		if(this.socket && this.socket.connected) { // already connected
			this.disconnect();
		}
		if(!this.config.host) { // don't know where to connect to
			return;
		}

		this.socketClient = new WebSocket();

		this.socketClient
			.on('connect', webSocketConnection => {
				this.debug('Websocket connected');
				this.status(this.STATUS_OK);
				this.socket = webSocketConnection;
				this.socket
					.on('message', message => {
						if (message.type == 'utf8') {
							message.utf8Data
								.split(',')
								.map(item => item.trim())
								.forEach(item => {
									this.debug(`Data recieved: "${item}"`);
									if (/^ME_XPT_.+:\d+$/.test(item)) {
										this.processXptChange(item);
									} else if (/^M1K[1-4]_KEYONAIR:\d$/.test(item)) {
										this.processKeyChange(item);
									}
								});
						}
					})
					.on('error', error => {
						this.debug(`Socket error: ${error}`);
					})
					.on('close', (reasonCode, description) => {
						this.debug(`Socket closed: [${reasonCode}]-${description}`);
						this.reconnect.bind(this, true);
					});
				this.socket.send(this.COMMAND.GET_STATE); // Get the initial state data
			})
			.on('connectFailed', errorDescription => {
				this.debug(`Websocket connection failed: ${errorDescription}`);
				this.status(this.STATUS_ERROR);
			});

			this.socketClient.connect(`ws://${this.config.host}:8621/`, null, `http://${this.config.host}`);
	}

	/**
	 * Attempt a reconnect on connection lost/logout
	 * @param {Boolean} retry_immediately - Immediately try reconnecting, useful if the session may have ended
	 * @since 1.0.0
	 */
	reconnect(retry_immediately = false) {
		this.status(this.STATUS_ERROR);
		this.disconnect();

		if(retry_immediately) {
			this.connect();
		} else {
			this.connect_timeout(this.RECONNECT_TIMEOUT);
		}
	}

	/**
	 * Try to commect again after timeout
	 * @param {Int} timeout - Timeout to try reconnection (seconds)
	 * @since 1.0.0
	 */
	connect_timeout(timeout) {
		if(this.reconnecting) {
			return;
		}
		this.log('info', `Attempting to reconnect in ${timeout} seconds.`);
		this.reconnecting = setTimeout(this.connect.bind(this, true), timeout * 1000);
	}

	/**
	 * Process a change to an XPT
	 * @param {string} data - The data recieved from the switcher
	 * @since 1.0.0
	 */
	processXptChange(data) {
		const xpt = data.match(/^ME_XPT_(.+):\d+$/)[1];
		const src = parseInt(data.match(/^ME_XPT_.+:(\d+)$/)[1], 10);

		if (/AUX[1-4]/.test(xpt)) {
			const auxNum = parseInt(xpt.match(/AUX([1-4])/)[1], 10);
			this.STATUS.xpt[`aux${auxNum}`] = src;
		} else if (/ME1_KEY[1-4]_[AB]/.test(xpt)) {
			const matches = xpt.match(/ME1_KEY([1-4])_([AB])/);
			const keyName = `${parseInt(matches[1], 10)}${matches[2]}`;
			this.STATUS.xpt[`key${keyName}`] = src;
		} else if (/ME1_BKGD_[AB]/.test(xpt)) {
			switch (xpt.match(/ME1_BKGD_([AB])/)[1]) {
				case 'A': {
					this.STATUS.xpt.pgm = src;
					break;
				}
				case 'B': {
					this.STATUS.xpt.pvw = src;
					break;
				}
			}
		}
		//TODO: Update variables and feedbacks with this information
	}

	/**
	 * Process a change to an KEY
	 * @param {string} data - The data recieved from the switcher
	 * @since 1.0.0
	 */
	processKeyChange(data) {
		const matches = data.match(/^M1K([1-4])_KEYONAIR:(\d)$/);
		const keyNum = matches[1];
		const live = parseInt(matches[2], 10) !== 0;
		this.STATUS.output[`key${keyNum}`] = live;
		//TODO: Update variables and feedbacks with this information
	}

	/**
	 * Send a command to the switcher
	 * @param {string} command - The command to send
	 * @since 1.0.0
	 */
	sendCommand(command) {
		if(!this.socket || !this.socket.connected) {
			this.reconnect.bind(this, true);
			return;
		}
		this.debug(`Sending command: ${command}`);
		this.socket.sendUTF(command);
	}

	/**
	 * Reboots the device and starts a reconnect attempt
	 * @since 1.0.0
	 */
	reboot() {
		this.sendCommand(this.COMMAND.REBOOT);
		this.disconnect();
		this.connect_timeout(this.REBOOT_WAIT_TIME);
	}

	/**
	 * Disconccect from device
	 * @since 1.0.0
	 */
	disconnect() {
		if(!this.socket) {
			this.status(this.STATUS_ERROR);
			this.socket.close();
			this.socket = null;
		}
	}

	/**
	 * Ends session if connected
	 * @since 1.0.0
	 */
	destroy() {
		this.disconnect();
	}
}

exports = module.exports = instance;
