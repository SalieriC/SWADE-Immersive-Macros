/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Effect Builder.
 * This allows users to apply power effects to any token
 * no matter if they have ownership or not. It respects
 * the standard rules and increased duration from the
 * concentration edge.
 * 
 * v. 1.0.0
 * By SalieriC#8263; dialogue resizing by Freeze#2689.
 ******************************************************/

export async function effect_builder() {
    if (!game.modules.get("warpgate")?.active) {
        ui.notifications.error(game.i18n.localize("SWIM.notification.warpgateRequired"));
        console.error("The SWIM Effect Builder macro requires Warp Gate by honeybadger. It is needed to replace the token. Please install and activate Warp Gate to use the Shape Changer macro: https://foundryvtt.com/packages/warpgate - If you enjoy Warp Gate please consider donating to honeybadger at his KoFi page: https://ko-fi.com/trioderegion")
        return;
    }
    // Targets:
    const targets = game.user.targets
    const { speaker, _, __, token } = await swim.get_macro_variables()
    if (!token || canvas.tokens.controlled.length > 1 || targets.size === 0) {
        ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleTargetMultiToken"))
        return
    }

    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    let duration = 5
    const concentration = token.actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration") && i.type === "edge")
    if (concentration) { duration = duration * 2 }

    const options = `
        <option value="boost">${game.i18n.localize("SWIM.power-boostTrait")}</option>
        <option value="burden">${game.i18n.localize("SWIM.power-easeBurden-tes")}</option>
        <option value="growth">${game.i18n.localize("SWIM.power-growth")}</option>
        <option value="lower">${game.i18n.localize("SWIM.power-lowerTrait")}</option>
        <option value="protection">${game.i18n.localize("SWIM.power-protection")}</option>
        <option value="shrink">${game.i18n.localize("SWIM.power-shrink")}</option>
        <option value="sloth">${game.i18n.localize("SWIM.power-sloth")}</option>
        <option value="smite">${game.i18n.localize("SWIM.power-smite")}</option>
        <option value="speed">${game.i18n.localize("SWIM.power-speed")}</option>
    `

    // Boost/Lower trait options
    let traitOptions = `
        <option value="agility">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrAgi")}</option>
        <option value="smarts">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrSma")}</option>
        <option value="spirit">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrSpr")}</option>
        <option value="strength">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrStr")}</option>
        <option value="vigor">${game.i18n.localize("SUCC.dialogue.attribute")} ${game.i18n.localize("SWADE.AttrVig")}</option>
    `
    // Getting traits of each target, reducing the options to only those traits every one of them has:
    let skills = []
    let targetIDs = []
    for (let target of targets) {
        const targetSkills = target.actor.items.filter(s => s.type === "skill")
        for (let targetSkill of targetSkills) {
            skills.push(targetSkill.name)
        }
        targetIDs.push(target.id)
    }
    const skillsFiltered = skills.filter((a, i, aa) => aa.indexOf(a) === i && aa.lastIndexOf(a) !== i);
    for (let each of skillsFiltered) {
        traitOptions = traitOptions + `<option value="${each.toLowerCase()}">${game.i18n.localize("SUCC.dialogue.skill")} ${each}</option>`
    }

    let text = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoost", { trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions })

    new Dialog({
        title: game.i18n.localize("SWIM.dialogue-powerEffectBuilderTitle"),
        content: game.i18n.format("SWIM.dialogue-powerEffectBuilderContent", { class: officialClass, options: options, text: text }),
        buttons: {
            one: {
                label: `<i class="fas fa-magic"></i> Proceed`,
                callback: async (html) => {
                    const selectedPower = html.find(`#selected_power`)[0].value
                    const usePowerIcons = game.settings.get("swim", "effectBuilder-usePowerIcons")
                    if (selectedPower === "boost") {
                        const selectedTrait = html.find(`#selected_trait`)[0].value
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-boost").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: "boost",
                            boost: {
                                degree: degree,
                                trait: selectedTrait,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "lower") {
                        const selectedTrait = html.find(`#selected_trait`)[0].value
                        const raise = html.find(`#raise`)[0].checked
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-lower").toLowerCase()))
                        const icon = power ? power.img : false
                        let degree = "success"
                        if (raise === true) { degree = "raise" }
                        const data = {
                            targetIDs: targetIDs,
                            type: "lower",
                            lower: {
                                degree: degree,
                                trait: selectedTrait,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "protection") {
                        const bonus = Number(html.find(`#protectionAmount`)[0].value)
                        const selectedType = html.find("input[name=type_choice]:checked").val()
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-protection").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "protection",
                            protection: {
                                bonus: bonus,
                                type: selectedType,
                                duration: 1,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "smite") {
                        const bonus = Number(html.find(`#damageBonus`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-smite").toLowerCase()))
                        const icon = power ? power.img : false
                        let weapons = []
                        for (let target of targets) {
                            const targetWeaponName = html.find(`#${target.id}`)[0].value
                            weapons.push({ targetID: target.id, weaponName: targetWeaponName })
                        }
                        const data = {
                            targetIDs: targetIDs,
                            type: "smite",
                            smite: {
                                bonus: bonus,
                                weapon: weapons,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "growth") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-growth").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "growth",
                            growth: {
                                change: change,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "shrink") {
                        const change = Number(html.find(`#sizeAmount`)[0].value)
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-shrink").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "shrink",
                            shrink: {
                                change: change,
                                duration: duration,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "sloth") {
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-sloth").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "sloth",
                            sloth: {
                                change: 0.5,
                                duration: 1,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "speed") {
                        const quickness = html.find(`#quickness`)[0].checked;
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-speed").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "speed",
                            speed: {
                                change: 2,
                                duration: duration,
                                quickness: quickness,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    } else if (selectedPower === "burden") {
                        const change = Number(html.find(`#die_steps`)[0].value)
                        if (change === 0) {
                            ui.notifications.warn(game.i18n.localize("SWIM.notififaction.enterNumberUnequalZero"))
                            return
                        }
                        const power = token.actor.items.find(p => p.type === "power" && p.name.toLowerCase().includes(game.i18n.localize("SWIM.power-burden-tes").toLowerCase()))
                        const icon = power ? power.img : false
                        const data = {
                            targetIDs: targetIDs,
                            type: "burden",
                            burden: {
                                change: change,
                                duration: duration,
                                durationNoCombat: concentration ? 20*60 : 10*60,
                                icon: usePowerIcons ? icon : false
                            }
                        }
                        warpgate.event.notify("SWIM.effectBuilder", data)
                    }
                }
            }
        },
        render: ([dialogContent]) => {
            $("#power-effect-dialogue").css("height", "auto"); // Adjust the dialogue to its content. Also fixes the error of scroll bar on first dialogue after login/reload.
            dialogContent.querySelector(`select[id="selected_power"`).focus();
            dialogContent.querySelector(`select[id="selected_power"`).addEventListener("input", (event) => {
                const textInput = event.target;
                const form = textInput.closest("form")
                const effectContent = form.querySelector(".effectContent");
                const selectedPower = form.querySelector('select[id="selected_power"]').value;
                if (selectedPower === "boost") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderBoost", { trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions })
                } else if (selectedPower === "lower") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderLower", { trait: game.i18n.localize("SUCC.dialogue.trait"), traitOptions: traitOptions })
                } else if (selectedPower === "protection") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderProtection", { amountText: game.i18n.localize("SUCC.dialogue.amount_to_increase") })
                } else if (selectedPower === "smite") {
                    //Get weapons for everyone
                    let allHTML = []
                    for (let target of targets) {
                        const targetWeapons = target.actor.items.filter(w => w.type === "weapon" && w.data.data.quantity >= 1)
                        if (targetWeapons.length >= 1) {
                            let weaponOptions
                            for (let weapon of targetWeapons) {
                                weaponOptions = weaponOptions + `<option value="${weapon.name}">${weapon.data.name}</option>`
                            }
                            let html = `
                                <div class='form-group'>
                                    <label for='${target.id}'><p>${game.i18n.localize("SWIM.dialogue-powerEffectBuilderSmiteWeaponOf")} ${target.name}:</p></label>
                                    <select id='${target.id}'>${weaponOptions}</select>
                                </div>
                            `
                            allHTML = allHTML += html
                        }
                    }
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderSmite", { allHTML: allHTML, increaseText: game.i18n.localize('SUCC.dialogue.amount_to_increase') })
                } else if (selectedPower === "growth") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderGrowth")
                } else if (selectedPower === "shrink") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderShrink")
                } else if (selectedPower === "sloth") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderNothingElse")
                } else if (selectedPower === "speed") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderSpeed")
                } else if (selectedPower === "burden") {
                    effectContent.innerHTML = game.i18n.format("SWIM.dialogue-powerEffectBuilderBurden")
                }
            });
        },
        default: "one",
    }, {
        id: "power-effect-dialogue"
    }).render(true);
}

export async function effect_builder_gm(data) {
    const type = data.type
    if (type === "boost") {
        for (let target of data.targetIDs) {
            const boostData = {
                boost: {
                    degree: data.boost.degree,
                    trait: data.boost.trait,
                    duration: data.boost.duration,
                    icon: data.boost.icon
                }
            }
            await succ.apply_status(target, 'boost', true, false, boostData)
        }
    } else if (type === "lower") {
        for (let target of data.targetIDs) {
            const lowerData = {
                lower: {
                    degree: data.lower.degree,
                    trait: data.lower.trait,
                    duration: data.lower.duration,
                    icon: data.lower.icon
                }
            }
            await succ.apply_status(target, 'lower', true, false, lowerData)
        }
    } else if (type === "protection") {
        for (let target of data.targetIDs) {
            const protectionData = {
                protection: {
                    bonus: data.protection.bonus,
                    type: data.protection.type,
                    duration: data.protection.duration,
                    icon: data.protection.icon
                }
            }
            await succ.apply_status(target, 'protection', true, false, protectionData)
        }
    } else if (type === "smite") {
        for (let target of data.smite.weapon) {
            const smiteData = {
                smite: {
                    bonus: data.smite.bonus,
                    weapon: target.weaponName,
                    duration: data.smite.duration,
                    icon: data.smite.icon
                }
            }
            await succ.apply_status(target.targetID, 'smite', true, false, smiteData)
        }
    } else if (type === "growth") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.growth.change
            let aeData = {
                changes: [],
                icon: data.growth.icon ? data.growth.icon : "modules/swim/assets/icons/effects/m-growth.svg",
                label: game.i18n.localize("SWIM.power-growth"),
                duration: {
                    rounds: data.growth.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            const targetStr = target.actor.data.data.attributes.strength.die.sides + change*2
            if (targetStr <= 12) {
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: change*2 })
            } else {
                const toMax = 12 - target.actor.data.data.attributes.strength.die.sides
                const rest = change - (toMax/2)
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: toMax },
                { key: `data.attributes.strength.die.modifier`, mode: 2, priority: undefined, value: rest })
            }
            aeData.changes.push({ key: `data.stats.size`, mode: 2, priority: undefined, value: change })
            if (target.actor.data.data.details.autoCalcToughness === false) {
                aeData.changes.push({ key: `data.stats.toughness.value`, mode: 2, priority: undefined, value: change })
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "shrink") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.shrink.change
            let aeData = {
                changes: [],
                icon: data.shrink.icon ? data.shrink.icon : "modules/swim/assets/icons/effects/m-shrink.svg",
                label: game.i18n.localize("SWIM.power-shrink"),
                duration: {
                    rounds: data.shrink.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            const targetStr = target.actor.data.data.attributes.strength.die.sides + change*2
            if (targetStr <= 4) {
                const toMin = 4 - target.actor.data.data.attributes.strength.die.sides
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: toMin })
            } else {
                aeData.changes.push({ key: `data.attributes.strength.die.sides`, mode: 2, priority: undefined, value: change*2 })
            }
            aeData.changes.push({ key: `data.stats.size`, mode: 2, priority: undefined, value: change })
            if (target.actor.data.data.details.autoCalcToughness === false) {
                aeData.changes.push({ key: `data.stats.toughness.value`, mode: 2, priority: undefined, value: change })
            }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "speed") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.speed.change
            const quickness = data.speed.quickness
            let aeData = {
                changes: [{ key: `data.stats.speed.value`, mode: 5, priority: undefined, value: target.actor.data.data.stats.speed.value * change }],
                icon: data.speed.icon ? data.speed.icon : quickness ? "modules/swim/assets/icons/effects/m-quickness.svg" : "modules/swim/assets/icons/effects/m-speed.svg",
                label: quickness ? game.i18n.localize("SWIM.power-speedQuickness") : game.i18n.localize("SWIM.power-speed"),
                duration: {
                    rounds: data.speed.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "sloth") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.sloth.change
            let aeData = {
                changes: [{ key: `data.stats.speed.value`, mode: 5, priority: undefined, value: Math.round(target.actor.data.data.stats.speed.value * change) }],
                icon: data.sloth.icon ? data.sloth.icon : "modules/swim/assets/icons/effects/m-sloth.svg",
                label: game.i18n.localize("SWIM.power-sloth"),
                duration: {
                    rounds: data.sloth.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    } else if (type === "burden") {
        for (let targetID of data.targetIDs) {
            const target = game.canvas.tokens.get(targetID)
            const change = data.burden.change
            let aeData = {
                changes: [{ key: `data.attributes.strength.encumbranceSteps`, mode: 2, priority: undefined, value: change }],
                icon: data.burden.icon ? data.burden.icon : change > 0 ? "modules/swim/assets/icons/effects/m-ease_burden.svg" : "modules/swim/assets/icons/effects/m-burden.svg",
                label: change > 0 ? game.i18n.localize("SWIM.power-easeBurden-tes") : game.i18n.localize("SWIM.power-burden-tes"),
                duration: {
                    rounds: data.burden.duration,
                },
                flags: {
                    swade: {
                        expiration: 3
                    }
                }
            }
            if (target.combatant != null) { aeData.duration.startRound = game.combat.data.round }
            else { aeData.duration.seconds = data.burden.durationNoCombat }
            await target.actor.createEmbeddedDocuments('ActiveEffect', [aeData]);
        }
    }
}