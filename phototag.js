const challengetable = document.getElementById("challengetable");
const startbutton = document.getElementById("startbutton");
const punktetext = document.getElementById("punktetext");
const challengelist = document.getElementById("challengelist")
challengetable.style.display = "none";

var challengeids = [0, 0, 0];
var challenges = ["Esst ein Eis", "Geht in eine unterirdische Bahnstation", "Findet eine Tafel mit Grundrechten",
"Geht in eine Kirche", "Findet ein „Nett hier“-Sticker", "Macht ein Foto von Karlsruhe von mehr als 10m Höhe", "Geht in einen Laden im Ettlinger Tor und findet etwas, das zwischen 19 und 20€ kostet",
"Fotografiert Buchstaben auf Schildern und bildet darauf die Vornamen aller Teammitglieder.Jeder Buchstabe muss ein anderes Schild sein.", "Findet eine Pflanze im Botanischen Garten, die aus Asien kommt",
"Trinkt Wasser aus einem Trinkwasserbrunnen", "Lauft um einen See herum",
"Fotografiert ein Boot", "Fotografiert ein Flugzeug", "Lest den ersten Artikel des GG vor dem Bundesverfassungsgericht vor",
"Findet auf dem Waldparkplatz das Kennzeichen, was von am weitesten herkommt", "Macht ein Foto von einem Tier im Zoo",
"Geht auf alle Bahnsteige am Hbf., die eine Primzahl sind", "Schätzt die Strecke, die die Modelleisenbahn im Hbf. fährt.",
"Macht ein Foto von einer KSC-Flagge", "Macht ein Foto von einer Regenbogen-Flagge",
"Zählt die Briefkästen eines Studentenwohnheims", "Macht ein Selfie mit der Statur vor dem Schloss",
"Identifiziert den Dino vor dem Naturkundemuseum", "Findet 3 Baustellen",
"Geht in ein Museum (Eingangsbereich zählt)", "Trinkt etwas vor der Höpfner Burg",
"Werft einen Gegenstand 10-mal mind. 10m hin und her", "Löst eine DGL an der Physik",
"Findet drei verschiedenfarbige Bänke an der Uni", "Lauft 100m mit geschlossenen Augen (ein Spieler reicht)",
"Schaut die aktuelle Sitzverteilung der Parteien vor dem Rathaus nach", "Entspannt euch für 10min im Schlosspark",
"Macht 2 Stationen vom Fitness Angebot im Südstadtpark", "Faltet einen Papierflieger, der mehr als 5m fliegt, am alten Flugplatz.",
"Faltet ein Papierboot und lass es im Schlossparkteich schwimmen", "Entsorgt rumliegenden Müll in einem Mülleimer",
"Findet ein 4-blättriges Kleeblatt", "Lasst einen Stein mehr als 3-mal auf dem Wasser springen",
"Umarmt einen Baum in Waldstadt", "Findet ein Zitat mit dem Wort Frieden im Garten der Religionen", "Zählt die Fenster vom Gottesauer Schloss",
"Findet ein Grabstein auf dem Hauptfriedhof, der einen eurer Namen/Geburtstag hat", "Berührt die Speerspitze auf dem Ehrenhof",
"Werft 4-mal Kopf vor der Münzprägestätte", "Geht auf einen Spielplatz und schaukelt", "Dribbelt einen Stein durch ein Tor auf einem Sportplatz oder vor dem Wildparkstadium",
"Geht in ein Kino und schaut nach, welche Filme heute laufen", "Findet ein Stadtteilwappen und einigt euch auf eine Rangliste aller Stadtteilwappen von Karlsruhe", "Setzt euch in den Tempel im Schlossgarten",
"Probiert in einem DM Sonnenbrillen an", "Fotografiert 3 verschiedene Tierarten (Menschen zählen nicht)",
"Fotografiert ein Fahrzeug mit Blaulichtlampen", "Findet das Wappentier von Karlsruhe, einen Greif","Lest die Uhrzeit an einer öffentlichen analogen Uhr ab", "Beobachtet einen Gesetzesverstoß (nicht von einem Teammitglied)"];
var punkte = 0;

var challengelisthtml ="";
for(let i=0; i<challenges.length; i++){
    challengelisthtml+="<li>"+challenges[i]+"</li>";
}
challengelist.innerHTML = challengelisthtml;


function startgame() {
    challengetable.style.display = "block";
    startbutton.style.display = "none";
    for (let i = 0; i < challengeids.length; i++) {
        reroll(i);
    }
    window.onbeforeunload = function () {return "Ihr Fortschritt geht verloren, wenn Sie die Seite verlassen. Sind Sie sicher?";};
}
function reroll(index) {
    challengeids[index] = Math.floor(Math.random() * challenges.length);
    var row = challengetable.getElementsByTagName("tr")[index + 1];
    row.getElementsByTagName("td")[0].innerHTML = challengeids[index];
    row.getElementsByTagName("td")[1].innerHTML = challenges[challengeids[index]];
}
function veto(index) {
    changePunkte(-10);
    reroll(index);
}
function done(index) {
    changePunkte(20);
    reroll(index);
}
function changePunkte(change) {
    punkte += change;
    punktetext.innerHTML = "Punkte: " + punkte;

}
