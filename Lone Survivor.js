//import "./_decls.ts";
// @ts-check

// This whole thing will almost certainly require *extensive* tweaking based on overall prestige level.
// It is nowhere near optimal, but it should function.
// There are many, many TODOs in this version.

// TODO: replicate Garden Graphene earlier, overriding Ringworld Ori/Neutronium demand system - those scale bad with replicator at 2000+ servants, Graphene is still mostly replicator
// replicateEdenGraphene doesn't really work if replicator is focused by demand

// As long as we're aiming for LS, adjust our settings.
if (settings["prestigeType"] !== "eden") { return stopRunning(); }

if (!_("Challenge", "lone_survivor")) {
    return stopRunning();
}

/**
 * @typedef {Object} SnipVars
 * @property {'auto'|'science'|'mine'} job Job for the lone survivor
 * @property {string} gov Goverment
 * @property {number} redraw Force tab redraw
 * @property {number} redrawSequence Force tab redraw (internal tracking, do not modify)
 * @property {number} patrolMiningCap Maximum amount of patrol/extractor ships to trigger when Titanium is ready
 * @property {string} mimic Current mimic
 * @property {boolean} mimicMonument Mimic is handled by monument handler
 * @property {boolean} spaceStationDecrypt Use custom logic for space station decrypting
 * @property {number} factoryLimit Building/power limit for factory
 * @property {boolean} ringworldMode Pit mine remaining Adamantite for Ringworld
 * @property {Object|null} autoMonument Settings for monument spammer
 * @property {boolean} replicateCement Allow replicating Cement if demanded. This is a workaround for mimic handling being broken
 * @property {boolean} replicateEdenGraphene Replicate Graphene for Garden of Eden
 * @property {boolean} knowledgeFullMining If knowledge is full, go Pit Miner
 */

/**
 * @typedef {Object} SnipState
 * @property {number} step
 * @property {SnipVars} vars
 * @property {Partial<SnipVars>} stepVars
 */

/** @type {SnipState} snippetState */

if (!('step' in snippetState)) {
    snippetState.step = 0;
    /**
     * @type {SnipVars}
     */
    const defaultVars = {
        job: "auto",
        gov: "technocracy",
        redraw: 0,
        redrawSequence: 0,
        patrolMiningCap: 0,
        mimic: "ignore",
        mimicMonument: false,
        spaceStationDecrypt: false,
        factoryLimit: -1,
        ringworldMode: false,
        autoMonument: null,
        replicateCement: false,
        replicateEdenGraphene: false,
        knowledgeFullMining: false,
    };
    snippetState.vars = structuredClone(defaultVars);
    snippetState.stepVars = {};
}

globalThis.lsState = snippetState;

// Disable game stuff
settings.autoBuild = false;
settings.autoARPA = false;
settings.autoResearch = false;
settings.autoTrigger = false;
settings.autoShapeshift = false;

// General setting overrides.
settings["mutableTrait_reset_dumb"] = true;
settings["mutableTrait_reset_freespirit"] = false;
settings["mutableTrait_reset_slow_regen"] = false;
settings["production_Money"] = false; // Luxury Goods
settings["generalRequestedTaxRate"] = 0;
settings["geneticsSequence"] = "disabled";
settings["shifterGenus"] = "ignore";
settings["naniteMode"] = "capped";
settings["productionExtWeight_uncommon"] = 1e12; // Full Neutronium
settings["productionExtWeight_rare"] = 0; // Full Orichalcum
settings["govGovernor"] = "bureaucrat";
settings["productionSmelting"] = "steel";
settings["productionSmeltingIridium"] = 0;
// Direct servants appropriately
settings["job_b2_quarry_worker"] = 0;
settings["job_b2_scavenger"] = -1;
settings["productionCraftsmen"] = "servants";
settings["foundry_w_Plywood"] = 0;
settings["foundry_w_Brick"] = 1e20;
settings["foundry_w_Wrought_Iron"] = 0;
settings["foundry_w_Sheet_Metal"] = 0;
settings["foundry_w_Mythril"] = 0;

// Factory weightings, demand system will still work, this is just leftovers!
settings["production_p_Money"] = 0;
settings["production_w_Money"] = 0;
settings["production_p_Furs"] = 50;
settings["production_w_Furs"] = 40;
settings["production_p_Polymer"] = 50;
settings["production_w_Polymer"] = 20;
settings["production_p_Alloy"] = 50;
settings["production_w_Alloy"] = 5;
settings["production_p_Nano_Tube"] = 50;
settings["production_w_Nano_Tube"] = 1;
settings["production_p_Stanene"] = 50;
settings["production_w_Stanene"] = 1;

// Change to default gov if currently Anarchy - this will let us get the first tick researches at discount.
if (GovernmentManager.isEnabled() && GovernmentManager.currentGovernment() === "anarchy") {
    GovernmentManager.setGovernment(snippetState.vars.gov);
}

