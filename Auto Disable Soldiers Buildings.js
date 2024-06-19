// Dead soldiers contribute to job stress/morale hit.
// This snippet disables/enables them as needed when there's too much dead soldiers.
// Doesn't touch buildings with extra functions.

// By rough priority order of which to disable, last ones get disabled first.
const buildingSoldierCount = {
    "Barracks": (_("TraitLevel", "chameleon") ? 1 : 2) + (_("ResearchComplete", "tech-bunk_beds") ? 1 : 0), 
    "RedSpaceBarracks": _("ResearchComplete", "tech-hammocks") ? 4 : 2,
    "ProximaCruiser": 3,
};
// Prefer Barracks > RedSpaceBarracks > ProximaCruiser to be enabled in that order.
// This is only for power purposes and doesn't affect autoBuild priority when its enabled.
const addOrder = ["Barracks", "RedSpaceBarracks", "ProximaCruiser"];

// Should be at least 5 away from each other to avoid hysteresis when turning off RedSpaceBarracks.
const targetDeadSoldiers = ui.number("min_dead_soldiers", "Min Dead Soldiers", 6, "Buildings will be turned on if dead soldiers fall below this number.");
const reduceAt = ui.number("max_dead_soldiers", "Max Dead Soldiers", 11, "Buildings will be turned off if dead soldiers go above this number. If any buildings are off, soldier building autoBuild will be disabled. Should be at least 5 higher than min to avoid flickering with Marine Garrison.");

// The game only updates some soldier data in the daily loop, so once a day is fine.
const computedTargets = daily(() => {
    let toggleables = {
        "Barracks": buildings.Barracks.stateOnCount,
        "RedSpaceBarracks": buildings.RedSpaceBarracks.stateOnCount,
        "ProximaCruiser": buildings.ProximaCruiser.stateOnCount,
    };

    // OD Red Garrisons have boot camp functions, should always be on. Don't manage it then, just let autoBuild do the trick and keep pumping them out even if our soldiers are dead.
    // It's the only way to get them back then!
    if (_("Challenge", "orbit_decay")) delete toggleables.RedSpaceBarracks;

    const deadCount = WarManager.deadSoldiers;
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
