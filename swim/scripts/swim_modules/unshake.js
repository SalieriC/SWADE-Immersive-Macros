/*******************************************
 * Unshake macro for SWD
 * version 4.0.2
 * Original code (an eternity ago) by Shteff, altered by Forien, edited and maintained by SalieriC#8263.
 ******************************************/

export async function unshake_swd_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }

    // Checking for System Benny image.
    let bennyImage = await swim.get_benny_image()
    // Setting up SFX path.
    let shakenSFX = game.settings.get(
        'swim', 'shakenSFX');
    let unshakeSFX;
    if (token.actor.data.data.additionalStats.sfx) {
        let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
        shakenSFX = sfxSequence[0];
        unshakeSFX = sfxSequence[2];
    }

    async function rollUnshake() {

        let edgeNames = [
            game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase(),
            game.i18n.localize("SWIM.ability-demon-hellfrost").toLowerCase(),
            game.i18n.localize("SWIM.ability-construct").toLowerCase(),
            game.i18n.localize("SWIM.ability-undead").toLowerCase(),
            game.i18n.localize("SWIM.ability-amorphous-theAfter").toLowerCase()
        ];
        // Making all lower case:
        edgeNames = edgeNames.map(name => name.toLowerCase())
        const undeadAE = token.actor.effects.find(ae => ae.data.label.toLowerCase() === game.i18n.localize("SWIM.ability-undead").toLowerCase());
        if (undeadAE && undeadAE.data.disabled === false) {
            edgeNames.push('undead')
        } else if (!undeadAE) {
            edgeNames.push('undead')
        }
        const actorAlias = speaker.alias;
        // ROLL SPIRIT AND CHECK COMBAT REFLEXES
        const r = await token.actor.rollAttribute('spirit');
        const edges = token.actor.data.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });

        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><i>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</i>`;
        }
        //Get generic actor unshake bonus and check if it is from an AE:
        const unShakeBonus = token.actor.data.data.attributes.spirit.unShakeBonus;
        let effectName = [];
        let effectIcon = [];
        let effectValue = [];
        if (unShakeBonus != 0 && token.actor.data.effects.size > 0) {
            for (let effect of token.actor.data.effects) {
                if (effect.data.disabled === false) { // only apply changes if effect is enabled
                    for (let change of effect.data.changes) {
                        if (change.key === "data.attributes.spirit.unShakeBonus") {
                            //Building array of effect names and icons that affect the unShakeBonus
                            effectName.push(effect.data.label);
                            effectIcon.push(effect.data.icon);
                            effectValue.push(change.value);
                        }
                    }
                }
            }
            for (let i = 0; i < effectName.length; i++) {
                // Apply mod using parseFloat() to make it a Number:
                rollWithEdge += parseFloat(effectValue[i]);
                // Change indicator in case the modifier from AE is negative:
                let indicator = "+";
                let effectMod = effectValue[i];
                if (parseFloat(effectValue[i]) < 0) {
                    indicator = "-";
                    effectMod = effectValue[i].replace("-", "");
                }
                edgeText += `<br/><i>${indicator} ${effectMod} <img src="${effectIcon[i]}" alt="" width="15" height="15" style="border:0" />${effectName[i]}</i>`;
            } //Finally, if the unShakeBonus does not come from an AE apply it generically (as of yet this is just a failsafe but makes the script future proof.)
        } else if (unShakeBonus != 0) {
            rollWithEdge += unShakeBonus;
            edgeText += game.i18n.format("SWIM.chatMessage-unshakeBonusOtherActor", {unShakeBonus: unShakeBonus});
        }

        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", {name : actorAlias, rollWithEdge : rollWithEdge})
        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.data.data.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFail"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", {name : actorAlias});
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rollWithEdge > 3 && rollWithEdge <= 7) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCannotAct");
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
                useBenny();
            } else if (rollWithEdge >= 8) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCanAct");
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
            } else {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultStillShaken");
                useBenny();
            }
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    async function useBenny() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0) {
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-spendBennyTitle"),
                content: game.i18n.format("SWIM.dialogue-spendBennyText", {totalBennies : totalBennies}),
                buttons: {
                    one: {
                        label: game.i18n.localize("SWIM.dialogue-yes"),
                        callback: async (_) => {
                            await swim.spend_benny(token);
                            //Chat Message to let the everyone knows a benny was spent
                            ChatMessage.create({
                                user: game.user.id,
                                content: game.i18n.format("SWIM.dialogue-spentBennyToUnshake", {bennyImage : bennyImage, player : game.user.name, name : token.name}),
                            });
                            await succ.apply_status(token, 'shaken', false)
                        }
                    },
                    two: {
                        label: game.i18n.localize("SWIM.dialogue-no"),
                        callback: (_) => { return; },
                    }
                },
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    if (await succ.check_status(token, 'shaken') === true) {
        rollUnshake()
    } else if (token) {
        await succ.apply_status(token, 'shaken', true)
        if (shakenSFX) {
            AudioHelper.play({ src: `${shakenSFX}` }, true);
        }
    }
    /// v.3.9.2 Original code by Shteff, altered by Forien and SalieriC#8263, thanks to Spacemandev for the help as well. Fixed by hirumatto.
}

/*******************************************
 * Unshake macro for SWADE
 * version 4.0.2
 * Original code (an eternity ago) by Shteff, altered by Forien, edited and maintained by SalieriC#8263.
 ******************************************/

export async function unshake_swade_script() {
    const { speaker, _, __, token } = await swim.get_macro_variables()

    // No Token is Selected
    if (!token || canvas.tokens.controlled.length > 1) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
        return;
    }

    // Checking for system Benny image.
    let bennyImage = await swim.get_benny_image()

    // Setting up SFX path.
    let shakenSFX = game.settings.get(
        'swim', 'shakenSFX');
    let unshakeSFX;
    if (token.actor.data.data.additionalStats.sfx) {
        let sfxSequence = token.actor.data.data.additionalStats.sfx.value.split("|");
        shakenSFX = sfxSequence[0];
        unshakeSFX = sfxSequence[2];
    }

    async function rollUnshake() {

        let edgeNames = [
            game.i18n.localize("SWIM.edge-combatReflexes").toLowerCase(),
            game.i18n.localize("SWIM.ability-demon-hellfrost").toLowerCase(),
            game.i18n.localize("SWIM.ability-construct").toLowerCase(),
            game.i18n.localize("SWIM.ability-undead").toLowerCase(),
            game.i18n.localize("SWIM.ability-amorphous-theAfter").toLowerCase()
        ];
        // Making all lower case:
        edgeNames = edgeNames.map(name => name.toLowerCase())
        const undeadAE = token.actor.effects.find(ae => ae.data.label.toLowerCase() === game.i18n.localize("SWIM.ability-undead").toLowerCase());
        if (undeadAE && undeadAE.data.disabled === false) {
            edgeNames.push('undead')
        } else if (!undeadAE) {
            edgeNames.push('undead')
        }
        const actorAlias = speaker.alias;
        // ROLL SPIRIT AND CHECK COMBAT REFLEXES
        const r = await token.actor.rollAttribute('spirit');
        const edges = token.actor.data.items.filter(function (item) {
            return edgeNames.includes(item.name.toLowerCase()) && (item.type === "edge" || item.type === "ability");
        });

        let rollWithEdge = r.total;
        let edgeText = "";
        for (let edge of edges) {
            rollWithEdge += 2;
            edgeText += `<br/><i>+ 2 <img src="${edge.img}" alt="" width="15" height="15" style="border:0" />${edge.name}</i>`;
        }
        //Get generic actor unshake bonus and check if it is from an AE:
        const unShakeBonus = token.actor.data.data.attributes.spirit.unShakeBonus;
        let effectName = [];
        let effectIcon = [];
        let effectValue = [];
        if (unShakeBonus != 0 && token.actor.data.effects.size > 0) {
            for (let effect of token.actor.data.effects) {
                if (effect.data.disabled === false) { // only apply changes if effect is enabled
                    for (let change of effect.data.changes) {
                        if (change.key === "data.attributes.spirit.unShakeBonus") {
                            //Building array of effect names and icons that affect the unShakeBonus
                            effectName.push(effect.data.label);
                            effectIcon.push(effect.data.icon);
                            effectValue.push(change.value);
                        }
                    }
                }
            }
            for (let i = 0; i < effectName.length; i++) {
                // Apply mod using parseFloat() to make it a Number:
                rollWithEdge += parseFloat(effectValue[i]);
                // Change indicator in case the modifier from AE is negative:
                let indicator = "+";
                let effectMod = effectValue[i];
                if (parseFloat(effectValue[i]) < 0) {
                    indicator = "-";
                    effectMod = effectValue[i].replace("-", "");
                }
                edgeText += `<br/><i>${indicator} ${effectMod} <img src="${effectIcon[i]}" alt="" width="15" height="15" style="border:0" />${effectName[i]}</i>`;
            } //Finally, if the unShakeBonus does not come from an AE apply it generically (as of yet this is just a failsafe but makes the script future proof.)
        } else if (unShakeBonus != 0) {
            rollWithEdge += unShakeBonus;
            edgeText += game.i18n.format("SWIM.dialogue-SWIM.chatMessage-unshakeBonusOtherActor", {unShakeBonus : unShakeBonus});
        }

        let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultRoll", {name : actorAlias, rollWithEdge : rollWithEdge});
        // Checking for a Critical Failure.
        let wildCard = true;
        if (token.actor.data.data.wildcard === false && token.actor.type === "npc") { wildCard = false }
        let critFail = await swim.critFail_check(wildCard, r)
        if (critFail === true) {
            ui.notifications.notify(game.i18n.localize("SWIM.notification-critFail"));
            let chatData = game.i18n.format("SWIM.chatMessage-unshakeResultCritFail", {name : actorAlias});
            ChatMessage.create({ content: chatData });
        }
        else {
            if (rollWithEdge <= 3) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultRemainShaken");
                useBenny();
            } else if (rollWithEdge >= 4) {
                chatData += game.i18n.localize("SWIM.chatMessage-unshakeResultNoShakenCanAct");
                await succ.apply_status(token, 'shaken', false)
                if (unshakeSFX) { AudioHelper.play({ src: `${unshakeSFX}` }, true); }
            }
            chatData += ` ${edgeText}`;
            ChatMessage.create({ content: chatData });
        }
    }

    async function useBenny() {
        let { _, __, totalBennies } = await swim.check_bennies(token)
        if (totalBennies > 0) {
            new Dialog({
                title: game.i18n.localize("SWIM.dialogue-spendBennyTitle"),
                content: game.i18n.format("SWIM.dialogue-spendBennyText", {totalBennies : totalBennies}),
                buttons: {
                    one: {
                        label: game.i18n.localize("SWIM.dialogue-yes"),
                        callback: async (_) => {
                            await swim.spend_benny(token);
                            //Chat Message to let the everyone knows a benny was spent
                            ChatMessage.create({
                                user: game.user.id,
                                content: game.i18n.format("SWIM.dialogue-spentBennyToUnshake", {bennyImage : bennyImage, player : game.user.name, name : token.name}),
                            });
                            await succ.apply_status(token, 'shaken', false)
                        }
                    },
                    two: {
                        label: game.i18n.localize("SWIM.dialogue-no"),
                        callback: (_) => { return; },
                    }
                },
                default: "one"
            }).render(true)
        }
        else {
            return;
        }
    }

    if (await succ.check_status(token, 'shaken') === true) {
        rollUnshake()
    } else if (token) {
        await succ.apply_status(token, 'shaken', true)
        if (shakenSFX) {
            AudioHelper.play({ src: `${shakenSFX}` }, true);
        }
    }
}