// Keep a list of our triggers
let triggers = [];

// We don't update debug data every time we shapeshift. Need to keep track of it ourselves.
// We also need to track the start one because that's what current costs are for.
let mimicGenus = game.global.race['ss_genus'];
let mimicGenusStart = mimicGenus;
let swappedThisTick = false;

// Mimic Avian/Flier discount based on expected rank. Let's go with r0.5.
// r0.5: 0.85, r1: 0.75, r2: 0.6, r3: 0.5
// Also costs a fixed 1.75 times the Cement cost.
const flierAdjustRate = 0.85;

const haveAll = (list) => {
    return Object.keys(list).every(rn => {
        return resources[rn].currentQuantity >= list[rn];
    });
};

// Returns a typeless entry but with the type added, and converted into an array if it wasn't already.
/**
 * @param {StepEntryTypeless|StepEntryTypeless[]} step
 * @returns {StepEntry[]}
 */
const probeType = (step) => {
    if (!Array.isArray(step)) {
        step = [step];
    }

    return step.map(entry => {
        if (typeof entry.type === "string") { let stepType = entry.type; return { ...entry, type: stepType }; }
        if (entry.building) return { ...entry, type: "building" };
        if (entry.tech) return { ...entry, type: "tech" };
        if (entry.project) return { ...entry, type: "project" };
        if (entry.variable) return { ...entry, type: "variable" };
        // TypeScript isn't willing to accept that a simple `return entry` will be correct here.
        // But for some reason it does know entry.type will be valid if it's a string type, and it knows it's a string type.
        // Interesting.
        throw `Failed to probeType ${JSON.stringify(entry)}.`;
    });
};

/**
 * Set current Mimic.
 * @param {string} newGenus 
 * @returns 
 */
function doShapeshift(newGenus) {
    if (newGenus === mimicGenus || !game.global.race.shapeshifter) return;
    // @ts-ignore
    getVueById('sshifter')?.setShape(newGenus);
    mimicGenus = newGenus;
    swappedThisTick = true;
}

// Buildings bought this tick. Add this to the current building to get the real cost.
let thisTickBuildingBought = {};

const getAvianizedCosts = (building) => {
    // Get costs directly from the game.
    /** @type {{[key: string]: (entry: number) => number;}} */
    let expectedCostsBase = poly.adjustCosts(building.definition);
    /** @type {{[key: string]: number}} */
    let expectedCosts = Object.fromEntries(Object.entries(expectedCostsBase).map(([k, v]) => {
        return [k, v(thisTickBuildingBought[building.id] ?? 0)];
    }));

    if (mimicGenusStart === "avian") {
        return expectedCosts;
    }

    // Heat 10% cost reduction will get removed.
    // Game applies it based on the mimic we had at the start of the tick, not current!
    let overallAdjust = 1;
    if (mimicGenusStart === "heat") {
        overallAdjust = 1 / 0.9;
    }

    if (expectedCosts?.Cement && resources.Cement.currentQuantity < expectedCosts?.Cement) {
        // From functions.js flierAdjust
        if (expectedCosts.Stone) {
            expectedCosts.Stone = expectedCosts.Stone + (expectedCosts.Cement * 1.8 * flierAdjustRate);
        }
        else {
            expectedCosts.Stone = expectedCosts.Cement * 1.75 * flierAdjustRate;
        }
        delete expectedCosts.Cement;
        expectedCosts = Object.entries(expectedCosts).map(([k, v]) => {
            return [k, v * overallAdjust];
        });
    }
    return expectedCosts;
};

/** @param {Action} building */
const withAvianMimic = (building) => {
    // Non Mimic?
    if (!game.global.race.shapeshifter) {
        return false;
    }
    let needAvian = false;
    // Get costs directly from the game.
    /** @type {{[key: string]: (entry: number) => number;}} */
    let expectedCostsBase = poly.adjustCosts(building.definition);
    /** @type {{[key: string]: number}} */
    let expectedCosts = Object.fromEntries(Object.entries(expectedCostsBase).map(([k, v]) => {
        return [k, v(thisTickBuildingBought[building.id] ?? 0)];
    }));
    if (expectedCosts?.Cement && resources.Cement.currentQuantity < expectedCosts?.Cement) {
        // From functions.js flierAdjust
        if (expectedCosts.Stone) {
            expectedCosts.Stone = expectedCosts.Stone + (expectedCosts.Cement * 1.8 * flierAdjustRate);
        }
        else {
            expectedCosts.Stone = expectedCosts.Cement * 1.75 * flierAdjustRate;
        }
        needAvian = true;
        delete expectedCosts.Cement;
    }

    if (haveAll(expectedCosts)) {
        doShapeshift('avian');

        // .click() won't work, DIY it.
        for (let res in expectedCosts) {
            resources[res].currentQuantity -= expectedCosts[res];
        }

        if (building.vue.action()) {
            thisTickBuildingBought[building.id] ??= 0;
            thisTickBuildingBought[building.id]++;
            return;
        }
    }

    return false;
};

