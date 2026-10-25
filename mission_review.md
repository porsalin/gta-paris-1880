# Mission review: GTA Paris 1880

This pass reworks all 112 missions (5 acts of 20, plus 12 kiosk side jobs). It covers depth, layering, challenge and period voice.

## What changed
**Engine (game/main.js).** The rendering files (gfx.js, post.js, models.js) were not touched. New step types:
- **tail:** follow a talking mark along a Dijkstra road route. Too close and you are blown; too far and you lose him.
- **eaves:** stay within earshot on foot. The dialogue unspools as your progress builds. Too close, wheels, or a real police chase (2 stars) fail the step.
- **sneak:** guards sweep visible vision cones. A sighting or a hurt guard fails the job.
- **choice:** two marked destinations. The pick is saved in `choices` (localStorage), and later steps carry `only: key=a|b`.
- **timed escapes**, **optional bonus pickups** ("OPTIONAL:"), and mission **intro and outro dialogue**.
- **A subtitle dialogue queue** with the speaker in gold, a persistent objective line, an eavesdrop %, and a "BEING NOTICED" warning.
- The test autopilot (`GAME.solveStep`) covers every new type.

**Data pipeline (gen_story.py, story/act1–5.py, story_data.py).** The DSL gains `//` dialogue, `@` intro, `%` outro, `b` bonus, `?key=val` conditions, `tl` tail, `ev` eavesdrop, `sn` sneak, `ch` choice and `gt` timed goto. Validation includes tail-distance sanity checks. The step mix across the game is goto 102, eaves 57, collect 45, kill 37, sneak 31, survive 30, escort 22, steal 17, tail 15, race 13, deliver 11, destroy 6, hold 6, choice 4, smash 1.

**Story.** Every mission opens on its own hook, and most have a mid-mission twist. The four persistent choices (Moineau, Odile, the ledger, Mourier) branch later missions. Act I teaches the tail, eavesdrop and sneak mechanics singly. By Act V they are combined, with armed bosses and tight timers.

