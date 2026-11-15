# Family Avatar Studio

From the Family Message Board, use the avatar beside the menu or open a reward under **Awesome things to unlock**. **My Avatar** includes 98 free choices, undo and reset, and six outfit slots. **Unlockables** previews all 253 original rewards and lets you filter by type, status, rarity and game. **Achievements** displays the exact requirements and verified progress. Try-ons only affect the studio preview. Save a design to use it as your avatar. The original portrait and legacy character assets stay in storage when you save a new character.

Use a prize’s action in Unlockables or **Activate** beside an item on your character. In **Pets**, preview a locked pet or adopt one you’ve earned. Playing and petting raise the bond. At bond six, the pet learns its trick. The board saves your pet’s name and bond to your account. **Take along** adds the pet to your avatar preview.

| Type | Reward designs |
| --- | ---: |
| Hats | 50 |
| Glasses and masks | 35 |
| Hair | 41 |
| Eyes and face | 30 |
| Props | 28 |
| Pets | 29 |
| Backgrounds | 25 |
| Effects | 15 |

The 49 achievements cover Mahjong, w0rdle, Word Quest, License Plates, Hot Rod, cross-game milestones and cooperative family play. Starter awards use goals such as clearing one Mahjong board or revealing a useful letter. The most demanding rewards use higher personal results, distinct solved days, or Hot Rod campaign wins. One reward can have several explicit requirements. Each private License Plates reward also has a route through a game available to the whole family. Drawing Studio saves locally and supplies no verified achievement record.

Players can follow each requirement directly into its game. The game’s exit control takes them back to their in-progress character and refreshes achievement data. Earned outfits follow the account. The board shows new rewards once per achievement after acknowledgment, with reduced-motion support.

## Integration

Migration `20261114213858_family_avatar_rewards` derives credit from existing game records and uses unique activity achievements for each approved member. Public API entry points bind requests to the authenticated member. The character projection checks approval and profile sharing before returning designs. The existing profile and image APIs still manage privacy and photos. Taking a character off preserves its last saved recipe. Trying or saving a character does not upload a canvas snapshot to storage.

The browser smoke suite uses local fictional accounts and exercises the published frontend modules, including the real arcade shell. The embedded database suite uses local games and roles to check ownership, persistence, idempotence, visibility, and restoration of photos. A physical Samsung Family Hub requires a separate device check. Roll back the frontend via GitHub if necessary. The additive migration can remain in place to retain earned rewards.

## References

- Roblox avatar customization and shop try-on. https://en.help.roblox.com/hc/en-us/articles/203313600-Customizing-Your-Avatar
- Xbox achievement progress. https://learn.microsoft.com/en-us/gaming/gdk/docs/services/player-data/achievements/title-managed/how-to/title-managed-achievements
- W3C minimum target size. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
