// Custom triggers with more logic than possible in the normal system.
// Note that there can be multiple triggers started this way active at once.
// It'll behave similar to when you manually queue conflicting buildings.
// But in most of these samples that's good because they don't use the same resources/resource types (or not much).
const isKnowledgeProdHardRun = (_("Challenge", "orbit_decay") && game.global.race.orbit_decayed) || _("Challenge", "cataclysm");

// A few triggers that don't apply in Cata/OD.
if (!isKnowledgeProdHardRun) {
    // Keep belt supported before World Collider/Quantum.
    if (buildings.BeltEleriumShip.stateOffCount && !(buildings.DwarfWorldController.count || techIds["tech-quantum_manufacturing"].isResearched()) && resources.Elerium.storageRatio < 0.5) {
        trigger(buildings.BeltSpaceStation);
    }
}

// Want to run this in parallel with normal Starbase trigger, so it's here.
trigger.amount(buildings.BologniumShip, 1);

// Ships required for Second Contact (Gorddon Mission).
// Missions are only considered "unlocked" while they're clickable; this means it won't re-build them later if they're lost by another mission.
if (buildings.GorddonMission.isUnlocked()) {
    if (buildings.ScoutShip.count < 2) trigger(buildings.ScoutShip);
    if (buildings.CorvetteShip.count < 1) trigger(buildings.CorvetteShip);
}

let supportRed = false;
// Starting at the Andromeda scouting event: Keep Red Planet strongly supported, build fabrications, and cap cheap sources of knowledge cap/good knowledge cap using buildings.
if (buildings.ScoutShip.count >= 1 || buildings.CorvetteShip.isUnlocked()) {
    if (!_("Challenge", "fasting")) {
        // 26 to 30 should do the trick.
        if (buildings.RedFabrication.count < (_("Universe", "micro") ? 30 : 26)) {
            trigger(buildings.RedFabrication);
        }

        supportRed = true;
    }

    // Cap cheap knowledge and control stations, except post-impact OD and Cata CTFL.
    // Even if we don't need the knowledge anymore, quantum is worth it.
    // Also some stuff not needed in those runs.
    if (!isKnowledgeProdHardRun) {
        const knowledgeBuildings = [buildings.SpaceSatellite, buildings.BioLab, buildings.BlackholeFarReach, buildings.MoonObservatory];
        if (resources.Sun_Support.maxQuantity <= resources.Sun_Support.currentQuantity) {
            knowledgeBuildings.push(buildings.SunSwarmControl);
        }
        let triggered = 0;
        for (let building of knowledgeBuildings) {
            if (building.isUnlocked() && (building.cost?.Knowledge ?? 0) < resources.Knowledge.maxQuantity) {
                triggered++;
                trigger(building);
            }
        }

        // Make 27 of them! We're gonna need the Iridium for excavators and we might as well start stockpiling now.
        // Second priority after knowledge, though.
        // 17 space stations = 15 iron, 21 iridium, 0 elerium.
        if (!triggered && !snippetData?.hasTrait?.moon_iridium) {
            if (buildings.BeltSpaceStation.count < 12) {
                trigger(buildings.BeltSpaceStation);
            }
            //  && !resources.Furs.isDemanded() && !resources.Polymer.isDemanded()
            if (buildings.BeltIridiumShip.count < 21) {
                trigger(buildings.BeltIridiumShip);
            }
        }

        // And Vit Plants.
        trigger.amount(buildings.Alien1VitreloyPlant, 8);
    }

    // Stockpile Furs for the Consulate too so we can proceed immediately.
    if (!buildings.Alien1Consulate.count) {
        // Need to use game API because building might not be available yet.
        let consulateFurCost = poly.adjustCosts(game.actions.galaxy.gxy_alien1.consulate).Furs() ?? 0;
        if (typeof consulateFurCost === "number" && isFinite(consulateFurCost) && !isNaN(consulateFurCost)) {
            let embassyFurCost = buildings.GorddonEmbassy.count ? 0 : (buildings.GorddonEmbassy.cost?.Furs ?? 0);

            trigger.custom(resourceList({ Furs: consulateFurCost + embassyFurCost }));
        }
    }
}

// Truepath: Support red starting after our first Adamantite Mine.
if (buildings.TitanMine.count) {
    supportRed = true;
}

if (supportRed) {
    // If autoPower is off, this might be incorrect because the player is managing it. Trust them to do the right thing.
    if (settings.autoPower && buildings.RedFabrication.stateOffCount) {
        // Build "best" support. Arbitrarily chosen, this will keep around a ratio of 1.3 (26 spaceports / 20 control tower).
        // YMMV on how correct that ratio is, will depend on HC, in/out of micro universe and junk gene.
        // Of course, this whole snippet is a demonstration of what you _can_ do, not what you _should_ do...
        // Also it's possible to divide by zero and get a NaN. Fun stuff.
        let ratio = buildings.RedSpaceport.count / buildings.RedTower.count;
        if (isNaN(ratio) || ratio > 1.3) {
            trigger(buildings.RedTower);
        }
        else {
            trigger(buildings.RedSpaceport);
        }
    }
}

// Ships for Alien2 Mission (Tech Scav system). Same idea as Gorddon above.
if (buildings.Alien2Mission.isUnlocked()) {
    if (buildings.FrigateShip.count < 2) trigger(buildings.FrigateShip);
    // If the city tab is removed (OD post impact or Cata), I configure the replicator to kick in for Vitreloy instead.
    if (buildings.CruiserShip.count < 2 && (!game.global.settings.showCity || buildings.Alien1VitreloyPlant.count >= 5)) trigger(buildings.CruiserShip);
}

// Needs to be concurrent with excavators, so it's here.
if (buildings.ChthonianMission.isComplete()) {
    trigger.amount(buildings.MassDriver, _("Challenge", "no_crispr") ? 22 : 25);
}

// Build 9 Soul Attractors if we need to go into the vault, the gem hasn't dropped yet, and we're already in Alien2.
// And if the gem drops, this'll automatically cancel because of how these triggers work.
if (!game.global.tech['corrupt'] && buildings.Alien2Mission.isComplete() &&
    (
        (settings.prestigeType === "demonic") ||
        (settings.prestigeType === "ascension" &&
            (!isPillarFinished() || _("Challenge", "witch_hunter"))
        )
    )
) {
    if (!buildings.PitMission.isComplete()) trigger(buildings.PitMission);
    else if (!buildings.PitAssaultForge.isComplete()) trigger(buildings.PitAssaultForge);
    else if (!buildings.PitSoulForge.count) trigger(buildings.PitSoulForge);
    else if (buildings.PitSoulAttractor.count < 9) trigger(buildings.PitSoulAttractor);
}
