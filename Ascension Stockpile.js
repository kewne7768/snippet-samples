// We need to read from the game API because we need costs before the projects are unlocked.
if (settingsRaw["prestigeType"] === "ascension" && buildings.ChthonianExcavator.count && !buildings.SiriusAscensionTrigger.count) {
    const adjustedElevator = poly.adjustCosts(game.actions.interstellar.int_sirius.space_elevator);
    const adjustedDome = poly.adjustCosts(game.actions.interstellar.int_sirius.gravity_dome);
    const adjustedMachine = poly.adjustCosts(game.actions.interstellar.int_sirius.ascension_machine);

    // "45" thermals (our cost reserves don't account for creep so actual number will be less)
    // We multibuild or trigger up to 45.
    const thermalsLeft = Math.max(0, 45 - buildings.SiriusThermalCollector.count);
    const thermalTarget = 45;
    const thermalTargetFinal = 69;

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
        Infernite: thermalsLeft * 22500, // Base cost for #1 assuming heat. There is cost creep but w/e.
        Vitreloy: thermalsLeft * 90000, // Kinda randomly chosen number. W/e.
    });

    // Start making Nanoweave only if Mythril is complete. Otherwise, "hold" the current amount.
    if (resources.Mythril.currentQuantity < res.Mythril) {
        // We can replicate Aerogel easily, it's fine. Just leave it in the list up there and get working on it ASAP.
        // But this would be necessary without replicator:
        //res.Aerogel = Math.min(res.Aerogel, resources.Aerogel.currentQuantity);
        res.Nanoweave = Math.min(res.Nanoweave, resources.Nanoweave.currentQuantity);
    }

    // Between Bolog/Orich, calculate which of the two fills last. That one gets 60 prio on the replicator.
    if (resources.Bolognium.currentQuantity >= res.Bolognium) {
        // Can be /0, in that case it's infinity.
        let timeToFillOri = Math.max(((res.Orichalcum ?? 0) - resources.Orichalcum.currentQuantity) / Math.max(0.01, resources.Orichalcum.rateOfChange - (game.breakdown.p.consume?.Orichalcum?.Replicator ?? 0) - (game.breakdown.p.consume?.Orichalcum?.Alchemy ?? 0)), 0);
        let timeToFillBolog = Math.max(((res.Bolognium ?? 0) - resources.Bolognium.currentQuantity) / Math.max(0.01, resources.Bolognium.rateOfChange - (game.breakdown.p.consume?.Bolognium?.Replicator ?? 0) - (game.breakdown.p.consume?.Bolognium?.Alchemy ?? 0)), 0);
        if (resources.Orichalcum.currentQuantity >= res.Orichalcum) timeToFillOri = 0;
        if (resources.Bolognium.currentQuantity >= res.Bolognium) timeToFillBolog = 0;
        console.info("Fill times: %o %o", timeToFillBolog, timeToFillOri);
        if (timeToFillOri > timeToFillBolog && timeToFillOri > 0) {
            settings["replicator_p_Orichalcum"] = 60;
            settings["res_alchemy_w_Bolognium"] = 0;
            settings["res_alchemy_w_Orichalcum"] = 20;
        }
        else if (timeToFillBolog > 0) {
            settings["replicator_p_Bolognium"] = 60;
            settings["res_alchemy_w_Bolognium"] = 20;
            settings["res_alchemy_w_Orichalcum"] = 0;
        }
    }

    // Stuff we don't need anymore
    Object.keys(res).forEach(k => { if (res[k] <= 0) delete res[k]; });

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

    if (buildings.SiriusThermalCollector.count < thermalTargetFinal) {
        // Doesn't account for cost creep, but it's OK.
        // Script will just fail at tracking resources but game will reject resources all the same.
        for (let i = buildings.SiriusThermalCollector.count; i < thermalTarget; ++i) {
            if (buildings.SiriusThermalCollector.click()) {
                buildings.SiriusThermalCollector.instance.count++;
            }
            else {
                break;
            }
        }
        trigger.amount(buildings.SiriusThermalCollector, thermalTargetFinal);

        // Fix up Infernite by disabling attractors and building new carports.
        if (!resources.Soul_Gem.isDemanded()) {
            settings["bld_m_portal-attractor"] = 0;
            trigger.amount(buildings.PortalCarport, 30);
        }
    }

    // And trigger the resource list.
    if (!machineComplete || pillarOrichalcum) {
        trigger.custom(res, [
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
            buildings.SiriusThermalCollector,
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
        /*
        daily(() => {
            console.info("Resource list: %s", Object.entries(res).reduce((p, [n, amount]) => { return p + (amount ? `${n}: ${amount}, ` : ""); }, ""));
        });
        */
    }
}
else if (buildings.SiriusAscensionTrigger.count && settings.autoPrestige) {
    // **THIS IS MOSTLY UNTESTED**
    // It happened once and it worked. I also tested it by turning autoPrestige off and removing this check.
    let now = game.global.stats.days;

    // Currently supposed to be off?
    if (('ascensionOffUntil' in snippetState)) {
        if (now <= snippetState.ascensionOffUntil) {
            // Still gotta be off.
            settings["bld_m_interstellar-ascension_trigger"] = 0;
        }
        else {
            // Try powering it again.
            delete snippetState.ascensionOffUntil;
            delete snippetState.ascensionPowered;
        }
    }
    // Currently powered?
    else if (buildings.SiriusAscensionTrigger.stateOnCount) {
        // Add day to state if not yet present, it'll be reset every successful attempt.
        if (!('ascensionPowered' in snippetState)) {
            snippetState.ascensionPowered = now;
        }

        let diff = now - snippetState.ascensionPowered;
        // Powered for at least 3 days and we're not done yet? Turn it off for 3-4 days.
        if (diff >= 3) {
            snippetState.ascensionOffUntil = now + 3;
            settings["bld_m_interstellar-ascension_trigger"] = 0;
            delete snippetState.ascensionPowered;
            GameLog.logWarning("special", `The Ascension Machine bugged out at day #${now}. Trying to auto-recover.`, ['progress', 'achievements']);
        }
    }
}

// ((eg, pt) => { let needVault = pt === "demonic" || (pt === "ascension" && (!(eg?.pillars?.[eg?.race?.species] >= 5))) || eg.race.witch_hunter; let vaultCost = needVault && eg.tech.hell_ruins < 3 ? 30e6 : 0; let ascensionCost = (pt === "ascension" || eg.race.witch_hunter) ? ((100 - ((eg.interstellar?.ascension_machine?.count || eg.portal?.absorption_chamber?.count)??0)) * 250000) : 0; let scarletiteCost = needVault && !eg.tech?.scarletite ? 8e6 : 0; return (eg?.resource?.Orichalcum?.amount??0) > (vaultCost + ascensionCost + scarletiteCost); })(evolve.global, settings["prestigeType"])
