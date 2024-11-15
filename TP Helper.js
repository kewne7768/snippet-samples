// Focused on the TP3 segment of the run

if (!_("Challenge", "truepath") || _("Challenge", "lone_survivor")) return stopRunning();

if (["bioseed", "mad"].includes(settings.prestigeType)) return;

// Instant triggers:
// 10 temples early on, but we may need a bank
if (buildings.Temple.cost.Money < resources.Money.maxQuantity) {
    trigger.amount(buildings.Temple, 10);
}
else if (buildings.Temple.count < 10) {
    // Build banks if those temples are not affordable
    trigger(buildings.Bank);
}
// 10 tourisms as soon as unlocked
trigger.amount(buildings.TouristCenter, 10);

let capKnowledge = false;
let forbidLQ = false; // Don't want to spam LQs if spamming Electrolysis Plants since they use the same mats

if (buildings.TitanSpaceport.count) {
    // Support Titan
    const titanSupportNeeded = buildings.TitanQuarters.count + buildings.TitanGraphene.count + buildings.TitanMine.count;
    if (resources.Titan_Support.maxQuantity < titanSupportNeeded && !buildings.TitanElectrolysis.stateOffCount || buildings.TitanElectrolysis.count < 10) {
        trigger(buildings.TitanElectrolysis);
        forbidLQ = true;
    }
}

if (buildings.TitanMine.isUnlocked()) {
    // Minimum, we'll go higher for quantium
    if (!buildings.TitanQuarters.stateOffCount) {
        trigger.amount(buildings.TitanQuarters, 12);
    }
    trigger.amount(buildings.RedFabrication, 26);
    trigger.amount(buildings.RedZiggurat, 34);

    if (buildings.RedFabrication.count >= 26) {
        trigger.amount(buildings.DwarfShipyard, 1);
    }

    // Trigger knowledge capping only if needed
    if (state.knowledgeRequiredByTechs > resources.Knowledge.maxQuantity) {
        capKnowledge = true;
    }
}

if (buildings.DwarfShipyard.count && techIds["tech-quantium"].isResearched()) {
    trigger.amount(buildings.HellSwarmPlant, 15);
    trigger.amount(buildings.Casino, 8);

    if (!buildings.TitanQuarters.stateOffCount) {
        trigger.amount(buildings.TitanQuarters, 24);
    }

    if (buildings.TitanQuarters.count >= 24 && buildings.TitanGraphene.count >= 12 && !forbidLQ) {
        trigger.amount(buildings.RedLivingQuarters, 48);
    }
    trigger.amount(buildings.RedFabrication, 30);
    trigger.amount(buildings.EnceladusZeroGLab, 25);

    // Support Enc
    const encSupportNeeded = buildings.EnceladusWaterFreighter.count + buildings.EnceladusZeroGLab.count + buildings.EnceladusBase.count;
    if (resources.Enceladus_Support.maxQuantity < encSupportNeeded && !buildings.TitanSpaceport.stateOffCount) {
        trigger(buildings.TitanSpaceport);
    }

    // Make sure we can keep up with sats
    trigger.amount(buildings.HellSwarmPlant, 20);

    // Go for FOB immediately after fabrications+mines; Enc Data is the bottleneck so the sooner the better
    if (buildings.RedFabrication.count >= 30 && buildings.TitanMine.count >= 6) {
        trigger.amount(buildings.TritonFOB, 1);
        // Get some soldiers early too, to let merc cost reset
        trigger.amount(buildings.Barracks, 34);
        trigger.amount(buildings.RedSpaceBarracks, 10);
        // Some knowledge buildings are good
        trigger.amount(buildings.Wardenclyffe, 50);
    }
}

if (buildings.TritonFOB.count) {
    if (buildings.TritonLander.count >= 45 || !resources.Nano_Tube.isDemanded()) {
        capKnowledge = true; // Unconditionally cap but don't use up Alloy while rushing troop landers
    }

    // We'll build a full 25, but that's in a classic trigger. First 12 or so are cheap.
    trigger.amount(buildings.BootCamp, 12);
    // Build Banquet for regen and other stuff
    trigger.amount(buildings.Banquet, 2);
    // Pump up soldier count. 15 barracks first, then pump bases too
    trigger.amount(buildings.RedSpaceBarracks, 15);
    if (buildings.RedSpaceBarracks.count >= 15) {
        const nextBuilding = buildings.EnceladusBase.cost.Mythril < buildings.RedSpaceBarracks.cost.Wrought_Iron ? buildings.EnceladusBase : buildings.RedSpaceBarracks;
        const cap = 500_000;
        if ((nextBuilding.cost?.Mythril??Infinity) < cap || (nextBuilding.cost?.Wrought_Iron??Infinity) < cap) {
            trigger(nextBuilding);
        }
    }
}

if (buildings.ErisDrone.isUnlocked()) {
    // This is EXTREMELY prestige dependent
    // Force reset (90% from Eris, usually 2-3 colonists of data worth)
    if (_("ResetType", "apocalypse")) {
        trigger.amount(buildings.ErisDrone, 9);
        trigger.amount(buildings.ErisTank, 7);
        trigger.amount(buildings.ErisTrooper, 38);
        trigger.amount(buildings.TitanAIColonist, 8);
        trigger.amount(buildings.TitanDecoder, 12);
    }
    else {
        // When not going for TP3 reset, just enough to get control
        trigger.amount(buildings.ErisDrone, 5);
        trigger.amount(buildings.ErisTank, 4);
        trigger.amount(buildings.ErisTrooper, 21);
    }
}

if (capKnowledge) {
    // Cap cheap knowledge and control stations.
    const knowledgeBuildings = [buildings.SpaceSatellite, buildings.BioLab, buildings.BlackholeFarReach, buildings.MoonObservatory];
    if (resources.Sun_Support.maxQuantity <= resources.Sun_Support.currentQuantity && state.knowledgeRequiredByTechs < resources.Knowledge.maxQuantity) {
        knowledgeBuildings.push(buildings.SunSwarmControl);
    }
    let triggered = 0;
    for (let building of knowledgeBuildings) {
        if (building.isUnlocked() && (building.cost?.Knowledge ?? 0) < resources.Knowledge.maxQuantity) {
            triggered++;
            trigger(building);
        }
    }
}
