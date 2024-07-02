// If you need access to something not in the definitions, you can add in a @ts-nocheck like this:
// @ts-nocheck
// Prestige log format needs to look something like:
// Reset: {resetType}, Species: {species}, Duration: {timeStamp} days, {eval:snippetData.milestonesResult?.str??'No milestones'}

// This will end up in snippetData.milestonesResult.str.
// It needs to be in another object so our getter only gets called when needed, instead of every tick.
// But we only have to make the Proxy one time.
const evalProxyData = once(() => {
    // Load state from ui var.
    if (!snippetState.milestones) {
        let loadState = ui.get("milestonePersist");
        if (typeof loadState === "object" && loadState && loadState.run === game.global.stats.reset) {
            snippetState.milestones = loadState.m;
        }
        else {
            snippetState.milestones = {};
        }
        if (state.milestones) snippetState.milestones = state.milestones;
    }

    // Register with the prestige DB
    if (typeof PrestigeDBManager !== "undefined" && typeof PrestigeDBManager.registerHook === "function") {
        PrestigeDBManager.registerHook("milestones", () => snippetState.milestones)
    }

    return {
        milestonesResult: {
            get str() {
                return [...specialMilestones, ...milestonesAvail].map(m => snippetState.milestones[m] ? m + ': ' + snippetState.milestones[m] : '').filter(s => s !== '').join(', ');
            }
        },
        milestones: snippetState.milestones,
    }
});
const specialMilestones = ["Womlings"];
/** @type {(keyof buildings|TechIdKey)[]} state.milestonesAvail */
const milestonesAvail = [
    "tech-merchandising",
    "TouristCenter",
    "RedSpaceport",
    "tech-quantum_manufacturing",
    "AlphaStarport",
    "BlackholeFarReach",
    "BlackholeMassEjector",
    "BlackholeStargateComplete",
    "GorddonEmbassy",
    "Alien2Foothold",
    "Dreadnought",
    "ChthonianMission",
    "RuinsArchaeology",
    "TitanSpaceport",
    "TritonFOB",
    "TitanAIComplete",
    "TauColony",
    "TauRedOrbitalPlatform",
    "tech-space-whaling",
];
if (game.global.race.servants && !('Womlings' in snippetState.milestones)) {
    snippetState.milestones.Womlings = game.global.stats.days;
    ui.set("milestonePersist", { run: game.global.stats.reset, m: snippetState.milestones });
}
milestonesAvail.forEach((name) => {
    if (!(name in snippetState.milestones) && (buildings[name]?.count || techIds[name]?.isResearched())) {
        snippetState.milestones[name] = game.global.stats.days;
        ui.set("milestonePersist", { run: game.global.stats.reset, m: snippetState.milestones });
    }
});

return evalProxyData;