// TypeScript doesn't like I when I throw in a ternary unless I "never" it.
/**
 * @param {StepEntry} entry
 * @param {string} e
 * @returns {never}
 */
function throwEntry(entry, e) {
    throw `Entry invalid: ${entry} ${e}`; // ${run.indexOf(entry)} ${e}`;
}

/**
 * @param {Action|Technology} triggerable
 * @param {number} amount
 */
function superTrigger(triggerable, amount = 1) {
    triggers.push(triggerable);
    if (triggerable instanceof Technology) {
        trigger(triggerable);
    }
    else if (triggerable instanceof Action) {
        if (triggerable.count >= amount) return;

        trigger.amount(triggerable, amount);
        /*
        // TODO: Implement Avian gimmicks

        const avianOverallCostIncrease = mimicGenusStart === 'heat' ? 1 / 0.9 : 1;
        // If we don't need Avian, just do a normal trigger, but like as heat.
        if (!(triggerable.cost.Stone || triggerable.cost.Cement)) {
            if (mimicGenus !== 'heat') {
                doShapeshift('heat');
            }
            trigger.amount(triggerable, amount);
        }
        */
    }
    else {
        throw `Expected ${triggerable} to be a different type`;
    }
}

/**
 * @typedef {Object} EntryTypeHandler
 * @property {(entry: StepEntry) => boolean} complete
 * @property {(entry: StepEntry) => void} do
 * @property {(entry: StepEntry) => void=} pre
 * @property {boolean=} once
 */
/** @type {{[key in StepType]: EntryTypeHandler;}}} */
const entryTypeHandlers = {
    building: {
        pre: (entry) => undefined,
        complete: (entry) => entry.building ? (entry.building.count >= (entry.amount ?? 1) || !!(entry?.orBuildingUnlocked?.isUnlocked())) : throwEntry(entry, `Invalid building`),
        do: (entry) => entry.building ? superTrigger(entry.building, entry?.amount ?? 1) : throwEntry(entry, `Invalid building`),
    },
    tech: {
        pre: (entry) => undefined,
        complete: (entry) => entry.tech ? entry.tech.isResearched() : throwEntry(entry, `Invalid tech`),
        do: (entry) => entry.tech ? superTrigger(entry.tech) : throwEntry(entry, `Invalid tech`),
    },
    project: {
        pre: (entry) => undefined,
        complete: (entry) => entry.project ? entry.project.count >= (entry.amount ?? 1) : throwEntry(entry, `Invalid project`),
        do: (entry) => entry.project ? superTrigger(entry.project, entry?.amount ?? 1) : throwEntry(entry, `Invalid project`),
    },
    variable: {
        pre: (entry) => undefined,
        complete: (entry) => true,
        do: (entry) => entry.variable && ((entry.layer === "step" ? snippetState.stepVars : snippetState.vars)[entry.variable] = entry.val),
        once: true,
    },
    techComplete: {
        pre: (entry) => undefined,
        complete: (entry) => game.global.tech[entry.variable] >= (entry?.amount ?? 1),
        do: (entry) => undefined,
    },
};

// Main stuff.
// This is essentially a gigantic list of triggers, followed from top to bottom.
// StepEntries are one action, or one action up to a specific count.
// Steps are an array of one or more StepEntries. They are sync points. Everything inside one array happens at the same time.
// keyof typeof entryTypeHandlers
/** @typedef {"building"|"tech"|"project"|"variable"|"techComplete"} StepType */
/**
 * @typedef {Object} StepEntry
 * @property {StepType} type
 * @property {Action=} building Build a building. Implies type=building
 * @property {number=} amount type=building/project: Total amount to build
 * @property {Technology=} tech Research a tech. Implies type=tech
 * @property {Project=} project Build ARPA. Implies type=project
 * @property {string=} variable Set a variable. Implies type=variable, unless type is techComplete, in which case it's the tech to check
 * @property {any=} val Variable value
 * @property {('set'|'step')=} layer Variable layer
 * @property {Action=} orBuildingUnlocked Considered complete if a building is unlocked, used for space station.
 * @property {boolean=} skipIfCement TODO NYI we get stuck on Cement currently!
 * @property {boolean=} opportunistic Allow advancing step even if incomplete
*/
/**
 * @typedef {Omit<StepEntry, 'type'> & {type?: StepType}} StepEntryTypeless
*/

