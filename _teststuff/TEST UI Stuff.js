ui.text("This is just for testing. Nothing useful here!");
let birbMode = ui.toggle(`birb_mode`, `Birb Mode`, false, `Turn birbs on or off`);
for(let i = 0; i < 20; ++i) {
    switch(true) {
        case (i % 4 === 0):
            ui.number(`testsetting${i}_num`, `Test Setting Num ${i}`, i * 1000);
        break;
        case (i % 4 === 1):
            ui.string(`testsetting${i}_str`, `Test ${birbMode ? 'Birb' : 'Population'} String ${i}`, `There are ${i} ${birbMode ? 'birb' : 'population'}`);
        break;
        case (i % 4 === 2):
            ui.toggle(`testsetting${i}_tog`, `Test Setting Toggle ${i}`, false, `Example toggle`);
        break;
        case (i % 4 === 3):
        // todo
        break;
    }
}
