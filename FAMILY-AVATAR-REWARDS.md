# Family Avatar Studio

From the Family Message Board, tap the avatar beside the menu. **My Avatar** has seven human, monster, and robot starter bodies. Choose a body and clothes, then drag to turn through the illustrated views. Use the arrow controls to turn, **Spin** to look around, and **Zoom in** to inspect fabric, facial hair, or equipment. Tap **Fit** to see the full figure again and **Reset view** to return to the front. The selection and camera are independent.

The **Unlockables** collection has 336 game rewards including 51 pets. Filter by slot or game, try an item on, and use its action in the preview. **Play to Unlock** opens the game listed for that achievement. Save a look to use it on the board or store it in one of six outfit slots. Shared family profiles offer **Inspect full avatar** when the member shares a character.

Use **Pets** to adopt, name, pet, and play with an earned creature. A pet learns its trick at bond six. **Take along** adds it to your draft. Family gifts and swaps require the recipient to accept. Pet names and bonds follow the pet and the game achievement stays with the original earner.

The 70 achievements cover Mahjong, w0rdle, Word Quest, License Plates, Hot Rod, Star Squadron, Mystery Maze, Dash Forge, cross-game milestones and cooperative family play. Starter awards use goals such as clearing one Mahjong board or revealing a useful letter. The most demanding rewards use higher personal results, distinct solved days, or Hot Rod campaign wins. One reward can have several explicit requirements. Each private License Plates reward also has a route through a game available to the whole family. Drawing Studio saves locally and supplies no verified achievement record.

Players can follow each requirement directly into its game. The game’s exit control takes them back to their in-progress character and refreshes achievement data. Earned outfits follow the account. The board shows new rewards once per achievement after acknowledgment, with reduced-motion support.

## Integration

The full-body migration accepts a bounded optional wardrobe on the existing saved recipe, verifies compatible body parts, and adds cosmetics to the established catalog. Profile photos and legacy recipes still load through their existing projections.

Migration `20261114213858_family_avatar_rewards` derives credit from existing game records and uses unique activity achievements for each approved member. Public API entry points bind requests to the authenticated member. The character projection checks approval and profile sharing before returning designs. The existing profile and image APIs still manage privacy and photos. Taking a character off preserves its last saved recipe. Trying or saving a character does not upload a canvas snapshot to storage.

The browser smoke suite uses local fictional accounts and exercises the published frontend modules, including the real arcade shell. The embedded database suite uses local games and roles to check ownership, persistence, idempotence, visibility, and restoration of photos. A physical Samsung Family Hub requires a separate device check. Roll back the frontend via GitHub if necessary. The additive migration can remain in place to retain earned rewards.

## References

- Roblox avatar customization and shop try-on. https://en.help.roblox.com/hc/en-us/articles/203313600-Customizing-Your-Avatar
- Xbox achievement progress. https://learn.microsoft.com/en-us/gaming/gdk/docs/services/player-data/achievements/title-managed/how-to/title-managed-achievements
- W3C minimum target size. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
