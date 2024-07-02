// Run Trait Assigner
// Nothing useful is here, this is to set up snippetData for other snippets.
// In an eval, you check check for the presence of a trait via:
// snippetData?.hasTrait?.stellar_engine_low_value
// Note overrides are wrong for one tick on page refresh. If this is super important, take the safe option when snippetData?.hasTrait does not exist at all.

/* Trait list:

- stellar_engine_low_value: Not worth putting effort into beefing up the Stellar Engine.
- fabrications_low_value: Not worth building Fabrications highly
- replicate_andromeda: The answer to all your Andromeda needs is "use replicator".
- specialized: Non-standard run that should not have most triggers active.
- stocks: Build lots of Stock Exchanges because we're ever-short on cash.
- droid_coal: Don't over-stockpile Adamantite, instead, try to focus on Coal production for more factories.
- biodomes_good: Want lots of Biodomes.
- global_prod_high: Focus more on global production buffs than usual.
*/

if (game.global.race.species === "protoplasm") return;

return once(() => {
    let decidedType = "";
    /** @type {("specialized"|"stellar_engine_low_value"|"fabrications_low_value"|"replicate_andromeda"|"stocks"|"droid_coal"|"biodomes_good"|"global_prod_high")[]} decidedTraits */
    let decidedTraits = [];

    // More specific first.
    // Micro pillar upgrade run: in micro, 4*, Ascension, not yet 4* pillared, not on custom, pillared but below 4*.
    if (_("Universe", "micro") && game.alevel() >= 5 && settingsRaw.prestigeType === "ascension" && game.global.race.species !== "custom" && game.global.pillars[game.global.race.species] && !isPillarFinished()) {
        decidedType = "pillarupgrade";
        decidedTraits.push("stellar_engine_low_value");
    }
    // T4 Farm run. Not AM, custom, 2* or below.
    else if (!_("Universe", "antimatter") && game.alevel() <= 3 && settingsRaw.prestigeType === "ascension" && game.global.race.species === "custom") {
        decidedType = "t4farm";
        decidedTraits.push("stellar_engine_low_value", "stocks", "droid_coal", "biodomes_good", "global_prod_high");
    }
    // Challenge run.
    else if (_("Challenge", "lone_survivor")) {
        decidedType = "ls";
        decidedTraits.push("specialized", "nocity");
    }
    else if (_("Challenge", "cataclysm")) {
        decidedType = "cataclysm";
        decidedTraits.push("specialized", "biodomes_good");
    }
    else if (_("Challenge", "orbit_decay")) {
        if (game.alevel() === 2) { // 1*
            decidedType = "odfarm";
        }
        decidedTraits.push("specialized", "biodomes_good", "replicate_andromeda");
    }

    const hasTrait = (trait) => {
        return decidedType === trait || decidedTraits.includes(trait);
    };

    return {
        runType: decidedType,
        runTraits: decidedTraits,
        hasTrait: new Proxy(hasTrait, {get(trg, name) { return trg(name); }}),
    }
});
