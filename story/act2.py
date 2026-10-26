# -*- coding: utf-8 -*-
# ACTE II — PRINTEMPS 1890 — "Le Salon"
ACT2 = [
('avant',"Les Indépendants","The Independents",
 "20 March. The Société des Artistes Indépendants opens its sixth exhibition in the Pavillon de la Ville de Paris on the Champs-Élysées, and Monsieur Signac needs a watchman he can trust. Henri has vouched for Théo, which Signac regards as a point against him.",
 """@ ~ Signac: You are the clockmaker. Good. Clockmakers look at things closely and say nothing. Painters look at nothing and say everything. Monsieur Seurat will tell you which pictures matter. He will say all of them, in a whisper.
 | g industrie ~ Report to Signac at the Pavillon de la Ville de Paris, beside the Palais de l'Industrie.
 | ev industrie 22 ~ Walk the rooms. Watch the walls, not the visitors, and listen to two gentlemen at the Cassatts. // First gentleman: Dots. Ten thousand dots, and not one of them a face. // Second gentleman: Then why are you measuring them, Albert? // First gentleman: The Baron wants the sizes. He says he can sell a daub very dear, provided it has a famous name. // Degas: (passing) And a famous frame, no doubt.
 | k industrie 3 ~ Twist: at closing time three men produce knives and go for the canvases. Stop them. // Seurat: (quietly) Not that one. It took a year. Every point of it took a year.
 | % ~ Signac: You will stay on as watchman until the twenty-seventh. Thirty francs a week and no opinions. Mademoiselle Cassatt came to look yesterday, and saw something. Ask her; she is the only one of us with any sense.""",None),
('avant',"Mademoiselle Cassatt","Miss Cassatt",
 "Mary Cassatt noticed a copyist at her pastels who worked far too well and far too fast. She would like Théo to walk with her to the Tuileries, where she says she last saw him.",
 """@ ~ Cassatt: In Philadelphia we would simply ask the man what he was doing. In Paris that is considered vulgar, so we follow him instead.
 | e industrie tuileriesg r ~ Escort Mademoiselle Cassatt to the Tuileries gardens.
 | g tuileriesg ~ Cassatt: There. By the ruined palace, with the folding stool. He has a painter's hands and a bookkeeper's eyes.
 | tl tuileriesg vendome ~ Follow the copyist without alarming him. // Copyist: (to a nursemaid) Charming child. Hold still, I shall have him in three strokes. // Copyist: (counting under his breath) Four Cassatts, two Degas, one Morisot. // Copyist: (at the Rue de Castiglione) Damn the man, he is always early.
 | ev vendome 18 ~ Twist: under the Vendôme Column he meets Silas Crane. Listen. // Crane: You copied her line, not her mind, old chap. These children have no weight in them. // Copyist: The buyers don't look at weight, they look at the name. // Crane: The Baron's buyers will look very carefully. Do them again.
 | % ~ Cassatt: (later, by letter) I have seen the copies. They are clever. That is the worst I can say of any picture. Tell me how I may help.""",None),
('crimson',"La Bête Humaine","The Human Beast",
 "Zola's railway novel is in every bookseller's window, and Maupassant's Notre Cœur is running in the Revue des Deux Mondes, so the boulevard can talk of nothing but novelists. Maupassant, it seems, has dined with a Baron who asked a great deal about clocks.",
 """@ ~ Lucie: Maupassant drinks at the Procope after the Odéon. He will tell you everything if you let him think it was his idea.
 | g procope ~ Meet Lucie at the Procope.
 | ev procope 24 ~ Maupassant holds court at the next table. Listen. // Maupassant: Boule de Suif is a fat girl in a carriage, my friends, and she is the only honest person in France. // Friend: And your Baron? // Maupassant: Vaneau? He collects people the way he collects pictures, with the price still pinned to the frame. He asked me whether I knew any good clockmakers. I said I knew only bad poets. // Maupassant: He laughed. Men like that only laugh when they are counting.
 | e procope odeon r ~ Walk Monsieur de Maupassant to the Odéon, where he means to look at the actresses.
 | g odeon ~ Maupassant: You want to know about the Baron? Then a word of advice, from a man at the Ministry of the Marine. He keeps two ledgers. One for the tax man, and one for God.
 | % ~ Lucie: Two ledgers. If we find the second one, we have him. If he finds us looking, he has us.""",None),
('velvet',"Le Jury","The Jury",
 "The official Salon fills the Palais de l'Industrie. Vaneau sits on a committee that hangs the pictures, and he wants Monet's old Lavacourt, lent by a collector to the retrospective room, to 'go missing' before the critics see it. Théo plays along, and hides it to save it.",
 """@ ~ Vaneau: Monsieur Monet is going about Paris with a subscription list, collecting money to buy Manet's Olympia for the nation. The nation does not want it. Let him learn what it costs to embarrass men of taste. You will make his picture vanish. Do it well and you have a friend for life. Do it badly and you have me.
 | g industrie ~ Go to the Palais de l'Industrie.
 | sn industrie 3 9 ~ Get past the Salon guardians to the store-rooms.
 | cs industrie 2 ~ Take the Lavacourt and its frame, unseen.
 | df bateau ~ Carry it to Henri's at the piano works. It is a Monet: drive as if it were made of eggshell.
 | % ~ Henri: (unwrapping it) The Seine at Lavacourt, in winter, with the ice on it. He paints cold like other men paint fire. // Théo: Tomorrow it goes back on the wall, the right way up, before the critics come. Vaneau will think his own men bungled it.""","Monet's Lavacourt (rescued)"),
('apache',"Le Receleur","The Fence",
 "Maza has heard that a buyer is shopping in the Marais for a 'regulator movement of exceptional quality'. Buyers like that have middlemen, and middlemen have weak knees.",
 """@ ~ Maza: Three of them, behind the Cirque d'Hiver. Persuade them. I do not mean with poetry.
 | st brougham bastille ~ Take a brougham at the Bastille.
 | k cirquehiver 3 a ~ Shake down the middlemen behind the Cirque d'Hiver. One of them has a revolver.
 | c cirquehiver 2 ~ Collect the silver they dropped in their hurry.
 | f chien 900 ~ Sell their silver to Maza.
 | % ~ Maza: They told me, between sobs, that the buyer was not buying. He was making sure nobody else could. The Baron is cornering the market in your master's clocks, mon petit.""",None),
('crimson',"Sarah en Jeanne","Sarah as Joan",
 "April. Sarah Bernhardt is playing Jeanne d'Arc at the Porte Saint-Martin, and the crowd at the stage door is larger every night. Crane means to use the crush to lift a portrait from the theatre foyer.",
 """@ ~ Lucie: Every journalist in Paris will be at the stage door. Nobody will be looking at the walls. Nobody but us.
 | g republique ~ Go to the Théâtre de la Porte Saint-Martin, by the Place du Château-d'Eau.
 | k republique 3 a ~ Stop Crane's men under the portico before they reach the foyer.
 | e republique stjacques r ~ Madame Bernhardt wants a way out through the crowd. See her safely to her carriage by the Tour Saint-Jacques. // Bernhardt: They burn me at the stake eight times a week, monsieur. One learns to leave a theatre quickly.
 | g stjacques ~ Bernhardt: You have a kind face, young man. It will be the ruin of you. Come and see me when I am Cleopatra; it opens in October.
 | % ~ Lucie: The portrait is safe. And you have been kissed on both cheeks by Sarah Bernhardt, which Henri will never forgive.""",None),
('avant',"Au Bon Marché","At the Bon Marché",
 "Crane's forgeries are hung as decoration in the grands magasins, and sold quietly to rich clients who think they are buying a bargain. Lucie needs a catalogue of them.",
 """@ ~ Lucie: Four of them, in the salons on the first floor. Mark the stretchers with this. It glows under a lamp. Like guilt.
 | g bonmarche ~ Go to Au Bon Marché.
 | sn bonmarche 3 9 ~ The store detectives patrol the galleries. Keep out of their sight.
 | cs bonmarche 4 ~ Mark four forgeries.
 | lo 1 ~ Leave by the delivery yard.
 | b stsulpice 800 ~ A shopgirl dropped a sealed envelope addressed to 'S.C.' outside Saint-Sulpice. Retrieve it.
 | % ~ Lucie: Four, and all of them sold to the same three families. They are not selling paintings, Théo. They are buying people.""",None),
('velvet',"L'Entresol","The Mezzanine",
 "At Boussod, Valadon et Cie, the old house of Goupil, a young Dutch manager named Theo van Gogh keeps the pictures his employers dislike on the mezzanine. Vaneau asks Théo to 'collect' one for his private gallery. Instead Théo will plant a tracing behind it.",
 """@ ~ Vaneau: The little Monet upstairs, the cliffs. Take it after the gas is lowered. The Dutchman will never notice; he is far too busy apologising for his taste.
 | g goupil ~ Go to Boussod, Valadon et Cie.
 | ev goupil 20 ~ Monsieur van Gogh is showing the mezzanine to a visitor. Listen. // Van Gogh: Downstairs we sell what Paris already likes, madame. Up here I keep what it will like in twenty years. // Van Gogh: (to Théo) You look at the pictures like a man looking for a door. What is behind the canvas, a mistress or a debt? // Théo: A clock, monsieur. // Van Gogh: Ah. That is worse. My brother would say a clock is only a sunflower that has learned arithmetic.
 | sn goupil 3 9 ~ Wait for the gas to be lowered, then slip past the clerks.
 | sw goupil ~ Hide Lucie's tracing behind the canvas Vaneau wants. He can keep the frame and the empty ambition.
 | % ~ Théo: I left the cliffs where they were and stole the Baron's patience instead. Now, when his men take that painting, Lucie's tracing goes with it, and we will know where his gallery is.""",None),
('crimson',"Le Petit Debussy","Young Debussy",
 "Claude Debussy, twenty-seven, back from Rome with a Prix de Rome and no money, gives lessons in the practice rooms of the Conservatoire. He has been making fun of an 'English music-lover' who copied out every manuscript in the library. Debussy, naturally, noticed.",
 """@ ~ Debussy: You are the police? No? A pity. I have always wanted to be arrested for an opinion.
 | g conservatoire ~ Go to the Conservatoire on the rue du Faubourg-Poissonnière.
 | ev conservatoire 22 ~ Debussy is improvising in a practice room while the masters argue in the corridor. Listen to both. // Debussy: (playing) What do you think of it, monsieur? It has no rules at all. // Master: It has no manners, which is worse. // Debussy: The Englishman asked for Monsieur Fauré's Requiem, the new score with the full orchestra. He wrote down every note. He sang it to himself, flat. // Master: Monsieur Debussy, this room is for pupils, not for revolutions. The scale of D, please, and without improvements.
 | tl conservatoire heugel ~ Twist: the Englishman's copyist is leaving with a satchel. Follow him to the music publisher Heugel. // Copyist: (to himself) Pie Jesu... pie, pie, piece of luck...
 | k heugel 3 a ~ He is selling the copy to Crane's agents. Stop the sale.
 | % ~ Debussy: (by note, a week later) I hear you saved Monsieur Fauré from piracy. He was charming about it. He is charming about everything, which is very hard to forgive.""","Copied score of Fauré's Requiem"),
('avant',"Le Jeudi de Madame Viardot","Madame Viardot's Thursday",
 "Pauline Viardot holds her musical Thursdays on the rue de Douai. Tonight an English tenor has been invited, and Lucie is fairly certain he is no tenor.",
 """@ ~ Lucie: A tenor who has never sung in public, who has three addresses, and who once asked me to forge a Turner. If he sings tonight, I shall eat my bonnet.
 | g lorette ~ Go to the rue de Douai, near Notre-Dame-de-Lorette.
 | ev lorette 26 ~ Stand at the back of the music room, and listen to the conversation under the music. // Viardot: Monsieur Crane, will you not sing for us? // Crane: Alas, madame, I have a cold. An English cold. It lasts for years. // Viardot: How sad. Then perhaps you will tell my guests why you were in my study. // Crane: I was admiring your clock, madame. It is a Vallet. // Viardot: It is, and it is mine. Ivan Sergeyevich gave it me. I should notice if it walked.
 | sn lorette 3 9 ~ Twist: Crane has left a device inside Viardot's clock. Slip into the study unseen.
 | c lorette 1 ~ Take out Crane's little brass cylinder.
 | % ~ Théo: A brass cylinder pinned like a music box, tuned to strike one bell at one moment. Madame Viardot's clock is one of the twelve.""","Crane's chiming cylinder"),
('apache',"La Fuite du Copiste","The Copyist Flees",
 "Cassatt's copyist has realised he is being followed. He has taken a cab and twenty forged pastels, and is making for the Gare du Nord and the Boulogne boat.",
 """@ ~ Maza: My cabmen saw him. He has a hundred-franc note in each glove and terror in his face. Bring me the pastels and him in one piece.
 | st phaeton tortoni ~ Take a fast phaeton outside Tortoni's.
 | r tortoni,folies,garenord 55 ~ Catch the copyist's cab before the boat train goes.
 | k garenord 3 a ~ Crane's men are seeing him off. Deal with them.
 | c garenord 2 ~ Save the portfolios from the platform.
 | % ~ Copyist: (shaking) I only copy! I never sign! He signs them! Crane signs them, with whatever name the Baron wants! // Maza: Then you will copy one more thing, my dear: a confession.""","Twenty forged pastels"),
('crimson',"Nadar","Nadar",
 "Nadar, photographer, balloonist and inexhaustible talker, has offered to photograph the forgeries under a raking light that shows every brushstroke. The plates must reach his studio intact.",
 """@ ~ Nadar: Glass, my young friend! Twenty plates of glass between you and the truth! In a balloon I once dropped one at four hundred metres and it survived. I would not count on such luck in a Paris cab.
 | g printers ~ Collect the forgeries from Lucie.
 | df boulevard ~ Drive the plates and the pictures to the boulevard. Glass: drive gently.
 | ev boulevard 20 ~ Watch over Nadar as he works, and listen. // Nadar: Look. Under the light, a true Degas has a hundred hesitations. Your forger never hesitates. That is how you know a liar: he never stops to think. // Nadar: I have photographed Hugo, Baudelaire, Sarah. They all hesitated. Only the forger is sure of himself.
 | al 2 20 ~ Twist: Mourier's men raid the studio for 'indecent photographs'. Hold them off while Nadar hides the plates.
 | % ~ Nadar: Indecent! The only indecent thing in this studio is the inspector's warrant. Here are your plates, intact. The truth, Monsieur Marchal, is chemically fixed.""","Nadar's photographic plates"),
('apache',"Le Pont des Arts","The Pont des Arts",
 "Mourier has learned that Théo meets Lucie at the Institut, and has laid a trap on the Pont des Arts. Maza has learned it too, and has her own opinion of traps.",
 """@ ~ Maza: He has twenty men on the bridge. I have two hundred porters at Les Halles who hate him. Arithmetic is on our side.
 | g institut ~ Go to the Institut de France as if you knew nothing.
 | al 3 25 ~ Mourier springs the trap. Survive until Maza's porters arrive.
 | lo 3 ~ In the confusion, lose the gendarmes.
 | gt chien 140 ~ Get back to Les Halles before Mourier works out where the porters came from.
 | % ~ Maza: He arrested forty porters and released them all by midnight. He could not prove which ones had thrown the cabbages. I have never been prouder of a vegetable.""",None),
('crimson',"Madame Morisot","Madame Morisot",
 "After the Pont des Arts, Mourier has every hotel and lodging-house watched. Berthe Morisot, who exhibited with the Impressionists from the first and fears nobody, has offered Théo a room in her house on the rue de Villejust, near the Étoile, for one night.",
 """@ ~ Morisot: My husband thinks you are a cousin from Bordeaux. Try to look provincial. No, less. Bordeaux is not the moon.
 | gt arc 120 ~ Get to the Morisots' house near the Étoile before curfew patrols begin.
 | ev arc 24 ~ Twist: Mourier himself calls at the door. Listen from the stairs. // Mourier: Madame, an apprentice watchmaker, a thief, has been seen in this street. // Morisot: Inspector, I paint women in white dresses on summer afternoons. Do I look as if I harbour thieves? // Mourier: Madame paints very modern pictures. Modern people are capable of anything. // Morisot: Then you must arrest the century, Inspector. Good night.
 | tl arc champs ~ Mourier leaves unsatisfied, and walks, not drives. Follow him down the avenue. // Mourier: (to his sergeant) The Baron says leave the painters alone. I'd like to leave them in the Seine. // Mourier: Twelve days. He wants it in twelve days.
 | % ~ Morisot: (at breakfast) You followed a policeman down the Champs-Élysées in my husband's hat. I shall paint that one day, but nobody would believe it.""",None),
('avant',"Durand-Ruel","Durand-Ruel",
 "Paul Durand-Ruel, the dealer who has risked his fortune on the Impressionists, has been offered a 'Monet' he knows Monet never painted. He will look at it only in the presence of a witness.",
 """@ ~ Durand-Ruel: Forgery is a sin, Monsieur Marchal, against the painter and against God. I am Catholic and a dealer; I find I disapprove of it twice.
 | e durandruel drouot r ~ Drive Monsieur Durand-Ruel to the Hôtel Drouot.
 | ev drouot 22 ~ Stand at his shoulder while he examines the canvas, and listen. // Durand-Ruel: The light is wrong. Monet paints the moment before the light changes. This man has painted the moment after. // Auctioneer: It comes with a certificate, monsieur. // Durand-Ruel: So do bank notes. Who sold it to you? // Auctioneer: The Vaneau collection. // Durand-Ruel: Then the Vaneau collection had better pray.
 | k drouot 3 a ~ Twist: the Baron's men try to take the canvas back before it can be photographed.
 | % ~ Durand-Ruel: I shall keep this, with your permission, under lock and key. When the time comes, I will stand up in any court in France and say so.""",None),
('velvet',"La Madeleine","The Madeleine",
 "Vaneau has invited Théo to hear Gabriel Fauré direct the choir at the Madeleine. He has also, Théo suspects, arranged to show him something in the organ loft.",
 """@ ~ Vaneau: Fauré is a genius, and genius is so badly paid. I have offered to buy him an organ. He refused. Imagine, a man who refuses an organ.
 | g madeleine ~ Go to La Madeleine.
 | ev madeleine 22 ~ Listen to the Baron during the anthem. // Fauré: (to the choir, quietly) Softer. As though you were afraid of waking someone. // Vaneau: (to Théo) The clock in the tower is old. I mean to have it replaced, with a Vallet. Your master's. Do you see? I am putting his music in all the churches of Paris. // Théo: Music, monsieur? // Vaneau: Every clock is music, if you listen correctly.
 | sn madeleine 3 9 ~ After the service, slip up to the tower clock past the vergers.
 | c madeleine 1 ~ Twist: Crane has already been here. Remove his cylinder from the striking train.
 | % ~ Fauré: (meeting Théo on the stair) You are the clockmaker's boy? The bell has been striking a half-tone flat for a week. Thank you. I thought I was going mad, which in a choirmaster is only a matter of time.""","Second chiming cylinder"),
('apache',"Le Masque","The Mask",
 "La Pie has been seen on the rooftops of Montmartre, carrying a bag of cylinders. This time Théo is ready for her.",
 """@ ~ Henri: She runs the same route every night, the windmills to the Tertre. Like a cat, or a postman.
 | gt galette 90 ~ Get to the Moulin de la Galette before the moon rises.
 | r radet,blutefin,tertre,sacrecoeur 50 ~ Chase La Pie across the rooftops and the windmill yards. // La Pie: Still winding your legs, watchmaker? // La Pie: You're gaining! How tiresome!
 | k sacrecoeur 3 a ~ Twist: at the scaffolding of the Sacré-Cœur, the Baron's men are waiting for her too. They mean to silence her.
 | % ~ La Pie: (catching her breath) You fought for me. Why? // Théo: Because I want my clock back, and you know where it is. // La Pie: How romantic. Meet me tomorrow, under the Opéra. Come alone. Or don't come at all.""",None),
('velvet',"L'Aveu","The Confession",
 "Under the Opéra, in the old fosse beside Garnier's reservoir, La Pie takes off her mask. Her name is Odile, and she is the Baron's ward.",
 """@ ~ Théo: Garnier said there was no cellar under the Baron's box. There is. I am standing in it.
 | gf garnier ~ Go down into the cellars of the Opéra on foot.
 | sn garnier 4 9 ~ Pass the Baron's night watchmen to the reservoir.
 | ev garnier 28 ~ Odile is waiting. Listen to her. // Odile: He took me in when I was nine. Taught me to climb, to pick locks, to bow to duchesses. I thought it was a kind of love. // Odile: I stole the tourbillon because he told me to. I left the feather because I wanted someone to come. // Théo: Why me? // Odile: Because you would come for the clock, not the money. Men who come for money can be paid to go away.
 | ev garnier 18 ~ Twist: footsteps. The Baron himself is in the cellars. Keep listening. // Vaneau: Odile? Are you down here, my dear? You know how I dislike it when you take the air without me. // Odile: (whispering) Go. He must not find us together.
 | gt cafepaix 60 f ~ Get out through the artists' entrance before the Baron's watchmen return.
 | % ~ Théo: The Baron's ward. And the Baron's prisoner.""",None),
('apache',"Les Tours de Notre-Dame","The Towers of Notre-Dame",
 "Mourier has found out about Odile, and has sent men to bring her in. She has fled to the one place in Paris higher than the Baron's reach: the towers of Notre-Dame.",
 """@ ~ Maza: If the police get her, the Baron gets her. If we get her, we owe nobody anything. I like that kind of girl.
 | gt notredame 100 ~ Get to Notre-Dame before Mourier's men climb the north tower.
 | k notredame 4 a ~ Fight off Mourier's men on the parvis.
 | ch odile notredame hoteldieu 0 1200 ~ Odile is cornered and exhausted. Let her go free on the parvis, or march her to Maza's cab at the Hôtel-Dieu, where Maza will keep her safe and under lock. // Odile: You're letting me go? Then I owe you. I hate owing. // Maza: She'll be warm, fed, and locked in. Here's for your trouble, mon petit. And don't look at me like that. Safe is safe.
 | lo 2 ~ Lose the police across the bridges.
 | % ~ Théo: Spring is ending. The Salon closes. And the Baron has lost his magpie.""",None),
('avant',"Fin du Printemps","The End of Spring",
 "The Salon has closed. The Independents have counted their losses and their friends. In the workshop on rue Mouffetard, Théo lays two brass cylinders on the bench next to his master's drawings.",
 """@ ~ Vallet: Let me see them. Ah. Crane is a brute, but he is a careful brute.
 | g cellier ~ Return to the workshop on rue Mouffetard.
 | ev cellier 24 ~ Listen to Vallet read the cylinders like a score. // Vallet: Each one strikes a single note at a single moment. Twelve notes, twelve clocks, all over Paris. Together they make a chord. // Vallet: The chord opens the lock. But only if every clock is regulated by the same master, to the same second. // Théo: The tourbillon. // Vallet: Without it, the clocks drift. With it, they sing together. He needs it, and he needs twelve clocks, and he has only ten.
 | c cellier 2 ~ Hide the cylinders in the workshop where no thief would look: inside the broken clocks.
 | % ~ Vallet: Summer will be long, Théo. The exiles are coming home, and the Republic means to throw itself a party. A fine time for a Baron to settle his accounts.""",None),
]
