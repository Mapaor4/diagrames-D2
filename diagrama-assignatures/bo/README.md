## Tot va genial!!!

Podem veure-ho a [Example-test](https://mapaor4.github.io/diagrames-D2/diagrama-assignatures/bo/connexions), [Example-diagram-1](https://mapaor4.github.io/diagrames-D2/diagrama-assignatures/bo/example-1) o [Diagrama-assignatures](https://mapaor4.github.io/diagrames-D2/diagrama-assignatures/bo/assignatures).

## Pendent a implemetar (extra)
Fer dues versions.
- Actual (connexions de descendents)
- Sense connexions dels descendents

Implementar un canvi visual necessari: que els veïns mostrin els seus descendents (però no les seves connexions). Costarà diria, però és el més adient visualment.

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

#### Molt en un futur
Seguint l'exemple de [d2.live](https://github.com/Watt3r/d2-live/tree/master), crear una aplicació web back-end que et generi el SVG incrustable a tot arreu simplement a partir del link que conté el codi encodificat just després de `/?script=`. La idea seria configrar-la modificant alguns fitxers Go per afegir la funcionalitat i disseny desitjats (centrat, zoomejable, interactiu, incrustable a Notion), penjar-la a Heroku (com a Docker build) i publicar-la en algun subdomini de 'martipardo.xyz', de manera que "https://interactive-svg.martipardo.xyz/?script=qlDQtVOo5AIEAAD__w%3D%3D&" generi un diagrama `x -> y` incrustable i interactiu.

Fer la interactivitat ben feta. Tal com comenten [aquí](https://docs.asciidoctor.org/asciidoc/latest/macros/image-svg/#options-for-svg-images) fer que sigui un objecte, si no es pot un svg i si no es pot una imatges estàtica. És a dir configurar fallbacks, per tal que en cas de no estar permès, l'usuari segueixi podent veure l'SVG tot i que amb menys funcionalitats.

## Un cop estigui enllestit
Fer una repo de github molt fàcil de duplicar amb un README ben explicat en què simplement un duplica i canvia el 'D2-diagram.svg' pel seu propi, tria la versió (de les 4 possibles) i automàticament pot veure el SVG com a web interactiva. Posar també un fitxer CSS per controlar les dimensions de 'contenidor-svg' i el com aquest escala al canviar la resolució de la pàgina o en diferents dispositius (i permetre el zoom in, zoom out, etc.).
