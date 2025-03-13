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

/**
 * @param {Action} building
 * @param {keyof typeof resources} resourceName
 * @param {number} maxAmount 
 */
function limitBuyToCost(building, resourceName, maxAmount) {
    if (building.isUnlocked() && building.cost[resourceName] > maxAmount) {
        settings["bat" + building.settingId] = false;
    }
}

if (settings["prestigeType"] === "apotheosis") {
    trigger(buildings.PitAssaultForge);
    trigger.amount(buildings.PitSoulAttractor, 9);

    settings["res_min_storeBolognium"] = 5e9;
    settings["res_min_storeVitreloy"] = 5e9;
    settings["res_min_storeOrichalcum"] = 5e9;
    settings["res_min_storeElysanite"] = 5e9;
    settings["res_storage_o_Elysanite"] = true;

    settings["bld_m_eden-asphodel_harvester"] = 40;
    settings["bld_m_eden-research_station"] = 30;
    //settings["bld_m_eden-bliss_den"] = 10;

    // Low thermal collector prio until they are about to actually do something (this is a few techs beforehand to give it time to build)
    settings["bld_w_interstellar-thermal_collector"] = techIds["tech-ghost_traps"].isResearched() ? 100 : 1;

    if (techIds["tech-quantum_manufacturing"].isResearched()) {
        trigger.amount(buildings.RedLivingQuarters, 30);
        trigger.amount(buildings.RedFabrication, 20);
        trigger.amount(buildings.AlphaMiningDroid, 16);
    }

    // why is this here
    if (buildings.BlackholeStargate.isUnlocked()) {
        trigger.amount(buildings.BlackholeStargate, 200);
    }
    if (buildings.GorddonEmbassy.isUnlocked()) {
        trigger.amount(buildings.BadlandsSensorDrone, 40);
    }
    if (buildings.Dreadnought.isUnlocked()) {
        trigger.amount(buildings.Dreadnought, 2);
    }

    // might as well build early
    if (buildings.BlackholeMassEjector.count >= 1) {
        if (!_("Universe", "magic")) {
            trigger.amount(buildings.BlackholeMassEjector, 30);
        }
        // to boost quantum a bit now, proper capped will be later
        trigger.amount(buildings.NeutronCitadel, 7);
        trigger.amount(buildings.RedMine, 30);

        trigger.amount(buildings.BadlandsSensorDrone, 30);

        // TODO move this elsewhere
        trigger.amount(buildings.NebulaNexus, 7);
        trigger.amount(buildings.NebulaHarvester, 4);
        trigger.amount(buildings.NebulaEleriumProspector, 10);

        // get that rng event flowing
        trigger.amount(buildings.ScoutShip, 1);
    }

    if (resources.Soul_Gem.currentQuantity >= 300) {
        // Just trigger a bunch of crap at once while we got spare gems, we don't really care about the order or speed as long as it finishes...
        triggerToCost(buildings.NeutronCitadel, "Soul_Gem", (buildings.SpireTower.count > 20 ? 500 : 200));
        triggerToCost(buildings.PortalWarDroid, "Soul_Gem", 50);
        trigger.amount(buildings.PortalRepairDroid, 40);
        trigger.amount(buildings.CruiserShip, 4);
        trigger.amount(buildings.Dreadnought, 5);
    }

    trigger.amount(buildings.RuinsGuardPost, 20);
    if (buildings.RuinsArchaeology.count >= 2 && (buildings.RuinsGuardPost.count >= 10 || techIds["tech-scarletite"].isResearched())) {
        // Pump fabs early, 25M wrought iron
        if (!triggerToCost(buildings.RedFabrication, "Wrought_Iron", 25e6)) {
            // Other expensive craftable buildings come after fabs
            if (!_("Universe", "magic")) {
                triggerToCost(buildings.BlackholeMassEjector, "Mythril", 1e6);
            }
            triggerToCost(buildings.RedFactory, "Brick", 10e6);
            triggerToCost(buildings.AlphaMegaFactory, "Brick", 10e6);
            triggerToCost(buildings.RedExoticLab, "Mythril", 40e6);
            triggerToCost(buildings.RedZiggurat, "Mythril", 40e6);
            trigger.amount(buildings.BeltIronShip, 30);
            if (buildings.BeltIronShip.count >= 30) {
                triggerToCost(buildings.HellSwarmPlant, "Brick", 3e6);
            }
            triggerToCost(buildings.ProximaCargoYard, "Mythril", 5e6);
            triggerToCost(buildings.BootCamp, "Brick", 20e6);
            trigger.amount(projects.StockExchange, 80);
            // All the def platforms
            trigger.amount(buildings.StargateDefensePlatform, Math.ceil((500 * getPiracyMultiplier()) / 20));
        }

        // Other stuff
        trigger.amount(buildings.RuinsVault, 2);
        trigger.amount(buildings.SpacePropellantDepot, 40);
        trigger.amount(buildings.GasStorage, 25);
        triggerToCost(buildings.BadlandsAttractor, "Stanene", 10e9); // 10G
        trigger.amount(buildings.StargateDepot, 50); // for elerium
        trigger.amount(projects.RoidEject, 50);

        trigger.amount(buildings.GateTurret, 25);

        trigger.amount(buildings.LakeHarbor, 25);
        trigger.amount(buildings.LakeCoolingTower, 25);
        const funShips = buildings.LakeBireme.count + buildings.LakeTransport.count;
        if (funShips < buildings.LakeHarbor.count && funShips < 25) {
            if (buildings.LakeBireme.count < buildings.LakeTransport.count) {
                trigger(buildings.LakeBireme);
            }
            else {
                trigger(buildings.LakeTransport);
            }
        }

        if (!triggerToCost(buildings.RuinsHellForge, "Soul_Gem", 15) && techIds["tech-scarletite"].isResearched()) {
            if (buildings.GateTurret.count >= 25) {
                trigger.amount(buildings.GateWestTower, buildings.GateWestTower.gameMax);
                trigger.amount(buildings.GateEastTower, buildings.GateEastTower.gameMax);
            }
            if (resources.Soul_Gem.currentQuantity > 25) {
                // This is here as a fallback so we can start getting some sweet infernite
                trigger.amount(buildings.PortalRepairDroid, 20);
                triggerToCost(buildings.Alien2ArmedMiner, "Soul_Gem", 50);
            }
        }

        // this will keep going with production
        if (buildings.MeditationChamber.isUnlocked() && buildings.MeditationChamber.cost.Furs < resources.Furs.rateOfChange) {
            trigger(buildings.MeditationChamber);
        }
    }

    if (buildings.SpireMechBay.count >= 1) {
        // Minimum needed to get script to reliably make titan mechs + bit more
        trigger.amount(buildings.SpirePurifier, 28);
        trigger.amount(buildings.SpirePort, 15);
        trigger.amount(buildings.SpireBaseCamp, 12);
        // power
        trigger.amount(projects.RoidEject, 100);
        triggerToCost(buildings.HellSwarmPlant, "Brick", 10e6);
        triggerToCost(buildings.Alien1VitreloyPlant, "Aerogel", 10e6);
        // just in case it hasn't autobuilt yet
        trigger.amount(buildings.SiriusSpaceElevator, 100);
        trigger.amount(buildings.SiriusGravityDome, 100);
        trigger.amount(buildings.SiriusAscensionMachine, 100);

        // knowledge
        if (projects.SuperCollider.count < 200) {
            trigger.amount(projects.SuperCollider, 200);
            settings["autoGenetics"] = false; // avoid weird knowledge crap
        }
    }

    // Progressively increase demon lord pressure after floor 10, and work on some fun buildings
    if (buildings.SpireTower.count >= 10) {
        settings["mechWaygatePotential"] = 0 + ((buildings.SpireTower.count - 10) / 45);

        triggerToCost(buildings.BadlandsAttractor, "Stanene", _("TraitLevel", "linked") ? 250e9 : 10e9); // 250G, or 10G on non-custom (angelic)

        triggerToCost(buildings.PitSoulAttractor, "Aerogel", 50e6);
        triggerToCost(buildings.RuinsArcology, "Nanoweave", 20e6);
        trigger.amount(projects.StockExchange, 100);

        if (projects.StockExchange.count >= 100) {
            // some extra knowledge for later, might as well prep now
            triggerToCost(buildings.GorddonSymposium, "Brick", 10e6);
        }
    }

    if (buildings.SpireTower.count >= 25) {
        // Turn off building new heavy consumers of soul gems, save for edenic stuff
        limitBuyToCost(buildings.RuinsHellForge, "Soul_Gem", 1500);
        limitBuyToCost(buildings.LakeTransport, "Soul_Gem", 1500);
        limitBuyToCost(buildings.LakeBireme, "Soul_Gem", 1500);

        // This is the easy one, don't currently adjust for Plywood or heat missing. Too bad!
        const metal = 75e6 * 0.9 * (20 - buildings.IsleSouthPier.count - buildings.ElysiumNorthPier.count);
        if (metal > 0) {
            trigger.custom(resourceList({
                Sheet_Metal: metal,
            }), [
                buildings.IsleSouthPier,
                buildings.ElysiumNorthPier,
                !buildings.AsphodelEncampment.isUnlocked() ? buildings.Wardenclyffe : null,
            ].filter(n => n !== null));
        }

        // Prep elysanite mines wrought iron, only after sheet metal is done
        // This linked check is kind of just the "is not seraph for traitor" check
        const minesWanted = _("TraitLevel", "linked") ? 30 : 22;
        let iron = 0;
        for (let i = buildings.ElysiumMine.count; i < minesWanted; ++i) {
            iron += evolve.adjustCosts(evolve.actions.eden.eden_elysium.elysanite_mine, i - buildings.ElysiumMine.count).Wrought_Iron();
        }

        if (iron > 0 && resources.Sheet_Metal.currentQuantity >= metal) {
            trigger.custom(resourceList({
                Wrought_Iron: iron,
            }), [
                buildings.ElysiumMine,
            ]);
        }
        else if (iron > 0) {
            // Don't craft, but keep reserving
            trigger.custom(resourceList({
                Wrought_Iron: resources.Wrought_Iron.currentQuantity,
            }), [
                buildings.ElysiumMine,
            ]);
        }
    }

    // Build railways for railway to hell, up to 6.66s of steel production
    if (game.global.tech.hell_lake >= 7) {
        if (projects.Railway.fullRemainingCost.Steel <= (resources.Steel.rateOfChange * 6.66)) {
            trigger(projects.Railway);
        }
    }

    // TODO: minmax ambush/raid/siege
    // Once we get in eden
    if (buildings.AsphodelEncampment.count >= 1) {
        settings["magicAlchemyManaUse"] = 0; // just doesn't make sense anymore
        limitBuyToCost(buildings.AsphodelBlissDen, "Soul_Gem", 50);

        trigger(techIds["tech-ethereal_weapons"]); // Gates everything worth a damn
        // Stuff to build ASAP when unlocked
        trigger.amount(buildings.ElysiumMine, 10);
        trigger.amount(buildings.ElysiumArchive, 1); // 1 is needed for techs
        trigger.amount(buildings.AsphodelBunker, 25); // get some troops and stuff
    }

    // Stockpile Elysium near end, when it takes longer to stockpile Elysium than it takes to drain energy
    if (buildings.IsleSpiritVacuum.count) {
        const elysanitePiece = evolve.adjustCosts(evolve.actions.eden.eden_palace.infuser).Elysanite(); // 112.5M, 25 parts
        const parts = 25 - buildings.PalaceInfuser.count;
        const elysaniteTotalCost = elysanitePiece * parts;
        if (evolve.global?.eden?.palace?.energy ?? Infinity > 0) {
            const drainage = 1653439 * buildings.IsleSpiritVacuum.stateOnCount * (1 + (0.08 * buildings.IsleSpiritBattery.stateOnCount));
            const secondsLeft = (evolve.global?.eden?.palace?.energy ?? 1e20) / drainage;
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
