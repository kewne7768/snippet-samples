// Micro DI 3*
if (!_("Universe", "micro")) return stopRunning();

if (settings.prestigeType === "demonic" && !_("Challenge", "badgenes") && _("Challenge", "no_plasmid")) {
    // Keep 40 soldiers out of hell
    settings["hellHomeGarrison"] = 40;

    // Build some particular stuff up high
    trigger.amount(buildings.RedLivingQuarters, 60);
    trigger.amount(buildings.RedZiggurat, 40);
    trigger.amount(buildings.RedFabrication, 40);

    if (resources.Soul_Gem.currentQuantity >= 200) {
        trigger.amount(buildings.NeutronCitadel, 80);
        trigger.amount(buildings.PortalWarDroid, 50);
        trigger.amount(buildings.PortalRepairDroid, 50);
    }

    if (resources.Bolognium.currentQuantity >= 1e6) {
        trigger.amount(buildings.NeutronStellarForge, 50);
    }

    trigger.amount(buildings.Alien2ArmedMiner, 30);
    trigger.amount(buildings.Dreadnought, 4);

    // REALLY push attractors, and along with it, some extra turrets aren't a waste....
    let attractorLimit = 150;
    if (buildings.LakeHarbor.count >= 1) {
        attractorLimit += 51;
    }
    if (buildings.SpireMechBay.count >= 10) {
        attractorLimit += 51;
    }
    settings["bld_m_portal-attractor"] = attractorLimit;
    settings["bld_m_portal-turret"] = Math.floor(attractorLimit / 20 * 8); // 100 for 252

    // Limit harbors and cooling towers to a reasonable amount
    settings["bld_m_portal-harbor"] = buildings.LakeBireme.count + buildings.LakeTransport.count + 30;
    settings["bld_m_portal-cooling_tower"] = settings["bld_m_portal-harbor"] + 50;

    // Force-build waygate after 200 mechbays
    if (buildings.SpireMechBay.count >= 200 && !haveTech("waygate", 2)) {
        trigger.amount(buildings.SpireWaygate, 10);
    }

    settings["mechInfernalCollector"] = true;
}
