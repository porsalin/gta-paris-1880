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

## Dramatis Personae
### Fictional
- **Théo Marchal**: Protagonist. A watchmaker's apprentice, 19, from the rue Mouffetard. Quick hands, a good ear, and a debt he did not choose.
- **Maître Augustin Vallet**: Théo's master, a horologist of genius. His masterpiece, a tourbillon regulator, is stolen in the first scene.
- **Henri Vautrin**: A penniless painter at the rue Ravignan piano works. Théo's oldest friend; knows every studio, model and cabaret in Montmartre.
- **Maza**: Fence and fixer of Les Halles, holding court at Au Chien qui Fume. Buys anything, sells everything, keeps her word.
- **Lucie Arnoux**: Printer, engraver and reformed forger, back from hiding in Geneva. Can copy any signature, refuses to copy a conscience.
- **Baron Léopold Vaneau**: VILLAIN. Financier, collector, patron of the Opéra, early investor in petrol carriages. Behind the velvet: a ring of thieves, forgers and bribed officials.
- **Silas Crane**: VILLAIN. Vaneau's English forger and cracksman. Paints like an angel, lies like a ledger.
- **Inspecteur Gaspard Mourier**: VILLAIN. A Préfecture detective on Vaneau's payroll who hunts Théo through all five acts.
- **La Pie (Odile Vaneau)**: The Magpie: a masked cat-burglar working for the Baron. His ward, and not as loyal as he believes.
- **Jules Broca**: A bell-founder and old Communard, home from New Caledonia since the amnesty of 1880, now a porter at the Gare de Lyon (fictional). Tunes the counter-chord.
- **Moineau**: A Montmartre street urchin (fictional), La Pie's lookout; spared or sold in Act I.
### Historical (speaking cameos, always respectful; all alive in 1890)
- **Paul Signac**: Painter, 26; a moving spirit of the Société des Artistes Indépendants, whose sixth exhibition opens on 20 March 1890.
- **Georges Seurat**: Painter, 30; the quiet inventor of the pointillist method. Shows Le Chahut and Jeune femme se poudrant at the Indépendants in 1890.
- **Edgar Degas**: Painter, 55. Long since done with group exhibitions; dry wit, sharp eye, little patience for fools.
- **Mary Cassatt**: Painter; in April 1890 she is enthralled by the great exhibition of Japanese prints at the École des Beaux-Arts. Practical, generous, and the first to believe Théo.
- **Berthe Morisot**: Painter; her house on the rue de Villejust near the Étoile is a refuge of good sense.
- **Gustave Caillebotte**: Painter, collector and boat-builder, living at Petit-Gennevilliers; quiet benefactor of his friends.
- **Camille Pissarro**: Painter, 60, in from Éragny; a patient mentor to younger artists.
- **Claude Monet**: Painter, settled at Giverny and painting the haystacks; in 1890 he raises a public subscription to buy Manet's Olympia for the nation.
- **Pierre-Auguste Renoir**: Painter, living in Montmartre.
- **Theo van Gogh**: Dealer, 33; manager of Boussod, Valadon et Cie on the boulevard Montmartre, who keeps the new painting on his mezzanine.
- **Paul Durand-Ruel**: Art dealer, rue Laffitte and rue Le Peletier; staking his fortune on the Impressionists in Paris and New York.
- **Julien 'Père' Tanguy**: Colour merchant of rue Clauzel; extends credit to painters in paint, and in kindness.
- **Henri de Toulouse-Lautrec**: Painter, 25; draws the dancers of the Moulin Rouge and the riders of the Cirque Fernando.
- **Émile Zola**: Novelist; La Bête humaine appears in March 1890. An observer who notices everything.
- **Guy de Maupassant**: Writer; Notre Cœur is serialised in 1890.
- **Stéphane Mallarmé**: Poet; his Tuesday evenings on the rue de Rome.
- **Georges Clemenceau**: Deputy for the Var, editor of La Justice, former mayor of Montmartre; lives on the rue Franklin in Passy.
- **Sarah Bernhardt**: Actress; plays Jeanne d'Arc at the Porte Saint-Martin in the spring and Sardou's Cléopâtre from 23 October, before her world tour of 1891.
- **Pauline Viardot**: Singer and composer, 69; still hosts her musical Thursdays on the rue de Douai, beside Turgenev's empty chair.
- **Jules Massenet**: Composer; Esclarmonde, written for Sibyl Sanderson, is the success of the Opéra-Comique.
- **Sibyl Sanderson**: American soprano, 25; Massenet's Esclarmonde.
- **Gabriel Fauré**: Composer; choirmaster at La Madeleine. His Requiem is being expanded for full orchestra.
- **Claude Debussy**: Composer, 27; back from the Villa Medici with a Prix de Rome and very little money.
- **Erik Satie**: Composer, 24; second pianist at Rodolphe Salis's Chat Noir, author of the Gymnopédies.
- **Rodolphe Salis**: Proprietor of the cabaret Le Chat Noir on the rue de Laval.
- **Aristide Bruant**: Chansonnier, 39; insults his customers nightly at Le Mirliton on the boulevard Rochechouart.
- **Emmanuel Chabrier**: Composer of España and Gwendoline.
- **Ignacy Jan Paderewski**: Polish pianist, 29, the sensation of the Paris concert halls since 1888.
- **Auguste Rodin**: Sculptor; still at work on the Gates of Hell at the Dépôt des Marbres, and commissioned in 1889 for a monument to Victor Hugo.
- **Gustave Eiffel**: Engineer, 57; keeps a laboratory at the top of his tower, completed in 1889.
- **Nadar**: Photographer, balloonist and inexhaustible talker, 70.
- **Charles Garnier**: Architect of the Opéra, who knows its every cellar.