// #region Triggers list
// For ease of writing, you can list a single StepEntry below.
// The type will be automatically inferred if not explicitly specified.
/** @type {(StepEntryTypeless|StepEntryTypeless[])[]} */
const runBase = [
    // First tick
    [
        { tech: techIds["tech-outpost_boost"] },
        { tech: techIds["tech-alt_fanaticism"] },
    ],
    // Rush Deify + governors, after this we try to get the replicator online
    [
        { tech: techIds["tech-ancient_theology"] },
        { tech: techIds[game.global.genes?.transcendence >= 2 ? "tech-deify_alt" : "tech-deify"] },
        { tech: techIds["tech-governor"] },
    ],

    // Spend some starting mats before engaging heat - Chrysotile production is slow before colonies
    [
        { building: buildings.TauOrbitalStation, amount: 2 },
        { project: projects.Monument, amount: 8 }, // Fixed amount of starting mats we can lose, dynamic is later
        { tech: techIds["tech-replicator"], opportunistic: true },
    ],
    [
        { building: buildings.TauColony, amount: 2 },
        { building: buildings.TauOrbitalStation, amount: 3 },
        { tech: techIds["tech-replicator"], opportunistic: true },
    ],
    [
        { building: buildings.TauColony, amount: 4 },
        { building: buildings.TauOrbitalStation, amount: 4 },
        { tech: techIds["tech-replicator"], opportunistic: true },
    ],
    [
        { variable: "mimic", val: "heat" },
        { building: buildings.TauColony, amount: 5 },
        { building: buildings.TauOrbitalStation, amount: 5 },
        { tech: techIds["tech-replicator"] }, // Needed for helium.

        {
            // First round of automatic monuments. We keep 12 casinos worth of cement (closer to 1.1m).
            variable: "autoMonument", val: {
                // 1 hightech farm + 2 womling mines, approx cost
                keepSteel: 1_580_000 + 1_130_000 + 1_300_000,
                keepCement: 1_500_000,
                mineFor: [resources.Stone.id, resources.Aluminium.id],
                allowAvian: false,
            }, layer: "step"
        },
        // Some casinos too, to get max morale up slightly
        { building: buildings.TauCasino, amount: 7 },
    ],
    [
        // Enable Cement replication if we get short from here on out. We normally don't, but sometimes it happens for some reason.
        { variable: "replicateCement", val: true },
        { building: buildings.TauColony, amount: 7 },
        { building: buildings.TauOrbitalStation, amount: 6 },
    ],
    [
        { building: buildings.TauFusionGenerator, amount: 2 },
    ],
    [
        // 19/21 when this is done
        { building: buildings.TauOrbitalStation, amount: 7 },
        { building: buildings.TauColony, amount: 9 },
    ],
    [
        // Yet more replicator juice + money
        { building: buildings.TauFusionGenerator, amount: 3 },
        { building: buildings.TauCasino, amount: 12 },
    ],

    // Factories + monuments
    [
        { variable: "replicateCement", val: false },
        {
            // Keep making monuments until we would fall below this amount of resources.
            // This does not block advancing steps.
            variable: "autoMonument", val: {
                // 1 hightech farm + 2 womling mines, approx cost
                keepSteel: 1_580_000 + 1_130_000 + 1_300_000,
                mineFor: [resources.Stone.id, resources.Aluminium.id],
                allowAvian: true,
            }, layer: "step"
        },
        // 19/22 when this is done
        { tech: techIds["tech-tau_cultivation"] },
        { building: buildings.TauFarm, amount: 1 },
    ],
    [{ tech: techIds["tech-tau_manufacturing"] }],

    // Money money money, get centers & switch to corpo
    [
        // 22/22 when factory & lab are done
        { building: buildings.TauFactory, amount: 2 },
        { building: buildings.TauDiseaseLab, amount: 1, opportunistic: true },
        //{ building: buildings.TauOrbitalStation, amount: 8, opportunistic: true },
        { tech: techIds["tech-iso_gambling"] },
        { tech: techIds["tech-cultural_center"] },
    ],
    [
        //{ variable: "job", val: "mine", layer: "step" },
        { variable: "gov", val: "corpocracy" },

        { building: buildings.TauOrbitalStation, amount: 8 },
        { building: buildings.TauDiseaseLab, amount: 1 },

        { building: buildings.TauCulturalCenter, amount: 5 },
        // Just in case our knowledge gets full, we'll get them for sure next tick
        { tech: techIds["tech-womling_unlock"], opportunistic: true },
        { building: buildings.TauRedIntroduce, opportunistic: true },
    ],

    // Mo money, mo problems
    [
        { building: buildings.TauOrbitalStation, amount: 9 },
        { building: buildings.TauColony, amount: 10 },
        { tech: techIds["tech-womling_unlock"], opportunistic: true },
        { building: buildings.TauRedIntroduce, opportunistic: true },
    ],
    [
        { building: buildings.TauColony, amount: 11 },
        { building: buildings.TauOrbitalStation, amount: 10 },
        { tech: techIds["tech-womling_unlock"], opportunistic: true },
        { building: buildings.TauRedIntroduce, opportunistic: true },
    ],
    [
        { building: buildings.TauColony, amount: 12 },
    ],

    // Meet the furrets and prepare some nice gambling for them
    [
        { variable: "job", val: "auto" },
        { building: buildings.TauColony, amount: 13 },
        { tech: techIds["tech-womling_unlock"] },
        { building: buildings.TauRedIntroduce, amount: 1 },
        { building: buildings.TauRedWomlingVillage, amount: 5 },
        { building: buildings.TauRedWomlingFarm, amount: 2 },
        { building: buildings.TauRedOrbitalPlatform, amount: 3 },
        { building: buildings.TauRedWomlingMine, amount: 2 },
        //{ building: buildings.TauRedOverseer, amount: 1 }, // Introduce: Vicarage - Titanium, Cement - expensive.....
        { tech: techIds["tech-womling_fun"] },
    ],

    // More furrets + allow spending all steel from now on
    [
        {
            // Keep making monuments until we would fall below this amount of resources.
            // This does not block advancing steps.
            variable: "autoMonument", val: {
                keepSteel: 0,
                mineFor: [resources.Stone.id, resources.Aluminium.id],
                allowAvian: false,
            }
        },

        { tech: techIds["tech-womling_lab"] },
        { building: buildings.TauRedOrbitalPlatform, amount: 4 },
        { building: buildings.TauRedWomlingLab, amount: 2 },
        { building: buildings.TauRedWomlingFun, amount: 4 },
        { building: buildings.TauCulturalCenter, amount: 8, opportunistic: true },
    ],

    // Gotta wait on furret tech 1, get some casinos in with bird powers
    [
        { variable: "mimic", val: "avian", layer: "step" },
        {
            // One last round of monuments with avian for just this layer
            variable: "autoMonument", val: {
                keepSteel: 0,
                mineFor: [resources.Stone.id, resources.Aluminium.id],
                allowAvian: true,
            }, layer: "step"
        },
        { building: buildings.TauCasino, amount: 18 },
    ],

    [
        { tech: techIds["tech-system_survey"] },
        // Optional but worth (probably?):
        { tech: techIds["tech-womling_mining"] },
    ],

    // Asteroid Belt & Gas Giant - none of this stuff is fun or interesting
    [
        { building: buildings.TauGasContest, amount: 1 },
        { building: buildings.TauGasName1, amount: 1 },

        { building: buildings.TauGasRefuelingStation, amount: 1 },

        { building: buildings.TauBeltMission, amount: 1 },
        { tech: techIds["tech-asteroid_analysis"] },
        { tech: techIds["tech-shark_repellent"] },
        { building: buildings.TauBeltPatrolShip, amount: 1 },

        // Bare minimum mining setup, we'll make more next
        { tech: techIds["tech-belt_mining"] },
        { building: buildings.TauGasOreRefinery, amount: 1 },
        { building: buildings.TauBeltMiningShip, amount: 1 },

        { building: buildings.TauCulturalCenter, amount: 8, opportunistic: true },
    ],

    // We can turn a factory off and add one more colony at this point...
    [
        { variable: "factoryLimit", val: 1 },
        { building: buildings.TauColony, amount: 14 },
    ],

    [
        { tech: techIds["tech-outer_tau_survey"] },
        { building: buildings.TauGas2Contest, amount: 1 },
        { building: buildings.TauGas2Name1, amount: 1 },

        { building: buildings.TauGasOreRefinery, amount: 4 },
        { variable: "patrolMiningCap", val: 7 },
        { building: buildings.TauBeltPatrolShip, amount: 5 },
        { building: buildings.TauBeltMiningShip, amount: 5 },
        { tech: techIds["tech-adv_belt_mining"], opportunistic: true },

        { building: buildings.TauCulturalCenter, amount: 9 },
    ],

    [
        { variable: "knowledgeFullMining", val: true, layer: "step" },
        // Space station, main payload we'll be working on
        { building: buildings.TauGas2AlienSurvey, amount: 1 },
        { building: buildings.TauGas2AlienStation, amount: 100, orBuildingUnlocked: buildings.TauGas2AlienSpaceStation },
        //{ building: buildings.TauGas2AlienSpaceStation, amount: 100 },
        // These are technically all optional but well, we got time.
        { tech: techIds["tech-adv_belt_mining"] },
        //{ tech: techIds["tech-womling_firstaid"] }, // need tech2
        //{ tech: techIds["tech-womling_logistics"] }, // need tech3

        { tech: techIds["tech-alien_research"] }, // This one isn't optional
    ],

    // Data decryption
    // First, force a redraw so we can get the space station in the industry UI
    // TODO: Maybe put this in the main script but main script doesn't use space station UI
    [{ variable: "redraw", val: "space station complete" }],

    // document.getElementById("iAlienSpaceStation").__vue__.focus = 0 .. 100
    [
        // Our code below will only enable the space station while no tech is available to get the techs ASAP
        { variable: "spaceStationDecrypt", val: true },
        { variable: "job", val: "science", layer: "step" },
        { tech: techIds["tech-food_culture"] }, // Sell food
        //{ tech: techIds["tech-useless_junk"] }, // Useless junk - small benefit not yet? worth
        { tech: techIds["tech-advanced_refinery"] },
        { tech: techIds["tech-advanced_asteroid_mining"] },
        // Wait for decryption to complete
        { type: "techComplete", variable: "alien_data", amount: 6 },
    ],

    // Finish it!
    [
        { variable: "ringworldMode", val: true },
        { variable: "replicateEdenGraphene", val: true },
        { building: buildings.TauStarRingworld, amount: 1000, },

        // If we got spare knowledge...
        { tech: techIds["tech-womling_gene_therapy"], opportunistic: true },
        { tech: techIds["tech-womling_firstaid"], opportunistic: true },
    ],
    [
        { variable: "gov", val: "technocracy" },
        { tech: techIds["tech-garden_of_eden"] },
        { building: buildings.TauStarEden, amount: 1 },
    ]
];
// #endregion
/** @type {(StepEntry[])[]} */
const run = runBase.map(probeType);

