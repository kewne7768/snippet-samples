if (resources.Slave.currentQuantity < resources.Slave.maxQuantity && resources.Money.rateOfChange >= (_("Challenge", "truepath") ? 100000 : 50000)) {
    let tryBuy = Math.max(resources.Slave.maxQuantity - resources.Slave.currentQuantity, 0);
    for (let i = 0; i < tryBuy; ++i) {
        if (buildings.SlaveMarket.click()) {
            resources.Slave.currentQuantity++;
        }
        else {
            trigger(buildings.SlaveMarket);
            break;
        }
    }
}

// Trigger or multibuy up to 15 horseshoes worth
const horseshoeTarget = 15;
if (_("TraitLevel", "hooved") && resources.Horseshoe.currentQuantity < horseshoeTarget && (resources.Horseshoe.isDemanded() || (buildings.RedSpaceport.count))) {
    let tryBuy = Math.max(horseshoeTarget - resources.Horseshoe.currentQuantity, 0);
    for (let i = 0; i < tryBuy; ++i) {
        if (buildings.ForgeHorseshoe.click()) {
            resources.Horseshoe.currentQuantity++;
        }
        else {
            trigger(buildings.ForgeHorseshoe);
            break;
        }
    }
}

// Set up triggers for early pop assembly (builtin build function will handle it after)
if (game.global.race.artifical && buildings.Assembly.isUnlocked() && resources.Population.currentQuantity < 50 && false) {
    trigger.amount(buildings.Assembly, resources.Population.maxQuantity);
}
