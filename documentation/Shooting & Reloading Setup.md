# Acknowledgement  
This macro is actually several macros with one goal: To completely overhaul the ammo usage of the core system by introducing new features, a way to handle grenades and other consumable weapons, sound effects and more. It even supports ammo for melee weapons.  
In order to use one of these macros, you first need to do some initial setup. This is required because the macro relies heavily on additional stats from the SWADE system. Currently these must be provided by the user but hopefully I can provide them with the module itself.  

# Additional Stats  
If you don't know about additional stats, you can read about them [here](https://gitlab.com/peginc/swade/-/wikis/settings/setting-configurator).  

## Setup of Additional Stats  
Head to the System Settings, click on the "Open Setting Configurator button and scroll down. You can create additional stats for items there. The screenshot below shows the stats you need to create. The "Stat Key", "Data Type" and "Has Max Value" must be set up exactly like in the Screenshot. Only the "Label" may be different.  
  
Don't forget to save when you're done.  
## Explanation  
Here is an explanation on what each of these do. Read it carefully as it will tell you on which items these need to be set up.  
- "isPack" (ammo items): Marks an items as a charge pack. If a weapon uses this as ammunition, it will only use *one quantity* of the ammo to reload the entire weapon; remaining shots are lost upon reloading or changing the ammo type. This is something like a battery or gas tank.  
- "loadedAmmo" (weapons): This shows which ammo is currently loaded in the weapons magazine or the like. It is important for the macro to know what ammo type is currently loaded in the weapon, when changin the ammo type. The macro can then put remaining shots back in the quantity of the previously loaded ammo unless it's a charge pack).  
- "isConsumable" (consumable weapons): Consumable weapons are most commonly thrown weapons like daggers, knifes, grenades, spears and the like. This stat will tell the macro that it shall reduce the *quantity* of the weapon, instead of the shots (this is important because of the carry weight calculation, which doesn't work with the shots stats of weapons).  
- "sfx" (weapons): Here you can set up all the sfx of a weapon. See below for further details.  
- "silenced" (weapons): Some weapons may be equipped with a suppressor. You only need to activate this on weapons which can be equipped with a suppressor. If the checkbox is checked on a weapon, the macro uses another sound effect if set up on the "sfx" stat.  

## The sfx stat  
This is a tricky one, please read carefully:  
Here you can set up all the sound effects you want in a weapon, seperated by pipe/bar, this is a vertical line and looks like this: |  
The fact that there are multiple sound effects in a single stat makes it rather crowded and hard to read for the user but it is the best solution I came up with which I can do as of yet.  
Here is a sample which shows the correct order of the sound effects:  
`RELOAD|FIRE|AUTOFIRE|SILENCED|SILENCEDAUTOFIRE|EMPTY`  
I suggest to use this template and populate it with the relative file paths of your sound effects one at a time. The macro will **not** fail if one sound isn't given. You may just leave the default in the template or type "NULL" or something in it. If you want no sounds at all, just leave it empty or don't activate the additional stat at all.  
- RELOAD: The sfx to be played on reloading the weapon.  
- FIRE: The sfx to be played on firing the weapon.  
- AUTOFIRE: This is for automatic guns. Whenever 5 or more bullets are spent, it will use this sound.  
- SILENCED: This is used if the "silenced" stat is checked instead of the regular FIRE sound.  
- SILENCEDAUTOFIRE: Same as above but played when 5 or more bullets are spent.  
- EMPTY: This sound is played when the weapon is empty and the player tries to fire it anyway.  
Note that currently no three round burst sfx is supported. Doing this would mean introducing two more variables (burst and burst for suppressed weapons). I thought this would be a bit too much. Let me know if you really need it.  
One of the easiest things to do to get the relative file paths of your weapon sounds is adding them to playlists and then just copy the file path from there into the template.  

# Ammunition  
The core system currently supports this stat on a weapon but unfortunately it is not shown until you activate the ammo management of the system. But we want to not use the systems default ammo management. I've created a request to also show it when ammo management is disabled. For now we need a workaround though. Fortunately, there is one:  

## Setting up ammunition  
Head to the System Settings, click on the "Open Setting Configurator button and find the checkbox for "Ammunition Management". Check it.  
Now open all your weapon items that use ammunition and click on their "Actions & Effects" tab. You'll find a row called "Ammunition" there. Populate it with the **exact** names of the ammunition items this weapon shall use. I can't stress enough that the names must be **exact**. Double check this.  
You can actually set up multiple ammunition types for each weapon. To do so, just seperate them with pipe/bar as with the sfx stat above. Here is an example:  
`Bullets, Large|Bullets, Large (AP)|Bullets, Large (Hollow Point)`  
Don't use spaces unless the ammo items contain them. If the weapon uses only one ammo type, just enter the **exact** name and forget about the |. Ammo items must be of type "gear".  
You may also set up ammunition for melee weapons if they use any. Examples inglude the Gunblade from Final Fantasy VIII or the Shishkebab from Fallout. Or a simple ol' chainsaw. You **must not** enter ammunition for melee weapons which don't use any.  
When you're done head back to the System Settings, click on the "Open Setting Configurator button and find the checkbox for "Ammunition Management" once again. Uncheck it. This will disable the systems ammo management but unfortunately also hide the "Ammunition" row. Don't worry though, the stat is still stored in the item including whatever you've just entered. The only downside to this workaround is that you can't quickly edit the accepted ammo, so **double check** for **exact** names. You can always activate the Ammunition Management option in the settings to make changes though.  