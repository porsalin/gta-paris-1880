# -*- coding: utf-8 -*-
# ACTE V — DÉCEMBRE 1890 — "Réveillon"
ACT5 = [
('crimson',"La Neige","The Snow",
 "December. Snow on the boulevards and the gas-lamps haloed in it. Mourier has put a price of five thousand francs on Théo's head, and every informer in Paris can count.",
 """@ ~ Lucie: Five thousand francs. I'm almost insulted. In 1871 they offered ten for me.
 | al 4 30 ~ Mourier's manhunt sweeps the Latin Quarter. Survive it.
 | lo 4 ~ Lose them in the snow.
 | gt procope 120 f ~ Regroup at the Procope, on foot, by the back streets.
 | % ~ Lucie: (pouring) Twenty days. Then either we are heroes, or we are in New Caledonia. I have been to Geneva; I should like to see somewhere warm.""",None),
('avant',"L'Hôtel de Ville","The Hôtel de Ville",
 "The twelfth clock stands in the rebuilt Hôtel de Ville, still half in scaffolding. Crane has posted his best men there, because it is the last.",
 """@ ~ Odile: Scaffolding! Oh, I love scaffolding. It's like a ladder that's been told a secret.
 | g hoteldeville ~ Go to the Hôtel de Ville.
 | sn hoteldeville 5 12 ~ Climb the scaffolding past Crane's watchmen.
 | sw hoteldeville ~ Fit the twelfth cylinder.
 | ev hoteldeville 16 ~ Twist: Crane's foreman is on the scaffold. Listen. // Foreman: Clock's checked, Mr Crane. All twelve true. // Crane: All twelve true? Then why do I feel as if someone has been through my pockets? // Foreman: Nerves, sir. // Crane: I don't have nerves. I have instincts. Double the watch.
 | gt stjacques 60 f ~ Get down and away to the Tour Saint-Jacques before the watch is doubled.
 | % ~ Théo: Twelve. Every clock in the Baron's chord is now tuned to ours.""",None),
('avant',"Les Invitations","The Invitations",
 "The crew needs invitations to the gala, and costumes to wear under them. Lucie can forge the cards; the costumes must come from the Opéra-Comique's wardrobe.",
 """@ ~ Lucie: Paper from the Palais-Royal, ink from the rue de Rivoli, seals from a man who owes me. Then the costumes. Musicians: nobody ever looks at musicians.
 | c palaisroyal 4 ~ Collect the paper, ink, seals and ribbon around the Palais-Royal.
 | g printers ~ Bring them to Lucie.
 | gf favart ~ Go to the Salle Favart on foot.
 | sn favart 5 11 ~ Get past the wardrobe mistresses and the night porter.
 | cs favart 3 ~ Take three musicians' costumes unseen.
 | % ~ Lucie: (holding a card to the lamp) 'The Baron Vaneau requests the pleasure.' He will have the pleasure. I shall see to it personally.""","Forged gala invitations"),
('velvet',"La Répétition Générale","The Dress Rehearsal",
 "The Baron's gala rehearsal at the Opéra. As his clockmaker, Théo is expected to wind the great clock in the Baron's box. He means to set it, very carefully, wrong.",
 """@ ~ Vaneau: Wind it well, Théo. On Réveillon, at midnight, this clock will be the most important in Paris.
 | g garnier ~ Go to the Opéra.
 | ev garnier 22 ~ While you work, listen to the Baron and Odile in the box. // Vaneau: You came back to me, my dear. // Odile: Where else would I go? // Vaneau: Nowhere. That is the beauty of it. On Réveillon you will sit beside me and watch the door open, and then we shall go to London, you and I, and be very rich and very bored. // Odile: I can hardly wait.
 | sw garnier ~ Swap the master escapement for your own, set twelve seconds slow.
 | g bateau ~ Report to the crew.
 | % ~ Théo: Twelve seconds. When his clock strikes midnight, ours will already have struck. The door will open to our chord, and he will be twelve seconds too late.""",None),
('crimson',"Les Douze Sonneurs","The Twelve Ringers",
 "Twelve friends at twelve clocks, each with one of Théo's watches. They must all have them by tonight, and Mourier is watching the streets.",
 """@ ~ Broca: Twelve of the best: three bell-ringers, two students, a nun, a cab driver, five old Communards who came home with the amnesty. They'll ring true, I promise you.
 | st phaeton procope ~ Take a phaeton at the Procope.
 | r stgermain,sorbonne,chatelet,hoteldeville,bourse,favart,conservatoire,lorette,staugustin,madeleine 120 ~ Deliver the watches to all ten outlying clocks before the night watch begins.
 | k pleyel 4 a ~ Twist: Crane's men are guarding the Pleyel clock. Clear them for your ringer.
 | k erard 4 a ~ And the Érard.
 | % ~ Théo: Twelve watches, twelve ringers, one second. If this works, the whole of Paris will strike midnight together, and only we will know why.""",None),
('apache',"Le Fiacre de Mourier","Mourier's Cab",
 "On Réveillon, Mourier will ride to the Opéra at a quarter to midnight to arrest Théo in front of the whole of Paris. Make him late.",
 """@ ~ Maza: Wreck his carriages. Gently, if you can; I want the horses for myself.
 | g prefecture ~ Go to the Préfecture.
 | sn prefecture 4 11 ~ Get into the stable yard past the night watch.
 | xv prefecture 3 brougham ~ Wreck Mourier's three carriages.
 | lo 3 ~ Lose the gendarmes.
 | % ~ Maza: (later) He will have to walk to the Opéra. At his weight, through the snow, that is three quarters of an hour. Exactly enough.""",None),
('avant',"La Galerie Secrète","The Secret Gallery",
 "Durand-Ruel and Caillebotte will receive everything recovered from the vault and authenticate it before witnesses, so that nothing can be taken back.",
 """@ ~ Durand-Ruel: Everything will go back to its painter, or to its rightful owner. You have my word. Which, I am told, is worth more than my credit.
 | e durandruel monceau r ~ Drive Monsieur Durand-Ruel to the safehouse by the Parc Monceau.
 | ev monceau 18 ~ Listen to Durand-Ruel and Caillebotte. // Caillebotte: My brother thinks we are mad. // Durand-Ruel: Your brother is a philatelist. All philatelists think everyone else is mad. // Caillebotte: (to Théo) We will be waiting, all night, with the lamps lit.
 | b monceau 1200 ~ Caillebotte has left a gift for the crew in the coach house: a purse for the night.
 | % ~ Théo: Everything is ready. Except me.""",None),
('velvet',"Le Gala","The Gala",
 "Réveillon at the Opéra. Everyone who matters in Paris is here, in jewels and furs, and so, in musicians' coats, is the crew.",
 """@ ~ Henri: (in a borrowed tailcoat) I look like a waiter at a funeral. Perfect.
 | g garnier ~ Arrive at the gala.
 | sn garnier 6 12 ~ Pass the Baron's guards on the grand staircase and the corridors.
 | ev garnier 24 ~ In the Baron's box, Vaneau raises a glass. Listen. // Vaneau: To time, ladies and gentlemen, which belongs to me! // Guest: To the Baron! // Vaneau: (to Théo, as he passes) You came, my clockmaker. Mourier will be here at midnight. I asked him to wait until after the champagne. // Odile: (low) Eleven minutes, Théo.
 | gf garnier ~ Slip away from the box down to the cellars.
 | % ~ Théo: Eleven minutes to midnight. Twelve clocks set. One door.""",None),
('crimson',"Minuit","Midnight",
 "The bells ring across Paris, twelve clocks striking one chord, twelve seconds before the Baron's. Under the Opéra, the vault begins to open.",
 """@ ~ Broca: (in Théo's ear, from memory) Listen. There. Saint-Augustin. The Bourse. The Châtelet. Now. Now!
 | h garnier 35 ~ Hold the cellar door while the chimes play.
 | k garnier 5 a ~ Twist: the Baron's cellar guards heard the chord too. Drive them off the door.
 | gf garnier ~ Enter the vault.
 | % ~ Théo: The door is open. Twelve seconds before his. For twelve seconds, the Baron's vault belongs to us.""",None),
('apache',"Le Coffre","The Vault",
 "Inside: paintings, manuscripts, instruments, ledgers, bonds, and on a velvet cushion, ticking, the tourbillon of Augustin Vallet.",
 """@ ~ Maza: (whispering) Mother of God. I have been a receiver of stolen goods for thirty years, and I have never seen so many in one room.
 | c garnier 5 ~ Gather the treasures: the paintings, the scores, the violin, the ledgers, and the tourbillon!
 | al 4 35 ~ Twist: the Baron's clock strikes twelve seconds late, and the Baron knows. His guards flood the cellars.
 | % ~ Théo: (lifting it) It's still keeping perfect time. Of course it is.""","The Vallet tourbillon"),
('avant',"L'Évasion","The Escape",
 "Out through the sewer, up through a grating on the rue Scribe, into a waiting omnibus with a horse called Cléopâtre.",
 """@ ~ Maza: Cléopâtre! Go!
 | st omnibus garnier ~ Take the getaway omnibus.
 | df monceau ~ Drive to the safehouse. Priceless cargo, so drive gently!
 | lo 4 ~ Twist: Mourier has arrived on foot, furious, and called out the army. Lose the pursuit.
 | % ~ Caillebotte: (at the door) Come in, come in. Lamps are lit. Durand-Ruel has his ledger open. Everything will be written down, monsieur. Everything.""",None),
('crimson',"Le Faussaire","The Forger",
 "Silas Crane has fled for the Gare du Nord with a case of masterpieces and a ticket on the boat train.",
 """@ ~ Lucie: He'll be in London by breakfast if we let him. I don't want him in London. I want him in a cell, with no paint.
 | st phaeton garenord ~ Take a phaeton.
 | r garenord,gareest,republique 55 ~ Catch Crane's cab.
 | k gareest 6 a b ~ Take down Crane and his men.
 | % ~ Crane: (on the ground) Well played, old man. Do you know, I always wanted to paint something of my own? Never had the time. // Lucie: You'll have years now.""","Crane's portfolio"),
('apache',"L'Inspecteur","The Inspector",
 "Mourier has barricaded himself in the Préfecture, burning his own ledgers in the grate.",
 """@ ~ Maza: He's burning the evidence. Policemen do that. It's called experience.
 | g prefecture ~ Go to the Préfecture.
 | k prefecture 6 a b ~ Face Mourier's loyalists.
 | c prefecture 3 ~ Save the unburnt ledger pages.
 | ch mourier palaisjustice procope ~ Mourier is in your hands. Deliver him and his ledger to the examining magistrate at the Palais de Justice, or to Lucie's newspaper at the Procope, where all of Paris will read it by morning. // Magistrate: The Republic thanks you, monsieur. Discreetly. The Republic is always discreet about its policemen. // Lucie: Front page. His face, his ledger, his wife's champagne. Let the magistrates try to be discreet about that.
 | % ~ Mourier: (as they take him) You think you've won, boy? Barons always come back. // Théo: So do watchmakers. We're very patient.""","Mourier's last ledger"),
('velvet',"Le Baron","The Baron",
 "Vaneau has fled to his private train at the Batignolles yards. He has taken Odile with him.",
 """@ ~ Henri: He's taken Odile. To his train. Théo, run!
 | r garnier,gare,railyard 70 ~ Race the Baron to the Batignolles yards!
 | k railyard 6 a b ~ Defeat Vaneau's bodyguard.
 | e railyard monceau ~ Bring Odile to safety.
 | % ~ Vaneau: (in handcuffs, on the snow) Time, Théo. It still belongs to somebody. // Théo: Yes, monsieur. To everyone. That's the point.""",None),
('avant',"Le Retour du Tourbillon","The Return of the Tourbillon",
 "The tourbillon goes home, to a room behind a piano works in Montmartre, where an old man is waiting with his loupe.",
 """@ ~ Henri: Gently. You've carried it through a sewer and a war. Don't drop it now.
 | df bateau ~ Drive the tourbillon to Maître Vallet. Gently.
 | ev bateau 20 ~ Watch your master open the case. // Vallet: Ah. There you are. // Vallet: It keeps perfect time. Of course it does. Time is the one thing they could never steal from us. // Vallet: Théo, it is yours now. No. Don't argue. I made it to open a door. You made it open the right one.
 | % ~ Théo: (to himself) I'll keep it. I'll keep it like a promise.""",None),
('crimson',"La Une","The Front Page",
 "The whole story, printed. Lucie has run off ten thousand copies and wants them on every café table in Paris by breakfast.",
 """@ ~ Lucie: The truth needs no permission. Clemenceau said so. Only courage, and a good printer.
 | ?mourier=a g palaisjustice ~ First, the examining magistrate wants a statement. Go to the Palais de Justice. // Magistrate: The Baron, Crane and Mourier will all stand trial in the spring. The Republic will be very thorough, and very quiet.
 | ?mourier=b g procope ~ The Procope is besieged by journalists. Lucie's front page has done its work. // Lucie: Every paper in Paris has picked it up. The magistrates had to act by noon. They hated it. I've never been happier.
 | c boulmich 4 ~ Hand out the papers on the Boulevard Saint-Michel.
 | g procope ~ Toast at the Procope.
 | % ~ Lucie: 'L'Affaire du Tourbillon', the headline. I wanted 'The Watchmaker's Revenge', but Clemenceau said it was vulgar, and he should know.""",None),
('apache',"Les Comptes","Settling Accounts",
 "Maza settles the crew's accounts. Everyone gets paid; the stolen art goes home.",
 """@ ~ Maza: I've been through every franc. Everyone gets paid, mon petit. Even heroes. Even me. Especially me.
 | f chien 2000 ~ Collect your share.
 | e chien monceau ~ Drive Maza to see the safehouse gallery.
 | % ~ Maza: (looking at the pictures) So this is what all the fuss was about. Paint. I could have sold them all, you know. I'm glad I didn't. Don't tell anyone.""",None),
('avant',"Les Indépendants","The Independents",
 "Degas, Cassatt, Morisot, Pissarro and young Signac come to Caillebotte's to see the recovered works before they go home to their owners.",
 """@ ~ Cassatt: I said you were to be believed. Nobody listened. They never listen to Americans, or to women. I am both, so I have twice the satisfaction.
 | g monceau ~ Go to the safehouse gallery.
 | ev monceau 22 ~ Listen to the painters among the pictures. // Pissarro: Look, there are three of mine. I didn't know anyone had ever wanted to steal me. // Morisot: It is the best review you have ever had, Camille. // Degas: So the watchmaker's boy has better taste than the Baron. Unsurprising. Barons buy names. Watchmakers buy works. // Signac: Monsieur Degas, you have just said something kind. // Degas: (to Théo) You will come to dinner on Friday. As a guest. And with no opinions.
 | % ~ Théo: No opinions, Monsieur Degas. Only the time.""",None),
('velvet',"Odile","Odile",
 "Odile leaves Paris as herself at last. The boat train leaves from Saint-Lazare, and Madame Bernhardt's company, bound around the world, is waiting for its new dresser.",
 """@ ~ Odile: Don't make a scene, Théo. I'm a professional, I can't be seen weeping on a platform.
 | e monceau gare ~ Drive Odile to the Gare Saint-Lazare.
 | ev gare 20 ~ On the platform. Listen. // Odile: I'll write. Badly. Every week. // Théo: Write me the time in Rio, and New York, and Sydney. I want to set a clock to it. // Odile: Wind your clocks, Théo. And when you hear one strike midnight, think of a thief.
 | % ~ Théo: (as the train leaves) Odile Vaneau, dresser to Sarah Bernhardt. It suits her. She was always in costume.""","Odile's feather"),
('avant',"Réveillon","New Year's Eve",
 "The last night of 1890. Midnight in a room behind a piano works in Montmartre, where the tourbillon is going to strike twelve.",
 """@ ~ Henri: Champagne! Real champagne, Maza swears it fell off a cart! Théo, come up, the whole of Paris is going to strike midnight!
 | e bateau tertre ~ Bring Henri and Vallet up to the Place du Tertre.
 | h tertre 15 ~ Watch the fireworks over Paris as the clocks strike midnight.
 | % ~ Vallet: Listen. All of them, together. Saint-Augustin, the Bourse, Notre-Dame. And ours. // Théo: Happy New Year, Maître. // Vallet: Happy New Year, Théo. Keep good time.""","Henri's portrait of the apprentice"),
]
SIDE = [
 ("Courses de Fiacres","Cab Races","The cabmen of the Right Bank race at night for a purse of fifty francs and the honour of their horses.",
  "@ ~ Old cabman: My mare has won nine races and lost one, and the one she lost she was asleep. Beat her if you can, young man. | st brougham boulevard ~ Take a cab on the Boulevard des Italiens. | r boulevard,bourse,halles,chatelet 65 ~ Hit the checkpoints before the old cabman."),
 ("Le Receleur de Nuit","Night Fence","At night Les Halles fills with loose goods: crates fallen from carts, baskets nobody claims. Maza buys it all.",
  "@ ~ Maza: Whatever's loose is mine, mon petit. Whatever's fastened is someone else's. Learn the difference. | c halles 4 ~ Collect the loose goods. | f chien 600 ~ Sell them to Maza."),
 ("L'Accordeur","The Piano Tuner","A concert grand must reach the Salle Pleyel without a scratch for Paderewski's recital.",
  "@ ~ Henri: If you scratch it, Paderewski will hear it from the stage. He hears everything. He hears things that haven't happened yet. | st gig bateau ~ Take the piano cart. | df pleyel ~ Deliver it to Salle Pleyel. Fragile!"),
 ("Les Copistes","The Copyists","Crane buys copies from art students at the Louvre. Swap theirs for blank canvases before he collects.",
  "@ ~ Lucie: Swap three. Don't feel sorry for the students, they'll paint better copies next week. | g louvre ~ Go to the Louvre. | sn louvre 3 9 ~ Pass the guardians of the Grande Galerie. | cs louvre 3 ~ Swap three copies unseen."),
 ("L'Omnibus","The Omnibus","Run the Madeleine–Bastille omnibus line, stopping at every stop, and keep the passengers happy.",
  "@ ~ Conductor: Twenty-six seats, and every one of them complains. | st omnibus madeleine ~ Take the omnibus. | r madeleine,vendome,palaisroyal,hoteldeville,bastille 90 ~ Make all the stops!"),
 ("Les Apaches de Belleville","The Belleville Toughs","A gang of extortionists is squeezing the small shops of Belleville in the Baron's name.",
  "@ ~ Shopkeeper: They want ten francs a week, monsieur, for protection. From whom? From them. | k belleville 4 a ~ Drive them off."),
 ("Le Pickpocket","The Pickpocket","A pickpocket is working the Châtelet crowds. Follow him back to the man he works for.",
  "@ ~ Henri: The thin one in the brown coat. He has had three watches in ten minutes. | tl chatelet hoteldeville ~ Tail the pickpocket. // Pickpocket: (to himself) Three watches, one purse, a handkerchief. A good evening. | k hoteldeville 3 ~ He hands his takings to two bruisers. Take back the watches."),
 ("Les Moulins","The Windmills","A rooftop race across the Montmartre windmills, for a bet with Henri's friends.",
  "@ ~ Henri: Ten francs says you can't do it in under a minute. I don't have ten francs, but it's the principle. | r galette,radet,blutefin,tertre 55 ~ Race the windmills!"),
 ("L'Alarme","The Alarm","The Banque de France wants its new alarm tested by someone who knows how to run.",
  "@ ~ Bank official: You will run, monsieur, and we shall see whether our alarm can catch you. It is all very scientific. | g bank ~ Go to the Banque de France. | al 2 25 ~ Survive the alarm drill. | lo 2 ~ Lose the police."),
 ("Les Partitions","Sheet Music","Deliver the Conservatoire's orchestral parts to the publishers before tomorrow's concerts.",
  "@ ~ Copyist: Durand first, then Heugel. If they arrive in the wrong order, they will both complain to Massenet, and Massenet will be charming about it, which is worse. | c conservatoire 3 ~ Collect the scores. | g durand ~ Deliver to Durand et Schoenewerk. | g heugel ~ And to Heugel's, Au Ménestrel."),
 ("Le Cirque","The Circus","Escort a horse-trainer and her prize mare from the Abbesses to the Cirque Fernando before the evening show.",
  "@ ~ Trainer: She is called Duchesse, and she does not like cabs, policemen or men with moustaches. | e abbesses fernando ~ Bring the trainer to the Cirque Fernando. | % ~ Lautrec: (from the front row, sketching) Mademoiselle Duchesse has better legs than the whole corps de ballet. Do not tell the corps de ballet."),
 ("La Tour de Monsieur Eiffel","Monsieur Eiffel's Tower","Gustave Eiffel keeps a laboratory at the top of his tower. A case of barometers from the Richard works must reach it before the weather turns.",
  "@ ~ Eiffel: The instruments, monsieur, and intact. Up there the wind tells the truth, and I mean to hear every word. | st gig bastille ~ Take the instrument-maker's gig. | df eiffel ~ Deliver the barometers to the foot of the Tour Eiffel. Fragile! | gf eiffel ~ Carry the case in under the great arch. | % ~ Eiffel: Three hundred metres of iron, and every newspaper in Paris said it would fall down. It is the newspapers, monsieur, that keep falling down."),
 ("Les Gymnopédies","The Gymnopédies","Erik Satie, second pianist at the Chat Noir, has had his satchel of manuscripts snatched on the rue de Laval.",
  "@ ~ Satie: They took my music, monsieur. Slow music. The thief will be very disappointed. | g chatnoir ~ Go to the Chat Noir. | ev chatnoir 16 ~ Listen to Salis and his customers. // Salis: Messieurs, you are in the most literary cabaret in the world. Kindly pay as if you knew it. // Customer: The thief went towards the Galette, with the pianist's bag. // Satie: My bag. With my umbrella in it. | k galette 3 ~ The snatch-thieves are drinking at the Moulin de la Galette. Take back the satchel. | g chatnoir ~ Return it to the Chat Noir. | % ~ Satie: Thank you. I shall dedicate something to you. Something very slow, so that you have time to enjoy it."),
 ("La Tour Saint-Jacques","The Tour Saint-Jacques","The Belleville toughs want the square at the Tour Saint-Jacques for their Sunday game. The market women want it more.",
  "@ ~ Market woman: You keep them off for half an hour, and we'll keep you in onions till Easter. | h stjacques 25 ~ Hold the square."),
]