// Main step processing loop.
let start = snippetState.step;
for (let i = start; i < run.length; ++i) {
    let step = run[i];
    if (start !== i) {
        step.filter(entry => entryTypeHandlers[entry.type].once).forEach(entry => entryTypeHandlers[entry.type].do(entry));
    }
    let incompleteEntries = step.filter(entry => !entryTypeHandlers[entry.type].complete(entry));
    // Check if all entries are complete (by checking if any are *not*).
    if (incompleteEntries.filter(entry => !entry.opportunistic).length === 0) {
        // They are! Great. Move on and reset stepVars.
        snippetState.step = i + 1;
        snippetState.stepVars = {};
        continue;
    }
    else {
        // "Do" all incomplete entries.
        incompleteEntries.forEach(entry => {
            let handler = entryTypeHandlers[entry.type];
            if (!handler.complete(entry)) {
                handler.do(entry);
            }
        });
        globalThis.lsWaitingOn = incompleteEntries;
        break;
    }
}

// Now set all the supporting stuff based on these vars
/** @type {SnipVars} */
const vars = Object.assign({}, snippetState.vars, snippetState.stepVars);

// #region Vars Handling
// TEMP TODO - We can do better than hardcoded assignments but this stuff needs to work first
if (vars.mimic && vars.mimic !== "ignore" && !vars.mimicMonument) {
    doShapeshift(vars.mimic);
}

