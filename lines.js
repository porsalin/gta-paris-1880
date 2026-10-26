// Paris 1890 — street voices. Tagged phrase banks for generated NPC conversation (life.js).
// Tags: t = time (morning/day/evening/night), w = rain/dry, d = district index (world.js DN), k = trade group,
// h = notoriety (0 calm, 1 wanted, 2 known face), a = act (0..4, story progress), m = temperament.
export const FIRST_M = ['Jules', 'Émile', 'Gaston', 'Anatole', 'Achille', 'Hippolyte', 'Ernest', 'Léon', 'Firmin', 'Prosper', 'Alphonse', 'Désiré', 'Honoré', 'Octave', 'Marius', 'Eugène', 'Aristide', 'Fernand', 'Lucien', 'Edmond', 'Adolphe', 'Bastien', 'Clovis', 'Gustave', 'Isidore', 'Narcisse', 'Philibert', 'Raoul', 'Séverin', 'Victorin'];
export const FIRST_F = ['Marguerite', 'Adèle', 'Berthe', 'Clémence', 'Eugénie', 'Félicie', 'Hortense', 'Joséphine', 'Léontine', 'Mathilde', 'Pauline', 'Rosalie', 'Séraphine', 'Valentine', 'Zélie', 'Amélie', 'Céleste', 'Fanny', 'Irma', 'Juliette', 'Victorine', 'Delphine', 'Ernestine', 'Philomène', 'Albertine'];
export const SURN = ['Dupuis', 'Lefèvre', 'Moreau', 'Girard', 'Chabert', 'Fournier', 'Mercier', 'Blanchard', 'Gauthier', 'Perrin', 'Leclerc', 'Barbier', 'Brunet', 'Roussel', 'Vasseur', 'Delorme', 'Chevalier', 'Picard', 'Lambert', 'Collin', 'Thibault', 'Marchand', 'Aubry', 'Pelletier', 'Guérin', 'Rivière', 'Dufresne', 'Lhermite', 'Bouchard', 'Caron', 'Masson', 'Tessier', 'Vidal', 'Lemoine', 'Poulain', 'Ragot', 'Sauvage', 'Joly', 'Bertin', 'Ferrand', 'Noël'];
export const NICK = ['la Puce', 'Bec-de-Gaz', 'le Frisé', 'Trompe-la-Mort', 'Gros-Louis', 'la Fouine', 'Casse-Cou', 'P\'tit Bleu'];
// trade groups by look; district-specific trades override (d: index)
export const TRADES = {
  bourgeois: { g: 'rich', m: ['rentier', 'notary', 'stockbroker at the Bourse', 'banker', 'doctor', 'barrister', 'industrialist', 'deputy\'s private secretary'], f: ['rentière'] },
  clerk: { g: 'clerk', m: ['clerk at the Postes', 'shop assistant at the Bon Marché', 'typesetter', 'notary\'s clerk', 'omnibus conductor', 'bookkeeper', 'telegraphist', 'insurance clerk'] },
  worker: { g: 'work', m: ['mason', 'carter', 'navvy', 'blacksmith', 'cabinetmaker', 'rag-picker', 'mechanic', 'gas-lamp lighter', 'roofer'] },
  lady: { g: 'lady', f: ['milliner', 'widow of independent means', 'schoolmistress', 'seamstress', 'actress between engagements', 'flower-seller', 'corsetière', 'piano teacher'] },
  maid: { g: 'serv', f: ['maid-of-all-work', 'laundress', 'cook', 'wet-nurse', 'costermonger', 'milk-woman', 'concierge'] },
  artist: { g: 'art', m: ['painter', 'poet', 'café-concert pianist', 'sculptor', 'chansonnier', 'engraver', 'art student'], f: ['artist\'s model', 'painter', 'dancer at the Élysée-Montmartre'] },
  cop: { g: 'cop', m: ['sergent de ville'] }, gend: { g: 'cop', m: ['garde républicain'] }, soldier: { g: 'cop', m: ['soldier of the line'] },
  apache: { g: 'gang', m: ['apache'] }, gang: { g: 'gang', m: ['tough'] },
};
export const DTRADE = { 2: { work: 'fort des Halles (market porter)', serv: 'fishwife at the Halles' }, 3: { work: 'railwayman', clerk: 'ticket clerk at the Gare du Nord' }, 4: { work: 'bargeman', serv: 'washerwoman on the bateaux-lavoirs' }, 6: { clerk: 'law student', art: 'medical student' }, 9: { work: 'slaughterman at La Villette' }, 10: { work: 'cabinetmaker of the Faubourg' }, 0: { work: 'quarryman', serv: 'laundress of the Butte' } };
export const TEMPS = ['gruff', 'chatty', 'nervous', 'pompous', 'dreamy', 'sly', 'cheerful', 'weary'];
export const GREET = {
  gruff: ['Hm.', 'What?', 'Eh bien, what is it?', 'Make it quick.', 'You again? No — I don\'t know you.'],
  chatty: ['Ah, bonjour, bonjour!', 'Tiens, a new face!', 'Oh, you\'ll want to hear this —', 'Monsieur! Have you heard?', 'Mais oui, stop a moment, nobody else listens to me.'],
  nervous: ['Oh! You startled me.', 'I — yes? Is something wrong?', 'Not so close, s\'il vous plaît.', 'Mon Dieu, I thought you were a pickpocket.'],
  pompous: ['My good fellow.', 'Ahem. You may speak.', 'Young man, I am a busy person.', 'You address me, monsieur?'],
  dreamy: ['Hm? Oh — bonjour.', 'Look at the light on the roofs...', 'Sorry, I was miles away. In Brittany, I think.', 'Ah. A person.'],
  sly: ['Psst. You look like a man who listens.', 'Bonjour, mon prince.', 'Eh, eh. What are you buying?', 'Keep walking with me, act natural.'],
  cheerful: ['Bonjour, citoyen!', 'Ah, quelle belle journée — or nearly!', 'Salut! You look lost — we\'re all lost here, it\'s Paris!', 'Bien le bonjour!'],
  weary: ['Oh, là là. Yes?', 'Ask quickly, my feet are on fire.', 'Bonjour. If you must.', '...Yes, monsieur?'],
};
export const BYE = {
  gruff: ['Now clear off.', 'Bon. That\'s all.', 'Go on, go.'], chatty: ['Anyway — I could talk all day! À bientôt!', 'Tell your friends Félix sent you. Well, not Félix. Me.', 'Allez, bonne journée!'],
  nervous: ['I must go — my mother is waiting.', 'Please don\'t follow me.', 'Excuse me, excuse me.'], pompous: ['Good day to you.', 'You may go.', 'I shall mention this to the Préfet. Or not.'],
  dreamy: ['...where was I going?', 'Look at the clouds, monsieur. Free of charge.', 'Adieu, adieu.'], sly: ['You never saw me.', 'Ten sous says I\'m right. Pay me later.', 'Keep your hand on your watch, hein?'],
  cheerful: ['À la vôtre!', 'Allez, courage!', 'Vive la République — and good luck!'], weary: ['C\'est la vie.', 'Que voulez-vous.', 'Bon... back to it.'],
};
// [tags, text]. {place} nearest landmark, {dist} district, {trade}, {name}
export const BANK = [
  // ---- time of day
  ['t:morning', 'The milk carts woke me at five, as usual. Paris gets up before God does.'], ['t:morning', 'Coffee, a tartine, the Petit Journal for five centimes — the only good hour of the day.'],
  ['t:morning', 'At this hour the omnibus is full of clerks pretending to be asleep.'], ['t:day', 'Look at the boulevards — everybody walking, nobody going anywhere.'],
  ['t:day', 'Noon gun from the Palais-Royal. My stomach knew already.'], ['t:evening', 'L\'heure verte — every café between here and the Madeleine smells of absinthe.'],
  ['t:evening', 'They are lighting the lamps. Gas here, electric on the Boulevard des Italiens. Progress, hein?'], ['t:evening', 'Dinner at a bouillon Duval — thirty sous and the waitresses in white bonnets.'],
  ['t:night', 'You shouldn\'t be walking about at this hour. Neither should I.'], ['t:night', 'After midnight the Butte belongs to the apaches and the poets — hard to tell which is worse.'],
  ['t:night', 'The night cabs have yellow lamps. Take one — the walk home is longer than you think.'], ['t:night', 'Only the Halles never sleep. They are bringing in the cabbages already.'],
  // ---- weather
  ['w:rain', 'This rain! My umbrella has given up the Republic and gone over to the Monarchists.'], ['w:rain', 'Rain on the zinc roofs — that\'s the true music of Paris, not your Massenet.'],
  ['w:rain', 'The gutters are rivers again. Mind your boots, the sewers are not as clean as the Prefect claims.'], ['w:rain', 'In this wet the horses slip on the wooden paving — two down on the rue de Rivoli this morning.'],
  ['w:dry', 'Fine weather. Even the sparrows look prosperous.'], ['w:dry', 'Dry at last — the dust on the boulevards is so thick you could plant potatoes.'],
  // ---- era: 1890
  ['', 'Have you been up Monsieur Eiffel\'s tower? Three hundred metres of iron. They say Maupassant lunches up there — the only place in Paris he can\'t see it.'],
  ['', 'The Exposition closed in November and I still dream of the Galerie des Machines. All that iron, all that glass.'],
  ['', 'The Panama Company went bust last year. My brother-in-law\'s savings are at the bottom of a canal full of mosquitoes.'],
  ['', 'General Boulanger? Sulking in Jersey, they say. Paris adored him for a summer and then forgot his name.'],
  ['', 'La grippe — the Russian influenza — had half my street in bed this winter. Even the undertakers fell ill.'],
  ['', 'The workers are marching on the first of May. Eight hours\' work, eight hours\' sleep, eight hours for ourselves. Imagine!'],
  ['', 'I heard Edison\'s phonograph at the Exposition. A tin cylinder that sings. The Devil must be jealous.'],
  ['', 'Buffalo Bill and his Indians camped at Neuilly last year. My nephew still wears a feather.'],
  ['', 'The new Moulin Rouge on the place Blanche — a red windmill and a plaster elephant in the garden. Only in Paris.'],
  ['', 'They\'ve been talking about a railway under Paris for twenty years. A Métropolitain! I\'ll be dead before it comes.'],
  ['', 'Did you see the petroleum carriage? Monsieur Panhard\'s, from the avenue d\'Ivry. It frightened a whole team of omnibus horses.'],
  ['', 'Everyone rides a bicycle now, the English kind with two wheels the same size. My concierge calls it the Devil\'s wheelbarrow.'],
  ['', 'The Sacré-Cœur on the Butte — fifteen years of building and still a pile of white stone. A wedding cake for giants.'],
  ['', 'Wine is dear since the phylloxera. What they sell on the Butte is made from raisins and good intentions.'],
  ['', 'Monsieur Pasteur has his Institute now, on the rue Dutot. They say he can cure the bite of a mad dog.'],
  ['', 'They\'re sending soldiers to Dahomey. Always somewhere hot and far away, the poor boys.'],
  ['', 'The telephone belongs to the State now. You ring, you wait, a young lady says "J\'écoute" and cuts you off.'],
  ['', 'Have you read Zola\'s new one, La Bête humaine? Murder on the railway. I\'ll never take the Le Havre train again.'],
  ['', 'Le Petit Journal says a million copies a day. A million people reading the same lie at breakfast.'],
  // ---- districts (DN index)
  ['d:0', 'Up here on the Butte the rents are cheap and the stairs are free.'], ['d:0', 'Have you been to the Moulin de la Galette on a Sunday? Bread and wine and the whole Butte dancing.'],
  ['d:0', 'Don\'t go to the Mirliton unless you like being insulted. Bruant sings about the poor and charges the rich double.'],
  ['d:1', 'The Opéra, the Café de la Paix, the boulevards — this is where Paris comes to be looked at.'], ['d:1', 'On the Boulevard des Italiens the electric lamps are so bright the ladies complain about their complexions.'],
  ['d:2', 'The Halles never sleep. Twenty thousand cabbages an hour and every one of them stolen twice.'], ['d:2', 'Mind the forts des Halles — those porters carry a side of beef like you carry a hat.'],
  ['d:3', 'Smoke and steam all day here. The trains come in from Le Havre, from Lille, from the whole world.'], ['d:3', 'Every country girl in France arrives at this station with one trunk and too many hopes.'],
  ['d:4', 'The Seine is low this year. The bargemen are cursing in four dialects.'], ['d:4', 'The bouquinistes on the quai have everything — Voltaire, dirty postcards, your grandmother\'s letters.'],
  ['d:5', 'Notre-Dame was here before all of us and will be here after. Comforting, non?'], ['d:5', 'The Préfecture is just there. Speak softly on the Île de la Cité.'],
  ['d:6', 'Students! They argue about Kant all night and borrow money all day.'], ['d:6', 'The Sorbonne is being rebuilt. Scaffolding everywhere — even knowledge needs a new roof.'],
  ['d:7', 'The Champs-Élysées on a Sunday: every carriage in Paris, and every one going round in circles.'], ['d:7', 'The Palais de l\'Industrie is for the Salon, the horse show and the Indépendants — not all at once, thank God.'],
  ['d:8', 'The Faubourg Saint-Germain — old families, old houses, old grudges.'], ['d:8', 'Les Invalides. Napoleon sleeps there. Lightly, they say.'],
  ['d:9', 'In Belleville we remember 1871. Don\'t let the Préfecture tell you otherwise.'], ['d:9', 'La Villette — the slaughterhouses. You smell it before you see it.'],
  ['d:10', 'The Faubourg makes every chair in Paris. Sit on one and thank a cabinetmaker.'], ['d:10', 'The July Column — the Genius of Liberty, all gilt and in a hurry.'],
  ['d:11', 'Montparnasse is full of painters who couldn\'t afford Montmartre.'], ['d:11', 'Under our feet there are six million dead in the Catacombs. Quiet neighbours.'],
  ['d:12', 'From the Trocadéro you see the whole Exposition ground and that tower, all at once. Too much for one pair of eyes.'], ['d:12', 'Passy is practically the countryside. The rich come here to be bored in peace.'],
  ['d:13', 'The Batignolles — railwaymen, painters and widows. A very respectable mixture.'], ['d:13', 'In the Parc Monceau even the ducks are rich.'],
  // ---- trades
  ['k:rich', 'My stockbroker says buy Russian bonds. My wife says buy hats. My wife is usually right.'], ['k:rich', 'One dines at Voisin\'s, one is seen at the Opéra, one pays for all of it. That is society.'],
  ['k:clerk', 'Twelve hours on a stool for a hundred and twenty francs a month. And they call me a gentleman.'], ['k:clerk', 'My chief clerk has a new fountain pen from America. He hasn\'t stopped talking about it since Easter.'],
  ['k:work', 'Ten hours\' work, three francs fifty. Bread at forty centimes. Do the sum yourself.'], ['k:work', 'They\'re digging everywhere — gas, water, sewers. Paris is all holes and promises.'],
  ['k:lady', 'At the Bon Marché they let you look at everything and touch nothing. I could live there.'], ['k:lady', 'Sleeves are getting bigger again. By next year we\'ll need two omnibus seats each.'],
  ['k:serv', 'Seventh floor, under the roof, no fire. Madame says I\'m lucky. Madame lives on the first.'], ['k:serv', 'I carry the laundry down to the river every Monday. My arms are stronger than a gendarme\'s.'],
  ['k:art', 'The Salon rejected me again. Fine. Seurat paints in dots and they hang him. I\'ll paint in dashes.'], ['k:art', 'Old Tanguy gives me colours on credit. Saint Julien Tanguy, the painters call him.'],
  ['k:art', 'At the Chat Noir they let me read a poem. Salis called me a genius and then charged me for the beer.'],
  ['k:cop', 'Circulez, circulez. Nothing to see.'], ['k:cop', 'Keep your papers in order and we\'ll get along, you and I.'],
  ['k:gang', 'This is our street. You can walk on it — for now.'], ['k:gang', 'Nice watch. Would be a shame if it went for a walk without you.'],
  // ---- notoriety
  ['h:1', 'Nom d\'un chien — the sergents de ville are after you! Don\'t stand near me!'], ['h:1', 'I didn\'t see you. I never see anybody. Go!'],
  ['h:1', 'You\'re running from the police? Down that alley — and you didn\'t hear it from me.'],
  ['h:2', 'Wait — you\'re that watchmaker, aren\'t you? The one the papers talk about.'], ['h:2', 'My cousin says you can open any lock in Paris. Is it true? Don\'t answer.'],
  // ---- story progress (no spoilers: what the street knows)
  ['a:0', 'Did you hear? Somebody broke into old Maître Vallet\'s workshop on the rue Mouffetard. Every clock stopped at a quarter past two.'],
  ['a:0', 'A boy from the provinces looking for work at the Halles? Ask for Maza at Au Chien qui Fume. Don\'t ask twice.'],
  ['a:1', 'They say someone in Paris is copying paintings — so well the painters can\'t tell which is theirs.'], ['a:1', 'The first of May is coming. My patron says if I march, I\'m out. My comrades say if I don\'t, I\'m out.'],
  ['a:2', 'On the Fourteenth twelve clocks stopped across the city at the same moment. Some say it was a sign.'], ['a:2', 'The new rich have taken up collecting antique clocks. Anyone with a tourbillon is suddenly very popular.'],
  ['a:3', 'There\'s a Baron who buys up everything beautiful in Paris. Nobody knows where he puts it all.'], ['a:3', 'The Préfecture is very interested in watchmakers lately. My uncle had a visit.'],
  ['a:4', 'They say the Baron\'s house is full of stolen clocks, all ticking at once. Brr.'], ['a:4', 'Whatever happens this winter, Paris will forget by spring. It always does.'],
];
// cops and gangs have short banks of their own; everyone else draws from the above
export const RUMOUR = [
  'I heard {who} has been asking for a clever pair of hands — at {place}.',
  'Somebody at {place} is looking for help. {who}, I think. Pays well, asks little.',
  'Go to {place}. {who} was there this morning, looking for someone exactly like you.',
  'My sister\'s husband says {who} hangs about {place} these days. Trouble or money, one of the two.',
];
export const ACT_RUMOUR = [
  'They say {what} — {place}. Go and see for yourself.', 'Have you heard? {what} — at {place}.',
];
// hand-written: contacts, by act (0..4) and a general list
export const NAMEDLINES = {
  Maza: { gen: ['Eh, petit. Sit, eat. Nobody talks business on an empty stomach.', 'The Halles feed Paris. I feed the Halles. Keep that in mind.', 'Mes rats tell me everything. Mes rats tell me you\'re honest. Don\'t make liars of them.'],
    0: ['A watchmaker\'s hands on a porter\'s body. I can use that.'], 2: ['The Fête is good for business. Everybody looks up at the fireworks, nobody looks down at their pockets.'], 4: ['Whatever the Baron pays, I pay in loyalty. It\'s rarer.'] },
  Lucie: { gen: ['Ink on my fingers again. The forger\'s sentence — they never wash out.', 'A newspaper is a gun that fires every morning.', 'Bonjour, Théo. Have you read today\'s lies? I wrote half of them.'],
    1: ['Zola writes about the railway; I write about who owns it.'], 3: ['Clemenceau said to me — never mind what he said. He says a lot.'] },
  Henri: { gen: ['Pianos, Théo. Every one is a little Republic of strings, all pulling against each other.', 'Mind the sawdust. And the cat. Mostly the cat.', 'Come in, come in, there\'s coffee. There\'s always coffee. It\'s the only thing we can afford.'],
    0: ['Vallet taught us both. He\'d want you to find it.'], 4: ['When this is over, I\'m building a piano with no secrets in it.'] },
  Vaneau: { gen: ['My dear boy. One so rarely meets a man who understands escapements.', 'Beauty, Monsieur Marchal, must be possessed or it is merely seen.', 'Champagne? No? A pity. You will learn.'],
    3: ['The Tower? Vulgar. But so is money, and I am very fond of money.'] },
};
