# -*- coding: utf-8 -*-
# Story data for "Grand Theft Auto: Paris 1880" — L'Affaire du Tourbillon
CONTACTS = {
 'avant':  dict(name="Vautrin's Atelier", phone='bateau', rival='velvet', who="Henri Vautrin"),
 'apache': dict(name="Maza (Au Chien qui Fume)", phone='chien', rival='velvet', who="Maza"),
 'crimson':dict(name="Lucie's Press (Café Procope)", phone='procope', rival='velvet', who="Lucie Arnoux"),
 'velvet': dict(name="Salon Vaneau (undercover)", phone='garnier', rival='apache', who="Baron Vaneau"),
}
CHAPTERS = [
 ("ACTE I", "HIVER 1880", "L'Apprenti", "January to March. The Seine freezes and breaks with a noise like cannon. In a workshop on the rue Mouffetard the clocks have all stopped at a quarter past two, and the finest regulator in France is gone."),
 ("ACTE II", "PRINTEMPS 1880", "Le Salon", "April and May. The Independents hang their pictures in the rue des Pyramides, the official Salon fills the Palais de l'Industrie, and someone in Paris is copying everything."),
 ("ACTE III", "ÉTÉ 1880", "La Fête", "June to August. The amnesty brings the exiles home, the Republic keeps its first Fourteenth of July, and twelve clocks across the city are quietly being tuned to one chord."),
 ("ACTE IV", "AUTOMNE 1880", "Les Contes", "September to November. Offenbach races his own clock at the Salle Favart, Sarah Bernhardt sails for America, and the Baron makes his offer."),
 ("ACTE V", "DÉCEMBRE 1880", "Réveillon", "December. Snow on the boulevards. One gala night at the Opéra, and twelve clocks that will strike midnight twelve seconds early."),
]
DRAMATIS = [
 ("Théo Marchal", "Protagonist. A watchmaker's apprentice, 19, from the rue Mouffetard. Quick hands, a good ear, and a debt he did not choose.", False),
 ("Maître Augustin Vallet", "Théo's master, a horologist of genius. His masterpiece, a tourbillon regulator, is stolen in the first scene.", False),
 ("Henri Vautrin", "A penniless painter at the rue Ravignan piano works. Théo's oldest friend; knows every studio and every model in Montmartre.", False),
 ("Maza", "Fence and fixer of Les Halles, holding court at Au Chien qui Fume. Buys anything, sells everything, keeps her word.", False),
 ("Lucie Arnoux", "Printer, engraver and reformed forger, back from exile in Geneva. Can copy any signature, refuses to copy a conscience.", False),
 ("Baron Léopold Vaneau", "VILLAIN. Financier, collector, patron of the Opéra. Behind the velvet: a ring of thieves, forgers and bribed officials.", False),
 ("Silas Crane", "VILLAIN. Vaneau's English forger and cracksman. Paints like an angel, lies like a ledger.", False),
 ("Inspecteur Gaspard Mourier", "VILLAIN. A Préfecture detective on Vaneau's payroll who hunts Théo through all five acts.", False),
 ("La Pie (Odile Vaneau)", "The Magpie: a masked cat-burglar working for the Baron. His ward, and not as loyal as he believes.", False),
 ("Edgar Degas", "Painter. Organiser of the Independents' exhibition on rue des Pyramides. Dry wit, sharp eye, little patience for fools.", True),
 ("Mary Cassatt", "Painter, exhibiting with the Independents. Practical, generous, and the first to believe Théo.", True),
 ("Berthe Morisot", "Painter, exhibiting with the Independents. Her salon is a refuge of good sense.", True),
 ("Gustave Caillebotte", "Painter, collector and quiet benefactor of his friends' careers.", True),
 ("Camille Pissarro", "Painter; a patient mentor to younger artists.", True),
 ("Claude Monet", "Painter, widowed the year before, painting the ice at Vétheuil; his June show at La Vie Moderne brings him to Paris.", True),
 ("Pierre-Auguste Renoir", "Painter; this year he sends to the official Salon.", True),
 ("Édouard Manet", "Painter; his spring show at La Vie Moderne is the talk of the boulevard.", True),
 ("Paul Durand-Ruel", "Art dealer, rue Le Peletier; staking his fortune on the Impressionists.", True),
 ("Julien 'Père' Tanguy", "Colour merchant of rue Clauzel; extends credit to painters in paint, and in kindness.", True),
 ("Émile Zola", "Novelist; Nana is serialised this year. An observer who notices everything.", True),
 ("Guy de Maupassant", "Writer; 'Boule de Suif' makes his name this spring.", True),
 ("Victor Hugo", "Poet, 78, the grand old man of the Republic; receives Théo with courtesy.", True),
 ("Stéphane Mallarmé", "Poet; his Tuesday evenings on rue de Rome.", True),
 ("Sarah Bernhardt", "Actress; walks out of the Comédie-Française on 18 April and sails for New York in October.", True),
 ("Jacques Offenbach", "Composer; racing to finish Les Contes d'Hoffmann. He dies, of illness, on 5 October; Paris mourns him at the Madeleine.", True),
 ("Pauline Viardot", "Singer and composer; hosts musical Thursdays.", True),
 ("Camille Saint-Saëns", "Composer, pianist and organist.", True),
 ("Gabriel Fauré", "Composer; choirmaster at La Madeleine.", True),
 ("Jules Massenet", "Composer; professor at the Conservatoire.", True),
 ("Claude Debussy", "A gifted 18-year-old student at the Conservatoire.", True),
 ("Emmanuel Chabrier", "Composer, newly resigned from the Ministry to write music full time.", True),
 ("Auguste Rodin", "Sculptor; commissioned this summer for a great portal, the Gates of Hell.", True),
 ("Nadar", "Photographer, balloonist and inexhaustible talker.", True),
 ("Jules Broca", "A bell-founder and returning Communard exile (fictional). Tunes the counter-chord.", False),
 ("Moineau", "A Montmartre street urchin (fictional), La Pie's lookout; spared or sold in Act I.", False),
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