// Auto-manage space station focus
if (vars.spaceStationDecrypt) {
    const station = document.getElementById("iAlienSpaceStation");
    if (station?.__vue__) {
        station.__vue__.focus = triggers.some(trg => trg.cost.Knowledge) ? 0 : 100;
    }
}

// Build monuments, let's cap at 30 so we don't spend forever mining in case of good alum/stone luck
if (vars.autoMonument && projects.Monument.count < 30) {
    /*
    // 1 hightech farm + 2 womling mines, approx cost
    keepSteel: 1_580_000 + 1_130_000 + 1_300_000,
    mineFor: [resources.Stone.id, resources.Aluminium.id],
    allowAvian: true,
    */
    const elem = document.getElementById("arpamonument");
    let remainingPartFactor = (100 - elem.__vue__.complete) / 100;
    // Get real cost for the thing
    let realCosts = Object.fromEntries(Object.entries(poly.arpaAdjustCosts(evolve.actions.arpa.monument.cost)).map(([k, v]) => {
        let amount = v() * remainingPartFactor;
        return amount ? [k, amount] : null;
    }).filter(e => e !== null));

    // Monument can be free if it's Cement and we just changed to Avian
    let nextMonumentResourceName = Object.keys(realCosts)[0] ?? null;
    let nextMonumentResourceCost = Object.values(realCosts)[0] ?? 0;
    let tryBuy = false;
    let birdie = false;
    switch (nextMonumentResourceName) {
        case 'Stone':
        case 'Aluminium':
            if (vars.autoMonument.mineFor.includes(nextMonumentResourceName)) {
                tryBuy = true;
            }
            break;

        case 'Cement':
            if (resources.Cement.currentQuantity > (nextMonumentResourceCost + (vars.autoMonument.keepCement??0))) {
                tryBuy = true;
            }
            if (resources.Cement.currentQuantity < nextMonumentResourceCost) {
                birdie = true;
            }
            break;

        case 'Steel':
            if (resources.Steel.currentQuantity > (nextMonumentResourceCost + vars.autoMonument.keepSteel)) {
                tryBuy = true;
            }
            break;
        case null:
        case undefined:
            tryBuy = true;
            break;
    }
    //console.info("Next monument: ", nextMonumentResourceName, nextMonumentResourceCost, tryBuy, birdie);

    if (tryBuy) {
        const curRank = elem.__vue__.rank;

        if (birdie && mimicGenus !== "avian") {
            doShapeshift('avian');
            snippetState.stepVars.mimicMonument = true;
        }

        elem.__vue__.build('monument', 100);
        let bought = elem.__vue__.rank > curRank;

        if (!bought) {
            superTrigger(projects.Monument, curRank + 1);
        }
        else if (birdie) {
            doShapeshift(vars.mimic);
            delete snippetState.stepVars.mimicMonument;
        }
    }
}

