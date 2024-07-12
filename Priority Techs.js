// Demo of all kinds of features, list of techs to trigger.
// Behaves similar to "if unlocked [X] research [X]" triggers.
once(() => {
    snippetState.pending = [
        techIds["tech-scientific_journal"],
        techIds["tech-adjunct_professor"],
        techIds["tech-archaeology"],
        techIds["tech-merchandising"],
        techIds["tech-cambridge_process"],
        techIds["tech-rover"],
        techIds["tech-probes"],
        techIds["tech-gauss_rifles"],
        techIds["tech-nano_tubes"],
        techIds["tech-quantum_computing"],
    ];

    if (_("Challenge", "truepath")) {
        snippetState.pending.push(...[
            techIds["tech-virtual_reality_tp"],
        ]);
    }
    else {
        snippetState.pending.push(...[
            techIds["tech-virtual_reality"],
            techIds["tech-stanene"],
            techIds["tech-swarm_convection"],
            techIds["tech-plasma"],
            techIds["tech-metaphysics"],
            techIds["tech-calibrated_sensors"],
            techIds["tech-gauss_rifles"],
            techIds["tech-scarletite"],
            techIds["tech-xeno_gift"],
            techIds["tech-nanoweave"], // Not priority so much as needs triggering for Nano Tubes.
        ]);
    }
    snippetState.multi = ["cambridge_process", "rover"];
});
for (let i = 0; i < snippetState.pending.length; ++i) {
    // Know better than the TypeScript analyzer? You can use JSDoc.
    /** @type {Technology} tech */
    let tech = snippetState.pending[i];
    if (!tech || tech.isResearched()) {
        snippetState.pending.splice(i, 1);
        i--;
    }
    else if (tech.isUnlocked() && (tech.cost?.Knowledge??0) < resources.Knowledge.maxQuantity) {
        trigger(tech);
        if (!snippetState.multi.includes(tech.id)) return;
    }
}

// Stop running when done to conserve resources (not much).
if (snippetState.pending.length === 0) return stopRunning();
