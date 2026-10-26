# -*- coding: utf-8 -*-
# Story data for "Grand Theft Auto: Paris 1890" — L'Affaire du Tourbillon
CONTACTS = {
 'avant':  dict(name="Vautrin's Atelier", phone='bateau', rival='velvet', who="Henri Vautrin"),
 'apache': dict(name="Maza (Au Chien qui Fume)", phone='chien', rival='velvet', who="Maza"),
 'crimson':dict(name="Lucie's Press (Café Procope)", phone='procope', rival='velvet', who="Lucie Arnoux"),
 'velvet': dict(name="Salon Vaneau (undercover)", phone='garnier', rival='apache', who="Baron Vaneau"),
}
CHAPTERS = [
 ("ACTE I", "HIVER 1890", "L'Apprenti", "January to March. The Russian influenza has half of Paris in bed, the crowds of the Exposition have gone home, and Monsieur Eiffel's tower still stands over the Champ de Mars like an unanswered question. In a workshop on the rue Mouffetard every clock has stopped at a quarter past two, and the finest regulator in France is gone."),
 ("ACTE II", "PRINTEMPS 1890", "Le Salon", "March to May. The Indépendants hang Monsieur Seurat's dots on the Champs-Élysées, the Salon splits in two, the workers of Paris march on the first of May for the eight-hour day, and someone in Paris is copying everything."),
 ("ACTE III", "ÉTÉ 1890", "La Fête", "June to August. The tower is lit for the Fourteenth of July, they dance the quadrille at the new Moulin Rouge, and twelve clocks across the city are quietly being tuned to one chord."),
 ("ACTE IV", "AUTOMNE 1890", "Les Contes", "September to November. Massenet's sorceress at the Châtelet, Sarah Bernhardt as Cleopatra at the Porte Saint-Martin, a petrol carriage from the Panhard works coughing down the boulevards, and the Baron makes his offer."),
 ("ACTE V", "DÉCEMBRE 1890", "Réveillon", "December. The coldest winter in living memory sets in, and the Seine begins to freeze. One gala night at the Opéra, and twelve clocks that will strike midnight twelve seconds early."),
]
DRAMATIS = [
 ("Théo Marchal", "Protagonist. A watchmaker's apprentice, 19, from the rue Mouffetard. Quick hands, a good ear, and a debt he did not choose.", False),
 ("Maître Augustin Vallet", "Théo's master, a horologist of genius. His masterpiece, a tourbillon regulator, is stolen in the first scene.", False),
 ("Henri Vautrin", "A penniless painter at the rue Ravignan piano works. Théo's oldest friend; knows every studio, model and cabaret in Montmartre.", False),
 ("Maza", "Fence and fixer of Les Halles, holding court at Au Chien qui Fume. Buys anything, sells everything, keeps her word.", False),
 ("Lucie Arnoux", "Printer, engraver and reformed forger, back from hiding in Geneva. Can copy any signature, refuses to copy a conscience.", False),
 ("Baron Léopold Vaneau", "VILLAIN. Financier, collector, patron of the Opéra, early investor in petrol carriages. Behind the velvet: a ring of thieves, forgers and bribed officials.", False),
 ("Silas Crane", "VILLAIN. Vaneau's English forger and cracksman. Paints like an angel, lies like a ledger.", False),
 ("Inspecteur Gaspard Mourier", "VILLAIN. A Préfecture detective on Vaneau's payroll who hunts Théo through all five acts.", False),
 ("La Pie (Odile Vaneau)", "The Magpie: a masked cat-burglar working for the Baron. His ward, and not as loyal as he believes.", False),
 ("Jules Broca", "A bell-founder and old Communard, home from New Caledonia since the amnesty of 1880, now a porter at the Gare de Lyon (fictional). Tunes the counter-chord.", False),
 ("Moineau", "A Montmartre street urchin (fictional), La Pie's lookout; spared or sold in Act I.", False),
 ("Paul Signac", "Painter, 26; a moving spirit of the Société des Artistes Indépendants, whose sixth exhibition opens on 20 March 1890.", True),
 ("Georges Seurat", "Painter, 30; the quiet inventor of the pointillist method. Shows Le Chahut and Jeune femme se poudrant at the Indépendants in 1890.", True),
 ("Edgar Degas", "Painter, 55. Long since done with group exhibitions; dry wit, sharp eye, little patience for fools.", True),
 ("Mary Cassatt", "Painter; in April 1890 she is enthralled by the great exhibition of Japanese prints at the École des Beaux-Arts. Practical, generous, and the first to believe Théo.", True),
 ("Berthe Morisot", "Painter; her house on the rue de Villejust near the Étoile is a refuge of good sense.", True),
 ("Gustave Caillebotte", "Painter, collector and boat-builder, living at Petit-Gennevilliers; quiet benefactor of his friends.", True),
 ("Camille Pissarro", "Painter, 60, in from Éragny; a patient mentor to younger artists.", True),
 ("Claude Monet", "Painter, settled at Giverny and painting the haystacks; in 1890 he raises a public subscription to buy Manet's Olympia for the nation.", True),
 ("Pierre-Auguste Renoir", "Painter, living in Montmartre.", True),
 ("Theo van Gogh", "Dealer, 33; manager of Boussod, Valadon et Cie on the boulevard Montmartre, who keeps the new painting on his mezzanine.", True),
 ("Paul Durand-Ruel", "Art dealer, rue Laffitte and rue Le Peletier; staking his fortune on the Impressionists in Paris and New York.", True),
 ("Julien 'Père' Tanguy", "Colour merchant of rue Clauzel; extends credit to painters in paint, and in kindness.", True),
 ("Henri de Toulouse-Lautrec", "Painter, 25; draws the dancers of the Moulin Rouge and the riders of the Cirque Fernando.", True),
 ("Émile Zola", "Novelist; La Bête humaine appears in March 1890. An observer who notices everything.", True),
 ("Guy de Maupassant", "Writer; Notre Cœur is serialised in 1890.", True),
 ("Stéphane Mallarmé", "Poet; his Tuesday evenings on the rue de Rome.", True),
 ("Georges Clemenceau", "Deputy for the Var, editor of La Justice, former mayor of Montmartre; lives on the rue Franklin in Passy.", True),
 ("Sarah Bernhardt", "Actress; plays Jeanne d'Arc at the Porte Saint-Martin in the spring and Sardou's Cléopâtre from 23 October, before her world tour of 1891.", True),
 ("Pauline Viardot", "Singer and composer, 69; still hosts her musical Thursdays on the rue de Douai, beside Turgenev's empty chair.", True),
 ("Jules Massenet", "Composer; Esclarmonde, written for Sibyl Sanderson, is the success of the Opéra-Comique.", True),
 ("Sibyl Sanderson", "American soprano, 25; Massenet's Esclarmonde.", True),
 ("Gabriel Fauré", "Composer; choirmaster at La Madeleine. His Requiem is being expanded for full orchestra.", True),
 ("Claude Debussy", "Composer, 27; back from the Villa Medici with a Prix de Rome and very little money.", True),
 ("Erik Satie", "Composer, 24; second pianist at Rodolphe Salis's Chat Noir, author of the Gymnopédies.", True),
 ("Rodolphe Salis", "Proprietor of the cabaret Le Chat Noir on the rue de Laval.", True),
 ("Aristide Bruant", "Chansonnier, 39; insults his customers nightly at Le Mirliton on the boulevard Rochechouart.", True),
 ("Emmanuel Chabrier", "Composer of España and Gwendoline.", True),
 ("Ignacy Jan Paderewski", "Polish pianist, 29, the sensation of the Paris concert halls since 1888.", True),
 ("Auguste Rodin", "Sculptor; still at work on the Gates of Hell at the Dépôt des Marbres, and commissioned in 1889 for a monument to Victor Hugo.", True),
 ("Gustave Eiffel", "Engineer, 57; keeps a laboratory at the top of his tower, completed in 1889.", True),
 ("Nadar", "Photographer, balloonist and inexhaustible talker, 70.", True),
 ("Charles Garnier", "Architect of the Opéra, who knows its every cellar.", True),
]
# DSL (see gen_story.py):  step ~ objective // dialogue // dialogue ...
#  g gf gt(timed) st d df k c cs sw e al lo r h x xv sm f | tl (tail) ev (eavesdrop) sn (sneak, vision cones) ch (choice) | ?key=a/b conditional | @ intro, % outro, b bonus
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'story'))
from act1 import ACT1
from act2 import ACT2
from act3 import ACT3
from act4 import ACT4
from act5 import ACT5, SIDE
STORY = [ACT1, ACT2, ACT3, ACT4, ACT5]