// Do we need a page redraw?
if (vars.redraw !== vars.redrawSequence) {
    snippetState.vars.redrawSequence = vars.redraw;
    // Ugly: make the main script do it for us
    // @ts-ignore
    state.tabHash = "something different than before";
    // @ts-ignore
    updateTabs(true);
}

// Make more patrol/extractor ships when able
if (vars.patrolMiningCap) {
    // TODO: Figure out a (good) way to interrupt building the ringworld so we don't compete for Money.
    let patrolLimit = vars.patrolMiningCap;
    if (buildings.TauBeltPatrolShip.count < buildings.TauBeltMiningShip.count && buildings.TauBeltPatrolShip.count < patrolLimit) {
        superTrigger(buildings.TauBeltPatrolShip, buildings.TauBeltPatrolShip.count + 1);
    }
    else if (buildings.TauBeltMiningShip.count < patrolLimit && (buildings.TauBeltMiningShip.cost?.Titanium ?? Infinity) < resources.Titanium.currentQuantity) {
        superTrigger(buildings.TauBeltMiningShip, buildings.TauBeltMiningShip.count + 1);
    }
}

// #endregion

// Calc ringworld costs, to be used for job + replicator
const ringworldPartsLeft = 1000 - buildings.TauStarRingworld.count;
const ringworldCosts = {
    Neutronium: 5040 * ringworldPartsLeft,
    Orichalcum: 6300 * ringworldPartsLeft,
    Unobtainium: 91 * ringworldPartsLeft,
    Adamantite: 50400 * ringworldPartsLeft,
    Bolognium: 4435 * ringworldPartsLeft,
    Nano_Tube: 17600 * ringworldPartsLeft,

    // Actually for Garden of Eden, and this purposefully underestimates the amount needed very slightly.
    // Ideally we build the GoE almost instantly so we don't "waste" Orichalcum we could have gotten from patrols.
    // Real cost is 2.55M
    Graphene: vars.replicateEdenGraphene ? 2_540_000 : 0,
    // GoE. Start making the Elerium towards the end only
    // Handled using minElerium
    //Elerium: ringworldPartsLeft < 50 ? 5090 : 0,
};

// Handle main job: Usually 'auto', sometimes 'science', sometimes 'mine'
const pitMinerResources = [
    resources.Bolognium,
    resources.Adamantite,
    resources.Stone,
    resources.Copper,
    resources.Iron,
    resources.Aluminium,
    resources.Coal,
    resources.Chrysotile,
];
// If auto, figure out if we need pit resources or not
let targetJob = vars.job;
if (targetJob === "auto") {
    let needPit = Object.values(triggers).some((trg) => {
        return Object.entries(trg.cost).some(([k, v]) => {
            let r = resources[k];
            return pitMinerResources.includes(r) && r.currentQuantity < v;
        });
    });
    let needPitRingworld = vars.ringworldMode && (ringworldCosts.Adamantite > resources.Adamantite.currentQuantity || ringworldCosts.Bolognium > resources.Bolognium.currentQuantity);

    let knowledgeFull = resources.Knowledge.storageRatio >= 1;
    let knowledgeMiner = vars.knowledgeFullMining && knowledgeFull;

    let needCement = false && vars.mimic !== "avian" && mimicGenus !== "avian" && mimicGenusStart !== "avian";

    // || knowledgeFull
    targetJob = (needPit || needPitRingworld || knowledgeMiner) ? 'mine' : 'science';
}

let realTargetJob = null;
switch (targetJob) {
    case 'science':
        // @ts-ignore
        realTargetJob = jobs.Scientist.max ? jobs.Scientist : jobs.Professor;
        break;
    case 'mine':
    default:
        // @ts-ignore
        realTargetJob = jobs.PitMiner;
        break;
}
// @ts-ignore
Object.values(jobs).forEach(job => {
    settings[`job_b1_${job._originalId}`] = job === realTargetJob ? 1000 : 0;
});

