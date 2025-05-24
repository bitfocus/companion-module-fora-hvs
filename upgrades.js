module.exports = [
	/**
	 * Upgrade 1.0.x -> 1.1.0
	 * CHANGES:
	 * - Changed "set_me1" action to allow selecting the ME
	 * - Added a model selector option to module config
	 */
	function (context, config, actions) {
		console.log('Running 1.0.x -> 1.1.0 upgrade.')
		let changed = false

		if (config) {
			if (!config.model || config.model === '') {
				console.log('No model selected. Defaulting to HVS100.')
				config.model = 'HVS100'
				changed = true
			}
		}

		for (let action of actions) {
			if (action.action === 'xpt_me1') {
				console.log("Updated a 'Set ME' action to the new format.")
				action.action = 'xpt_me'
				action.options.me = 1
				changed = true
			}
		}

		return changed
	},

	/**
	 * Upgrade 1.1.x -> 1.2.0
	 * CHANGES:
	 * - Combined seperate ME transition actions into 1
	 * - Updated ME transition actions to allow selecting the ME
	 */
	function (context, config, actions, feedbacks) {
		console.log('Running 1.1.x -> 1.2.0 upgrade.')
		let changed = false

		for (let action of actions) {
			if (action.action === 'trans_auto' || action.action === 'trans_cut') {
				console.log('Updated a transition action to the new format.')
				let type = action.action === 'trans_auto' ? 'AUTO' : 'CUT'
				action.action = 'trans_me'
				action.options.me = 1
				action.options.type = type
				changed = true
			}
		}

		return changed
	},
]
