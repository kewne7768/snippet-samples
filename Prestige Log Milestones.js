// If you need access to something not in the definitions, you can add in a @ts-nocheck like this:
// @ts-nocheck
//
// These go in the script's overall state because this was originally an eval and I haven't bothered fixing it.
//
// Prestige log format needs to look something like:
// Reset: {resetType}, Species: {species}, Duration: {timeStamp} days, {eval:snippetData.milestonesResult?.str??'No milestones'}

// This will end up in snippetData.milestonesResult.str.
// It needs to be in another object so our getter only gets called when needed, instead of every tick.
// But we only have to make the Proxy one time.
const evalProxyData = once(() => {
    return {
        milestonesResult: {
            get str() {
                return state.milestonesAvail.map(m => state.milestones[m] ? m + ': ' + state.milestones[m] : '').filter(s => s !== '').join(', ');
            }
        }
    }
});
state.milestones = state.milestones || {};
let milestones = state.milestones;
state.milestonesAvail = ["tech-merchandising", "TouristCenter", "RedSpaceport", "tech-quantum_manufacturing", "TitanSpaceport", "TritonFOB", "TitanAIComplete", "TauColony", "TauRedOrbitalPlatform", "tech-space-whaling"];
state.milestonesAvail.forEach((name) => {
    if (!(name in milestones) && (buildings[name]?.count || techIds[name]?.isResearched()))
        milestones[name] = game.global.stats.days;
});

return evalProxyData;
