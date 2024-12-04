// @ts-nocheck
// Exports stuff to the window object so you can peek into script data via your browser console.
// Useful when developing.
let exportedToWindow = {
    buildings,
    jobs,
    state,
    settings,
    settingsRaw,
    resources,
    crafter,
    projects,
    races,
    SnippetManager,
    SnippetEditorManager,
    TriggerManager,
    WarManager,
    MarketManager,
    FleetManager,
    FleetManagerOuter,
    MechManager,
    KeyManager,
    GovernmentManager,
    fastEval,
    traitVal,
    poly,
    $,
    PrestigeDBManager: typeof PrestigeDBManager !== "undefined" ? PrestigeDBManager : undefined,
    get snippetData() { return snippetData; }, // Object changes every tick
};

if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.autoEvolve = exportedToWindow;
}
else {
    window.autoEvolve = exportedToWindow;
}

stopRunning();
