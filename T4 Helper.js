/**
* @param {Action} buildingBase
* @param {number} targetCount
*/
function rushBuild(buildingBase, targetCount) {
    const building = buildingBase.definition;
    const maxCount = targetCount - buildingBase.count;
    if (maxCount <= 0) return 0;

    const starterCosts = poly.adjustCosts(building);

    let bought = 0;
    for (let i = 0; i < maxCount; ++i) {
        let resourceCosts = {};
        let affordable = true;
        Object.keys(starterCosts).forEach(rk => {
            let cost = starterCosts[rk](i);
            if (cost < 1) return; // It's free!
            resourceCosts[rk] = cost;
            if (cost > resources[rk].currentQuantity) {
                affordable = false;
            }
        });
        if (affordable) {
            Object.keys(resourceCosts).forEach(rk => {
                resources[rk].currentQuantity -= resourceCosts[rk];
            });
            // Don't use the game's builtin multi-buy for this.
            if (i === 0) KeyManager.set(false, false, false);
            buildingBase.vue.action();
            bought++;
        }
        else {
            trigger(buildingBase);
            break;
        }
    }
    return bought;
}

if (snippetData?.hasTrait?.t4farm) {
    // Rush build houses at the start.
    rushBuild(buildings.House, 40);
    rushBuild(buildings.Cottage, 15);
    // After investing, rushBuild 15 banks to get taxes flowing. It's all we got early on...
    if (techIds["tech-investing"].isResearched()) {
        rushBuild(buildings.Bank, 15);
    }

    // Keep em going post merchandising
    let spMin = techIds["tech-merchandising"].isResearched() ? 20 : 0;
    if (resources.Knowledge.maxQuantity >= 1000e3) {
        spMin = 48;
    }
    else if (resources.Knowledge.maxQuantity >= 120e3) {
        spMin = 40;
    }
    else if (resources.Knowledge.maxQuantity >= 60e3) {
        spMin = 28;
    }
    // Trigger if 8 below min, just increase weighting after
    if (buildings.SlavePen.count < spMin) {
        trigger.amount(buildings.SlavePen, spMin - 8);
        settings["bld_w_city-slave_pen"] = 5000;
    }

    // Power can be messy early on, so set a max build.
    settings["bld_m_city-transmitter"] = 2;

    // Buy Furs early, and keep it up for a bit. Buy all the furs!
    if (WarManager.currentSoldiers < 12 && buildings.Temple.count < 20) {
        settings["res_trade_buy_Furs"] = true;
        settings["res_trade_w_Furs"] = 10000;
        settings["res_trade_p_Furs"] = 10000;
        trigger.amount(buildings.StorageYard, 8);

        // Really really hire the first couple of mercs after investing
        if (WarManager.currentSoldiers < 3 && techIds["tech-investing"].isResearched()) {
            trigger(techIds["tech-mercs"]);
            settings["foreignHireMercCostLowerThanIncome"] = 1;
        }
    }

    // Let's go for 6 Helium mines. At least, after Iridium is set up.
    if (buildings.MoonIridiumMine.count) {
        trigger.amount(buildings.MoonHeliumMine, 6);
    }

    // Iridium mine stuff at high enough Iridium deposits.
    if (snippetData?.hasTrait?.moon_iridium) {
        settings["batspace-iridium_ship"] = false;
        if (buildings.DwarfWorldController.count) {
            if (buildings.BlackholeStargateComplete.count) {
                trigger.amount(buildings.MoonIridiumMine, 15);
            }
            else {
                trigger.amount(buildings.MoonIridiumMine, 8);
            }
        }
        else {
            trigger.amount(buildings.MoonIridiumMine, 4);
        }
    }

    // After the initial buildup, push a few things.
    if (techIds["tech-merchandising"].isResearched()) {
        // Some cheap pop
        trigger.amount(buildings.Lodge, 15);
        // Pump up the knowledge cap
        trigger.amount(buildings.Library, 20);

        // Build ALL the Wardenclyffes.
        if (buildings.Wardenclyffe.cost.Knowledge < resources.Knowledge.maxQuantity) {
            if (buildings.Wardenclyffe.stateOffCount === 0 && (buildings.Mine.stateOffCount === 0 || buildings.RedMission.isComplete())) {
                trigger(buildings.Wardenclyffe);
            }
            else if (!buildings.RedMission.isComplete()) {
                // Build "cheapest" power building according to arbitrary metric.
                // This stops at Red because we have other power sources.
                // Also remember this only runs while we need to build Wardenclyffes, otherwise non-trigger stuff should take care of it.
                let coalCost = buildings.CoalPower.cost?.Money ?? Infinity;
                let oilCost = buildings.OilPower.cost?.Money ?? Infinity;
                trigger(coalCost > (oilCost * 1.15) ? buildings.OilPower : buildings.CoalPower);
            }
        }
    }

    // Pump factories when it's time to start working on Alloy.
    if (techIds["tech-uranium_storage"].isUnlocked() || techIds["tech-uranium_storage"].isResearched()) {
        trigger.amount(buildings.Factory, 8);
        // More cheap pop
        trigger.amount(buildings.Lodge, 22);
        trigger.amount(buildings.Apartment, 8);
    }
    // And make some biolabs after Uranium. 4 is enough to make Tourism easy to access. We also wanna pump out some factories at the same time.
    if (techIds["tech-uranium_storage"].isResearched()) {
        trigger.amount(buildings.BioLab, 4);
        trigger.amount(buildings.Library, 30);
    }

    // Temples and Casinos will build first, Tourist only after unlocked.
    if (projects.Monument.isUnlocked()) {
        trigger.amount(buildings.BootCamp, 5);
        trigger.amount(buildings.Apartment, 12);
        trigger.amount(buildings.Library, 40);
        trigger.amount(buildings.Temple, 35);
        trigger.amount(buildings.Casino, 3);
        // Need to get tourism flowing ASAP once monuments are unlocked.
        trigger.amount(buildings.TouristCenter, 10);
        if (projects.Monument.count < 2) {
            if (!projects.Monument.click()) {
                trigger(projects.Monument);
            }
        }
    }

    if (buildings.RedSpaceport.count) {
        trigger.amount(buildings.BootCamp, 15);
    }

    // Need to enter Hell but not enough soldiers? Remember this interacts with the stress/auto script.
    if (techIds["tech-fortifications"].isResearched()) {
        trigger.amount(buildings.BootCamp, 25);
        trigger.amount(projects.SuperCollider, 20);
        if (WarManager.maxSoldiers < 65) {
            settings["bld_w_city-garrison"] = 1000;
            settings["bld_w_space-space_barracks"] = 1000;
            trigger.amount(buildings.Barracks, 28);
            trigger.amount(buildings.RedSpaceBarracks, 5);
        }
        // Pump up the mercs until we're at a decent spot, too
        if (WarManager.maxSoldiers < 90) {
            settings["foreignHireMercDeadSoldiers"] = 1;
            settings["foreignHireMercCostLowerThanIncome"] = 1;
        }
    }
    // At min merc cost, always try to buy one (even before hell, don't wanna waste time spent at min cost).
    if ((game.global.civic?.garrison?.m_use??0) < 1) {
        settings["foreignHireMercDeadSoldiers"] = 0;
    }
    // Ensure we keep soldiers flowing
    if ((WarManager.deadSoldiers === 0 || (game.global.civic?.garrison?.m_use??0) < 1) && buildings.Barracks.stateOffCount === 0) {
        trigger.amount(buildings.Barracks, 15);
    }

    if (buildings.BlackholeMassEjector.count && techIds["tech-calibrated_sensors"].isResearched()) {
        // Make sure we got enough Elerium going on.
        trigger.amount(buildings.NebulaNexus, 5);
        trigger.amount(buildings.NebulaEleriumProspector, 6);
        trigger.amount(buildings.NebulaHarvester, 4);

        trigger.amount(projects.SuperCollider, 40);

        // These get a little more expensive than desired after 25. After we have them we can build the gate.
        trigger.amount(buildings.BadlandsSensorDrone, 25);
        if (buildings.BadlandsSensorDrone.count >= 25) {
            trigger(buildings.BlackholeStargate);
        }

        // We also need to keep some Alloy from this point on, to make Mythril. Script builtin logic only works when it's demanded.
        if (resources.Alloy.currentQuantity < 1000e3) {
            resources.Alloy.requestedQuantity = Math.max(resources.Alloy.requestedQuantity, 1000e3);
        }

        trigger.amount(buildings.BootCamp, 32);
    }
    // 33 is a good max for Sensors.
    settings["bld_m_portal-sensor_drone"] = 33;

    // Run 10 bolog ships early to get enough for a freighter. Pump 30 after Embassy while waiting on Metaphysics.
    trigger.amount(buildings.BologniumShip, buildings.GorddonEmbassy.count ? 30 : 10);

    if (buildings.ScoutShip.count) {
        trigger.amount(projects.SuperCollider, 80);
    }

    // Some misc maxes
    settings["bld_m_space-outpost"] = 22; // Neutronium Miner
    settings["bld_m_galaxy-gateway_station"] = 12; // Gateway. This is enough for our ship setup.

    // Free Dreaded Strat
    // May not be useful at all prestige levels or outside of Magic without Alchemy, make sure Orichalcum is easy.
    // Alien2: 650 needed, 2 Frigate 2 Cruiser
    // Chthonian: 1250 needed, 2 Scout 1 Corvette 3 Frigate 4 Cruiser.
    // The 2 scout is implied.
    // Make sure there are no conflicting triggers!
    settings["batgalaxy-dreadnought"] = false;
    settings["bld_m_galaxy-corvette_ship"] = 1;
    settings["bld_m_galaxy-frigate_ship"] = buildings.Alien2Mission.isComplete() ? 3 : 2;
    settings["bld_m_galaxy-cruiser_ship"] = buildings.Alien2Mission.isComplete() ? 4 : 2;
    if (buildings.Alien2Mission.isComplete() && !buildings.ChthonianMission.isComplete()) {
        trigger.amount(buildings.BootCamp, 40); // don't really care about them after going into chth
        trigger.amount(buildings.FrigateShip, 3);
        trigger.amount(buildings.CruiserShip, 4);
        // If we're ready to attack, herbivore it up
        if (buildings.FrigateShip.count >= 3 && buildings.CruiserShip.count >= 4) {
            if (game.global.race.shapeshifter) {
                settings["shifterGenus"] = "ignore";
                getVueById('sshifter')?.setShape("herbivore");
            }
            settings["fleetChthonianLoses"] = "high";
        }
    }
    else if (buildings.ChthonianMission.isComplete() && game.global.race.ss_genus === "herbivore") {
        // Back to heat for the machine!
        settings["shifterGenus"] = "ignore";
        getVueById('sshifter')?.setShape("heat");
    }

    // Prep some more Orichalcum
    if (buildings.Alien2Mission.isComplete() && _("Universe", "magic")) {
        trigger.amount(projects.ManaSyphon, 24);
    }

    // Quantum Living Quarters
    function calcQuantum() {
        if (game.global.tech['high_tech'] && game.global.tech['high_tech'] >= 11) {
            let k_base = game.global.resource.Knowledge.max;
            let k_inc = 250000;
            let qbits = 0;
            while (k_base > k_inc) {
                k_base -= k_inc;
                k_inc *= 1.1;
                qbits++;
            }
            qbits += +(k_base / k_inc).toFixed(2);
            if (game.global.interstellar['citadel']) {
                let citadel = buildings.NeutronCitadel.stateOnCount;
                if (game.global.tech['high_tech'] && game.global.tech['high_tech'] >= 15 && citadel > 0) {
                    qbits *= 1 + (citadel * 0.05);
                }
            }
            if (game.global.space['ai_core2']) {
                let core = game.global.space.ai_core2.on;
                if (game.global.tech['titan_ai_core'] && core > 0) {
                    qbits *= 1.25;
                }
            }
            if (game.global.stats.achieve['obsolete'] && game.global.stats.achieve[`obsolete`].l >= 5 && game.global.prestige.AICore.count > 0) {
                qbits *= 2 - (0.99 ** game.global.prestige.AICore.count);
            }
            if (game.global.race['linked']) {
                let factor = game.traits.linked.vars()[0] / 100 * game.global.resource[game.global.race.species].amount;
                if (factor > game.traits.linked.vars()[1] / 100) {
                    factor -= game.traits.linked.vars()[1] / 100;
                    factor = factor / (factor + 200 - game.traits.linked.vars()[1]);
                    factor += game.traits.linked.vars()[1] / 100;
                }
                qbits *= 1 + factor;
            }
            return +(qbits).toFixed(3);
        }
        return 0;
    }

    let lines = FactoryManager.maxOperating();
    let qLevel = calcQuantum();
    let quantum = game.global.tech['q_factory'] ? (qLevel - 1) / 2 + 1 : 1;
    let polymerPerLine = game.f_rate.Polymer.output[game.global.tech['factory'] || 0] * state.globalProductionModifier * quantum;
    if (buildings.RedLivingQuarters.cost.Polymer < (polymerPerLine * lines * 5)) {
        // wow this is weirdly written.
        // TODO: figure out if i can make a neat firstOf construct because this kinda shit is just bad
        let softCap = buildings.CruiserShip.count ? 40 :
            buildings.GorddonEmbassy.count ? 30 :
                buildings.BlackholeStargateComplete.count ? 25 :
                    buildings.BlackholeFarReach.count ? 20 :
                        buildings.DwarfWorldController.count ? 10 :
                            5;

        let hardCap = softCap + 10;

        if (buildings.RedLivingQuarters.count < softCap) {
            trigger(buildings.RedLivingQuarters);
        }
        else if (buildings.RedLivingQuarters.count < hardCap) {
            trigger.custom({ Polymer: buildings.RedLivingQuarters.cost.Polymer }, [buildings.RedLivingQuarters, buildings.BadlandsSensorDrone]);
        }
    }

}
