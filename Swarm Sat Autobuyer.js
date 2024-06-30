// This is a little messy because the game doesn't give us a way to read creep from the game data
// Emulating it (HC, traits, governor, etc) is a massive pain...
// So we make an approximation.
// Also, doing it like this is a fun demo.

// Disable in Inflation
if (_("Challenge", "inflation")) return stopRunning();

/*
once(() => {
    if (!logIgnore.includes("swarm_satellite")) { logIgnore.push("swarm_satellite"); }
});
*/

let maxCost = ui.number("maxCost", "Maximum Money cost per sat", 10000);
// Ugly hack to stop it from spending excess resources early.
// This buyer doesn't respect autoBuild weightings or anything so it can eat your Iridium stockpile early.
// Of course, you can just do this with an override on the max cost, too!
if (resources.Iridium.currentQuantity < 10000) return;

// Not yet available for purchase.
if (!buildings.SunSwarmSatellite.vue) return;

if((!settings["batspace-swarm_satellite"] || !settings["autoBuild"]) || (buildings.SunSwarmSatellite.count >= resources.Sun_Support.maxQuantity)) {
    maxCost = 1;
}

if (buildings.SunSwarmSatellite.cost.Money > maxCost) {
    return;
}

// Need to use the game API directly so we can use offsets. Offset needs to be calculated to the debug data's last update.
const building = game.actions.space.spc_sun.swarm_satellite;
const starterCosts = poly.adjustCosts(game.actions.space.spc_sun.swarm_satellite);
const maxCount = 200 + (resources.Sun_Support.maxQuantity - buildings.SunSwarmSatellite.count); // Only overbuild 200 sats of support, after that it's negative and nothing happens.

let bought = 0;
for (let i = 0; i < maxCount; ++i) {
    let resourceCosts = {};
    let affordable = true;
    Object.keys(starterCosts).forEach(rk => {
        let cost = starterCosts[rk](i);
        if (cost < 1) return; // It's free!
        resourceCosts[rk] = cost;
        if (cost > resources[rk].currentQuantity || rk === "Money" && cost > maxCost) {
            affordable = false;
        }
    });
    if (affordable) {
        Object.keys(resourceCosts).forEach(rk => {
            resources[rk].currentQuantity -= resourceCosts[rk];
        });
        // Don't use the game's builtin multi-buy for this.
        if (i === 0) KeyManager.set(false, false, false);
        buildings.SunSwarmSatellite.vue.action();
        bought++;
        //console.info("Bought %d for %o", bought + buildings.SunSwarmSatellite.count, resourceCosts);
    }
    else {
        break;
    }
}

// If we managed to buy any, don't allow autoBuild of swarm sats for one tick.
if (bought) {
    settings["batspace-swarm_satellite"] = false;
    GameLog.logSuccess("multi_construction", `Swarm Sat Autobuyer: Swarm Satellite (${bought}) constructed.`, ['queue', 'building_queue']);
}
