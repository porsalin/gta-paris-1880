# -*- coding: utf-8 -*-
# ACTE IV — AUTOMNE 1880 — "Les Contes"
ACT4 = [
('crimson',"Les Contes d'Hoffmann","The Tales of Hoffmann",
 "September. At the Salle Favart, Jacques Offenbach, frail and racing his own clock, is rehearsing Les Contes d'Hoffmann. The Opéra-Comique's clock is the sixth of the twelve, and Crane has a man in the orchestra.",
 """@ ~ Offenbach: (at the piano, coughing) Again, from the Barcarolle. Gently. Like a gondola that owes money.
 | g favart ~ Go to the Opéra-Comique, Salle Favart.
 | ev favart 24 ~ Listen to the rehearsal, and to the second oboe, who is not playing. // Offenbach: I would give everything I have to be at the premiere. // Carvalho: You will be, maître. // Offenbach: Carvalho, you are a manager. You lie for a living. // Oboist: (whispering to a stagehand) The clock in the foyer. Midnight on the twenty-fourth. The Englishman will pay double.
 | sn favart 4 10 ~ While the company rehearses, slip past the stagehands into the clock room.
 | sw favart ~ Fit Broca's cylinder in the foyer clock.
 | % ~ Offenbach: (passing Théo in the corridor) You are the man who mends clocks? Mend mine, then. It runs too fast. No? A pity. Nobody can.""",None),
('avant',"Sarah s'en va","Sarah Departs",
 "Sarah Bernhardt sails for New York in the middle of October with a company, eight trunks of costumes and a coffin she sleeps in. She needs a dresser who can climb, pick a lock and lie to customs. Odile has an idea.",
 """@ ~ Odile: A dresser! For Sarah Bernhardt! In America! Théo, it's the only honest job in the world that suits a thief.
 | e bateau comedie ~ Drive Odile down from Montmartre to meet Madame Bernhardt.
 | ev comedie 22 ~ Listen to the interview. // Bernhardt: Can you sew? // Odile: Badly. // Bernhardt: Can you lie? // Odile: Beautifully. // Bernhardt: Then you will dress me, and lie to the newspapermen, and in New York you will be someone else entirely. Everyone is, in New York. // Bernhardt: But you have something to finish first. I can see it in your face. Finish it, and then come. There will be a ticket at Le Havre with your name on it. Your real name.
 | k comedie 4 a ~ Twist: the Baron's men have followed Odile. Drive them off before they reach the stage door.
 | % ~ Odile: My real name. She said my real name. I don't think I've heard it out loud in ten years.""","Bernhardt's letter of engagement"),
('apache',"Le Deuil d'Offenbach","Offenbach's Mourning",
 "5 October. Jacques Offenbach is dead, his opera unfinished. Paris mourns him at the Madeleine, and the Baron uses the funeral to move the tourbillon itself.",
 """@ ~ Maza: All of Paris will be at the Madeleine. The Baron's carriage will be the only one going the other way.
 | g madeleine ~ Go to the Madeleine as the funeral leaves.
 | ev madeleine 18 ~ Listen to the mourners. // Mourner: He wrote music to make Paris laugh at itself. // Other: And now Paris will have to laugh at itself without help. // Fauré: (to the choir) Gently, gently. He would not want it too sad. He would want it in tempo.
 | tl madeleine garnier ~ Twist: Crane, in mourning black, walks against the crowd towards the Opéra. Follow him. // Crane: (to himself) A great man. A great waste. Like all of them. // Crane: (at the Opéra) Inform the Baron. Everything is ready.
 | lo 2 ~ The Baron's watchmen have seen you. Lose them.
 | % ~ Théo: Everything is ready. He has the tourbillon in the vault, and he believes his twelve clocks are still his. In December, we will see whose time it is.""",None),
('apache',"Salle Pleyel","Salle Pleyel",
 "The concert hall of the piano-makers Pleyel, on the rue Rochechouart, holds the seventh clock. Camille Saint-Saëns is giving a recital, and is in no mood to be interrupted.",
 """@ ~ Maza: Your pianist is the most bad-tempered man in Paris. If you make a sound during his Beethoven, he will have you arrested and I won't pay the bail.
 | g pleyel ~ Go to the Salle Pleyel.
 | ev pleyel 22 ~ Listen to Saint-Saëns in the green room before he goes on. // Saint-Saëns: The clock in this hall is three seconds fast. I can hear it from the stage. It is like playing next to a woodpecker. // Saint-Saëns: And some English music-lover has been stealing my manuscripts. My concerto, monsieur. My new concerto! // Théo: We recovered it, monsieur. // Saint-Saëns: You did? Then you are the only reliable person in this city.
 | sn pleyel 4 10 ~ While he plays, get into the clock room past the Baron's men.
 | sw pleyel ~ Fit the cylinder.
 | % ~ Saint-Saëns: (after the recital) The clock is now exactly right. I noticed in the second movement. Whoever you are, you have ruined my excuse for playing badly.""",None),
('crimson',"Salle Érard","Salle Érard",
 "The eighth clock is at the Salle Érard. Lucie's ledger, or Maza's, has made the Baron's friends nervous, and the hall is crawling with private police.",
 """@ ~ Lucie: The men in the ledger know we have it. They have hired guards for every clock in Paris.
 | ?ledger=a al 3 25 ~ The ledger was printed, and the men it named have struck back. Mourier's men close in on the Procope. Hold out.
 | ?ledger=b ev chien 18 ~ The ledger is with Maza. Listen while she uses it. // Maza: (to a frightened magistrate) Your name, page four. Your wife's name, page nine. Your mistress, page eleven. You will take your men off the Salle Érard tonight, monsieur. // Magistrate: That is blackmail, madame. // Maza: It's bookkeeping.
 | g erard ~ Go to the Salle Érard.
 | sn erard 4 10 ~ Get past the private police.
 | sw erard ~ Fit the cylinder.
 | % ~ Théo: Eight. Four to go, and a city that has noticed something is wrong with its clocks.""",None),
('velvet',"La Demande","The Proposal",
 "The Baron invites Théo to dine at the Café Anglais. He has an offer to make, and a threat to make after it, and he never confuses the two.",
 """@ ~ Vaneau: Sit, Théo. Eat. The pigeon is excellent. You look like a young man who has been climbing church towers.
 | g cafepaix ~ Go to the Boulevard, to dine with the Baron.
 | ev cafepaix 26 ~ Listen to him. // Vaneau: I know about the cylinders. I know about Broca, and Lucie, and my unhappy Odile. // Vaneau: I am going to offer you a hundred thousand francs and a workshop on the rue de la Paix. You will be the finest watchmaker in Europe. // Théo: And my master? // Vaneau: Your master is old. Time, Théo, is money. I simply own more of both. // Vaneau: If you refuse, Mourier will arrest you on Christmas Eve, and Odile will be sent somewhere very far away, and very cold.
 | tl cafepaix trinite ~ Twist: you refused. Mourier's sergeant is following you. Follow him instead, from behind. // Sergeant: (to a cabman) Rue de Clichy. No, wait, he's gone. Where's he gone? // Sergeant: (to himself) The Inspector will have my stripes.
 | lo 2 ~ Lose his friends.
 | % ~ Théo: He thinks I'm afraid of him. I am. But I'm more afraid of a world in which he owns the time.""",None),
('apache',"Le Dépôt","The Dépôt",
 "Théo refused the Baron, and the Baron has answered. Henri has been arrested for 'insulting a magistrate' and is in the cells of the Dépôt, under the Palais de Justice.",
 """@ ~ Maza: A painter in the Dépôt. They'll make him paint the walls. Get him out before he starts insulting the guards as well.
 | g palaisjustice ~ Go to the Palais de Justice.
 | sn palaisjustice 5 10 ~ Get past the warders of the Dépôt.
 | ev palaisjustice 16 ~ Find Henri's cell, and listen at the grille. // Henri: (singing, badly) Ah! que j'aime les militaires... // Warder: Shut it, you. // Henri: Monsieur, I am a prisoner of conscience. My conscience demands that I sing.
 | e palaisjustice bateau ~ Get Henri out through the courtyard and drive him home to Montmartre.
 | lo 3 ~ Twist: the escape has been seen from the Quai des Orfèvres. Lose the gendarmes.
 | % ~ Henri: Four days in the Dépôt, and they never once let me have a pencil. I shall paint Mourier as a pig. A very accurate pig.""",None),
('avant',"Rue Laffitte","Rue Laffitte",
 "The picture dealers of the rue Laffitte, led by Durand-Ruel, have agreed to testify against the Baron in the spring. The Baron's answer is to send men with paraffin.",
 """@ ~ Durand-Ruel: They want to burn my stock. Everything I own is in that gallery, monsieur. Including my debts.
 | h durandruel 35 ~ Guard Durand-Ruel's gallery through the night.
 | k durandruel 5 a ~ Twist: the arsonists come in force at dawn. Drive them off.
 | x lorette 2 ~ Burn their paraffin carts before they come back.
 | % ~ Durand-Ruel: (at dawn, among the pictures) Every one of these is a prayer, monsieur. You have kept them from being burnt as heretics.""",None),
('crimson',"Victor Hugo","Victor Hugo",
 "Lucie wants the story told, when it is over, by someone the whole Republic will believe. There is only one such man, and he is seventy-eight years old and lives on the avenue d'Eylau.",
 """@ ~ Lucie: He was in exile for nineteen years. He will understand.
 | e procope arc ~ Escort Lucie to call on Victor Hugo.
 | ev arc 26 ~ Listen to Hugo. // Hugo: Madame, I have known exile. It is a long night in which one learns to see in the dark. // Hugo: You ask me to bear witness against a baron. I have borne witness against an emperor. Barons are smaller, and their crimes larger. // Hugo: Publish. The truth needs no permission, only courage. And a good printer.
 | tl arc champs ~ Twist: a man has been watching the house. Follow him down the avenue. // Watcher: (to himself) The poet's house. The Englishman will want to know. // Watcher: (to a cab) Rue de Rivoli.
 | lo 2 ~ He has called for help. Lose them.
 | % ~ Hugo: (by note, the next day) Monsieur, I am told you followed a spy from my door. At my age one is grateful for such small proofs of the existence of youth.""","Victor Hugo's letter"),
('apache',"Le Conservatoire","The Conservatoire",
 "The ninth clock is at the Conservatoire, in the room where the Prix de Rome is judged. Jules Massenet, who teaches composition there, knows its every eccentricity.",
 """@ ~ Massenet: The clock? Charming. It strikes like a soprano who has had a little too much champagne. Why should anyone want to steal it, dear boy?
 | g conservatoire ~ Go to the Conservatoire.
 | ev conservatoire 20 ~ Listen to Massenet in his classroom. // Massenet: Gentlemen, a melody is a woman. She must be flattered, then abandoned at the right moment. // Student: And if she won't be abandoned, maître? // Massenet: Then you have written an opera. // Massenet: (to Théo, aside) The Englishman came. He asked me which note the clock struck. I lied, naturally. I am a composer.
 | sn conservatoire 4 10 ~ Get past the porters to the judging room.
 | sw conservatoire ~ Fit the cylinder.
 | % ~ Théo: Nine. Three left, and Crane knows exactly which ones.""",None),
('velvet',"Le Salon de Chabrier","Chabrier's Evening",
 "Emmanuel Chabrier has resigned from the Ministry of the Interior to write music full time, and celebrates by giving a party for everyone he knows. One of his guests is the Baron's spy in the crew.",
 """@ ~ Chabrier: You are the one with the bells? Wonderful! I have written a waltz with twelve bells in it. It sounds like a fire in a cathedral. Come in, come in, there is more wine than talent here, but only just.
 | e batignolles staugustin r ~ Drive Monsieur Chabrier to his party.
 | ev staugustin 24 ~ Listen to the guests. // Chabrier: (at the piano) Ta-ra-ta-ra! You see? Bells! // Guest: (low, to another) The bell-founder Broca is working at the foundry in Vaugirard, every night until Christmas. // Other: The Baron will be grateful. // Guest: The Baron is never grateful. He pays, which is better.
 | tl staugustin madeleine ~ Twist: the informer leaves. Follow him. // Informer: (to himself) Broca, Vaugirard, every night. // Informer: (at the Madeleine steps, to a cabman) To the Préfecture.
 | k madeleine 4 a ~ Stop him before he reaches his cab.
 | % ~ Chabrier: (later) My spy? At my party? I am flattered. I did not think anyone took me seriously enough to spy on.""",None),
('apache',"La Fonderie","The Foundry",
 "The informer did not get far, but Mourier has guessed. His men are going to the Vaugirard foundry where Broca is tuning the last bells.",
 """@ ~ Broca: Let them come. I have been shot at by better policemen than Mourier, and I am still here.
 | gt bonmarche 120 ~ Get to Broca's foundry, behind the Bon Marché, before Mourier.
 | h bonmarche 30 ~ Hold the foundry yard while Broca casts the last bell.
 | k bonmarche 5 a b ~ Twist: Mourier's chief bully leads the final rush.
 | df cellier ~ Carry the new bell to Vallet. It is still warm, and cracks if jolted.
 | % ~ Broca: It rings true. A quarter-tone higher than the Baron's. On Réveillon, his chord will become ours.""","Broca's bell"),
('crimson',"La Sorbonne","The Sorbonne",
 "The tenth clock is in the old chapel of the Sorbonne, where the students have already noticed that it strikes thirteen.",
 """@ ~ Lucie: Students. They will be awake at any hour and they will notice anything. Be quick.
 | g sorbonne ~ Go to the Sorbonne.
 | ev sorbonne 18 ~ Listen to the students arguing in the courtyard. // Student: It struck thirteen, I tell you! Like a novel by Jules Verne! // Other: You were drunk. // Student: I am a student of philosophy. I am always drunk. That does not mean I cannot count.
 | sn sorbonne 5 10 ~ Get past the beadles and the Baron's watchmen.
 | sw sorbonne ~ Fit the cylinder.
 | % ~ Théo: Ten. Saint-Germain, the Hôtel de Ville, and the master itself.""",None),
('avant',"Saint-Germain-des-Prés","Saint-Germain-des-Prés",
 "The eleventh clock is in the tower of Saint-Germain-des-Prés, the oldest church in Paris. Crane has guessed it is next, and is waiting inside.",
 """@ ~ Odile: He's waiting for you. Let him wait. Go in through the roof, the way I would.
 | g stgermain ~ Go to Saint-Germain-des-Prés.
 | sn stgermain 5 11 ~ Cross the roof and the bell-loft past Crane's men.
 | sw stgermain ~ Fit the cylinder.
 | k stgermain 5 a b ~ Twist: Crane springs his trap as you leave. Fight your way out.
 | % ~ Crane: (escaping, bleeding) You've got all but one, old man. All but one. Do you know what a chord with one note missing is? It's a discord.""",None),
('velvet',"Rue de Douai","The Rue de Douai",
 "Madame Viardot's clock was the first one Théo saved. Crane means to take it back on the night of her last Thursday of the year, and undo the chord.",
 """@ ~ Viardot: My clock? Again? How tiresome. Bring your watchmaker, Odile. I will sing something long and very loud.
 | g lorette ~ Go to Madame Viardot's.
 | ev lorette 20 ~ Listen to Viardot's last Thursday. // Viardot: (singing) Che farò senza Euridice... // Guest: Is it true, madame, that Turgenev is in Paris? // Viardot: Ivan is always in Paris, in his heart. His body is in Russia, complaining about the cold. // Odile: (whispering) Crane's men are in the garden.
 | k lorette 5 a ~ Twist: Crane's men break in during the aria. Protect the house.
 | sw lorette ~ Fit Broca's cylinder in the clock.
 | % ~ Viardot: (after) They broke my window during the Gluck, which is unforgivable. But you saved the clock. Ivan will be pleased. He likes to think of it ticking while I sing.""","Viardot's clock key"),
('crimson',"Les Plans de Garnier","Garnier's Plans",
 "Charles Garnier does not like the Baron, and likes even less the idea that someone has built a vault under his Opéra without asking. He has the original plans of the foundations.",
 """@ ~ Garnier: A vault? Under my house? Without my permission? Monsieur, I would rather have a Baron in my bed.
 | g institut ~ Meet Garnier at the Institut de France.
 | ev institut 22 ~ Listen to him over the plans. // Garnier: Here is the reservoir. Here, the old quarry, which we filled. Or I thought we filled it. // Garnier: If your Baron has dug into the quarry, his vault lies between the reservoir and the rue Scribe. A good place to hide gold. A bad place to be caught: there is only one way out. // Théo: Two. Through the sewer. // Garnier: Monsieur, no gentleman leaves my Opéra through the sewer. // Théo: I am not a gentleman.
 | c institut 2 ~ Copy the two sheets of the foundation plans.
 | lo 1 ~ Leave quietly.
 | % ~ Garnier: (calling after) If you find anything of mine down there, bring it back! I want to know who has been stealing my marble!""","Garnier's foundation plans"),
('avant',"L'Omnibus","The Omnibus",
 "The crew will need a getaway vehicle large enough for eleven people and a vault's worth of paintings. Maza has her eye on a Madeleine–Bastille omnibus.",
 """@ ~ Maza: Twenty-six seats, three horses and a conductor who owes me money. Nobody looks twice at an omnibus.
 | st omnibus madeleine ~ Take the omnibus at the Madeleine.
 | r vendome,palaisroyal,hoteldeville,bastille 80 ~ Drive the whole route to the Bastille as if nothing were wrong. Make every stop.
 | d chien ~ Bring it to Les Halles to be hidden under the cabbages.
 | % ~ Maza: (patting a horse) This one is Cléopâtre. She bites policemen. We shall get on very well.""","The getaway omnibus"),
('apache',"Le Masque de Crane","Crane's Mask",
 "Crane has gone to ground in the studio above the Folies Bergère, where his twelve painters work. The pupil's plan of the stairs is good. Maza wants to raid it before he can move.",
 """@ ~ Lucie: Twelve painters. Some of them are prisoners, and some are thieves. Try to tell the difference before you hit anyone.
 | g folies ~ Go to the Folies Bergère.
 | sn folies 5 11 ~ Climb the back stairs past Crane's watchmen.
 | cs folies 3 ~ Take three canvases that are proof of the forgery: half-finished, with Crane's notes on them.
 | k folies 5 a ~ Twist: Crane's men discover the raid. Get the painters out.
 | % ~ Pupil: (outside) He's gone. He was gone before you came. He left a note: 'Until Réveillon, old man.'""","Crane's unfinished forgeries"),
('velvet',"Les Préparatifs","The Preparations",
 "November. The gala is in six weeks. The crew gathers in Caillebotte's rooms by the Parc Monceau to set the plan.",
 """@ ~ Maza: Everyone gets paid. Even heroes. Especially heroes, they're the most expensive.
 | g monceau ~ Go to the safehouse by the Parc Monceau.
 | ev monceau 28 ~ Listen to the plan. // Lucie: Twelve clocks. Twelve of our friends at twelve clocks, each with a watch set by Théo. At midnight they strike our chord. // Broca: The vault opens to our tuning, not his. // Odile: I'll be in the Baron's box, with him. He likes me there. // Maza: The omnibus waits in the rue Scribe. // Théo: And Mourier will be at the Opéra to arrest me at midnight. // Henri: Then we make him late.
 | c monceau 3 ~ Collect the pocket watches, each set to the same second, to hand out.
 | % ~ Henri: Everything we have, on one night. If it fails, I want it known that I always said it would.""",None),
('avant',"Fin de l'Automne","The End of Autumn",
 "The first snow. Vallet, out of hospital, is living in a room behind Henri's piano works. He asks to see Théo's watch, the one he will carry on the night.",
 """@ ~ Vallet: Show me. Ah. You have made it yourself. That is good. One should only trust one's own work on the night that matters.
 | g bateau ~ Go to Vallet's room behind the piano works.
 | ev bateau 22 ~ Listen to your master. // Vallet: When I was your age, I thought time was a thing one measured. It is not. It is a thing one keeps, like a promise. // Vallet: The Baron thinks he can own it. He cannot. The best he can do is borrow it, and he has borrowed too much. // Vallet: Go, Théo. Keep your promise.
 | % ~ Théo: The last night of autumn. And in December, a gala.""",None),
]
