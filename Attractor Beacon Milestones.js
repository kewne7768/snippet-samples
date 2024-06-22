// When to activate milestones
const milestones = [
    buildings.BadlandsAttractor.isUnlocked(),
    buildings.BlackholeMassEjector.count >= 1,
    buildings.GatewayStarbase.count >= 1,
    buildings.GorddonEmbassy.count >= 1,
    techIds["tech-scarletite"].isResearched(),
];
const numberAt = {
    t4farm: [20, 41, 52, 60, 66],
    t5micro: [30, 41, 52, 66, 81],
    pillarupgrade: [21, 33, 39, 45, 0],
};

// Bad runs, disable entirely even if other conditions are met
if (checkTypes.Challenge.fn("cataclysm") || checkTypes.Challenge.fn("orbit_decay") || checkTypes.Challenge.fn("truepath")) return stopRunning();

// Irrelevant runs, but user settings can still change
if (!["ascension", "demonic"].includes(String(settings["prestigeType"]))) return;

// Try to categorize current run type
let runType = null;
if (checkTypes.Universe.fn("micro") && checkTypes.Challenge.fn("no_plasmid")) {
    if (checkTypes.ResetType.fn("ascension") && checkTypes.RaceId.fn("species") !== checkTypes.RaceId.fn("custom")) {
        runType = "pillarupgrade";
    }
    else if (checkTypes.ResetType.fn("demonic") && checkTypes.RaceId.fn("species") === checkTypes.RaceId.fn("custom")) {
        runType = "t5micro";
    }
}
else if (checkTypes.Other.fn("rname") === "Numberbirb") {
    runType = "t4farm";
}

if (!runType) return;

let firstFailed = milestones.findIndex(milestone => milestone === false);
// -1 means all reached, 0 means none reached, and we always want to subtract 1 unless they're all reached
let reachedMilestone = firstFailed === -1 ? milestones.length - 1 : (firstFailed - 1);
if (reachedMilestone < 0) return;

let amountToBuild = numberAt?.[runType]?.[reachedMilestone];
if (typeof amountToBuild === "number" && buildings.BadlandsAttractor.count < amountToBuild) {
    trigger(buildings.BadlandsAttractor);
}
