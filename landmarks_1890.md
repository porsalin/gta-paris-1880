# Landmarks of Paris in 1890 — what the game shows and why

Each entry has a real OpenStreetMap position. Most also have a real OSM footprint, extracted by `tools/lm_extract.py`, built by `tools/build_landmarks.py` and stored in `map/landmarks.json`. The models are in `landmarks.js`.

"Status in 1890" is what stood that year. Sources are the Wikipedia article (FR or EN) for each building unless another source is named. "OSM" means the footprint was traced from OpenStreetMap; "hand" means the monument is placed at its real OSM point and built by hand.

| Landmark (key) | Status in 1890 | How it's shown | Source |
|---|---|---|---|
| Notre-Dame de Paris (`notredame`) | Complete. Viollet-le-Duc's flèche dates from 1859 | OSM; 69 m towers, flèche, roses, flying buttresses | wikipedia.org/wiki/Notre-Dame_de_Paris |
| Sainte-Chapelle (`saintechapelle`) | Complete. The flèche was rebuilt in 1853 | OSM; flèche, lancets | wikipedia.org/wiki/Sainte-Chapelle |
| Palais de Justice & Conciergerie (`palaisjustice`) | Standing. The quai towers are medieval; the Palais was rebuilt in the 1860s–70s after the 1871 fire | OSM; 4 round quai towers (incl. Tour de l'Horloge) | wikipedia.org/wiki/Palais_de_Justice,_Paris |
| Hôtel-Dieu (`hoteldieu`) | Rebuilt on its present site in 1867–1877 | OSM | wikipedia.org/wiki/Hôtel-Dieu_de_Paris |
| Pont Neuf & Henri IV (`pontneuf`) | Standing. Statue recast in 1818 | hand, statue only | wikipedia.org/wiki/Pont_Neuf |
| Pont des Arts (`pontarts`) | The 1804 iron footbridge | label only (gap) | wikipedia.org/wiki/Pont_des_Arts |
| Palais du Louvre (`louvre`) | Complete with Napoleon III's New Louvre (1852–1857) and the Flore/Marsan rebuilds (to 1870s). **No pyramid** (1989) | OSM; tall pavilion roofs | wikipedia.org/wiki/Louvre_Palace |
| Tuileries (`tuileries`) | The palace burned in 1871 and its ruins were **demolished in 1883**. Gardens only | label only; the old ruin model is removed | wikipedia.org/wiki/Tuileries_Palace |
| Arc du Carrousel (`carrousel`) | Standing (1806–08) | hand | wikipedia.org/wiki/Arc_de_Triomphe_du_Carrousel |
| Palais-Royal (`palaisroyal`) | Standing | OSM | wikipedia.org/wiki/Palais-Royal |
| Comédie-Française, Salle Richelieu (`comedie`) | Standing. Burned in 1900, after this game's date | OSM | wikipedia.org/wiki/Salle_Richelieu |
| Opéra Garnier (`garnier`) | Inaugurated in 1875 | OSM; copper dome, stage-house pediment, gilt groups | wikipedia.org/wiki/Palais_Garnier |
| La Madeleine (`madeleine`) | Consecrated in 1842 | OSM; peripteral temple | wikipedia.org/wiki/La_Madeleine,_Paris |
| Palais Brongniart / Bourse (`bourse`) | Standing (1826). The wings were added in 1902–07, so they are not shown | OSM; peripteral colonnade | wikipedia.org/wiki/Palais_Brongniart |
| La Trinité (`trinite`) | Completed in 1867 | OSM; 63 m belfry | wikipedia.org/wiki/Église_de_la_Sainte-Trinité_de_Paris |
| Saint-Augustin (`staugustin`) | Completed in 1871 | OSM; dome | wikipedia.org/wiki/Saint-Augustin,_Paris |
| Grands Magasins du Printemps (`printemps`) | Rebuilt in 1882–1889 after the 1881 fire. The 1907–10 domes are later, so the corner cupolas shown are the 1880s ones | OSM | wikipedia.org/wiki/Printemps |
| Folies Bergère (`folies`) | Open since 1869. The Art Deco front is 1926, so it is not shown | OSM | wikipedia.org/wiki/Folies_Bergère |
| Porte Saint-Denis (`portestdenis`) | Standing (1672) | hand | wikipedia.org/wiki/Porte_Saint-Denis |
| Porte Saint-Martin (`portestmartin`) | Standing (1674) | hand | wikipedia.org/wiki/Porte_Saint-Martin |
| Cirque d'Hiver (`cirquehiver`) | Standing (1852) | OSM; 20-sided rotunda | wikipedia.org/wiki/Cirque_d'Hiver |
| Place de la République & Marianne (`republique`) | Square renamed in 1879. Morice brothers' Marianne inaugurated in **1883**. Davioud's Château-d'Eau fountain was moved to Daumesnil in 1880 | hand | wikipedia.org/wiki/Monument_à_la_République |
| Théâtre du Châtelet (`chatelet`) | Standing (1862) | OSM | wikipedia.org/wiki/Théâtre_du_Châtelet |
| Théâtre des Nations, later Théâtre de la Ville (`lyrique`) | Standing (1862). It housed the **Opéra-Comique from 1887 to 1898** | OSM | wikipedia.org/wiki/Théâtre_de_la_Ville |
| Salle Favart (`favart`) | **Burned on 25 May 1887**. Rebuilt in 1893–98, so it is shown as a burnt shell | OSM | wikipedia.org/wiki/Salle_Favart |
| Tour Saint-Jacques & square (`stjacques`) | Restored in 1850s; square laid out in 1856 | OSM + square trees | wikipedia.org/wiki/Tour_Saint-Jacques |
| Fontaine Saint-Michel (`fontstmichel`) | Standing (1860) | hand | wikipedia.org/wiki/Fontaine_Saint-Michel |
| Fontaine des Innocents | Jean Goujon 1549; moved to the Square des Innocents 1858, stepped cascade basin added 1865 | square east of Les Halles |
| Panthéon (`pantheon`) | Secular since **1885** (Victor Hugo's funeral) | OSM; drum, dome, portico | wikipedia.org/wiki/Panthéon |
| Sorbonne (`sorbonne`) | **Being rebuilt** by Nénot (1885–1901). The 1642 chapel stands, the rest is a building site | OSM; half complete, half scaffolded, crane | wikipedia.org/wiki/Sorbonne_(building) |
| Palais du Luxembourg (`luxembourg`) | Senate since 1879 | OSM | wikipedia.org/wiki/Luxembourg_Palace |
| Musée du Luxembourg (`museelux`) | In the orangery since 1886 | OSM | wikipedia.org/wiki/Musée_du_Luxembourg |
| Théâtre de l'Odéon (`odeon`) | Standing (rebuilt in 1819) | OSM | wikipedia.org/wiki/Odéon-Théâtre_de_l'Europe |
| Saint-Sulpice (`stsulpice`) | Standing. The **south tower was never finished** | OSM; the south tower is lower and plain | wikipedia.org/wiki/Saint-Sulpice,_Paris |
| Saint-Germain-des-Prés (`stgermain`) | Standing | OSM | wikipedia.org/wiki/Abbey_of_Saint-Germain-des-Prés |
| Saint-Étienne-du-Mont (`stetienne`) | Standing | OSM | wikipedia.org/wiki/Saint-Étienne-du-Mont |
| Val-de-Grâce (`valdegrace`) | Standing; military hospital | OSM; gilt-ribbed dome | wikipedia.org/wiki/Val-de-Grâce |
| Hôtel de Cluny / Musée de Cluny (`cluny`) | Museum since 1843 | OSM | wikipedia.org/wiki/Musée_de_Cluny |
| Institut de France (`institut`) | Standing | OSM; dome | wikipedia.org/wiki/Institut_de_France |
| Hôtel de la Monnaie (`monnaie`) | Standing (1775) | OSM | wikipedia.org/wiki/Monnaie_de_Paris |
| École des Beaux-Arts (`beauxarts`) | Standing | OSM | wikipedia.org/wiki/École_nationale_supérieure_des_Beaux-Arts |
| Palais Bourbon (`bourbon`) | Chamber of Deputies | OSM; portico | wikipedia.org/wiki/Palais_Bourbon |
| Hôtel des Invalides + Dôme (`invalides`, `domeinv`) | Standing. Napoleon's tomb dates from 1861 | OSM; gilded dome | wikipedia.org/wiki/Les_Invalides |
| École Militaire (`ecolemil`) | Standing | OSM | wikipedia.org/wiki/École_Militaire |
| Saint-Germain-l'Auxerrois (`stgermainaux`) | Standing; the belfry dates from 1860 | OSM | wikipedia.org/wiki/Saint-Germain-l'Auxerrois |
| Saint-Eustache (`steustache`) | Standing | OSM | wikipedia.org/wiki/Saint-Eustache,_Paris |
| Hôtel de Ville (`hoteldeville`) | Burned in 1871. **Rebuilt in 1873–1882** and inaugurated on 13 July 1882, so it is complete in 1890 | OSM; corner pavilions, belfry | wikipedia.org/wiki/Hôtel_de_Ville,_Paris |
| Bibliothèque nationale, Richelieu (`bnf`) | Standing (Labrouste reading room 1868) | OSM | wikipedia.org/wiki/Bibliothèque_nationale_de_France |
| Halle au blé / Bourse de commerce (`bourse_commerce`) | Being converted into the Bourse de commerce in **1888–89**, with a glazed iron dome | OSM | wikipedia.org/wiki/Bourse_de_commerce |
| Les Halles, Baltard pavilions (`halles`) | **10 pavilions** (1852–1874). The last two were added in 1936; all were demolished in 1971 | hand: 10 pavilions, open sides | wikipedia.org/wiki/Les_Halles |
| Gare du Nord (`garenord`) | Hittorff façade, 1865 | OSM | wikipedia.org/wiki/Gare_du_Nord |
| Gare de l'Est (`gareest`) | Only the **1849** hall and rose façade. Doubled in 1931 | hand, at the real point | wikipedia.org/wiki/Gare_de_l'Est |
| Gare Saint-Lazare (`gare`) | Lisch's new front built in **1885–1889** | OSM | wikipedia.org/wiki/Gare_Saint-Lazare |
| Gare de Lyon (`garelyon`) | The **old 1855 station**. The present building and its clock tower date from 1900 | OSM; no clock tower | wikipedia.org/wiki/Gare_de_Lyon |
| Gare d'Orléans / Austerlitz (`gareaust`) | 1862–67 hall | OSM | wikipedia.org/wiki/Gare_d'Austerlitz |
| Sacré-Cœur (`sacrecoeur`) | **Under construction**: begun in 1875, consecrated in 1919. The dome came in 1899+ and the campanile in 1912, so neither is shown | OSM; walls and drum base, scaffolding, 3 cranes, sheds, stone yard | wikipedia.org/wiki/Sacré-Cœur,_Paris |
| Moulin de la Galette (`galette`) | Working mill and guinguette | hand; animated sails (Radet and Blute-Fin are still gfx.js models) | wikipedia.org/wiki/Moulin_de_la_Galette |
| Moulin Rouge (`moulinrouge89`) | **Opened 6 October 1889** | hand; red mill with lit sails | wikipedia.org/wiki/Moulin_Rouge |
| Élysée-Montmartre (`moulinrouge` key, relabelled) | Dance hall since 1807 | gfx model, relabelled | wikipedia.org/wiki/Élysée_Montmartre |
| Place de la Concorde (`concorde`) | Obelisk 1836; Hittorff fountains 1840; 8 city statues | hand at the real points; the square stays walkable | wikipedia.org/wiki/Place_de_la_Concorde |
| Arc de Triomphe (`arc`) | Standing (1836) | hand, on the Champs-Élysées axis | wikipedia.org/wiki/Arc_de_Triomphe |
| Place Vendôme & Column (`vendome`) | The column was toppled by the Commune in 1871 and **re-erected in 1875** | hand | wikipedia.org/wiki/Vendôme_Column |
| Colonne de Juillet, Bastille (`bastille`) | Standing (1840) | hand | wikipedia.org/wiki/July_Column |
| Place des Vosges (`vosges`) | Called Place Royale until 1800 and Place des Vosges again since 1870; Louis XIII statue of 1829; 4 fountains | hand: arcaded brick square | wikipedia.org/wiki/Place_des_Vosges |
| Palais de l'Élysée (`elysee`) | Presidential palace | OSM | wikipedia.org/wiki/Élysée_Palace |
| Observatoire de Paris (`observatoire`) | Standing | OSM | wikipedia.org/wiki/Paris_Observatory |
| Au Bon Marché (`bonmarche`) | Boileau & Eiffel store, 1869–1887 | OSM | wikipedia.org/wiki/Le_Bon_Marché |
| **Tour Eiffel** (`eiffel`) | Completed in **March 1889**. Painted "rouge de Venise"; 1889 restaurants on the first floor; gas jets on the edges | gfx.js model (graphics worker, 76ce834) — not duplicated | wikipedia.org/wiki/Eiffel_Tower |
| **Galerie des machines** (`galerie`) | 1889 (Dutert & Contamin), 420 × 115 m. Demolished in 1910 | gfx.js model (graphics worker, 76ce834) — not duplicated | wikipedia.org/wiki/Galerie_des_machines |
| Palais du Trocadéro (`trocadero`) | Built for the **1878** Exposition and replaced by the Palais de Chaillot in 1937 | hand: rotunda, two towers, curved wings, cascade | wikipedia.org/wiki/Trocadéro_Palace |
| Statue of Liberty replica (`liberty`) | Given in **1889**; on the Île aux Cygnes; **faced east until 1937** | hand | wikipedia.org/wiki/Liberty_Enlightening_the_World_(Paris) |
| Palais de l'Industrie (`industrie`) | Standing until 1897 | kept as the gfx.js model | wikipedia.org/wiki/Palais_de_l'Industrie |

## Deliberately absent (post-1890)
- Louvre Pyramid (1989).
- Sacré-Cœur dome (1899–) and campanile (1912).
- Pont Alexandre III (1896–1900).
- Grand Palais and Petit Palais (1897–1900).
- Gare d'Orsay (1898–1900).
- Gare de Lyon clock tower (1900).
- Present Salle Favart (1898).
- Bourse wings (1902–07).
- Les Halles pavilions 11–12 (1936).
- Palais de Chaillot (1937).
- The present Gare de l'Est extension (1931).
- The Tuileries ruins, already gone (demolished 1883).

Districts (Belleville, Marais, Latin Quarter and so on) belong to the city-layout worker and are not covered here.

## Seine bridges (1890)
Pont Neuf (both arms), Carrousel, Royal, Solférino (iron), Concorde, Invalides, Alma (Zouave), Iéna, Change, Notre-Dame, Arcole (iron), Saint-Michel, Petit-Pont, Double, Louis-Philippe, Saint-Louis, Marie, Tournelle, Sully, Austerlitz, Bercy, Passy; Pont des Arts as iron footbridge. Pont Alexandre III omitted (1896-1900).
