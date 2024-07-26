// Register with the prestige DB
if (typeof PrestigeDBManager !== "undefined" && typeof PrestigeDBManager.registerEntryHook === "function") {
    PrestigeDBManager.registerEntryHook("Prestige DB Extras", () => {
        return {
            extra: {
                deadSoldiers: game.global.stats.died,
            }
        };
    });
}

stopRunning();
