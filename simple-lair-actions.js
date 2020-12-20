Hooks.on("createCombatant", (combat, combatant, options, userId) => {
  if (!game.user.isGM) return;
  if (!combatant.tokenId) return;
  const token = canvas.tokens.get(combatant.tokenId);
  // The combatant has a lair action
  if (!!token.actor.data.data.resources.lair?.value) {
    // Create a combatant with no token for the lair action. Store some
    // data in the flags object to make it identifiable for the other
    // hooks.
    combat.createCombatant({
      name: "Lair Action: " + token.name,
      hidden: true,
      initiative: token.actor.data.data.resources.lair.initiative,
      img: "icons/sundries/flags/banner-yellow.webp",
      flags: {
        lair: {
          init: token.actor.data.data.resources.lair.initiative,
          combatant: combatant._id,
        },
      },
    });
  }
});

Hooks.on("updateCombatant", (combat, combatant, diff, options, userId) => {
  if (!game.user.isGM) return;
  if (
    "initiative" in diff &&
    !!combatant.flags.lair &&
    combatant.flags.lair.init !== diff.initiative
  ) {
    // Reset the initiative value on the lair action if cleared.
    combat.setInitiative(combatant._id, combatant.flags.lair.init);
  }
  if ("defeated" in diff && !!combatant.token) {
    // Set the defeated status on the lair action to match the owning combatant
    let lair = combat.turns.find(t => t.flags.lair?.combatant === combatant._id);
    if (!!lair) combat.updateCombatant({ _id: lair._id, defeated: diff.defeated });
  }
});

Hooks.on("deleteCombatant", (combat, combatant, options, userId) => {
  if (!game.user.isGM) return;
  // Delete any lair actions owned by the combatant
  let lair = combat.turns.find(t => t.flags.lair?.combatant === combatant._id);
  if (!!lair) combat.deleteCombatant(lair._id);
});
