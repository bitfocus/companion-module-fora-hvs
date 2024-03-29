module.exports = {
	HVS100: {
		COMMANDS: {
			GET_INPUTS: 'GET.SIGNAL_GROUP2',
			GET_STATE: 'GET.ALLDATA_ME_XPT',
			REBOOT: 'CMD.020503',
			// event: 2-digit hex for the selected event
			RECALL_EVENT: 'CMD.030502{event}',
			// macroHex: 2-digit hex for the selected macro
			RECALL_MACRO: 'CMD.04058100{macroHex}',
			// me: which me to transition
			TRANS_ME_AUTO: 'SET.ME_XPT_ME{me}_BKGD_TRS_AUTO_STAT:1',
			// me: which me to transition
			TRANS_ME_CUT: 'SET.ME_XPT_ME{me}_BKGD_TRS_AUTO_STAT:3',
			// me: which me owns the key
			// key: which key to transition
			TRANS_KEY_AUTO: 'SET.ME_XPT_ME{me}_KEY{key}_TRS_AUTO_STAT:1',
			// me: which me owns the key
			// key: which key to transition
			TRANS_KEY_CUT: 'SET.ME_XPT_ME{me}_KEY{key}_TRS_AUTO_STAT:3',
			// me: which me to set
			// layer: which layer to set
			// source: id of the selected source
			XPT_ME: 'SET.ME_XPT_ME{me}_BKGD_{layer}:{source}',
			// aux: which aux to set;
			// source: id of the selected source
			XPT_AUX: 'SET.ME_XPT_AUX{aux}:{source}',
		},
		ME_LAYERS: { A: 'A', B: 'B' },
		AUXES: [
			{ id: 1, label: 'Aux 1' },
			{ id: 2, label: 'Aux 2' },
			{ id: 3, label: 'Aux 3' },
			{ id: 4, label: 'Aux 4' },
			{ id: 5, label: 'Aux 5' },
			{ id: 6, label: 'Aux 6' },
			{ id: 7, label: 'Aux 7' },
			{ id: 8, label: 'Aux 8' },
		],
		VARIABLES: [
			{ label: 'Last event to be recalled', name: 'event_recall' },
			{ label: 'KEY 1 on/off', name: 'me_1_key_1' },
			{ label: 'KEY 2 on/off', name: 'me_1_key_2' },
			{ label: 'DSK 1 on/off', name: 'me_1_key_3' },
			{ label: 'DSK 2 on/off', name: 'me_1_key_4' },
		],
		MES: [{ id: 1, label: 'ME 1' }],
		KEYS: [
			{ id: '1,1', label: 'KEY 1' },
			{ id: '1,2', label: 'KEY 2' },
			{ id: '1,3', label: 'DSK 1' },
			{ id: '1,4', label: 'DSK 2' },
		],
		get SOURCES_ME() {
			let sources = [
				// Built-in Inputs
				{ id: 1, label: 'Source 1' },
				{ id: 2, label: 'Source 2' },
				{ id: 3, label: 'Source 3' },
				{ id: 4, label: 'Source 4' },
				{ id: 5, label: 'Source 5' },
				{ id: 6, label: 'Source 6' },
				{ id: 7, label: 'Source 7' },
				{ id: 8, label: 'Source 8' },
				// Optional expansion card inputs
				{ id: 9, label: 'Source 9' },
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
			]
			let system = [
				// System inputs
				{ id: 0, label: 'Black' },
				{ id: 29, label: 'Still 1' },
				{ id: 30, label: 'Still 2' },
				{ id: 37, label: 'Color Bars' },
				{ id: 38, label: 'Matte 1' },
				{ id: 39, label: 'Matte 2' },
				{ id: 40, label: 'Color Key Fill' },
				{ id: 41, label: 'Color Key Key' },
				{ id: 42, label: 'Sub Effect 1' },
				{ id: 43, label: 'Sub Effect 2' },
			]
			return sources.concat(system.sort((a, b) => (a.label > b.label ? 1 : -1)))
		},
		get SOURCES_AUX() {
			let additional = [
				// Additional AUX-only sources
				{ id: 46, label: 'Program' },
				{ id: 47, label: 'Preview' },
				{ id: 48, label: 'Clean' },
				{ id: 50, label: 'Multi-View' },
			]
			return this.SOURCES_ME.concat(additional.sort((a, b) => (a.label > b.label ? 1 : -1)))
		},
	},
}
