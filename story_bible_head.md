# GTA: Paris 1890 — Story Bible
## *L'Affaire du Tourbillon*: one story in five acts

**Logline.** In 1890, the year after the Exposition Universelle, someone steals a master watchmaker's tourbillon regulator. His apprentice, Théo Marchal, follows the thief from the frozen Seine to the Opéra's hidden vault. Along the way he moves through the studios, salons, concert halls and galleries, cabarets and music halls of a Paris where Neo-Impressionists, poets, chansonniers and composers are remaking art, under Monsieur Eiffel's new tower. The trail leads to a fictional financier's ring of thieves and forgers.

**Tone.** The game's heists are played as caper fiction rather than tragedy. Theft is mostly *re*-theft: forgeries are swapped out and stolen works are rescued, with the art returned to its makers and owners. Violence is aimed only at fictional criminals.

### Rules for historical figures (non-negotiable)
1. Real people appear only as **respectful speaking characters**: hosts, witnesses, mentors, passengers and patrons.
2. No real person is ever a murderer, victim, target, villain or criminal accomplice. Escorted real people are invulnerable. If the escort fails, the historical passenger *walks away shaken*; they never die.
3. Their dialogue is invented but in character. Where a line refers to an event, it is a real 1890 event: the Russian influenza pandemic of the winter, the 6th Salon des Indépendants (20 March; Seurat's *Le Chahut*), the split of the Salon into two (Société nationale des beaux-arts), the Japanese print exhibition at the Beaux-Arts (April), the first May Day, Monet's subscription to buy *Olympia* for the nation, *La Bête humaine*, *Esclarmonde* at the Opéra-Comique (in the Châtelet's Théâtre des Nations since the 1887 fire), Bernhardt's *Cléopâtre* (23 October), the Panama scandal's aftermath, Boulanger in exile in Jersey, the Moulin Rouge (opened October 1889), the Chat Noir on rue de Laval, Bruant at Le Mirliton, and the Panhard-Levassor petrol carriages.
4. Real deaths of 1890 (Vincent van Gogh at Auvers on 29 July, César Franck on 8 November) are mentioned only as news and mourning, never shown and never caused by the plot. Nobody who died before 1890 appears in person.
5. All villains, crimes, artworks named as stolen or forged, and the conspiracy itself are **fictional**.


### The central mystery: the stolen tourbillon
Baron Vaneau (fictional) has fitted twelve chiming clocks in twelve Paris rooms: Saint-Augustin, Viardot's salon, Pleyel, Érard, the Madeleine, the Sorbonne and others, with the **Hôtel de Ville as the twelfth**. Struck in sequence, their chimes open a sound-keyed vault beneath the Opéra. Only Vallet's tourbillon can drive the master clock that keeps them in time. The vault holds a decade of stolen art and forged scores, along with the ledgers that buy the Baron his magistrates.
- **Act I:** the clues are a magpie feather, Tanguy's watch-key and lead white bought by the hundredweight. The trail runs from Moineau the urchin to La Pie, from Crane at the Hôtel Drouot to the Baron and Inspector Mourier.
- **Act II:** Viardot's clock holds Crane's brass cylinder. the musicians of Montmartre read the score, and La Pie is unmasked as **Odile**, the Baron's ward.
- **Act III:** the plan of the twelve clocks is found at the Bibliothèque nationale. Jules Broca, a bell-founder and old Communard, amnestied in 1880, casts the replacement cylinders. The ledger is seized, and the tourbillon taken from a ministry carriage proves to be Crane's copy. The workshop burns.
- **Act V:** the escapement is set twelve seconds slow, so at midnight on Réveillon 1890 the bells ring for the crew and not the Baron.

## Arc and branching choices
Each act has 20 missions, plus 12 kiosk side jobs. Difficulty climbs from act to act: longer tails, more guards in the sneaks, tighter timers, and armed bosses in Acts IV and V. Four choices are remembered and change later missions:
| Key | Where | A | B |
|---|---|---|---|
| moineau | Act I, *Le Moineau* | Spare the boy. In Act III he opens the coal chute at Saint-Augustin. | Sell him to Maza's man for +900 F. You must sneak past four watchmen alone. |
| odile | Act II, *Les Tours de Notre-Dame* | Free her. She joins the crew willingly. | Hand her to Maza for +1200 F. She escapes and must be chased down. |
| ledger | Act III | Lucie prints it. The alarm is up at Érard. | Maza keeps it for +2500 F. You overhear her blackmailing a magistrate. |
| mourier | Act V | Mourier goes to the magistrate. | Mourier goes to the press. The front page (*La Une*) changes. |

## Mission mechanics
- **goto / race / timed escape:** move against the clock.
- **tail:** follow a mark through the streets. Too close (4.5 m) and you are *blown*; more than 38 m away for 6 s and you have *lost him*. The mark talks as he walks.
- **eaves (eavesdrop):** stand on foot within about 9 m of two speakers. Their dialogue builds with your progress. Too close, a vehicle, or rising police attention ends the conversation.
- **sneak:** guards sweep visible vision cones. Being seen for 0.7 s, or harming a guard, fails the job.
- **choice:** reach one of two marked places to decide. The outcome is saved and changes later steps (steps carry `only: key=a|b`).
- **optional bonus:** a marked "OPTIONAL" pickup in many missions. It adds money and is recorded.
- **Intro and outro lines, plus a subtitle dialogue queue** with the speaker named in gold.
- Also: steal, escort (real passengers cannot be harmed), deliver, hold, destroy, collect, kill (fictional thugs only), survive, and heist flags ([STEALTH], [FORGERY SWAP], [FRAGILE CARGO]).
- **Safehouse gallery** and **Codex** in the pause menu.

## How missions are found (1890 world flow)
There is no mission menu in normal play (it survives behind `?debug`). The game opens on the street:
- **Givers stand in the world.** Each story mission's giver (its first speaker: Maza at Les Halles, Satie at the Chat Noir, Eiffel at the Tower...) waits at a real location with a gold ring; side-job givers have a blue ring and call out as you pass. Walk up and press **T** or click them to talk; talking starts the mission.
- **Discovery.** A *petit bleu* (pneumatic letter) names the next story contact; newspapers at kiosks print headlines that reveal side jobs and activities; ordinary Parisians pass on rumours of the current act. Map stars and a HUD line show known contacts.
- **Ordinary Parisians talk.** Every pedestrian has a seeded name, trade, temperament and district; their lines are composed from a tagged phrase bank that reacts to the hour, the rain, the district, your notoriety and the act. Nearby speakers never repeat a fragment. Named characters and shopkeepers have hand-written lines.
- **Activities** (acts.js): newspaper round, fiacre fares, bicycle and motor-car races, écarté and billiards, a fence, tailor (clears heat), gunsmith, photography at 14 landmarks with a Kodak from Nadar's, 15 Chéret posters and 12 pages of Vallet's notebook to collect, street performers, five music-hall shows (20h–3h), pickpocketing (Shift-click; never real figures), and street events (a theft, a duel fired in the air, a chimney fire, a May Day march, Tower crowds).

