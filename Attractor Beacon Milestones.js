// When to activate milestones
const milestones = [
    buildings.BadlandsAttractor.isUnlocked(),
    buildings.BlackholeMassEjector.count >= 1,
    buildings.GatewayStarbase.count >= 1,
    buildings.GorddonEmbassy.count >= 1,
    techIds["tech-scarletite"].isResearched(),
];
const t4farmoffset = _("Universe", "antimatter") ? 6 : 24;
const numberAt = {
    t4farm: [30 + (Math.floor(t4farmoffset / 2)), 39 + (Math.floor(t4farmoffset / 1.5)), 66 + t4farmoffset, 66 + t4farmoffset, 0],
    //old:
    //t4farm: [36, 54, 64, 69, 0],
    t5micro: [60, 90, 111, 135, 150],
    pillarupgrade: [30, 33, 39, 45, 0],
    t4fallback: [24, 36, 45, 54, 0],
    t6fourstar: [45, 60, 75, 75, 84], // TODO: make micro and 3* variants
};
const softtriggerAt = {
    t4farm: [45, 60, 66 + 15 + t4farmoffset, 66 + 15 + t4farmoffset, 0],
};

// Bad runs, disable entirely even if other conditions are met
if (checkTypes.Challenge.fn("cataclysm") || checkTypes.Challenge.fn("orbit_decay") || checkTypes.Challenge.fn("truepath")) return stopRunning();

// Irrelevant runs, but user settings can still change
if (!["ascension", "demonic", "apotheosis"].includes(String(settings["prestigeType"]))) return;

// User forced max build/power for attractors to zero, let's not build any.
if (settings["bld_m_portal-attractor"] === 0) return;

// Try to categorize current run type
/** @type {(keyof numberAt|null)} runType */
let runType = null;
if (checkTypes.Universe.fn("micro") && checkTypes.Challenge.fn("no_plasmid")) {
    if (checkTypes.ResetType.fn("ascension") && checkTypes.RaceId.fn("species") !== checkTypes.RaceId.fn("custom")) {
        runType = "pillarupgrade";
    }
    else if (checkTypes.ResetType.fn("demonic") && checkTypes.RaceId.fn("species") === checkTypes.RaceId.fn("custom")) {
        runType = "t5micro";
    }
    else if (checkTypes.ResetType.fn("apotheosis") && checkTypes.RaceId.fn("species") === checkTypes.RaceId.fn("custom")) {
        runType = "t6fourstar";
    }
}
// 0*-2*
else if (checkTypes.Other.fn("rname") === "Numberbirb" && _("ResetType", "ascension") && game.alevel() < 4) {
    runType = "t4farm";
}
else if (_("ResetType", "ascension")) {
    runType = "t4fallback";
}
else if (checkTypes.ResetType.fn("apotheosis")) {
    runType = "t6fourstar";
}

if (!runType) return;

let firstFailed = milestones.findIndex(milestone => milestone === false);
// -1 means all reached, 0 means none reached, and we always want to subtract 1 unless they're all reached
let reachedMilestone = firstFailed === -1 ? milestones.length - 1 : (firstFailed - 1);
if (reachedMilestone < 0) return;

let amountToBuild = numberAt?.[runType]?.[reachedMilestone];
let softtrigger = softtriggerAt?.[runType]?.[reachedMilestone];
let pushing = false;
if (typeof amountToBuild === "number") {
    // Antimatter is slower paced, -6 seems to be OK from testing.
    if (_("Universe", "antimatter")) amountToBuild -= 6;

    if (buildings.BadlandsAttractor.count < amountToBuild) {
        trigger(buildings.BadlandsAttractor);
        pushing = true;
    }
    else if (typeof softtrigger === "number" && buildings.BadlandsAttractor.count < softtrigger) {
        pushing = true;
        if (resources.Stanene.currentQuantity >= buildings.BadlandsAttractor.cost.Stanene) {
            // Try to trigger the rest and get it clicked
            trigger(buildings.BadlandsAttractor);
        }
        else {
            // Preserve all resources, but do not trigger Stanene. Just preserve all we make naturally.
            trigger.custom(resourceList({
                Chrysotile: buildings.BadlandsAttractor.cost?.Chrysotile ?? 0,
                Aluminium: buildings.BadlandsAttractor.cost.Aluminium,
                Money: buildings.BadlandsAttractor.cost.Money,
                // Only hold on to Stanene, don't trigger it. Keeps other factory things flowing.
                Stanene: Math.min(resources.Stanene.currentQuantity, buildings.BadlandsAttractor.cost.Stanene),
            }), [buildings.BadlandsAttractor, buildings.BlackholeStargate]);
        }
        // Main effect of this soft-trigger:
        settings["production_w_Stanene"] = 750;
        settings["bld_w_portal-attractor"] = 10000;
    }
}

return {pushingBeacons: pushing};
