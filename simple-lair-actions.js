const MODULE = "simple-lair-actions";

Hooks.on("preCreateCombatant", combatant => {
  const actor = combatant.actor;
  // The combatant has a lair action
  if (combatant.data.tokenId && !!actor?.data.data.resources.lair?.value) {
    // Create a combatant with no token for the lair action. Store some
    // data in the flags object to make it identifiable for the other
    // hooks.
    setTimeout(() => {
      // Debounce this or they'll sometimes disappear
      combatant.parent.createEmbeddedDocuments("Combatant", [
        {
          name: "Lair Action: " + combatant.name,
          hidden: true,
          initiative: actor.data.data.resources.lair.initiative,
          img: "icons/sundries/flags/banner-yellow.webp",
          actorId: actor.id,
          flags: {
            [MODULE]: {
              init: actor.data.data.resources.lair.initiative,
              token: combatant.data.tokenId,
            },
          },
        },
      ]);
    }, 50);
  }
});

Hooks.on("preUpdateCombatant", (combatant, diff) => {
  const combat = combatant.parent;
  if ("initiative" in diff && combatant.getFlag(MODULE, "init")) {
    // Reset the initiative value on the lair action if cleared.
    diff.initiative = combatant.getFlag(MODULE, "init");
  }
  if ("defeated" in diff && !!combatant.data.tokenId) {
    // Set the defeated status on the lair action to match the owning combatant
    let lair = combat.combatants.find(t => t.getFlag(MODULE, "token") === combatant.data.tokenId);
    console.log(lair);
    if (!!lair) {
      const data = lair.data.toObject();
      data.defeated = diff.defeated;
      combat.updateEmbeddedDocuments("Combatant", [data]);
    }
  }
});

Hooks.on("preUpdateCombat", (_c, diff) => {
  if ("combatants" in diff) {
    diff.combatants = diff.combatants.map(c => {
      const init = c.flags[MODULE]?.init;
      if (init) c.initiative = init;
      return c;
    });
  }
});

Hooks.on("preDeleteCombatant", combatant => {
  if (!combatant.token) return;
  const combat = combatant.parent;
  // Delete any lair actions owned by the combatant
  const lair = combat.combatants.find(
    t => t.getFlag(MODULE, "token") && t.getFlag(MODULE, "token") === combatant.data.tokenId
  );
  // Race condition in Combat._onDeleteEmbeddedDocuments
  // Only happens when this is the last one. Log as a warning
  lair?.delete().catch(console.warn);
});
