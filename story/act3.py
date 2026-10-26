# -*- coding: utf-8 -*-
# ACTE III — ÉTÉ 1890 — "La Fête"
ACT3 = [
('avant',"Monet et l'Olympia","Monet and the Olympia",
 "June. Claude Monet has come in from Giverny with his subscription list, to buy Manet's Olympia from the widow and give it to the nation. He receives subscribers at the Galerie Georges Petit, where he hung beside Rodin last summer, and one of Crane's men is sketching every canvas in the room.",
 """@ ~ Monet: I do not paint the river, monsieur. I paint the air between me and the river. That is why nobody can copy it, they always copy the river.
 | g petit ~ Go to the Galerie Georges Petit on the rue de Sèze.
 | ev petit 22 ~ Listen to Monet talking with a visitor who asks too many questions. // Visitor: What medium do you prime with, maître? // Monet: Hope, mostly. And debt. // Visitor: And the varnish? // Monet: I never varnish. Varnish is for coffins. // Monet: (to Théo, low) That one draws everything. He holds his pencil like a pickpocket.
 | tl boulevard drouot ~ The sketcher leaves with a full notebook. Follow him. // Sketcher: (to himself) Ice floes, grey, rose, pale yellow. Rose? The man's mad. // Sketcher: (to a porter at Drouot) For Mr Crane, by hand.
 | k drouot 4 a ~ Twist: it is a trap. Crane knew you would follow. His men are waiting in the courtyard.
 | % ~ Monet: (by letter) Thank you for the notebook. I have burnt it. It was the best drawing of my pictures that anyone has done, and therefore the most dangerous.""",None),
('velvet',"Odile","Odile",
 "Odile has spent a month in hiding, either free on the streets or safe in Maza's cellar. Now she sends word. She knows what the twelve clocks are for, and she wants to be paid in revenge.",
 """@ ~ Théo: Whatever we did on the towers of Notre-Dame, she is still the only person who has seen inside the Baron's vault.
 | ?odile=a g bateau ~ She comes to the piano works of her own accord, through the skylight.
 | ?odile=a ev bateau 22 ~ Listen to her. // Odile: You let me go. I've spent a month deciding whether that was clever or stupid. // Odile: The vault is behind the reservoir under the Opéra. Twelve tumblers, each moved by a sound. A chord. // Odile: He has ten clocks in place. He needs two more, and your master's tourbillon to tune them.
 | ?odile=b gf chien ~ Twist: she has broken out of Maza's cellar, through the coal hole. Go to Les Halles.
 | ?odile=b r halles,steustache,bank,palaisroyal 55 ~ Chase her through the night market. // Odile: You locked me up! You and that cabbage-queen! // Odile: All right! All right. I'll talk. But not in a cellar.
 | ?odile=b ev palaisroyal 22 ~ In the arcades of the Palais-Royal, she finally tells you. // Odile: The vault is behind the reservoir under the Opéra. Twelve tumblers, each moved by a sound. // Odile: He has ten clocks in place. He needs two more, and your master's tourbillon to tune them. // Odile: I'm helping you because I want him to lose. Not because I've forgiven you.
 | % ~ Théo: Ten clocks in place. Two to go. And now, for the first time, La Pie is working for us.""",None),
('crimson',"La Carte des Douze","The Map of the Twelve",
 "Odile says Crane keeps his master plan of the twelve clocks in the one place no policeman would look: the map room of the Bibliothèque nationale, filed under the wrong century.",
 """@ ~ Lucie: The Bibliothèque. Two million books and every one of them a good hiding place. Crane has a reader's card in the name of John Keats.
 | g bnf ~ Go to the Bibliothèque nationale on the rue de Richelieu.
 | sn bnf 3 9 ~ Pass the librarians and guardians into the Département des Cartes.
 | cs bnf 3 ~ Take the three sheets of the plan from the folio of 'Paris in 1550'.
 | ev bnf 18 ~ Twist: Crane himself enters the map room. Hide and listen. // Crane: The sheet for 1550, please. // Librarian: Already out, monsieur. Ten minutes ago. // Crane: Out? By whom? // Librarian: A young man. With very clean hands. A watchmaker's hands, I'd have said.
 | gt bourse 80 f ~ Get out before the doors are closed.
 | % ~ Lucie: (unrolling the sheets) Saint-Augustin, the Bourse, the Châtelet, Salle Pleyel, Salle Érard, the Madeleine, Viardot's house, the Conservatoire, the Opéra-Comique, the Sorbonne, Saint-Germain, and the Hôtel de Ville. Twelve. And all of them strike midnight together on one night only: Réveillon, at the Baron's gala.""","Crane's plan of the twelve clocks"),
('crimson',"Le Fondeur","The Bell-Founder",
 "July. Jules Broca, who once cast the bells for half the churches in Paris, came home from New Caledonia with the amnesty ten years ago and has not cast a bell since. He carries trunks at the Gare de Lyon, and he does not want to be found.",
 """@ ~ Lucie: Broca cast the bells, Théo. If anyone knows what twelve bells can do together, it's him. And he owes me his life, which is a debt I intend to collect.
 | g garelyon ~ Go to the Gare de Lyon as the Marseille express comes in.
 | ev garelyon 20 ~ The platform is full of porters and holiday-makers. Find Broca and listen. // Broca: Ten years home, Lucie, and I carry other men's trunks under a ceiling of iron and glass. The Tuileries are gone, the Republic is still arguing, and nobody asks me for a bell. // Lucie: The Republic will always be arguing. That is how you know it is alive. // Broca: And you want bells. Of course you want bells.
 | e garelyon bastille ~ Mourier's informers are on the platform. Get Broca out through the crowd to the Bastille.
 | k bastille 4 a ~ Twist: they have followed. Drive them off under the July Column, where Broca once stood on a barricade.
 | % ~ Broca: Twelve bells tuned to a chord? It can be done. But tune one wrong, by a quarter-tone, and the chord becomes a different chord. Then whatever opens, opens to the wrong man.""",None),
('avant',"Le Clocher de Saint-Augustin","The Saint-Augustin Clock",
 "The first of the Baron's clocks to be retuned: the tower of Saint-Augustin. Théo must get in, change Crane's cylinder for one of Broca's, and get out, without the Baron learning that anything has changed.",
 """@ ~ Broca: Change the cylinder and nothing else. The Baron's man checks every clock on Sundays. If he finds a scratch, he finds you.
 | g staugustin ~ Go to Saint-Augustin.
 | ?moineau=a gf staugustin ~ Moineau is waiting by the sacristy, grinning. He has found the coal chute. // Moineau: You let me go in the winter, monsieur. I don't forget. This way, and mind your head on the coal.
 | ?moineau=b sn staugustin 4 10 ~ No one is waiting for you. Get past the vergers and the Baron's watchmen alone.
 | sw staugustin ~ Swap Crane's cylinder for Broca's, without leaving a mark.
 | lo 1 ~ Leave quietly.
 | % ~ Théo: One clock is ours. Eleven to go, and a Baron who must not notice.""",None),
('apache',"Le Quatorze Juillet","The Fourteenth of July",
 "The Fête nationale. Flags on every window, dancing in every square, and Monsieur Eiffel's tower lit from its feet to its flag above the fireworks. Mourier has chosen this night, of all nights, to move the Bourse clock's cylinder to a safer place.",
 """@ ~ Maza: Half of Paris is drunk and the other half is singing. There will never be a better night to steal from a policeman.
 | st phaeton republique ~ Take a phaeton at the Place du Château-d'Eau, under the flags.
 | tl hoteldeville chatelet ~ Twist: Mourier's courier is on foot among the dancers. Follow him without losing him in the crowd. // Courier: (dodging dancers) Vive la République! Vive anything! Let me pass! // Courier: (to himself) The Châtelet clock, he said, not the Bourse.
 | k chatelet 4 a ~ He hands the box to two armed men behind the theatre. Take it.
 | lo 2 ~ Vanish into the fireworks.
 | % ~ Maza: (opening the box) The Châtelet cylinder. He was moving it so you couldn't touch it, mon petit. Which means he knows someone is touching them.""","The Châtelet cylinder"),
('avant',"La Porte de l'Enfer","The Gates of Hell",
 "August. Ten years after the State commissioned his great bronze door, Auguste Rodin is still at work on it at the Dépôt des Marbres, in the shadow of the Tour Eiffel, and now there is a monument to Victor Hugo to make as well. Crane wants a cast from the studio, to make a bronze 'by Rodin' of his own.",
 """@ ~ Rodin: (at his studio) Clay, monsieur. Clay does not lie. Bronze can be made to lie, if you pour it in the wrong mould.
 | g champdemars ~ Go to Rodin's studio at the Dépôt des Marbres, under the Tour Eiffel.
 | ev champdemars 20 ~ Listen while Rodin works. // Rodin: Ten years they have waited for a door to a museum that does not exist. I shall make them a door to Hell. Dante's, not the Ministry's, though I grant you the difference is small. // Rodin: An Englishman came yesterday. He wanted a cast of my poet, the seated one, the one who thinks. I told him he could not afford to think. // Théo: Did he leave? // Rodin: He left a man at the gate.
 | k champdemars 4 a ~ Twist: the man at the gate has friends, and they are coming in for the plasters.
 | df cellier ~ Rodin trusts you with a plaster study to hide from Crane. Drive it to the workshop as if it were alive.
 | % ~ Rodin: (by note) Keep it until the Englishman has gone to his own hell. I will need it back. It is me, in a way. All of them are.""","Rodin's plaster study"),
('crimson',"Les Carnets de Zola","Zola's Notebooks",
 "Émile Zola, whose railway novel has sold a hundred thousand copies, is documenting the markets of Paris for a novel about money. He has also, by accident, documented the Baron's concierge.",
 """@ ~ Zola: I write down everything, monsieur. What people eat, how they lie, what they hide in their cellars. A novelist is a policeman who has not been bribed.
 | g halles ~ Find Monsieur Zola among the market stalls of Les Halles.
 | ev halles 24 ~ Walk beside him and listen while he takes notes. // Zola: The Baron's concierge buys three kilos of meat a day for a household of two. Who eats the rest? // Zola: She buys candles by the case, the expensive wax. Somebody works at night in that house, and not at accounts. // Zola: And every Thursday a cab brings a man with paint on his cuffs. English. He tips badly.
 | tl halles steustache ~ The concierge is at the market now, with her basket. Follow her. // Concierge: Three kilos of the beef. And the bones, for the Englishman's dogs. // Concierge: (to a butcher) The master's ward is back, they say. He's in a fury about it.
 | g steustache ~ She enters the sacristy at Saint-Eustache. A note changes hands at the poor box.
 | % ~ Zola: (reading the note) 'Twelve days before Christmas, the last two clocks.' Monsieur, your Baron writes like a villain in a feuilleton. That is the one thing I cannot forgive him.""","Zola's notebook page"),
('velvet',"Le Grand Livre","The Ledger",
 "The Baron's second ledger, the one for God, sits in the strongroom of his stockbroker by the Bourse. It records every bribe, every forgery, every policeman.",
 """@ ~ Odile: The broker's strongroom has a lock by Fichet. I can open it in four minutes. You will need to keep the guards occupied for five.
 | g bourse ~ Go to the Bourse.
 | sn bourse 4 10 ~ Get Odile past the broker's watchmen.
 | cs bourse 2 ~ Take the ledger and its index while Odile works the lock.
 | ch ledger procope chien 0 2500 ~ You have the ledger. Give it to Lucie at the Procope to print now, or take it to Maza at Les Halles to keep as leverage over the men named in it. // Lucie: (reading) Mourier. Three magistrates. A deputy. We print it now, Théo, while it can still frighten them. // Maza: (weighing it in her hand) A book of debts. My favourite reading. These men will pay us to stay out of the newspapers, mon petit, for as long as we need them to.
 | lo 3 ~ The broker has raised the alarm. Lose the police.
 | % ~ Odile: Whatever you decided to do with it, he knows it's gone. He'll be frightened now. Frightened men are careless, or very careful.""","The Baron's second ledger"),
('avant',"Caillebotte","Caillebotte",
 "Gustave Caillebotte, painter, collector, boatman and quiet patron of his friends, who lives now at Petit-Gennevilliers among his boats and roses, has offered his old rooms near the Parc Monceau as a safehouse for everything they recover.",
 """@ ~ Caillebotte: I buy my friends' pictures when nobody else will. One day the State will have to take them, if only to stop me buying more.
 | e boulevard monceau r ~ Drive Monsieur Caillebotte from the boulevard to the Parc Monceau.
 | g monceau ~ Caillebotte: These rooms. The light is north. The locks are new. And my brother is a very poor liar, so do not tell him anything.
 | sn monceau 3 9 ~ Twist: the Baron's watchmen are already in the park. Get in without being seen.
 | c monceau 2 ~ Bring in the rescued canvases from the cart.
 | % ~ Caillebotte: You have the beginnings of a museum, Monsieur Marchal. The beginning of every museum is a theft that was put right.""",None),
('apache',"Le Train de Bercy","The Bercy Train",
 "Crane has loaded the two remaining cylinders on a wine-train at Bercy, packed among barrels of Burgundy, to be carried to the Gare Saint-Lazare and fitted in December.",
 """@ ~ Maza: Burgundy! Such a waste. Burn the wagons, keep the cylinders, and if a barrel should fall into my cart, so be it.
 | g bercy ~ Go to the Bercy wine stores.
 | sn bercy 4 10 ~ Slip between the warehouses past Crane's men.
 | cs bercy 2 ~ Take the two cylinders from the barrels.
 | xv bercy 2 gig ~ Twist: Crane has a second copy of each, in two drays. Burn them both.
 | lo 3 ~ The warehouse watchmen have raised the alarm. Lose the pursuit.
 | % ~ Broca: (examining them) Two cylinders, and both ours now. The Baron's chord has two notes missing. He will have to come and find them.""","The last two cylinders"),
('crimson',"L'Ombre de Mourier","Mourier's Shadow",
 "Lucie wants to know whom Mourier reports to, now that the ledger is gone. The only way to find out is to follow him from the Préfecture on foot.",
 """@ ~ Lucie: He walks to the Hôtel de Ville every evening at seven. He thinks it makes him look honest. Follow him, and keep your hat low.
 | tl prefecture hoteldeville ~ Tail Inspector Mourier from the Préfecture. He is a policeman: he knows how to look behind him. // Mourier: (to a flower-seller) Not today, madame. // Mourier: (stopping dead on the bridge) ... // Mourier: (to himself) Somebody is following me. Somebody always is.
 | ev hoteldeville 22 ~ Among the scaffolding of the rebuilt Hôtel de Ville, he meets Crane. Listen. // Crane: The ledger is gone, Inspector. // Mourier: Then the girl is with them. // Crane: The girl was always going to be with them. Vaneau knows it. He says let her run. She'll lead us to the apprentice and the apprentice will lead us to the cylinders. // Mourier: And then? // Crane: And then the Baron will want them all to disappear. Even the girl.
 | lo 2 ~ Twist: a sergent noticed you on the bridge. Lose the patrol.
 | % ~ Lucie: Even the girl. Don't tell Odile. Or rather, do. She should know who loves her.""",None),
('avant',"Pissarro","Pissarro",
 "Camille Pissarro, in Paris for a day from Pontoise, has a pupil who wants to confess: a young painter who works for Crane and is frightened for his life.",
 """@ ~ Pissarro: The boy has talent. Talent is a terrible thing to sell. It is like selling your eyes: you get money, and then you cannot see what to buy.
 | g tanguy ~ Meet Pissarro at Père Tanguy's.
 | ev tanguy 22 ~ Listen as Pissarro and the pupil talk. // Pupil: He pays me two hundred francs for a Pissarro, maître. You sell yours for eighty. // Pissarro: Then you are a better businessman than I am, and a worse painter. // Pupil: The Baron wants all of us to go to London after Christmas. I don't think I'll arrive. // Pissarro: No. Nor do I.
 | e tanguy lorette ~ Get the pupil to Lucie's friends at Notre-Dame-de-Lorette, where he can hide.
 | k lorette 4 a ~ Twist: Crane's men have followed. Protect the pupil.
 | % ~ Pupil: (to Théo) There's a studio over the Folies Bergère. That's where we paint. Twelve of us. I'll draw you the stairs.""","Plan of Crane's studio"),
('apache',"La Fête au Tertre","The Feast at the Tertre",
 "Montmartre's August fête. Henri is painting portraits for a franc a head, and Crane's men have come up the hill to settle a score with the painter who hid a Monet.",
 """@ ~ Henri: A franc a head! I have painted four policemen, two nuns and a donkey. The donkey had the most character.
 | gt tertre 90 ~ Get up the hill to the Place du Tertre.
 | h tertre 30 ~ Hold the square with Henri's friends while the fête goes on around you.
 | k tertre 4 a ~ Twist: Crane's leader arrives with a revolver. Drive them off.
 | % ~ Henri: (dabbing his lip) I shall paint them all from memory, and very unflattering. That is the only revenge a painter has.""",None),
('velvet',"Les Horloges de la Bourse","The Bourse Clocks",
 "The great clock over the Bourse is the fourth of the twelve. The Baron's men check it daily. Théo will have to fit Broca's cylinder while the stockbrokers shout below.",
 """@ ~ Odile: The clock room is above the trading floor. When the market opens, nobody hears anything. Not even a gunshot. Be quick.
 | g bourse ~ Go to the Bourse as the market opens.
 | sn bourse 4 10 ~ Get past the Baron's watchmen to the clock room.
 | sw bourse ~ Fit Broca's cylinder in place of Crane's.
 | ev bourse 16 ~ Twist: someone is coming up the stair. Hide and listen. // Watchman: Clock's right, sir. Striking true. // Crane: True to whom, I wonder. Check it again tomorrow. And the day after. // Watchman: Sir.
 | lo 1 ~ Leave quietly, among the brokers.
 | % ~ Théo: Four clocks ours. Eight to go. And Crane is checking his clocks twice a day now.""",None),
('crimson',"Le Châtelet","The Châtelet",
 "The Châtelet's clock is the fifth. The theatre is putting on a spectacular with real horses and a shipwreck, and Crane is backstage.",
 """@ ~ Lucie: Crane is in the flies, among the ropes. He likes to watch things fall.
 | g chatelet ~ Go to the Théâtre du Châtelet.
 | sn chatelet 4 10 ~ Cross the backstage during the shipwreck scene without being seen.
 | sw chatelet ~ Fit the Châtelet cylinder you took on the Fourteenth.
 | k chatelet 4 a b ~ Twist: Crane is waiting at the stage door with his best men. Fight your way out.
 | % ~ Crane: (fleeing through the crowd) Bravo, Monsieur Marchal! Encore! I shall see you at the gala! Do dress!""",None),
('apache',"Le Faux Tourbillon","The False Tourbillon",
 "Maza's people have heard that the tourbillon will be moved in a closed barouche from the Baron's house to the Ministry, where he has a friend. It is a chance that will never come again.",
 """@ ~ Maza: One barouche, two outriders, and a clock worth more than this whole market. Bring it back without a scratch, mon petit.
 | g elysee ~ Go to the faubourg Saint-Honoré.
 | st barouche elysee ~ Take the barouche from its outriders.
 | df bateau ~ Drive it gently to Henri's. The tourbillon is aboard.
 | k bateau 4 a ~ Twist: Mourier was waiting at the piano works. He knew.
 | % ~ Henri: (opening the case) It's beautiful. It's ticking. It's... Théo, why is it ticking backwards?""",None),
('crimson',"La Fausse Pièce","The False Piece",
 "The tourbillon in the barouche was a copy, made by Crane to be stolen. Somebody in the crew has been talking.",
 """@ ~ Lucie: A copy, made to be taken. And Mourier waiting at the piano works. Somebody told him.
 | g printers ~ Return to Lucie's.
 | ev printers 24 ~ Listen while the crew argue. // Henri: Don't look at me. I can't keep a secret, everyone knows that, so nobody tells me any. // Odile: You think it was me. Of course you do. // Maza: (arriving) It was nobody. It was the concierge at the piano works. She has a son in the Sûreté. // Lucie: Then we have all insulted each other for nothing. Good. It clears the air.
 | g cellier ~ Take the copy to Vallet.
 | % ~ Vallet: A copy? Then he fears us. Good. And it is a very good copy, Théo, which means that Crane has had the real one in his hands for months. He has learnt it. That is worse.""","Crane's copy tourbillon"),
('apache',"Rue Mouffetard en Flammes","Rue Mouffetard in Flames",
 "The Baron has answered the theft of his copy in the only language he trusts. Vallet's workshop is on fire.",
 """@ ~ Moineau: (running) Monsieur! Monsieur Théo! The workshop!
 | gt cellier 80 ~ Get to the workshop before the roof comes down!
 | k cellier 4 a ~ The arsonists are still in the street, making sure. Drive them off.
 | e cellier hoteldieu ~ Get Maître Vallet to the Hôtel-Dieu.
 | % ~ Vallet: (in the ward) They burned the clocks. All nineteen. Never mind. I kept the drawings in my head, Théo, where nobody can set fire to them. Not even a Baron.""",None),
('avant',"Fin de l'Été","The End of Summer",
 "The workshop is a ruin, but the drawings survive in Vallet's head, and the crew is together. Autumn is coming, and the Opéra-Comique, homeless since the fire of 1887, is rehearsing Esclarmonde at the Place du Châtelet.",
 """@ ~ Henri: We have five clocks, a bell-founder, a magpie, a fishwife, a forger and a watchmaker. If this were an opera it would end badly.
 | g bateau ~ Meet the crew at the piano works.
 | ev bateau 24 ~ Listen to the council of war. // Lucie: Five clocks ours. Five ours, counting the Madeleine and Madame Viardot's. Seven to go: the Opéra-Comique, Pleyel, Érard, the Conservatoire, the Sorbonne, Saint-Germain and the Hôtel de Ville. // Odile: And the master itself. The tourbillon. He keeps it in the vault, and the vault only opens when the twelve chime together. // Broca: Then on Réveillon we ring them ourselves. Our chord, not his. And whatever opens, opens to us. // Maza: And then we take everything inside it. I have been very patient.
 | % ~ Théo: The Baron has a gala in December. So do we.""",None),
]
