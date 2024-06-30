if (resources.Slave.currentQuantity < resources.Slave.maxQuantity && resources.Money.rateOfChange >= (_("Challenge", "truepath") ? 150000 : 50000)) {
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

// completely untested
/*
let allowableMax = ui.number("assemble_max_pop", "Maximum population", -1, "Set to -1 for infinite.");
if (allowableMax < 0) allowableMax = Number.MAX_SAFE_INTEGER;
if (resources.Population.currentQuantity < Math.min(allowableMax, resources.Population.maxQuantity)) {
    if (buildings.TauCloning.isUnlocked()) {
        trigger(buildings.TauCloning);
    }
    else if (_("TraitLevel", "artifical")) {
        if (buildings.Assembly.isUnlocked()) {
            trigger(buildings.Assembly);
        }
        else if (buildings.RedAssembly.isUnlocked()) {
            trigger(buildings.RedAssembly);
        }
        else {
            trigger(buildings.TauAssembly);
        }
    }
}
*/