## Mission list

### ACTE I · HIVER 1890 · L'Apprenti
*January to March. The Russian influenza has half of Paris in bed, the crowds of the Exposition have gone home, and Monsieur Eiffel's tower still stands over the Champ de Mars like an unanswered question. In a workshop on the rue Mouffetard every clock has stopped at a quarter past two, and the finest regulator in France is gone.*

1. **Une Plume de Pie** (A Magpie's Feather): In the empty velvet of the case lies a single black-and-white feather, laid there with care. Henri Vautrin, who knows every rooftop in Montmartre, knows who leaves feathers. *[goto, steal, race]*
2. **Le Chien qui Fume** (The Smoking Dog): Every stolen thing in Paris passes through Maza's back room at Les Halles sooner or later, in a basket, under the cabbages. She will talk to Théo, if he brings her a present first. *[steal, deliver, eaves, goto]*
3. **Glace et Charbon** (Ice and Coal): The winter has made coal dearer than wine, and Maza has a wagon of it that does not, strictly speaking, belong to her. Favours are the only coin she does not count. *[steal, deliver, destroy, survive]*
4. **Chez le Père Tanguy** (At Père Tanguy's): Old Tanguy grinds colours on rue Clauzel and gives credit to any painter who looks hungry. A customer paid him last week with a gold watch-key engraved A.V. *[goto, eaves, collect]*
5. **Le Moineau** (The Sparrow): A barefoot urchin has been watching the workshop for three days. Children do not keep watch for free in January. Follow him and see who pays. *[tail, eaves, choice]*
6. **Retour de Genève** (Back from Geneva): Lucie Arnoux, engraver and former forger, has slipped back over the Swiss border with a forger's sentence still hanging over her. She can read a scrap of canvas the way a priest reads a confession. *[goto, escort, kill, collect]*
7. **Le Blanc de Plomb** (Lead White) ◆: Lucie suspects the forgeries are being sold at the Hôtel Drouot, where a fortune changes hands every afternoon and nobody asks where anything came from. *[goto, sneak, collect, eaves]*
8. **Le Baron** (The Baron): A gilded card arrives at the wrecked workshop: Baron Léopold Vaneau wishes to commission a clock for his box at the Opéra, and asks for the apprentice by name. *[goto, escort, eaves]*
9. **Inspecteur Mourier** (Inspector Mourier) ◆: Inspector Mourier has decided that the apprentice robbed his own master. There is a warrant, and the warrant has a reward attached. *[survive, goto]*
10. **Le Bal de la Galette** (The Ball at the Galette): Sunday at the Moulin de la Galette: dancing, cheap wine and masks. Henri says La Pie will be fencing a watch movement among the dancers. *[steal, escort, eaves, kill]*
11. **Les Cuivres** (The Copperplates) ◆: Mourier has seized Lucie's copperplates and taken them to the Préfecture. With them she can prove which prints are hers and which are Crane's. *[goto, sneak, collect, eaves, survive]*
12. **La Clé de Montre** (The Watch-Key) ◆: Pawn ticket 4471 leads not to a pawnshop but to a locker in the left-luggage office at the Gare Saint-Lazare, which the watch-key fits exactly. *[steal, sneak, collect, race]*
13. **Les Mardis de la rue de Rome** (Tuesdays on the rue de Rome): On Tuesday evenings Stéphane Mallarmé receives poets in his small apartment by the Saint-Lazare tracks. A guest there knows Crane's English alias. *[escort, eaves, tail, goto]*
14. **L'Horloge du Baron** (The Baron's Clock): Théo has accepted the Baron's commission, as a way inside. The great clock for Vaneau's box needs measuring, and the Opéra's architect has his own opinions on who may touch his building. *[goto, collect, eaves, smash]*
15. **Les Glaçons** (The Ice Floes) ◆: A barge with the Baron's crest is locked in the ice at the Ivry wharves. Maza's watermen swear it carries Crane's crates. When the thaw comes it will slip away for Le Havre. *[goto, sneak, collect, destroy, survive]*
16. **Le Faux Corot** (The False Corot) ◆: Crane's first forgery to surface is a Corot hanging at Goupil's on the rue Chaptal. Lucie has painted a copy of the copy, with her mark hidden in the varnish, so the next sale can be traced. *[goto, sneak, collect, survive]*
17. **L'Imprimerie Clandestine** (The Secret Press): Crane prints false certificates of provenance by the hundred. A paper merchant on the Boulevard Saint-Michel has been selling museum-grade paper to a man with no museum. *[tail, kill, destroy, collect]*
18. **Le Dégel** (The Thaw): The ice is breaking. Maza's watermen say the tourbillon itself was seen being carried aboard a second barge below Notre-Dame. Mourier's men are guarding it. *[steal, race, kill, collect]*
19. **Fin de l'Hiver** (Winter's End): The last snow is turning to slush on the rue Mouffetard. Maître Vallet is well enough to sit up, and to tell Théo what he should have told him long ago. *[goto, eaves]*

