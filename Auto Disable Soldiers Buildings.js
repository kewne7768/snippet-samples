// Dead soldiers contribute to job stress/morale hit.
// This snippet disables/enables them as needed when there's too much dead soldiers.
// Doesn't touch buildings with extra functions.

const highPopScale = traitVal('high_pop', 0, 1);
// By rough priority order of which to disable, last ones get disabled first.
const buildingSoldierCount = {
    "Barracks": Math.min((_("TraitLevel", "chameleon") ? 1 : 2) + (_("ResearchComplete", "tech-bunk_beds") ? 1 : 0) - (_("TraitLevel", "grenadier") ? 1 : 0), 1) * highPopScale,
    "RedSpaceBarracks": (_("ResearchComplete", "tech-hammocks") ? 4 : 2) * highPopScale / (_("TraitLevel", "grenadier") ? 2 : 1),
    "ProximaCruiser": ((_("TraitLevel", "grenadier") ? 2 : 3) - (_("Challenge", "fasting") ? 1 : 0)) * highPopScale,
};

// Prefer Barracks > RedSpaceBarracks > ProximaCruiser to be enabled in that order.
// This is only for power purposes and doesn't affect autoBuild priority when its enabled.
const addOrder = ["Barracks", "RedSpaceBarracks", "ProximaCruiser"];

// Should be at least 5 away from each other to avoid hysteresis when turning off RedSpaceBarracks.
const targetDeadSoldiers = ui.number("min_dead_soldiers", "Min Dead Soldiers", 6, "Buildings will be turned on if dead soldiers fall below this number.") * highPopScale;
const reduceAt = ui.number("max_dead_soldiers", "Max Dead Soldiers", 11, "Buildings will be turned off if dead soldiers go above this number. If any buildings are off, soldier building autoBuild will be disabled. Should be at least 5 higher than min to avoid flickering with Marine Garrison.") * highPopScale;
const hellSoldierLimit = ui.number("hell_soldiers", "Hell Soldier Limit", -1, "If more than this number of soldiers can be assigned to hell, excess buildings will be disabled. No effect in Truepath or if set to <=0.");

// The game only updates some soldier data in the daily loop, so once a day is fine.
const computedTargets = daily(() => {
    // Can only work with valid numbers.
    if (reduceAt < targetDeadSoldiers || targetDeadSoldiers <= 0) return false;

    let toggleables = {
        "Barracks": buildings.Barracks.stateOnCount,
        "RedSpaceBarracks": buildings.RedSpaceBarracks.stateOnCount,
        "ProximaCruiser": buildings.ProximaCruiser.stateOnCount,
    };

    // OD Red Garrisons have boot camp functions, should always be on. Don't manage it then, just let autoBuild do the trick and keep pumping them out even if our soldiers are dead.
    // It's the only way to get them back then!
    // In fasting, garrisons are unusable and should be left managed by user overrides/etc.
    if (_("Challenge", "orbit_decay") || _("Challenge", "fasting")) delete toggleables.RedSpaceBarracks;

    // We need to work with the *target* hell soldier count, not how many there actually are.
    // Major difference is: We need to account for dead soldiers that would go to hell immediately, instead of looking at the current hell number.
    // Otherwise this whole setup will break very badly at Nanoweave Hammocks research.
    // Ex: User limit is 256, min 5 dead soldiers, current max 500 soldiers, 50 dead, 60 crew, 10 hellHomeGarrison.
    // Current hell garrison size: (500 - 50 - 60 - 10) = 380 -> cool but useless info!
    // Intended soldier cap: 256 + 60 + 10 + targetDeadSoldiers -> 331
    // Need to turn off 169 slots. The dead soldiers will "heal" as a nice bonus.
    let hellFakeDeads = 0;
    if (game.global.portal?.fortress && hellSoldierLimit > 0) {
        const intendedSoldierCap = hellSoldierLimit + WarManager.crew + settings.hellHomeGarrison + targetDeadSoldiers;
        const excessSoldiers = WarManager.max - intendedSoldierCap;
        // If negative, we are nowhere near the limit just yet.
        if (excessSoldiers > 0) {
            hellFakeDeads = excessSoldiers;
        }
   }

    const deadCount = Math.max(WarManager.deadSoldiers, hellFakeDeads);
    if (deadCount < targetDeadSoldiers) {
        // Can turn on more buildings. Let's see how many...
        let newDeadCount = deadCount;
        let changed = false;
        do {
            changed = false;
            // Work forwards for adding.
            for (let i = 0; i < addOrder.length; ++i) {
                let key = addOrder[i];
                let buildingMax = buildings[key].count;
                // Check for both defined and < max
                if (key in toggleables && toggleables[key] < buildingMax) {
                    toggleables[key]++;
                    newDeadCount += buildingSoldierCount[key];
                    changed = true;
                    break;
                }
            }
        } while (newDeadCount < targetDeadSoldiers && changed);
        // Couldn't change enough? Means we're all good! Let normal autoPower handle it, and turn autoBuild on.
        if (newDeadCount < targetDeadSoldiers) {
            return true;
        }
    }
    else if (deadCount > reduceAt) {
        // Can turn off more buildings. Let's see how many...
        let newDeadCount = deadCount;
        let changed = false;
        do {
            changed = false;
            // Work backwards for removal.
            for (let i = addOrder.length - 1; i >= 0; i--) {
                let key = addOrder[i];
                // Check for both defined and >0
                if (toggleables[key]) {
                    toggleables[key]--;
                    newDeadCount -= buildingSoldierCount[key];
                    changed = true;
                    break;
                }
            }
        } while (newDeadCount > reduceAt && changed);
    }
    else {
        // Equal. Just keep the current numbers.
    }
    //console.info("New suggested state: %o", toggleables);
    return toggleables;
});

// Evolution phase null
if (!computedTargets) return;

if (computedTargets === true) {
    // No soldier limitation in effect, can build more, too. Don't do anything.
}
else {
    // In turning-off-buildings mode.
    for (const [bKey, newCount] of Object.entries(computedTargets)) {
        /** @type {Action} building */
        let building = buildings[bKey];
        // Turn off autoBuild for buildings we manage
        settings[`bat${building.settingId}`] = false;
        // Turn off autoPower too
        settings[`bld_s_${building.settingId}`] = false;
        // Set power ourselves
        let adjustCount = newCount - building.stateOnCount;
        if (adjustCount !== 0) {
            building.tryAdjustState(adjustCount);
        }
    }
}
