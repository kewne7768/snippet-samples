// Custom triggers with more logic than possible in the normal system.
// Note that there can be multiple triggers started this way active at once.
// It'll behave similar to when you manually queue conflicting buildings.
// But in most of these samples that's good because they don't use the same resources/resource types (or not much).
const isKnowledgeProdHardRun = (_("Challenge", "orbit_decay") && game.global.race.orbit_decayed) || _("Challenge", "cataclysm");

// Ships required for Second Contact (Gorddon Mission).
// Missions are only considered "unlocked" while they're clickable; this means it won't re-build them later if they're lost by another mission.
if (buildings.GorddonMission.isUnlocked()) {
    if (buildings.ScoutShip.count < 2) trigger(buildings.ScoutShip);
    if (buildings.CorvetteShip.count < 1) trigger(buildings.CorvetteShip);
}

// Starting at the Embassy: Keep Red Planet strongly supported, build fabrications, and cap cheap sources of knowledge cap/good knowledge cap using buildings.
if (buildings.GorddonMission.isComplete()) {
    // 26 to 30 should do the trick.
    if (buildings.RedFabrication.count < (_("Universe", "micro") ? 30 : 26)) {
        trigger(buildings.RedFabrication);
    }

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

    // Cap cheap knowledge and control stations, except post-impact OD and Cata CTFL.
    // Even if we don't need the knowledge anymore, quantum is worth it.
    if (!isKnowledgeProdHardRun) {
        const knowledgeBuildings = [buildings.SpaceSatellite, buildings.BioLab, buildings.BlackholeFarReach, buildings.MoonObservatory];
        if (resources.Sun_Support.maxQuantity <= resources.Sun_Support.currentQuantity) {
            knowledgeBuildings.push(buildings.SunSwarmControl);
        }
        for (let building of knowledgeBuildings) {
            if (building.isUnlocked() && (building.cost?.Knowledge??0) < resources.Knowledge.maxQuantity) {
                trigger(building);
            }
        }
    }
}

// Ships for Alien2 Mission (Tech Scav system). Same idea as Gorddon above.
if (buildings.Alien2Mission.isUnlocked()) {
    if (buildings.FrigateShip.count < 2) trigger(buildings.FrigateShip);
    // If the city tab is removed (OD post impact or Cata), I configure the replicator to kick in for Vitreloy instead.
    if (buildings.CruiserShip.count < 2 && (!game.global.settings.showCity || buildings.Alien1VitreloyPlant.count >= 5)) trigger(buildings.CruiserShip);
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