### ACTE II · PRINTEMPS 1890 · Le Salon
*March to May. The Indépendants hang Monsieur Seurat's dots on the Champs-Élysées, the Salon splits in two, the workers of Paris march on the first of May for the eight-hour day, and someone in Paris is copying everything.*

1. **Mademoiselle Cassatt** (Miss Cassatt): Mary Cassatt noticed a copyist at her pastels who worked far too well and far too fast. She would like Théo to walk with her to the Tuileries, where she says she last saw him. *[escort, goto, tail, eaves]*
2. **La Bête Humaine** (The Human Beast): Zola's railway novel is in every bookseller's window, and Maupassant's Notre Cœur is running in the Revue des Deux Mondes, so the boulevard can talk of nothing but novelists. Maupassant, it seems, has dined with a Baron who asked a great deal about clocks. *[goto, eaves, escort]*
3. **Le Jury** (The Jury) ◆: The official Salon fills the Palais de l'Industrie. Vaneau sits on a committee that hangs the pictures, and he wants Monet's old Lavacourt, lent by a collector to the retrospective room, to 'go missing' before the critics see it. Théo plays along, and hides it to save it. *[goto, sneak, collect, deliver]*
4. **Le Receleur** (The Fence): Maza has heard that a buyer is shopping in the Marais for a 'regulator movement of exceptional quality'. Buyers like that have middlemen, and middlemen have weak knees. *[steal, kill, collect, goto]*
5. **Sarah en Jeanne** (Sarah as Joan): April. Sarah Bernhardt is playing Jeanne d'Arc at the Porte Saint-Martin, and the crowd at the stage door is larger every night. Crane means to use the crush to lift a portrait from the theatre foyer. *[goto, kill, escort]*
6. **Au Bon Marché** (At the Bon Marché) ◆: Crane's forgeries are hung as decoration in the grands magasins, and sold quietly to rich clients who think they are buying a bargain. Lucie needs a catalogue of them. *[goto, sneak, collect, survive]*
7. **L'Entresol** (The Mezzanine) ◆: At Boussod, Valadon et Cie, the old house of Goupil, a young Dutch manager named Theo van Gogh keeps the pictures his employers dislike on the mezzanine. Vaneau asks Théo to 'collect' one for his private gallery. Instead Théo will plant a tracing behind it. *[goto, eaves, sneak, collect]*
8. **Le Petit Debussy** (Young Debussy): Claude Debussy, twenty-seven, back from Rome with a Prix de Rome and no money, gives lessons in the practice rooms of the Conservatoire. He has been making fun of an 'English music-lover' who copied out every manuscript in the library. Debussy, naturally, noticed. *[goto, eaves, tail, kill]*
9. **Le Jeudi de Madame Viardot** (Madame Viardot's Thursday) ◆: Pauline Viardot holds her musical Thursdays on the rue de Douai. Tonight an English tenor has been invited, and Lucie is fairly certain he is no tenor. *[goto, eaves, sneak, collect]*
10. **La Fuite du Copiste** (The Copyist Flees): Cassatt's copyist has realised he is being followed. He has taken a cab and twenty forged pastels, and is making for the Gare du Nord and the Boulogne boat. *[steal, race, kill, collect]*
11. **Nadar** (Nadar) ◆: Nadar, photographer, balloonist and inexhaustible talker, has offered to photograph the forgeries under a raking light that shows every brushstroke. The plates must reach his studio intact. *[goto, deliver, eaves, survive]*
12. **Le Pont des Arts** (The Pont des Arts) ◆: Mourier has learned that Théo meets Lucie at the Institut, and has laid a trap on the Pont des Arts. Maza has learned it too, and has her own opinion of traps. *[goto, survive]*
13. **Madame Morisot** (Madame Morisot): After the Pont des Arts, Mourier has every hotel and lodging-house watched. Berthe Morisot, who exhibited with the Impressionists from the first and fears nobody, has offered Théo a room in her house on the rue de Villejust, near the Étoile, for one night. *[goto, eaves, tail]*
14. **Durand-Ruel** (Durand-Ruel): Paul Durand-Ruel, the dealer who has risked his fortune on the Impressionists, has been offered a 'Monet' he knows Monet never painted. He will look at it only in the presence of a witness. *[escort, eaves, kill]*
15. **La Madeleine** (The Madeleine) ◆: Vaneau has invited Théo to hear Gabriel Fauré direct the choir at the Madeleine. He has also, Théo suspects, arranged to show him something in the organ loft. *[goto, eaves, sneak, collect]*
16. **Le Masque** (The Mask): La Pie has been seen on the rooftops of Montmartre, carrying a bag of cylinders. This time Théo is ready for her. *[goto, race, kill]*
17. **L'Aveu** (The Confession) ◆: Under the Opéra, in the old fosse beside Garnier's reservoir, La Pie takes off her mask. Her name is Odile, and she is the Baron's ward. *[goto, sneak, eaves]*
18. **Les Tours de Notre-Dame** (The Towers of Notre-Dame): Mourier has found out about Odile, and has sent men to bring her in. She has fled to the one place in Paris higher than the Baron's reach: the towers of Notre-Dame. *[goto, kill, choice, survive]*
19. **Fin du Printemps** (The End of Spring): The Salon has closed. The Independents have counted their losses and their friends. In the workshop on rue Mouffetard, Théo lays two brass cylinders on the bench next to his master's drawings. *[goto, eaves, collect]*

### ACTE III · ÉTÉ 1890 · La Fête
*June to August. The tower is lit for the Fourteenth of July, they dance the quadrille at the new Moulin Rouge, and twelve clocks across the city are quietly being tuned to one chord.*

1. **Odile** (Odile): Odile has spent a month in hiding, either free on the streets or safe in Maza's cellar. Now she sends word. She knows what the twelve clocks are for, and she wants to be paid in revenge. *[goto, eaves, race]*
2. **La Carte des Douze** (The Map of the Twelve) ◆: Odile says Crane keeps his master plan of the twelve clocks in the one place no policeman would look: the map room of the Bibliothèque nationale, filed under the wrong century. *[goto, sneak, collect, eaves]*
3. **Le Fondeur** (The Bell-Founder): July. Jules Broca, who once cast the bells for half the churches in Paris, came home from New Caledonia with the amnesty ten years ago and has not cast a bell since. He carries trunks at the Gare de Lyon, and he does not want to be found. *[goto, eaves, escort, kill]*
4. **Le Clocher de Saint-Augustin** (The Saint-Augustin Clock) ◆: The first of the Baron's clocks to be retuned: the tower of Saint-Augustin. Théo must get in, change Crane's cylinder for one of Broca's, and get out, without the Baron learning that anything has changed. *[goto, sneak, collect, survive]*
5. **Le Quatorze Juillet** (The Fourteenth of July): The Fête nationale. Flags on every window, dancing in every square, and Monsieur Eiffel's tower lit from its feet to its flag above the fireworks. Mourier has chosen this night, of all nights, to move the Bourse clock's cylinder to a safer place. *[steal, tail, kill, survive]*
6. **La Porte de l'Enfer** (The Gates of Hell) ◆: August. Ten years after the State commissioned his great bronze door, Auguste Rodin is still at work on it at the Dépôt des Marbres, in the shadow of the Tour Eiffel, and now there is a monument to Victor Hugo to make as well. Crane wants a cast from the studio, to make a bronze 'by Rodin' of his own. *[goto, eaves, kill, deliver]*
7. **Les Carnets de Zola** (Zola's Notebooks): Émile Zola, whose railway novel has sold a hundred thousand copies, is documenting the markets of Paris for a novel about money. He has also, by accident, documented the Baron's concierge. *[goto, eaves, tail]*
8. **Le Grand Livre** (The Ledger) ◆: The Baron's second ledger, the one for God, sits in the strongroom of his stockbroker by the Bourse. It records every bribe, every forgery, every policeman. *[goto, sneak, collect, choice, survive]*
9. **Caillebotte** (Caillebotte) ◆: Gustave Caillebotte, painter, collector, boatman and quiet patron of his friends, who lives now at Petit-Gennevilliers among his boats and roses, has offered his old rooms near the Parc Monceau as a safehouse for everything they recover. *[escort, goto, sneak, collect]*
10. **Le Train de Bercy** (The Bercy Train) ◆: Crane has loaded the two remaining cylinders on a wine-train at Bercy, packed among barrels of Burgundy, to be carried to the Gare Saint-Lazare and fitted in December. *[goto, sneak, collect, destroy, survive]*
11. **L'Ombre de Mourier** (Mourier's Shadow): Lucie wants to know whom Mourier reports to, now that the ledger is gone. The only way to find out is to follow him from the Préfecture on foot. *[tail, eaves, survive]*
12. **Pissarro** (Pissarro): Camille Pissarro, in Paris for a day from Pontoise, has a pupil who wants to confess: a young painter who works for Crane and is frightened for his life. *[goto, eaves, escort, kill]*
13. **La Fête au Tertre** (The Feast at the Tertre): Montmartre's August fête. Henri is painting portraits for a franc a head, and Crane's men have come up the hill to settle a score with the painter who hid a Monet. *[goto, hold, kill]*
14. **Les Horloges de la Bourse** (The Bourse Clocks) ◆: The great clock over the Bourse is the fourth of the twelve. The Baron's men check it daily. Théo will have to fit Broca's cylinder while the stockbrokers shout below. *[goto, sneak, collect, eaves, survive]*
15. **Le Châtelet** (The Châtelet) ◆: The Châtelet's clock is the fifth. The theatre is putting on a spectacular with real horses and a shipwreck, and Crane is backstage. *[goto, sneak, collect, kill]*
16. **Le Faux Tourbillon** (The False Tourbillon) ◆: Maza's people have heard that the tourbillon will be moved in a closed barouche from the Baron's house to the Ministry, where he has a friend. It is a chance that will never come again. *[goto, steal, deliver, kill]*
17. **La Fausse Pièce** (The False Piece): The tourbillon in the barouche was a copy, made by Crane to be stolen. Somebody in the crew has been talking. *[goto, eaves]*
18. **Rue Mouffetard en Flammes** (Rue Mouffetard in Flames): The Baron has answered the theft of his copy in the only language he trusts. Vallet's workshop is on fire. *[goto, kill, escort]*
19. **Fin de l'Été** (The End of Summer): The workshop is a ruin, but the drawings survive in Vallet's head, and the crew is together. Autumn is coming, and the Opéra-Comique, homeless since the fire of 1887, is rehearsing Esclarmonde at the Place du Châtelet. *[goto, eaves]*

### ACTE IV · AUTOMNE 1890 · Les Contes
*September to November. Massenet's sorceress at the Châtelet, Sarah Bernhardt as Cleopatra at the Porte Saint-Martin, a petrol carriage from the Panhard works coughing down the boulevards, and the Baron makes his offer.*

1. **Sarah s'en va** (Sarah Departs): October. Sarah Bernhardt is rehearsing Sardou's Cléopâtre at the Porte Saint-Martin, and planning a tour of the whole world, with a company, forty trunks of costumes and a coffin she sleeps in. She needs a dresser who can climb, pick a lock and lie to customs. Odile has an idea. *[escort, eaves, kill]*
2. **Les Noces de la Madeleine** (The Madeleine Wedding): October. A minister's daughter marries a banker's son at the Madeleine, and the whole of the Faubourg is on the steps. The Baron uses the crush of carriages to move the tourbillon itself. *[goto, eaves, tail, survive]*
3. **Salle Pleyel** (Salle Pleyel) ◆: The concert hall of the piano-makers Pleyel, on the rue Rochechouart, holds the seventh clock. Ignacy Paderewski, the young Polish pianist all Paris is mad about, is giving a recital, and is in no mood to be interrupted. *[goto, eaves, sneak, collect]*
4. **Salle Érard** (Salle Érard) ◆: The eighth clock is at the Salle Érard. Lucie's ledger, or Maza's, has made the Baron's friends nervous, and the hall is crawling with private police. *[survive, eaves, goto, sneak, collect]*
5. **La Demande** (The Proposal): The Baron invites Théo to dine at the Café Anglais. He has an offer to make, and a threat to make after it, and he never confuses the two. *[goto, eaves, tail, survive]*
6. **Le Dépôt** (The Dépôt) ◆: Théo refused the Baron, and the Baron has answered. Henri has been arrested for 'insulting a magistrate' and is in the cells of the Dépôt, under the Palais de Justice. *[goto, sneak, eaves, escort, survive]*
7. **Rue Laffitte** (Rue Laffitte): The picture dealers of the rue Laffitte, led by Durand-Ruel, have agreed to testify against the Baron in the spring. The Baron's answer is to send men with paraffin. *[hold, kill, destroy]*
8. **Monsieur Clemenceau** (Monsieur Clemenceau): Lucie wants the story told, when it is over, by someone the Chamber cannot ignore. Georges Clemenceau, deputy, duellist and editor of La Justice, receives visitors in his house on the rue Franklin in Passy. *[escort, eaves, tail, survive]*
9. **Le Conservatoire** (The Conservatoire) ◆: The ninth clock is at the Conservatoire, in the room where the Prix de Rome is judged. Jules Massenet, who teaches composition there, knows its every eccentricity. *[goto, eaves, sneak, collect]*
10. **Le Salon de Chabrier** (Chabrier's Evening): Emmanuel Chabrier has resigned from the Ministry of the Interior to write music full time, and celebrates by giving a party for everyone he knows. One of his guests is the Baron's spy in the crew. *[escort, eaves, tail, kill]*
11. **La Fonderie** (The Foundry) ◆: The informer did not get far, but Mourier has guessed. His men are going to the Vaugirard foundry where Broca is tuning the last bells. *[goto, hold, kill, deliver]*
12. **La Sorbonne** (The Sorbonne) ◆: The tenth clock is in the old chapel of the Sorbonne, where the students have already noticed that it strikes thirteen. *[goto, eaves, sneak, collect]*
13. **Saint-Germain-des-Prés** (Saint-Germain-des-Prés) ◆: The eleventh clock is in the tower of Saint-Germain-des-Prés, the oldest church in Paris. Crane has guessed it is next, and is waiting inside. *[goto, sneak, collect, kill]*
14. **Rue de Douai** (The Rue de Douai) ◆: Madame Viardot's clock was the first one Théo saved. Crane means to take it back on the night of her last Thursday of the year, and undo the chord. *[goto, eaves, kill, collect]*
15. **Les Plans de Garnier** (Garnier's Plans): Charles Garnier does not like the Baron, and likes even less the idea that someone has built a vault under his Opéra without asking. He has the original plans of the foundations. *[goto, eaves, collect, survive]*
16. **L'Omnibus** (The Omnibus): The crew will need a getaway vehicle large enough for eleven people and a vault's worth of paintings. Maza has her eye on a Madeleine–Bastille omnibus. *[steal, race, deliver]*
17. **Le Masque de Crane** (Crane's Mask) ◆: Crane has gone to ground in the studio above the Folies Bergère, where his twelve painters work. The pupil's plan of the stairs is good. Maza wants to raid it before he can move. *[goto, sneak, collect, kill]*
18. **Les Préparatifs** (The Preparations): November. The gala is in six weeks. The crew gathers in Caillebotte's rooms by the Parc Monceau to set the plan. *[goto, eaves, collect]*
19. **Fin de l'Automne** (The End of Autumn): The first snow. Vallet, out of hospital, is living in a room behind Henri's piano works. He asks to see Théo's watch, the one he will carry on the night. *[goto, eaves]*

### ACTE V · DÉCEMBRE 1890 · Réveillon
*December. The coldest winter in living memory sets in, and the Seine begins to freeze. One gala night at the Opéra, and twelve clocks that will strike midnight twelve seconds early.*

1. **L'Hôtel de Ville** (The Hôtel de Ville) ◆: The twelfth clock stands in the rebuilt Hôtel de Ville, still half in scaffolding. Crane has posted his best men there, because it is the last. *[goto, sneak, collect, eaves]*
2. **Les Invitations** (The Invitations) ◆: The crew needs invitations to the gala, and costumes to wear under them. Lucie can forge the cards; the costumes must come from the Opéra-Comique's wardrobe. *[collect, goto, sneak]*
3. **La Répétition Générale** (The Dress Rehearsal) ◆: The Baron's gala rehearsal at the Opéra. As his clockmaker, Théo is expected to wind the great clock in the Baron's box. He means to set it, very carefully, wrong. *[goto, eaves, collect]*
4. **Les Douze Sonneurs** (The Twelve Ringers): Twelve friends at twelve clocks, each with one of Théo's watches. They must all have them by tonight, and Mourier is watching the streets. *[steal, race, kill]*
5. **Le Fiacre de Mourier** (Mourier's Cab) ◆: On Réveillon, Mourier will ride to the Opéra at a quarter to midnight to arrest Théo in front of the whole of Paris. Make him late. *[goto, sneak, destroy, survive]*
6. **La Galerie Secrète** (The Secret Gallery): Durand-Ruel and Caillebotte will receive everything recovered from the vault and authenticate it before witnesses, so that nothing can be taken back. *[escort, eaves]*
7. **Le Gala** (The Gala) ◆: Réveillon at the Opéra. Everyone who matters in Paris is here, in jewels and furs, and so, in musicians' coats, is the crew. *[goto, sneak, eaves]*
8. **Minuit** (Midnight): The bells ring across Paris, twelve clocks striking one chord, twelve seconds before the Baron's. Under the Opéra, the vault begins to open. *[hold, kill, goto]*
9. **Le Coffre** (The Vault) ◆: Inside: paintings, manuscripts, instruments, ledgers, bonds, and on a velvet cushion, ticking, the tourbillon of Augustin Vallet. *[collect, survive]*
10. **L'Évasion** (The Escape) ◆: Out through the sewer, up through a grating on the rue Scribe, into a waiting omnibus with a horse called Cléopâtre. *[steal, deliver, survive]*
11. **Le Faussaire** (The Forger): Silas Crane has fled for the Gare du Nord with a case of masterpieces and a ticket on the boat train. *[steal, race, kill]*
12. **L'Inspecteur** (The Inspector): Mourier has barricaded himself in the Préfecture, burning his own ledgers in the grate. *[goto, kill, collect, choice]*
13. **Le Baron** (The Baron): Vaneau has fled to his private train at the Batignolles yards. He has taken Odile with him. *[race, kill, escort]*
14. **Le Retour du Tourbillon** (The Return of the Tourbillon) ◆: The tourbillon goes home, to a room behind a piano works in Montmartre, where an old man is waiting with his loupe. *[deliver, eaves]*
15. **La Une** (The Front Page): The whole story, printed. Lucie has run off ten thousand copies and wants them on every café table in Paris by breakfast. *[goto, collect]*
16. **Les Comptes** (Settling Accounts): Maza settles the crew's accounts. Everyone gets paid; the stolen art goes home. *[goto, escort]*
17. **Les Indépendants** (The Independents): Degas, Cassatt, Morisot, Pissarro and young Signac come to Caillebotte's to see the recovered works before they go home to their owners. *[goto, eaves]*
18. **Odile** (Odile): Odile leaves Paris as herself at last. The boat train leaves from Saint-Lazare, and Madame Bernhardt's company, bound around the world, is waiting for its new dresser. *[escort, eaves]*
19. **Réveillon** (New Year's Eve): The last night of 1890. Midnight in a room behind a piano works in Montmartre, where the tourbillon is going to strike twelve. *[escort, hold]*

### Side jobs (heard of through kiosks, newspapers and rumours)

- **Courses de Fiacres** (Cab Races): The cabmen of the Right Bank race at night for a purse of fifty francs and the honour of their horses. *[steal, race]*
- **Le Receleur de Nuit** (Night Fence): At night Les Halles fills with loose goods: crates fallen from carts, baskets nobody claims. Maza buys it all. *[collect, goto]*
- **L'Accordeur** (The Piano Tuner): A concert grand must reach the Salle Pleyel without a scratch for Paderewski's recital. *[steal, deliver]*
- **Les Copistes** (The Copyists): Crane buys copies from art students at the Louvre. Swap theirs for blank canvases before he collects. *[goto, sneak, collect]*
- **L'Omnibus** (The Omnibus): Run the Madeleine–Bastille omnibus line, stopping at every stop, and keep the passengers happy. *[steal, race]*
- **Les Apaches de Belleville** (The Belleville Toughs): A gang of extortionists is squeezing the small shops of Belleville in the Baron's name. *[kill]*
- **Le Pickpocket** (The Pickpocket): A pickpocket is working the Châtelet crowds. Follow him back to the man he works for. *[tail, kill]*
- **Les Moulins** (The Windmills): A rooftop race across the Montmartre windmills, for a bet with Henri's friends. *[race]*
- **L'Alarme** (The Alarm): The Banque de France wants its new alarm tested by someone who knows how to run. *[goto, survive]*
- **Les Partitions** (Sheet Music): Deliver the Conservatoire's orchestral parts to the publishers before tomorrow's concerts. *[collect, goto]*
- **Le Cirque** (The Circus): Escort a horse-trainer and her prize mare from the Abbesses to the Cirque Fernando before the evening show. *[escort]*
- **La Tour de Monsieur Eiffel** (Monsieur Eiffel's Tower): Gustave Eiffel keeps a laboratory at the top of his tower. A case of barometers from the Richard works must reach it before the weather turns. *[steal, deliver, goto]*
- **Les Gymnopédies** (The Gymnopédies): Erik Satie, second pianist at the Chat Noir, has had his satchel of manuscripts snatched on the rue de Laval. *[goto, eaves, kill]*
- **La Tour Saint-Jacques** (The Tour Saint-Jacques): The Belleville toughs want the square at the Tour Saint-Jacques for their Sunday game. The market women want it more. *[hold]*
