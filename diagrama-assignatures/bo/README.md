## Tot va genial!!!

Podem veure-ho a [Example-test](https://mapaor4.github.io/diagrames-D2/diagrama-assignatures/bo/connexions), [Example-diagram-1](https://mapaor4.github.io/diagrames-D2/diagrama-assignatures/bo/example-1) o [Diagrama-assignatures](https://mapaor4.github.io/diagrames-D2/diagrama-assignatures/bo/assignatures).

## Pendent a implemetar (extra)
Fer tres versions.
A) Actual (connexions de descendents)
B) Sense connexions dels descendents
C) Actual + mostrar també els descendents de veïns (no sols el contenidor veï amb els fills apaviguats)
D) Sense connexions dels descendents + mostrar també els descendents de veïns (no sols el contenidor veï amb els fills apaviguats)

## Pendent de corregir
#### Prioritari
- Si un element té una opacitat 0.6 per exemple, la transició d'opacitat l'ha de patir de 0 a 0.6, no pas de 0 a 1.
- Revisar el 'Example-diagram-1' i perquè no s'està veient com s'hauria de veure.
  Nota: segurament sigui degut a que no es reconeixen les connexions en què els identificadors tenen espais
  
  <img src="https://github.com/user-attachments/assets/1cc6049a-c1ff-44d1-b6bc-98ec9cd4be23" alt="Captura de pantalla" width="500">

#### Altres
- S'han d'afegir els 4 tipus de connexions (->, --, <-, <->). De moment sols esta implementada la normal (->).
- Revisar que funciona encara que els nodes tinguin identificadors amb parèntesis, guions, comes, etc. (Per exemple: "Hola, què tal? (Bon dia)"
- En un futur: afegir elements avançats de D2 com Markdown text, Imatges(icones), LaTeX, etc.
- Comprovar que funciona sigui quina sigui la shape dels nodes o contenidors.

## Un cop estigui enllestit
Fer una repo de github molt fàcil de duplicar amb un README ben explicat en què simplement un duplica i canvia el 'D2-diagram.svg' pel seu propi, tria la versió (de les 4 possibles) i automàticament pot veure el SVG com a web interactiva. Posar també un fitxer CSS per controlar les dimensions de 'contenidor-svg' i el com aquest escala al canviar la resolució de la pàgina o en diferents dispositius (i permetre el zoom in, zoom out, etc.).
