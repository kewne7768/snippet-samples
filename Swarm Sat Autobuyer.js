// This is a little messy because the game doesn't give us a way to read creep from the game data
// Emulating it (HC, traits, governor, etc) is a massive pain...
// So we make an approximation.
// Also, doing it like this is a fun demo.

// Disable in Inflation
if (_("Challenge", "inflation")) return stopRunning();

once(() => {
    if (!logIgnore.includes("swarm_satellite")) { logIgnore.push("swarm_satellite"); }
});

let maxCost = ui.number("maxCost", "Maximum Money cost per sat", 10000);
// Ugly hack. Of course, you can just do this with an override, too!
if (resources.Iridium.currentQuantity < 10000) return;

const howMany = () => {
    // We have to be really defensive because losing quantum effect when we have 10k+ sats can result in very funny numbers.
    // Everything coming from calculation is NaN-checked.

    // We respect the autoBuild toggle for swarm sats by capping cost to 1.
    // Still gonna get the free ones even if the user doesn't want autoBuild, no reason not to.
    // Also the case if we have too much sats.
    if((!settings["batspace-swarm_satellite"] || !settings["autoBuild"]) || (buildings.SunSwarmSatellite.count >= resources.Sun_Support.maxQuantity)) {
        maxCost = 1;
    }
    const nIncrease = 100; // Somewhat arbitrary value: try to check for 100+ sats
    const altsToAttempt = [1000, 500, 250];

    // We need both the current cost and the one from 100 in the future to calculate cost creep.
    // But, in some cases, we can exit early.
    let currentCost = poly.adjustCosts(game.actions.space.spc_sun.swarm_satellite, 0).Money()
    if (isNaN(currentCost) || currentCost >= maxCost) { return 0; }

    // Can't read creep from game data, guess by seeing what the current cost & 100 in the future is.
    let increaseCost = poly.adjustCosts(game.actions.space.spc_sun.swarm_satellite, nIncrease).Money()

    // If numbers get really out of whack, we might end up in NaN territory. This also applies if the numbers are zero, but free is good.
    if (isNaN(increaseCost)) { return 0; }

    // If the cost at 100+ is free.
    if (increaseCost < maxCost) {
        for (let attempt of altsToAttempt) {
            increaseCost = poly.adjustCosts(game.actions.space.spc_sun.swarm_satellite, attempt).Money()
            if (!isNaN(increaseCost) && increaseCost < maxCost) {
                return attempt;
            }
        }
        return nIncrease;
    }

    // Base cost too low, most likely free, so this won't work right, but we know we can't buy 100.
    // With the base cost set at nothing we can't calculate the cost creep.
    if (currentCost < 0.001) return 1;

    let creepRatio = Math.pow(increaseCost / currentCost, (1 / nIncrease));
    if (isNaN(creepRatio)) return 0;
    if (creepRatio < 1.005) creepRatio = 1.005;

    let approxBuyable = Math.floor(Math.log(maxCost / currentCost) / Math.log(creepRatio));
    if (approxBuyable > 0) {
        console.info("Calculated: %o approxBuyable, %o creepRatio, %o currentCost, %o increaseCost", approxBuyable, creepRatio, currentCost, increaseCost);
    }

    // Possible result of rounding. If we get here we can always buy at least 1 swarm sat.
    if (approxBuyable <= 0) return 1;
    return approxBuyable;
};
let count = howMany();
//console.info("How many: %o", count);
if (!isNaN(count) && count > 0 && isFinite(count)) {
    for (let m of KeyManager.click(count)) {
        buildings.SunSwarmSatellite.click();
    }
}
