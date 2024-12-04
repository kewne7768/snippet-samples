// Demo of all kinds of features, list of techs to trigger.
// Behaves similar to "if unlocked [X] research [X]" triggers.
once(() => {
    snippetState.pending = [
        techIds["tech-steel"],
        techIds["tech-scientific_journal"],
        techIds["tech-adjunct_professor"],
        techIds["tech-archaeology"],
        techIds["tech-merchandising"],
        techIds["tech-cambridge_process"],
        techIds["tech-rover"],
        techIds["tech-probes"],
        techIds["tech-gauss_rifles"],
        techIds["tech-lasers"],
        techIds["tech-nano_tubes"],
        techIds["tech-quantum_computing"],
        techIds["tech-quantum_manufacturing"],
        techIds["tech-quantum_swarm"],
    ];

    if (_("Challenge", "truepath")) {
        snippetState.pending.push(...[
            techIds["tech-virtual_reality_tp"],
            techIds["tech-graphene_tp"],
            techIds["tech-quantium"],
            techIds["tech-quantum_signatures"],
        ]);
    }
    else {
        snippetState.pending.push(...[
            // Stone cost is sometimes delaying it
            techIds["tech-tachyon"],
            techIds["tech-warp_drive"],
            techIds["tech-portal"],
            techIds["tech-fortifications"],

            // T3 happy path: alpha support -> global prod+attractors -> some power -> Deut/Aerogel
            techIds["tech-habitat"], // Required for graphene
            techIds["tech-laboratory"], // Extra scientist slots
            techIds["tech-graphene"], //
            techIds["tech-virtual_reality"],
            techIds["tech-superstars"],
            techIds["tech-stanene"],
            techIds["tech-war_drones"], // Prereq for attractors
            techIds["tech-demon_attractor"],
            techIds["tech-perovskite_cell"], // Extra power
            techIds["tech-swarm_convection"],
            techIds["tech-ram_scoops"],
            techIds["tech-plasma"],
            techIds["tech-aerogel"],
            techIds["tech-subspace_signal"], // Extra red support

            // Work towards T4
            techIds["tech-dimensional_readings"],
            techIds["tech-map_terrain"],
            techIds["tech-shields"],
            techIds["tech-calibrated_sensors"],
            techIds["tech-stellar_engine"],
            techIds["tech-plasma_mining"],
            techIds["tech-gravitational_waves"],
            techIds["tech-gravity_convection"],
            techIds["tech-mass_ejector"],
            techIds["tech-quantum_entanglement"],
            techIds["tech-wormholes"],


            techIds["tech-metaphysics"],
            techIds["tech-gauss_rifles"],
            techIds["tech-scarletite"],
            techIds["tech-xeno_gift"],
            techIds["tech-nanoweave"], // Not priority so much as needs triggering for Nano Tubes.
            techIds["tech-orichalcum_analysis"],
        ]);
    }
    if (_("Universe", "magic") && settings.prestigeType === "vacuum") {
        snippetState.pending.push(techIds["tech-veil"], techIds["tech-mana_syphon"]);
    }
    // Mostly techs that require other mats, too
    snippetState.multi = ["cambridge_process", "rover", "perovskite_cell", "virtual_reality", "stanene", "graphene", "calibrated_sensors", ];
});
for (let i = 0; i < snippetState.pending.length; ++i) {
    // Know better than the TypeScript analyzer? You can use JSDoc.
    /** @type {Technology} tech */
    let tech = snippetState.pending[i];
    if (!tech || tech.isResearched()) {
        snippetState.pending.splice(i, 1);
        i--;
    }
    else if (tech.isUnlocked() && (tech.cost?.Knowledge ?? 0) < resources.Knowledge.maxQuantity) {
        trigger(tech);
        if (!snippetState.multi.includes(tech.id)) return;
        // TODO: also return if other stuff in tech.cost met
    }
}

// Stop running when done to conserve resources (not much).
if (snippetState.pending.length === 0) return stopRunning();
