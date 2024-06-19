// Can be used for TP4 prep, or to prep Wrought Iron for the Embassy early if you know you don't need more crafteds.
// You can trigger resources like this:

if (techIds["tech-isolation_protocol"].isUnlocked()) {
    trigger(resourceList({
        Mythril: 70e6,
        Bolognium: 50e9,
        Graphene: 210e6,
    }));
}