**Voice.** All briefings, chapter cards and dialogue were rewritten in a restrained literary 1880 register. Money is in francs and sous, travel is by cab, omnibus and boat train, and there are magneto phones only for contacts. Anachronisms were removed: no Moulin Rouge (1889), Chat Noir (1881), Galerie Georges Petit (1882), Quat'z'Arts ball (1892) or "Thinker" (Rodin's figure is "my poet, the seated one").

**Historical figures.** Everyone who appears was alive and in Paris in 1880 and is used only as a host, witness or mentor. Bernhardt resigns on 18 April and sails in October. Offenbach dies of illness on 5 October and is mourned in public; the plot plays no part. Viardot, Degas, Cassatt, Morisot, Pissarro, Monet, Manet, Zola, Maupassant, Hugo, Rodin, Nadar, Garnier, Saint-Saëns, Fauré, Massenet, Chabrier, Debussy, Durand-Ruel, Tanguy and Caillebotte are never harmed, killed or made criminals. Every villain (Vaneau, Crane, Mourier, La Pie's handlers) and every crook (Broca's foes, the apaches) is fictional.

## Testing
A Playwright run with tm.py drives every mission with the autopilot, using **112/112 pass on choice path A** and **4/4 branching missions passing on path B**. There were 0 page errors or console errors. Bugs fixed during testing:
- The generic auto-timer overrode eavesdrop duration, so eavesdrops always ran "Out of time".
- The escort autopilot met burning carriages.
- A stray wanted level carried into eavesdrops.

## Example missions

### 1. La Débâcle — *The Breaking of the Ice*
> January. The Seine has frozen and is breaking up with a noise like artillery. Théo comes home to rue Mouffetard and finds the workshop door open to the cold.

*Intro:* Théo: Nineteen clocks on the wall, and every one of them stopped at a quarter past two. Somebody wanted me to know the hour.  

1. **[goto]** Run home to Maître Vallet's workshop before the trail goes cold.
2. **[kill]** Two masked men are still at the strongbox. Throw them out.
   - “Masked man: Leave it, Jojo, it's only the boy!”
3. **[goto]** Vallet is bleeding from the scalp. Fetch a surgeon from the Hôtel-Dieu, and run.
   - “Vallet: Never mind my head. The case, Théo. Is the tourbillon in its case?”
4. **[goto]** Bring the surgeon back to the workshop.

*Outro:* Surgeon: A clean blow, expertly given. Your thieves did not wish to kill him, only to keep him quiet.

*Outro:* Théo: The case is empty, Maître. They left the gold and took the regulator.

*Outro:* Vallet: Then they are not thieves. Thieves take gold.

### 6. Le Moineau — *The Sparrow*
> A barefoot urchin has been watching the workshop for three days. Children do not keep watch for free in January. Follow him and see who pays.

*Intro:* Henri: The little one with the cap? Moineau, they call him. Sharp as a tack. Sold me a dead pigeon once as a live one.  

1. **[tail]** Follow Moineau down the hill without being seen. He looks behind him at every corner.
   - “Moineau: (whistling) Au clair de la lune...”
   - “Moineau: (to a passing soldier) Spare a sou, mon général?”
   - “Moineau: (to himself) Two francs. Two francs for watching a boy watch clocks.”
2. **[eaves]** He meets a man outside the Rat Mort. Get close enough to hear.
   - “Man: Still at the workshop, the apprentice?”
   - “Moineau: Every night. He sleeps in the shavings.”
   - “Man: Then tell La Pie her bird has flown into the right cage. Here. Don't drink it.”
3. **[choice]** You have the boy by the collar. Let him go free at the Abbesses, or hand him to Maza's man at the Rat Mort.
   - A → “Théo: Go on. Tell La Pie I said good evening. Moineau: You're soft, monsieur. I'll remember that. In a good way.”
   - B → “Maza's man: Maza will teach him a better trade. Here's for your trouble. Théo: (pocketing it) Then why do I feel I have sold something?” (+900 F)

*Outro:* Théo: La Pie has a bird-keeper. And La Pie answers to someone who pays in silver.

### 39. Les Tours de Notre-Dame — *The Towers of Notre-Dame*
> Mourier has found out about Odile, and has sent men to bring her in. She has fled to the one place in Paris higher than the Baron's reach: the towers of Notre-Dame.

*Intro:* Maza: If the police get her, the Baron gets her. If we get her, we owe nobody anything. I like that kind of girl.  

1. **[goto]** Get to Notre-Dame before Mourier's men climb the north tower.
2. **[kill]** Fight off Mourier's men on the parvis.
3. **[choice]** Odile is cornered and exhausted. Let her go free on the parvis, or march her to Maza's cab at the Hôtel-Dieu, where Maza will keep her safe and under lock.
   - A → “Odile: You're letting me go? Then I owe you. I hate owing.”
   - B → “Maza: She'll be warm, fed, and locked in. Here's for your trouble, mon petit. And don't look at me like that. Safe is safe.” (+1200 F)
4. **[survive]** Lose the police across the bridges.

*Outro:* Théo: Spring is ending. The Salon closes. And the Baron has lost his magpie.

### 30. Le Jeudi de Madame Viardot — *Madame Viardot's Thursday* ◆ heist
> Pauline Viardot holds her musical Thursdays on the rue de Douai. Tonight an English tenor has been invited, and Lucie is fairly certain he is no tenor.

*Intro:* Lucie: A tenor who has never sung in public, who has three addresses, and who once asked me to forge a Turner. If he sings tonight, I shall eat my bonnet.  

1. **[goto]** Go to the rue de Douai, near Notre-Dame-de-Lorette.
2. **[eaves]** Stand at the back of the music room, and listen to the conversation under the music.
   - “Viardot: Monsieur Crane, will you not sing for us?”
   - “Crane: Alas, madame, I have a cold. An English cold. It lasts for years.”
   - “Viardot: How sad. Then perhaps you will tell my guests why you were in my study.”
   - “Crane: I was admiring your clock, madame. It is a Vallet.”
   - “Viardot: It is, and it is mine. Ivan Sergeyevich gave it me. I should notice if it walked.”
3. **[sneak]** Twist: Crane has left a device inside Viardot's clock. Slip into the study unseen.
4. **[collect]** Take out Crane's little brass cylinder.

*Outro:* Théo: A brass cylinder pinned like a music box, tuned to strike one bell at one moment. Madame Viardot's clock is one of the twelve.

### 45. Le Clocher de Saint-Augustin — *The Saint-Augustin Clock* ◆ heist
> The first of the Baron's clocks to be retuned: the tower of Saint-Augustin. Théo must get in, change Crane's cylinder for one of Broca's, and get out, without the Baron learning that anything has changed.

*Intro:* Broca: Change the cylinder and nothing else. The Baron's man checks every clock on Sundays. If he finds a scratch, he finds you.  

1. **[goto]** Go to Saint-Augustin.
2. **[goto]** *(only if moineau=a)* Moineau is waiting by the sacristy, grinning. He has found the coal chute.
   - “Moineau: You let me go in the winter, monsieur. I don't forget. This way, and mind your head on the coal.”
3. **[sneak]** *(only if moineau=b)* No one is waiting for you. Get past the vergers and the Baron's watchmen alone.
4. **[collect]** Swap Crane's cylinder for Broca's, without leaving a mark.
5. **[survive]** Leave quietly.

*Outro:* Théo: One clock is ours. Eleven to go, and a Baron who must not notice.

## Known gaps
- The choice outcomes are carried in text and the step mix; there are no unique cutscenes or models for them.
- Branch B paths are tested only on the 4 missions that contain `=b` steps.
- Sneak guards use a fixed sweep, with no investigation state.
- Eavesdrop and tail lines are subtitles only, with no voice.
- Dialogue is English with French titles and terms of address. A full French localisation is not done.
