# DriveOP - HTML pitch

12 slajdov. Načrt za 5-minutni nastop. Posnetka prototipa iz izvornega PPT-ja.

## Najhitrejši začetek

Odpri `index.html` v sodobnem brskalniku. Internet, namestitev paketov ali gradnja niso potrebni. Mapa `assets` ter datoteke `styles.css`, `content.js` in `app.js` morajo ostati ob datoteki `index.html`.

Samostojni `DriveOP_Pitch.html`, dostavljen posebej, vsebuje tudi vse slike, posnetke, oblikovanje in kodo v eni datoteki. To je najpreprostejša verzija za pošiljanje in oder. Predvajanje v predogledu priponke je lahko omejeno; datoteko odpri v polnem brskalniku.

## Upravljanje

| Tipka | Dejanje |
| --- | --- |
| Puščici levo/desno, preslednica | Prejšnji/naslednji slajd |
| F | Celozaslonski prikaz |
| P | Ločeno govorniško okno |
| N | Govorne opombe v glavnem oknu |
| T / Shift + T | Začni ali ustavi vajo / ponastavi |
| A | Samodejna 5-minutna vaja od prvega slajda |
| 1 / 2 / 3 na slajdu 3 | TASTE / KNOW / MATCH |
| R na slajdu 3 | Ponovi vodeno demonstracijo |
| D | Povečaj demonstracijo |
| S | Viri, status trditev in predpostavke |
| O | Pregled 12 slajdov |
| H | Skrij/pokaži upravljalno vrstico |
| Home / End | Prvi/zadnji slajd |
| ? | Navodila |

Za nastop uporabi ročne prehode. Samodejni način je orodje za vajo, ne priporočilo za nastop. Odprta pogovorna okna in skrit zavihek ustavijo odstevanje. Govorniško okno premakni na svoj monitor; projiciraj samo glavno okno. Brskalnik lahko zahteva dovoljenje za pojavno okno.

## Demonstracija

Na tretjem slajdu se začne 42-sekundno vodeno zaporedje: 6 s statični TASTE, 20 s KNOW, 16 s MATCH. Po 42 sekundah ostane prikazan MATCH; njegov posnetek se vrti v zanki, dokler ne zamenjaš slajda ali ponoviš demonstracije. Ročna izbira koraka izklopi avtomatsko preklapljanje; izbrani posnetek se nato vrti v zanki. Gumb "Od začetka" obnovi vodeno zaporedje.

Izvorni PPT vsebuje DVA animirana GIFa, ne treh. TASTE je obstoječi statični zaslon. V predstavitvi sta GIFa pretvorjena v tiha MP4 posnetka, da lahko delujejo pavza, ponovno predvajanje, zanka in povečava. Vrstni red prikazanih dejanj ostaja enak; tempo je prilagojen 20 in 16 sekundam in ni meritev dejanske hitrosti aplikacije. Originalna GIFa sta ohranjena v `assets/originals/`.

- `know-original.gif`: `ppt/media/image5.gif`, 955 sličic, 403 x 774, iz slajda 5.
- `match-original.gif`: `ppt/media/image12.gif`, 811 sličic, 403 x 774, iz slajda 6.
- Statični TASTE: `ppt/media/image4.png`, iz slajda 4.

Posnetki niso aplikacija v živo. Cene, izračuni lastništva, odstotki ujemanja in priporočila so demonstracijski podatki iz uporabnikovega gradiva. Niso preverjeni nakupni ali finančni nasveti. V primeru napake predvajanja se pokaže rezervni statični zaslon. Pri vključeni sistemski nastavitvi zmanjšanega gibanja je demo najprej ustavljen; zaženi ga z gumbom.

## Kje urejaš projekt

| Datoteka | Kaj vsebuje |
| --- | --- |
| `index.html` | 12 semantičnih sekcij; vidna besedila, razporeditev in oznake `data-bind` |
| `styles.css` | Vizualni sistem, 16:9 oder 1600 x 900, odzivni prikaz, tisk in animacije |
| `content.js` | Govor, časovnica, viri, statusi trditev, uredniške opombe in finančne predpostavke |
| `app.js` | Navigacija, demonstracija, govorniško okno, viri, štoparica in izračun prikazanih vrednosti |
| `model.json` | Berljiva kopija osnovnih modelnih predpostavk |
| `Govor_5_minut.md` | Celoten govor, časi in navodila za nastop |
| `Viri_in_predpostavke.md` | Kaj je podatek, hipoteza, predlog ali cilj |
| `Vprasanja_komisije.md` | Priprava na zahtevna vprašanja |
| `assets/` | Slike, originalna GIFa in optimizirana posnetka |
| `build_single_file.py` | Ponovno združi projekt v eno HTML datoteko; potrebuje le Python 3 |

Podatke modela spreminjaj v `content.js` pod `model`. Prikazane finančne vrednosti z oznako `data-bind` se preračunajo samodejno. **Govorni tekst, uredniške razlage, vidni naslovi in kopija `model.json` se ob spremembi predpostavk ne prepišejo samodejno.** Uskladi jih ročno. Prav tako ob spremembi trajanj preveri, da vsota ostane 300 sekund.

Za ponovno izdelavo samostojne datoteke v mapi projekta zaženi:

```sh
python build_single_file.py
```

Izhod je `DriveOP_Pitch.html` v isti mapi. Projekt nima sledenja, spletnih knjižnic, analitike ali omrežnih klicev za delovanje. Zunanje povezave se uporabijo le, ko sam odpreš vir. Uporablja sistemske pisave; nobena datoteka pisave ni priložena.

## Pred natečajem potrdita

**50.000 €, 6 mesecev in razrez porabe so delovni predlog, ne potrjena finančna potreba.** Prav tako niso potrjeni cena 75 €, cilj 100 testnih kupcev in 3 ponovnih plačnikov, ciljna skupina družin in scenarij 20 partnerjev. Ne predstavljajta jih kot doseženo traction ali obljubljen donos.

Največja vsebinska vrzel sta dejanska validacija in relevantni izkušnji ustanoviteljev. Pred oddajo na slajd 6 dodajta resnične dokaze, če obstajajo, na slajd 11 pa po en konkreten relevantni dosežek. Brez izmišljenih referenc, partnerstev ali citatov. Dodajta potrjen kontakt oziroma povezavo do delujoče aplikacije; v gradivu ni bilo preverljivega javnega demo naslova.

## Viri in tehnični preizkus

Vsebinski viri so navedeni v prilozeni datoteki in pod tipko S na vsakem slajdu. Slike in posnetki izvirajo iz uporabnikovega PPT-ja; ni dodatnih spletnih fotografij. Ohranita pravice do uporabe obstoječih vizualov.

Predstavitev je vizualno pregledana in funkcionalno preizkušena v Chromiumu. Datoteka uporablja standardni HTML/CSS/JavaScript in H.264 MP4. Pred nastopom preveri predvajanje na dejanskem računalniku in projektorju. Organizacijske politike lahko blokirajo lokalne HTML datoteke ali pojavna okna; to ni povezano z internetno odvisnostjo predstavitve.
