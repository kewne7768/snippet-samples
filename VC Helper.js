if (settings.prestigeType === "vacuum") {
    // Farm only
    if (game.alevel() >= 5) return stopRunning();

    trigger(techIds["tech-map_terrain"]);
    trigger(techIds["tech-calibrated_sensors"]);
    if (techIds["tech-virtual_reality"].isResearched()) {
        trigger.amount(buildings.PortalCarport, 25);
    }
    if (projects.ManaSyphon.isUnlocked()) {
        trigger.amount(buildings.RedZiggurat, 32);
        trigger.amount(buildings.BadlandsSensorDrone, 40);
        trigger.amount(projects.ManaSyphon, 80);
    }
}