// Set Tau Colony power limit based on available support
// TODO: We can min/max by only having the disease lab OR the pit mine on based on our job
let requiredTauSupport = 0;
requiredTauSupport += 1; // Pit mine, always 1
requiredTauSupport += buildings.TauDiseaseLab.count; // Science lab
requiredTauSupport += Math.min(vars.factoryLimit > 0 ? vars.factoryLimit : 100, buildings.TauFactory.count); // Factory
let totalTauSupport = (buildings.TauOrbitalStation.count * 3) + buildings.TauFarm.count;
let supportableColonies = Math.floor((totalTauSupport - requiredTauSupport) / 2);
settings["bld_m_tauceti-colony"] = supportableColonies;

// TODO: This is here because we'll need it here for the min/maxing
settings["bld_m_tauceti-mining_pit"] = 1;
settings["bld_m_tauceti-infectious_disease_lab"] = 1;

// Handle replicator
const minHe3 = 5_000;
const minElerium = (ringworldPartsLeft < 50 && resources.Elerium.maxQuantity >= 5000) ? 5000 : 500;
let goodReplicatorResources = [
    resources.Helium_3,
    resources.Elerium,
    resources.Oil,

    buildings.TauGasOreRefinery.count === 0 ? resources.Steel : null,
    resources.Unobtainium,
    resources.Orichalcum,
    resources.Neutronium,
    resources.Graphene,
    resources.Brick, // shouldn't be needed too often
    // Cement is normally not needed and should be cement workered even if it would be. But this is to avoid getting stuck before we have cement worker unlocked.
    vars.replicateCement ? resources.Cement : null,
].filter(r => r !== null);
const goodReplicatorResourceNames = goodReplicatorResources.map(r => r.id);
let replicatorResource = null;

// Do we need fuel?
if (resources.Helium_3.currentQuantity < minHe3) {
    replicatorResource = resources.Helium_3;
}
else if (resources.Elerium.currentQuantity < minElerium) {
    replicatorResource = resources.Elerium;
}

// Then check for buildings currently triggered & their costs (this includes Ringworld current part if we're building it)
// TODO: This is so incredibly crude...
if (!replicatorResource) {
    let neededReplicator = {};
    triggers.forEach(trg => {
        Object.entries(trg.cost).forEach(([k, v]) => {
            if (!replicableResources.includes(k)) return;
            if (!goodReplicatorResourceNames.includes(k)) return;

            let r = resources[k];
            if (r.currentQuantity < v) {
                neededReplicator[k] = v;
            }
        });
    });

    if (Object.keys(neededReplicator).length) {
        let firstKey = Object.keys(neededReplicator)[0];
        replicatorResource = resources[firstKey];
    }
}

// Then finally prep stuff for Ringworld if we still don't have a resource
if (!replicatorResource) {
    // Higher = more replicator time spent on it
    const ttfWeightings = {
        Orichalcum: 1,
        Neutronium: 1,
    };

    // Calculate the time-to-fill
    let tryOrder = [
        resources.Neutronium,
        resources.Orichalcum,
        resources.Unobtainium,
        // We'll get Bolog by accident from pit mining for Adamantite, most likely
        ringworldCosts.Adamantite < resources.Adamantite.currentQuantity ? resources.Bolognium : null,
        resources.Graphene,
    ]
        .filter(r => r !== null)
        .filter(r => ringworldCosts[r.id] && r.currentQuantity < ringworldCosts[r.id])
        .map(r => {
            let ringworldNeed = ringworldCosts[r.id] ?? 0;
            let replicatingOf = (game.breakdown.p.consume?.[r.id]?.Replicator ?? 0) + (game.breakdown.p.consume?.[r.id]?.Alchemy ?? 0);
            let timeToFill = Math.max((ringworldNeed - r.currentQuantity) / Math.max(0.01, r.rateOfChange - replicatingOf), 0);
            if (!isFinite(timeToFill)) timeToFill = 0;
            timeToFill *= ttfWeightings[r.id] ?? 1;

            return {
                resource: r,
                timeToFill,
            };
        })
        .sort((a, b) => a.timeToFill - b.timeToFill);
    replicatorResource = tryOrder[tryOrder.length - 1]?.resource || undefined;
}

// We should really have a replicatorResource now, set it to high prio
// Otherwise just fall back to user's settings, I guess
if (replicatorResource) {
    //console.info("Replicator: %o", replicatorResource);
    settings[`replicator_${replicatorResource.id}`] = true;
    settings[`replicator_p_${replicatorResource.id}`] = 1e20;
}

// Demand Nano Tubes for Ringworld
if (vars.ringworldMode) {
    if (resources.Nano_Tube.currentQuantity < ringworldCosts.Nano_Tube) {
        trigger.custom({
            Nano_Tube: ringworldCosts.Nano_Tube,
        });
    }
}

// Respawn us if needed
if (resources.Population.currentQuantity === 0 && buildings.TauAssembly.isUnlocked()) {
    buildings.TauAssembly.click();
}

// Handle misc settings
settings["govSpace"] = vars.gov;
settings["bld_m_tauceti-tau_factory"] = vars.factoryLimit;
