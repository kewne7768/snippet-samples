if (snippetData?.hasTrait?.t4farm) {
    if (buildings.BlackholeStargateComplete.count) {
        trigger.amount(buildings.BadlandsSensorDrone, 25);
    }

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
}
