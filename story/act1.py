# -*- coding: utf-8 -*-
# ACTE I — HIVER 1890 — "L'Apprenti"
ACT1 = [
('avant',"La Grippe","The Influenza",
 "January. The Russian influenza has put half of Paris to bed, and a yellow fog lies on the Seine like wet wool. Théo comes home from the chemist on rue Mouffetard and finds the workshop door standing open to the cold.",
 """@ ~ // Théo: Nineteen clocks on the wall, and every one of them stopped at a quarter past two. Somebody wanted me to know the hour.
 | gt cellier 90 ~ Run home to Maître Vallet's workshop before the trail goes cold.
 | k cellier 2 ~ Two masked men are still at the strongbox. Throw them out. // Masked man: Leave it, Jojo, it's only the boy!
 | gt hoteldieu 80 ~ Vallet is bleeding from the scalp. Fetch a surgeon from the Hôtel-Dieu, and run. // Vallet: Never mind my head. The case, Théo. Is the tourbillon in its case?
 | g cellier ~ Bring the surgeon back to the workshop.
 | % ~ Surgeon: A clean blow, expertly given. Your thieves did not wish to kill him, only to keep him quiet. // Théo: The case is empty, Maître. They left the gold and took the regulator. // Vallet: Then they are not thieves. Thieves take gold.""",None),
('avant',"Une Plume de Pie","A Magpie's Feather",
 "In the empty velvet of the case lies a single black-and-white feather, laid there with care. Henri Vautrin, who knows every rooftop in Montmartre, knows who leaves feathers.",
 """@ ~ Henri: A feather? Mon vieux, that is a signature. La Pie, they call her. She robs only the rich, which is to say she has never robbed me.
 | g bateau ~ Find Henri at the piano works on rue Ravignan.
 | st gig bateau ~ Borrow the coal-merchant's gig. Henri will square it with him. Probably.
 | r tertre,abbesses,ratmort 55 ~ A masked rider on the rooftops! Keep her in sight down the hill. // Henri: There! On the roof of the laundry! Nobody runs on wet slates like that unless they are paid to.
 | g ratmort ~ She is gone, but she dropped something outside the Café du Rat Mort. Look.
 | % ~ Théo: A pawn ticket from the Mont-de-Piété. Number 4471. // Henri: Either she is careless, or she wanted you to have it. I cannot decide which frightens me more.""","Magpie feather"),
('apache',"Le Chien qui Fume","The Smoking Dog",
 "Every stolen thing in Paris passes through Maza's back room at Les Halles sooner or later, in a basket, under the cabbages. She will talk to Théo, if he brings her a present first.",
 """@ ~ Maza: A watchmaker's boy in my house at this hour? Either someone has died or someone owes. Bring me something with wheels, mon petit, and then we talk.
 | st brougham boulevard ~ Take a gentleman's brougham on the Boulevard des Italiens while its owner dines at Tortoni.
 | d chien ~ Bring it to Au Chien qui Fume. Maza's people will strip it before the soup is cold.
 | ev chien 24 ~ Wait in the back room, close enough to hear Maza's other customer. // Customer: Nobody will touch the regulator, Maza. It's promised. A great house. // Maza: Promised by whom? // Customer: By a man who has more friends at the Préfecture than you have rats. // Maza: Nobody has more friends than I have rats, chéri.
 | f chien 400 ~ Collect what Maza pays for the brougham.
 | % ~ Maza: You heard? Good. Then I needn't repeat myself, which I never do. Your clock is spoken for by someone with a coronet. Be careful whom you annoy, mon petit.""",None),
('apache',"Glace et Charbon","Ice and Coal",
 "The winter has made coal dearer than wine, and Maza has a wagon of it that does not, strictly speaking, belong to her. Favours are the only coin she does not count.",
 """@ ~ Maza: One wagon of coal from Bercy to the pavilions before dawn. Nobody hurt, nobody seen, and you stop asking me questions for one whole night.
 | st gig bercy ~ Take the coal wagon from the Bercy depots.
 | d halles ~ Drive it to the Halles pavilions.
 | x halles 2 ~ Twist: Mourier's agents have marked the sacks with chalk to trace them. Burn the marked sacks before they are counted. // Théo: Chalk crosses on every second sack. Somebody expected this wagon.
 | lo 2 ~ The sergents de ville smell smoke. Lose them.
 | % ~ Maza: Chalk! The inspector marks my coal like a schoolmaster. You did well. I shall remember it, and I remember very little.""",None),
('avant',"Chez le Père Tanguy","At Père Tanguy's",
 "Old Tanguy grinds colours on rue Clauzel and gives credit to any painter who looks hungry. A customer paid him last week with a gold watch-key engraved A.V.",
 """@ ~ Tanguy: You are Vallet's boy? Then you are welcome. Mind the Cézannes, nobody buys them, but they still bite.
 | g tanguy ~ Call on Père Tanguy at his colour shop, rue Clauzel.
 | ev tanguy 20 ~ Tanguy is serving a customer. Keep your distance and listen. // Customer: Lead white. All you have. And bitumen. // Tanguy: Bitumen cracks, monsieur, in twenty years. // Customer: That is precisely the point, old man. // Tanguy: (to Théo, after) He wanted his pictures to look old the day they were born. A forger's quantity, I said to myself.
 | c batignolles 3 ~ The customer's servant threw canvas scraps on the rubbish heaps of the Batignolles. Recover three.
 | b batignolles 600 ~ A torn sketchbook page lies in the snow near the scraps. It might be worth something to someone.
 | % ~ Tanguy: Your watch-key, my boy. A.V. Augustin Vallet. Your master's own initials. Whoever paid me with it was laughing at both of us.""","Watch-key 'A.V.'"),
('avant',"Le Moineau","The Sparrow",
 "A barefoot urchin has been watching the workshop for three days. Children do not keep watch for free in January. Follow him and see who pays.",
 """@ ~ Henri: The little one with the cap? Moineau, they call him. Sharp as a tack. Sold me a dead pigeon once as a live one.
 | tl tanguy ratmort ~ Follow Moineau down the hill without being seen. He looks behind him at every corner. // Moineau: (whistling) Au clair de la lune... // Moineau: (to a passing soldier) Spare a sou, mon général? // Moineau: (to himself) Two francs. Two francs for watching a boy watch clocks.
 | ev ratmort 18 ~ He meets a man outside the Rat Mort. Get close enough to hear. // Man: Still at the workshop, the apprentice? // Moineau: Every night. He sleeps in the shavings. // Man: Then tell La Pie her bird has flown into the right cage. Here. Don't drink it.
 | ch moineau abbesses ratmort 0 900 ~ You have the boy by the collar. Let him go free at the Abbesses, or hand him to Maza's man at the Rat Mort. // Théo: Go on. Tell La Pie I said good evening. Moineau: You're soft, monsieur. I'll remember that. In a good way. // Maza's man: Maza will teach him a better trade. Here's for your trouble. Théo: (pocketing it) Then why do I feel I have sold something?
 | % ~ Théo: La Pie has a bird-keeper. And La Pie answers to someone who pays in silver.""",None),
('crimson',"Retour de Genève","Back from Geneva",
 "Lucie Arnoux, engraver and former forger, has slipped back over the Swiss border with a forger's sentence still hanging over her. She can read a scrap of canvas the way a priest reads a confession.",
 """@ ~ Lucie: Don't say my name in this café, it still has a price on it. Sit. Order something hot and look bored. You are very good at it already.
 | g procope ~ Meet Lucie at the Café Procope, the oldest café in Paris and the least discreet.
 | e procope printers ~ Walk her to her old press on rue de la Harpe. Keep off the main streets.
 | k printers 3 ~ Twist: her landlord sold her for twenty francs. Mourier's informers are waiting. // Lucie: Landlords. In the Commune we were going to abolish them. We ran out of time.
 | c printers 2 ~ Gather the tools the informers threw into the snow: her burin and her loupe.
 | % ~ Lucie: (studying the scraps) Primed with lead white, smoked over a lamp, rolled to crack. Someone is making old masters in a warm room, Théo, and very fast.""",None),
('crimson',"Le Blanc de Plomb","Lead White",
 "Lucie suspects the forgeries are being sold at the Hôtel Drouot, where a fortune changes hands every afternoon and nobody asks where anything came from.",
 """@ ~ Lucie: The auction rooms open to view at eleven. Look at the backs of the pictures, not the fronts. The fronts are for fools.
 | g drouot ~ Go to the Hôtel Drouot.
 | sn drouot 2 7 ~ Slip past the porters into the viewing rooms. Stay out of their sight lines.
 | cs drouot 3 ~ Chalk-mark three suspect canvases for Lucie. Raise no alarm.
 | ev drouot 20 ~ Twist: an Englishman is bidding against nobody, and winning. Listen. // Englishman: Lot forty-two. A Corot, quite authentic, I assure you. I painted it myself, very nearly. // Auctioneer: Monsieur Crane is droll. // Crane: Monsieur Crane is paid. Mark the provenance to the Vaneau collection, there's a good fellow.
 | g printers ~ Bring the lot numbers back to Lucie.
 | % ~ Lucie: Crane. Silas Crane. He forged bank notes in Brussels and Turners in London, and now he forges France. And he works for a baron.""",None),
('velvet',"Le Baron","The Baron",
 "A gilded card arrives at the wrecked workshop: Baron Léopold Vaneau wishes to commission a clock for his box at the Opéra, and asks for the apprentice by name.",
 """@ ~ Théo: He asks for me, not for my master. Either he knows Vallet is hurt, or he did the hurting.
 | g cafepaix ~ Meet the Baron's secretary at the Café de la Paix.
 | e cafepaix garnier ~ Drive the secretary to the Opéra. He talks the entire way and says nothing at all.
 | ev garnier 22 ~ Twist: on the grand staircase the Baron is speaking with a man in a policeman's overcoat. Listen from the balustrade. // Vaneau: The boy is to be watched, Mourier, not touched. A frightened apprentice is useless to me. // Mourier: And a dead one is quieter. // Vaneau: Quiet is cheap, Inspector. I prefer things that are dear.
 | g garnier ~ Present yourself to the Baron.
 | % ~ Vaneau: Your master's work was exquisite. Was. I shall need a clock for my box, Monsieur Marchal, and I am told you have very steady hands. Let us see whether you have steady nerves.""",None),
('apache',"Inspecteur Mourier","Inspector Mourier",
 "Inspector Mourier has decided that the apprentice robbed his own master. There is a warrant, and the warrant has a reward attached.",
 """@ ~ Maza: Your inspector wants you in the Dépôt by tonight. He has told every concierge in Paris. They are all deciding what you are worth.
 | al 2 25 ~ Mourier's men close the streets around Les Halles. Survive the net.
 | lo 2 ~ Lose the police.
 | gt catacombs 150 f ~ Twist: every bridge is watched. Cross on foot and go to ground at the Catacombs at Denfert, before the barrier closes.
 | % ~ Théo: Six million dead Parisians under the city, and not one of them asks me for papers. // Lucie: (by note) Stay underground two nights. Then come to me. We have work.""",None),
('avant',"Le Bal de la Galette","The Ball at the Galette",
 "Sunday at the Moulin de la Galette: dancing, cheap wine and masks. Henri says La Pie will be fencing a watch movement among the dancers.",
 """@ ~ Henri: Wear this mask. No, the other way up. There. You look like a disappointed owl. Perfect, nobody looks twice at owls.
 | st phaeton monceau ~ Steal a phaeton near the Parc Monceau. One cannot arrive at a ball on foot.
 | e batignolles galette ~ Collect Henri's two models in the Batignolles and drive them up to the Galette.
 | ev galette 24 ~ Drift among the dancers near the bandstand, and listen for talk of a watch. // Masked woman: A regulator, they say. Twenty-four jewels. // Masked man: And twenty-four buyers, all lying. // Masked woman: La Pie will sell to only one. She says the Baron would rather it were never found. // Masked man: Then why steal it at all? // Masked woman: To make an apprentice come looking.
 | k galette 3 a ~ Twist: Vaneau's men have recognised your walk, mask or no. Drive them off. // Henri: Owls, I said! Not peacocks! You strutted, Théo!
 | % ~ Théo: She took the tourbillon to make me come looking. Then the Baron wants me looking. The question is, what does he want me to find?""",None),
('crimson',"Les Cuivres","The Copperplates",
 "Mourier has seized Lucie's copperplates and taken them to the Préfecture. With them she can prove which prints are hers and which are Crane's.",
 """@ ~ Lucie: The evidence room is on the second floor, behind the clerks of the Sûreté. The clerks sleep at four. I know, because I used to be their evidence.
 | g prefecture ~ Go to the Préfecture de Police on the Île de la Cité.
 | sn prefecture 3 8 ~ Get past the night watch in the courtyard. Keep to the shadows.
 | cs prefecture 2 ~ Take the copperplates from the evidence shelves unseen.
 | ev prefecture 16 ~ Twist: a ledger lies open on the clerk's desk. Read it over his shoulder. // Clerk: (muttering) Vaneau, five hundred... Vaneau, five hundred... Vaneau, a case of champagne for Madame Mourier. // Clerk: The Inspector's wife drinks well for a policeman's wife.
 | lo 2 ~ Slip away across the Pont Saint-Michel.
 | % ~ Lucie: My plates. And you read his ledger too? Théo Marchal, you may yet become a criminal worth knowing.""","Lucie's copperplates"),
('avant',"La Clé de Montre","The Watch-Key",
 "Pawn ticket 4471 leads not to a pawnshop but to a locker in the left-luggage office at the Gare Saint-Lazare, which the watch-key fits exactly.",
 """@ ~ Théo: Someone wanted me to find the key, and the ticket, and now the locker. One does not leave so many breadcrumbs unless one wants the bird to follow.
 | st brougham gare ~ Take a cab at Saint-Lazare as cover.
 | sn gare 3 8 ~ Reach the left-luggage counter without the railway police noticing.
 | cs gare 2 ~ Search the locker and the porter's book.
 | r batignolles,monceau,arc 65 ~ Twist: a cloaked figure snatches the box from under your hands. Chase her to the Étoile! // La Pie: Too slow, little watchmaker! You wind your legs like you wind your clocks!
 | % ~ Théo: She threw it back to me from the Arc. An empty tourbillon case, with a card inside: 'Not yet.' // Henri: Romantic. Thoroughly criminal, and romantic.""","Empty tourbillon case"),
('crimson',"Les Mardis de la rue de Rome","Tuesdays on the rue de Rome",
 "On Tuesday evenings Stéphane Mallarmé receives poets in his small apartment by the Saint-Lazare tracks. A guest there knows Crane's English alias.",
 """@ ~ Lucie: The poets talk in riddles and drink tea. You will hate it. Listen anyway.
 | e procope gare ~ Escort Lucie across the river to the rue de Rome.
 | ev gare 26 ~ Mallarmé's salon. Stand by the stove and listen. // Mallarmé: To name a thing, monsieur, is to destroy three quarters of the pleasure of the poem. // Guest: Your Englishman, Mallarmé, the one who quotes Keats so badly? // Mallarmé: He signs his letters S.C. and his paintings with other men's names. A man so modest he will not even be himself. // Mallarmé: He asked me where one buys a great deal of gilt. Gilt, monsieur. Not gold.
 | tl gare staugustin ~ Twist: a guest leaves early and in a hurry. Follow him to Saint-Augustin. // Guest: (to his cabman) No. Walk. I need the air. // Guest: (under his breath) Twelve. He said twelve. Twelve of what?
 | g staugustin ~ He enters the church by the side door. Go in after him.
 | % ~ Théo: He was looking at the clock in the tower, not the altar. And making notes. // Lucie: Then we have a man who prays to clocks.""",None),
('velvet',"L'Horloge du Baron","The Baron's Clock",
 "Théo has accepted the Baron's commission, as a way inside. The great clock for Vaneau's box needs measuring, and the Opéra's architect has his own opinions on who may touch his building.",
 """@ ~ Charles Garnier: You are the clockmaker? Mind you do not drill my marble. Every Baron in Paris thinks he owns a piece of this house. They own a box. I own the building, in the only way that matters.
 | g garnier ~ Present yourself at the Opéra's artists' entrance.
 | c garnier 3 ~ Take the measurements of the Baron's box: height, depth, the angle of the gaslight.
 | ev garnier 18 ~ Twist: Garnier is showing an English visitor the cellars. Listen. // Garnier: Below us, the reservoir. Water, monsieur, to keep the foundations from floating away. // Crane: And the old cellar under the Baron's box? // Garnier: There is no cellar under the Baron's box. // Crane: How curious. He told me there was.
 | sm bourse 4 ~ The Baron's clerk tests your nerve: wreck the office of a rival watchmaker near the Bourse. // Théo: (to himself) A dirty test for a dirty employer. I'll break the furniture and spare the clocks.
 | % ~ Vaneau: You broke his desks and left his clocks ticking. Sentimental. I find I like you, Monsieur Marchal. That is unfortunate for one of us.""",None),
('apache',"Les Glaçons","The Ice Floes",
 "A barge with the Baron's crest is locked in the ice at the Ivry wharves. Maza's watermen swear it carries Crane's crates. When the thaw comes it will slip away for Le Havre.",
 """@ ~ Maza: Burn it or sink it, I don't care which. But I want one crate, unburnt, for my trouble. I am a businesswoman.
 | g ivry ~ Go to the Ivry wharves.
 | sn ivry 3 8 ~ Cross the ice to the barge without the bargemen seeing you.
 | cs ivry 1 ~ Lift Maza's crate first.
 | x ivry 3 ~ Twist: the crates hold not paintings but blank canvases, stretched and aged for forgeries. Torch them.
 | lo 2 ~ The river brigade is coming over the ice. Lose them.
 | % ~ Maza: (prising the lid) Gilt frames. Empty gilt frames, each with a museum label. Your forger works backwards, mon petit: frame first, picture after.""",None),
('crimson',"Le Faux Corot","The False Corot",
 "Crane's first forgery to surface is a Corot hanging at Goupil's on the rue Chaptal. Lucie has painted a copy of the copy, with her mark hidden in the varnish, so the next sale can be traced.",
 """@ ~ Lucie: Mine is better than his, naturally. Don't let them see you carrying it, a painting under the arm is the only thing more suspicious than a pistol.
 | g goupil ~ Go to Goupil et Cie.
 | sn goupil 3 8 ~ Get past the shopmen to the back gallery.
 | sw goupil ~ Swap Crane's forgery for Lucie's marked copy.
 | lo 1 ~ Leave quietly, and don't run. Men who run are men who have done something.
 | % ~ Lucie: Now every buyer of that Corot carries my signature home. We can follow the money like a thread through a needle.""","Forged 'Corot' (evidence)"),
('crimson',"L'Imprimerie Clandestine","The Secret Press",
 "Crane prints false certificates of provenance by the hundred. A paper merchant on the Boulevard Saint-Michel has been selling museum-grade paper to a man with no museum.",
 """@ ~ Lucie: Follow the paper. Paper always goes home to a press, the way a dog goes home to its master.
 | tl boulmich printers ~ Tail the paper-boy from the Boulevard Saint-Michel. He takes a long way round. // Paper-boy: (singing) Le temps des cerises... // Paper-boy: (stopping to look behind him) ... // Paper-boy: Good evening, Madame Lebrun. No, it's not for the Sorbonne, it's for the Englishman.
 | k printers 4 a ~ Crane's guards defend the press, and they are armed.
 | x printers 2 ~ Smash the press and burn the certificates.
 | c printers 2 ~ Twist: Crane's order book survives. Save the two pages that matter.
 | % ~ Théo: An order book. Twelve clocks are listed, with names beside them: Saint-Augustin, the Bourse, the Châtelet... // Lucie: Twelve churches and halls. That is not forgery. That is architecture.""",None),
('apache',"Le Dégel","The Thaw",
 "The ice is breaking. Maza's watermen say the tourbillon itself was seen being carried aboard a second barge below Notre-Dame. Mourier's men are guarding it.",
 """@ ~ Maza: One hour until the river runs again. After that your clock goes to Le Havre, and from Le Havre to anywhere.
 | st phaeton concorde ~ Take a fast phaeton at the Concorde.
 | r concorde,louvre,notredame 60 ~ Race along the quais before the barge casts off.
 | k notredame 4 a b ~ Board the barge and fight Mourier's hired men. Their leader is armed.
 | c notredame 1 ~ Open the strongroom in the barge's hold.
 | % ~ Théo: Empty, but for a crate stamped with the Baron's crest and a note in La Pie's hand: 'He was never going to send it away. He needs it here.'""",None),
('avant',"Fin de l'Hiver","Winter's End",
 "The last snow is turning to slush on the rue Mouffetard. Maître Vallet is well enough to sit up, and to tell Théo what he should have told him long ago.",
 """@ ~ Henri: He's asked for you. He's asked for his loupe and his tobacco too, so he's either recovering or preparing a deathbed speech.
 | g bateau ~ Collect Henri at the piano works.
 | gt cellier 120 ~ Get to the workshop before Vallet's strength fails him.
 | ev cellier 28 ~ Sit by Vallet's bed, and listen. // Vallet: I did not build the tourbillon for a client, Théo. I built it for a lock. // Vallet: Twelve chiming clocks, all regulated by one master. When they strike together, in a certain order, a door opens. // Théo: A door where? // Vallet: Under the Opéra. Garnier never knew. The Baron paid me to build the key, and when I understood what it opened, I refused to give it to him. // Vallet: So he came for it in the night.
 | % ~ Vallet: Spring is coming, and the Salon. Every collector in Paris will be in one room. Go and watch them, Théo. Somebody will be looking at the wrong picture.""",None),
]
