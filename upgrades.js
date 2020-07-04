module.exports = {
	/**
	 * Upgrade 1.0.x -> 1.1.0
	 * CHANGES:
	 * - Changed "set_me1" action to allow selecting the ME
	 * - Added a model selector option to module config
	 */
	upgradeV1x1x0: (config, actions, releaseActions, feedbacks) => {
		console.log("Running 1.0.x -> 1.1.0 upgrade.");
		let changed = false;

		if (!config.model || config.model === "") {
			console.log("No model selected. Defaulting to HVS100.");
			config.model = "HVS100";
			changed = true;
		}

		for (let action of [...actions, ...releaseActions]) {
			if (action.action === "xpt_me1") {
				console.log("Updated a 'Set ME' action to the new format.");
				action.action = "xpt_me";
				action.label = `${action.instance}:${action.action}`;
				action.options.me = 1;
				changed = true;
			}
		}

		return changed;
	},
};
