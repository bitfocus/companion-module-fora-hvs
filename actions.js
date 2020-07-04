let protocol_hvs100 = require("./protocol_hvs100");

let protocol = {
	...protocol_hvs100,
};

module.exports = {
	/**
	 * Build the list of actions
	 * @param {string} model - The model we are requesting actions for
	 * @returns {Object} - The actions
	 */
	getActions: (model) => {
		// Global actions
		let actions = {};
		actions["custom"] = {
			label: "Send Custom Command",
			options: [
				{
					type: "textinput",
					label: "Command",
					id: "command",
					default: "",
					required: true,
				},
			],
		};
		actions["reboot"] = { label: "Reboot Switcher" };
		actions["recall_event"] = {
			label: "Recall Event",
			options: [
				{
					type: "number",
					label: "Event Number",
					id: "event",
					default: 0,
					min: 0,
					max: 99,
					required: true,
				},
			],
		};
		actions["reconnect"] = {
			label: "Reconnect",
			tooltip:
				"If the switcher drops the connection, this action will reconnect.",
		};
		actions["trans_auto"] = { label: "Auto Transition" };
		actions["trans_cut"] = { label: "Cut Transition" };
		actions["xpt_aux"] = {
			label: "Set AUX",
			options: [
				{
					type: "dropdown",
					label: "Aux",
					id: "aux",
					required: true,
					default: 1,
					choices: protocol[model].AUXES,
				},
				{
					type: "dropdown",
					label: "Source",
					id: "source",
					required: true,
					default: 1,
					choices: protocol[model].SOURCES_ME.concat(
						protocol[model].SOURCES_AUX
					),
				},
			],
		};
		actions["xpt_me"] = {
			label: "Set ME",
			options: [
				{
					type: "dropdown",
					label: "ME",
					id: "me",
					required: true,
					default: 1,
					choices: protocol[model].MES,
				},
				{
					type: "dropdown",
					label: "Layer",
					id: "layer",
					required: true,
					default: "A",
					choices: [
						{ id: "A", label: "A / PGM" },
						{ id: "B", label: "B / PVW" },
					],
				},
				{
					type: "dropdown",
					label: "Source",
					id: "source",
					required: true,
					default: 1,
					choices: protocol[model].SOURCES_ME,
				},
			],
		};

		return actions;
	},

	/**
	 * Process data recieved from the switcher
	 * @param {string} - The data that was recieved
	 */
	dataRecieved: (data) => {
		// TODO: Process this data to populate feedbacks
	},

	/**
	 * Return the command string fot the provided action
	 * @param {string} model - The model of switcher to get the command for
	 * @param {string} action - The id of the action we want a command for
	 * @param {Object} options - Any options from the action
	 * @returns {string} - The command string
	 */
	getCommandForAction: (model, action, options) => {
		let command = "";

		switch (action) {
			case "get_state":
				command = protocol[model].COMMANDS.GET_STATE;
				break;
			case "reboot":
				command = protocol[model].COMMANDS.REBOOT;
				break;
			case "recall_event":
				let eventInt = parseInt(options.event) + 1; // Although the switcher labels them starting at 0, they are recalled with a 1 base...
				let eventHex = ("0" + eventInt.toString(16)).slice(-2); // The switcher expects the event Id as a 2-digit hexidecimal
				command = protocol[model].COMMANDS.RECALL_EVENT
					.replace( "{event}", eventHex);
				break;
			case "trans_auto":
				command = protocol[model].COMMANDS.TRANS_AUTO;
				break;
			case "trans_cut":
				command = protocol[model].COMMANDS.TRANS_CUT;
				break;
			case "xpt_me":
				command = protocol[model].COMMANDS.XPT_ME
					.replace("{me}", options.me)
					.replace("{layer}", options.layer)
					.replace("{source}", options.source);
				break;
			case "xpt_aux":
				command = protocol[model].COMMANDS.XPT_AUX
					.replace("{aux}", options.aux)
					.replace("{source}", options.source);
				break;
			case "custom":
				command = options.command.trim();
				break;
		}

		return command;
	},
};
