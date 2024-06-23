// We need to read from the game API because we need costs before the projects are unlocked.
if (settings["prestigeType"] === "ascension" && buildings.ChthonianExcavator.count && !buildings.SiriusAscensionTrigger.count) {
    const adjustedElevator = poly.adjustCosts(game.actions.interstellar.int_sirius.space_elevator);
    const adjustedDome = poly.adjustCosts(game.actions.interstellar.int_sirius.gravity_dome);
    const adjustedMachine = poly.adjustCosts(game.actions.interstellar.int_sirius.ascension_machine);

    const machineComplete = !!buildings.SiriusAscensionTrigger.count;
    const machinePartsRemaining = machineComplete ? 0 : (100 - buildings.SiriusAscensionMachine.count);
    const domeComplete = machineComplete || buildings.SiriusAscensionMachine.isUnlocked();
    const domePartsRemaining = domeComplete ? 0 : (100 - buildings.SiriusGravityDome.count);
    const elevatorComplete = domeComplete || buildings.SiriusGravityDome.isUnlocked();
    const elevatorPartsRemaining = elevatorComplete ? 0 : (100 - buildings.SiriusSpaceElevator.count);

    // @ts-ignore
    const needVault = !isPillarFinished();
    let pillarOrichalcum = 0;
    if (needVault) {
        pillarOrichalcum += (game.global.tech?.hell_ruins ?? 0) >= 3 ? 0 : game.adjustCosts(game.actions.portal.prtl_ruins.vault, buildings.RuinsVault.count === 1 ? 0 : 1).Orichalcum();
        pillarOrichalcum += techIds["tech-scarletite"].isResearched() ? 0 : game.adjustCosts(game.actions.tech.scarletite).Orichalcum();
    }

    let res = resourceList({
        Orichalcum: pillarOrichalcum + (machinePartsRemaining * adjustedMachine.Orichalcum()),
        Bolognium: elevatorPartsRemaining * adjustedElevator.Bolognium(),
        Mythril: elevatorPartsRemaining * adjustedElevator.Mythril(),
        Aerogel: domePartsRemaining * adjustedDome.Aerogel(),
        Nanoweave: machinePartsRemaining * adjustedMachine.Nanoweave(),
    });

    // Start making Aerogel and Nanoweave only if Mythril is complete. Otherwise, "hold" the current amount.
    if (resources.Mythril.currentQuantity < res.Mythril) {
        res.Aerogel = Math.min(res.Aerogel, resources.Aerogel.currentQuantity);
        res.Nanoweave = Math.min(res.Nanoweave, resources.Nanoweave.currentQuantity);
    }

    // If we have all the Bolognium, move replicator priority to Orichalcum instead.
    if (resources.Bolognium.currentQuantity >= res.Bolognium) settings["replicator_p_Orichalcum"] = 60;

    // Stuff we don't need anymore
    Object.keys(res).forEach(k => { if(res[k] <= 0) delete res[k]; });

    // Now, we need to trigger all of the relevant buildings, too.
    // Look for Vault
    if (!game.global.tech.hell_vault) {
        if (buildings.RuinsArchaeology.count < 2) trigger(buildings.RuinsArchaeology);
        if (buildings.RuinsGuardPost.count < Math.min(5 * buildings.RuinsArchaeology.count, 10)) trigger(buildings.RuinsGuardPost);
    }
    // Activate Vault
    if (buildings.RuinsVault.count < 2) {
        trigger(buildings.RuinsVault);
    }
    // Elevator trigger after 15 excavators OR all required Mythril crafted.
    if (!elevatorComplete && (buildings.ChthonianExcavator.count >= 15 || resources.Mythril.currentQuantity >= res.Mythril)) {
        trigger(buildings.SiriusSpaceElevator);
    }
    else if (!domeComplete) {
        trigger(buildings.SiriusGravityDome);
    }
    // Wait until all pillar-required Orichalcum is spent before triggering the machine.
    else if (!machineComplete && (!pillarOrichalcum || resources.Orichalcum.currentQuantity >= res.Orichalcum)) {
        trigger(buildings.SiriusAscensionMachine);
    }

    if (buildings.SiriusThermalCollector.count < 69) {
        trigger(buildings.SiriusThermalCollector);
    }

    // And trigger the resource list.
    if (!machineComplete || pillarOrichalcum) {
        trigger(res, [
            // Zigs need Mythril, but generally not much.
            buildings.RedZiggurat,
            buildings.RedExoticLab,
            // Excavators need Mythril, but will speed up the Orichalcum production.
            buildings.ChthonianExcavator,
            // Archaeology is needed to unlock the Vault.
            buildings.RuinsArchaeology,
            // Dreads need Aerogel and might be needed to reduce piracy.
            buildings.Dreadnought,
            // Vault, of course
            buildings.RuinsVault,
            // Ascension Projects, of course
            buildings.SiriusSpaceElevator,
            buildings.SiriusGravityDome,
            buildings.SiriusAscensionMachine,
            // Technologies: (ignore list still applies)
            techIds["tech-orichalcum_analysis"],
            techIds["tech-orichalcum_capacitor"],
            techIds["tech-orichalcum_driver"],
            techIds["tech-orichalcum_panels"],
            techIds["tech-high_tech_factories"],
            techIds["tech-advanced_emplacement"],
            //techIds["tech-orichalcum_sphere"],
            techIds["tech-scarletite"],
            // All other things using the listed resources are only allowed to spend excess.
        ]);
        daily(() => {
            console.info("Resource list: %s", Object.entries(res).reduce((p, [n, amount]) => { return p + (amount ? `${n}: ${amount}, ` : ""); }, ""));
        });
    }
}

// ((eg, pt) => { let needVault = pt === "demonic" || (pt === "ascension" && (!(eg?.pillars?.[eg?.race?.species] >= 5))) || eg.race.witch_hunter; let vaultCost = needVault && eg.tech.hell_ruins < 3 ? 30e6 : 0; let ascensionCost = (pt === "ascension" || eg.race.witch_hunter) ? ((100 - ((eg.interstellar?.ascension_machine?.count || eg.portal?.absorption_chamber?.count)??0)) * 250000) : 0; let scarletiteCost = needVault && !eg.tech?.scarletite ? 8e6 : 0; return (eg?.resource?.Orichalcum?.amount??0) > (vaultCost + ascensionCost + scarletiteCost); })(evolve.global, settings["prestigeType"])
