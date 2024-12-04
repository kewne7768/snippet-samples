/**
 * @param {Action} building
 * @param {keyof typeof resources} resourceName
 * @param {number} maxAmount 
 */
function triggerToCost(building, resourceName, maxAmount) {
    if (building.isUnlocked() && building.cost[resourceName] < maxAmount) {
        trigger(building);
        return true;
    }
    return false;
}

if (settings["prestigeType"] === "apotheosis") {
    settings["res_min_storeElysanite"] = 5e9;
    settings["res_storage_o_Elysanite"] = true;

    // Low thermal collector prio until they are about to actually do something (this is a few techs beforehand to give it time to build)
    settings["bld_w_interstellar-thermal_collector"] = techIds["tech-ghost_traps"].isResearched() ? 100 : 1;

    // might as well build early
    if (buildings.BlackholeMassEjector.count >= 1) {
        trigger.amount(buildings.BlackholeMassEjector, 30);
        trigger.amount(buildings.RedMine, 30);
        trigger.amount(buildings.SpacePropellantDepot, 40);
        trigger.amount(buildings.GasStorage, 25);
    }

    if (resources.Soul_Gem.currentQuantity >= 300) {
        // Just trigger a bunch of crap at once while we got spare gems, we don't really care about the order or speed as long as it finishes...
        triggerToCost(buildings.NeutronCitadel, "Soul_Gem", (buildings.SpireTower.count > 20 ? 500 : 200));
        triggerToCost(buildings.PortalWarDroid, "Soul_Gem", 50);
        trigger.amount(buildings.PortalRepairDroid, 40);
        trigger.amount(buildings.CruiserShip, 4);
        trigger.amount(buildings.Dreadnought, 5);
    }

    if (buildings.RuinsArchaeology.count >= 2 && buildings.RuinsGuardPost.count >= 10) {
        // Pump fabs early, 15M wrought iron
        if (!triggerToCost(buildings.RedFabrication, "Wrought_Iron", 15e6)) {
            // Other expensive craftable buildings come after fabs
            triggerToCost(buildings.BlackholeMassEjector, "Mythril", 5e6);
            triggerToCost(buildings.RedFactory, "Brick", 10e6);
            triggerToCost(buildings.RedZiggurat, "Mythril", 30e6);
            triggerToCost(buildings.HellSwarmPlant, "Brick", 3e6);
            triggerToCost(buildings.ProximaCargoYard, "Mythril", 5e6);
            trigger.amount(projects.StockExchange, 80);
            // All the def platforms
            trigger.amount(buildings.StargateDefensePlatform, Math.ceil((500 * getPiracyMultiplier()) / 20));
        }

        // Other stuff
        triggerToCost(buildings.BadlandsAttractor, "Stanene", 25e9); // 25G
        trigger.amount(buildings.StargateDepot, 50); // for elerium
        trigger.amount(projects.RoidEject, 100);

        trigger.amount(buildings.LakeCoolingTower, 45);

        triggerToCost(buildings.Alien2ArmedMiner, "Soul_Gem", 50);

        // this will keep going with production
        if (buildings.MeditationChamber.isUnlocked() && buildings.MeditationChamber.cost.Furs < resources.Furs.rateOfChange) {
            trigger(buildings.MeditationChamber);
        }
    }

    if (buildings.SpireMechBay.count >= 1) {
        // Minimum needed to get script to reliably make titan mechs
        trigger.amount(buildings.SpirePurifier, 28);
        trigger.amount(buildings.SpirePort, 15);
        trigger.amount(buildings.SpireBaseCamp, 12);
        // power
        triggerToCost(buildings.HellSwarmPlant, "Brick", 10e6);
        // some extra knowledge for later, might as well prep now
        triggerToCost(buildings.GorddonSymposium, "Brick", 10e6);
        triggerToCost(buildings.Alien1VitreloyPlant, "Aerogel", 10e6);

        // knowledge
        if (projects.SuperCollider.count < 200) {
            trigger.amount(projects.SuperCollider, 200);
            settings["autoGenetics"] = false; // avoid weird knowledge crap
        }
    }

    // Force-build waygate after 15 mechbays
    if (buildings.SpireMechBay.count >= 15 && !haveTech("waygate", 2)) {
        trigger.amount(buildings.SpireWaygate, 10);
    }

    // Progressively increase demon lord pressure after floor 10, and work on some fun buildings
    if (buildings.SpireTower.count >= 10) {
        settings["mechWaygatePotential"] = 0 + ((buildings.SpireTower.count - 10) / 45);

        triggerToCost(buildings.BadlandsAttractor, "Stanene", 250e9); // 250G

        triggerToCost(buildings.PitSoulAttractor, "Aerogel", 50e6);
        triggerToCost(buildings.RuinsArcology, "Nanoweave", 20e6);
        trigger.amount(projects.StockExchange, 100);
    }

    // Once we get in eden
    if (buildings.AsphodelEncampment.count >= 1) {
        settings["magicAlchemyManaUse"] = 0; // just doesn't make sense anymore
        trigger(techIds["tech-ethereal_weapons"]); // Gates everything worth a damn
        // Stuff to build ASAP when unlocked
        trigger.amount(buildings.ElysiumMine, 10);
        trigger.amount(buildings.ElysiumArchive, 1); // 1 is needed for techs
    }

    // TODO: minmax ambush/raid/siege

    // TODO: Reserve craft mats from spire floor ~30
    /*
    ~3 pillboxes
    ~10-12 elysanite mine
    10 north/south pier
    soul gems for ~12 spirit vacuum
    */

    // Stockpile Elysium near end, when it takes longer to stockpile Elysium than it takes to drain energy
    if (buildings.IsleSpiritVacuum.count) {
        const elysanitePiece = evolve.adjustCosts(evolve.actions.eden.eden_palace.infuser).Elysanite(); // 112.5M, 25 parts
        const parts = 25 - buildings.PalaceInfuser.count;
        const elysaniteTotalCost = elysanitePiece * parts;
        if (evolve.global?.eden?.palace?.energy ?? Infinity > 0) {
            const drainage = 1653439 * buildings.IsleSpiritVacuum.stateOnCount * (1 + (0.08 * buildings.IsleSpiritBattery.stateOnCount));
            const secondsLeft = (evolve.global?.eden?.palace?.energy ?? 1e20) / drainage;
            //console.info("Seconds left: ", secondsLeft, succ);
            if (Number.isFinite(secondsLeft) && elysaniteTotalCost / secondsLeft > resources.Elysanite.rateOfChange) {
                trigger.custom(resourceList({
                    Elysanite: elysaniteTotalCost
                }), [
                    buildings.PalaceInfuser
                ]);

                settings["bateden-spirit_vacuum"] = false;
                settings["bateden-spirit_battery"] = false;
            }
        }
        else {
            settings["bateden-spirit_vacuum"] = false;
            settings["bateden-spirit_battery"] = false;

            trigger.amount(buildings.PalaceConduit, 25);
            trigger.amount(buildings.PalaceInfuser, 25);
            trigger.amount(buildings.PalaceTomb, 10);
            // Just so it doesn't get spent...
            if (elysaniteTotalCost > 0) {
                trigger.custom(resourceList({
                    Elysanite: elysaniteTotalCost
                }), [
                    buildings.PalaceInfuser,
                ]);
            }
        }
    }
}
