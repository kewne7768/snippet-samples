if (resources.Slave.currentQuantity < resources.Slave.maxQuantity && resources.Money.rateOfChange >= (_("Challenge", "truepath") ? 150000 : 50000)) {
    trigger(buildings.SlaveMarket);
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
