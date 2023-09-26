var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");
var DEBUG = false;
"use strict";
class Player{
    constructor(param) {
        this.id=param.id;
        this.socket = param.socket;
        this.cards = [];
        this.score = 0;
        this.name = "";
    }
}

var PlayerArray = [];

//Create Cards ["suit", "value"]
var TrumpfCards = [["Diamond",  "King"],["Diamond",  "King"],
    ["Diamond",  "10"],["Diamond",  "10"],
    ["Diamond",  "Ass"],["Diamond",  "Ass"],
    ["Diamond",  "Jack"],["Diamond",  "Jack"],
    ["Heart",  "Jack"], ["Heart",  "Jack"],
    ["Spade",  "Jack"],["Spade",  "Jack"],
    ["Club",  "Jack"], ["Club",  "Jack"],
    ["Diamond",  "Queen"],["Diamond",  "Queen"],
    ["Heart",  "Queen"], ["Heart",  "Queen"],
    ["Spade",  "Queen"],["Spade",  "Queen"],
    ["Club",  "Queen"],["Club",  "Queen"],
    ["Heart",  "10"], ["Heart",  "10"]];
var HeartCards = [["Heart",  "King"],["Heart",  "King"],
    ["Heart",  "Ass"], ["Heart",  "Ass"]];
var SpadeCards = [["Spade",  "King"],["Spade",  "King"],
    ["Spade",  "10"], ["Spade",  "10"],
    ["Spade",  "Ass"], ["Spade",  "Ass"]];
var ClubCards  = [["Club",  "King"],["Club",  "King"],
    ["Club",  "10"],["Club",  "10"],
    ["Club",  "Ass"],["Club",  "Ass"]];

var AllCards = ClubCards.concat(SpadeCards, HeartCards, TrumpfCards);
var NontrumpfCards = {};
NontrumpfCards["Heart"]=HeartCards;
NontrumpfCards["Spade"]=SpadeCards;
NontrumpfCards["Club"]=ClubCards;

//global Variables
var alten = new Array(2);
var contra = new Array(2);
var valuePoints = [0,0]; //[Punkte alte, Punkte Contra]
var finalPoints = [0,0]; //[Punkte alte, Punkte Contra]
var startPlayer = 0;
var currentPlayer = startPlayer;
var currentPlayedCards=[];

checkRestart();
var io = require('socket.io')(serv,{});

io.sockets.on('connection', function(socket){
    var index = findFreeSlot();
    if (index===-1){//zu viele Spieler
        console.log("ERROR Zu viele Spieler");
        socket.emit("myError", "Zu viele Spieler");
        socket.disconnect();
    }
    else {
        console.log("Player "+index+" connected");
        PlayerArray[index].socket = socket;
        PlayerArray[index].name = "Spieler " + index;
        emitToAllSockets("addToChat", PlayerArray[index].name + " ist beigetreten.");
        emitToAllSockets('updateNames', getNames());
        socket.emit('init', {
            selfId: index,
            currentPlayer: currentPlayer,
            names: getNames()
        });
        checkStartGame();
        updateCards(index);
        socket.on('disconnect', function () {
            console.log("Player " + index + " disconnected");
            PlayerArray[index].socket = null;
            emitToAllSockets("pauseGame", {});
            checkRestart();
        })
        socket.on('sendMsgToServer',function(data){
            emitToAllSockets('addToChat',PlayerArray[index].name+ ': ' + data);
        });
        socket.on('sendPmToServer',function(data){ //data:{username,message}
            var recipientSocket = null;
            for (let i = 0; i < PlayerArray.length; i++) {
                if(PlayerArray[i].name === data.username){
                    recipientSocket = PlayerArray[i].socket;
                }
            }
            if (recipientSocket === null) {
                socket.emit('addToChat', 'Den Spieler ' + data.username + ' gibt es nicht.');
            } else {
                recipientSocket.emit('addToChat', 'Von ' + PlayerArray[index].name + ':' + data.message);
                socket.emit('addToChat', 'Zu ' + data.username + ':' + data.message);
            }});
        socket.on('evalServer',function(data){
            if(DEBUG) {
                var res = eval(data);
                socket.emit('evalAnswer', res);
            }
        });
        socket.on("clickedCard", function (data){
            playCard(data);
        });
        socket.on('changeName', function (data){
            console.log(PlayerArray[data.id].name + " tried to change thier name to: "+data.newName)
            PlayerArray[data.id].name = data.newName;
            var names = getNames();
            emitToAllSockets('updateNames', names);
        });

    }

});

function checkStartGame(){
    if(findFreeSlot()===-1) {
        if(PlayerArray[0].cards.length === 0) {
            var proPlayerCards = AllCards.length / PlayerArray.length;
            var schlechtverteilt = true;
            while (schlechtverteilt) {
                var CardsArray = shuffel(AllCards);
                console.log("Starting Game")
                for (var i = 0; i < PlayerArray.length; i++) {
                    PlayerArray[i].cards = sortCards(CardsArray.slice(proPlayerCards * i, proPlayerCards * i + proPlayerCards));
                }
                schlechtverteilt= checkSchlechtVerteilt();
            }
            for (var j = 0; j < PlayerArray.length; j++) {
                updateCards(j);
            }
        }
        emitToAllSockets("startGame", {anzahlCards:getAnzahlCards()});
    }
}
function findFreeSlot(){
    for(let i=0; i<PlayerArray.length; i++){
        if(PlayerArray[i].socket==null){
            return i;
        }
    }
    return -1;
}
function checkSchlechtVerteilt(){
    alten = [];
    contra = [];
    for (let i = 0; i <PlayerArray.length; i++) {
        if(findIndexInArray(PlayerArray[i].cards,["Club", "Queen"])[0]!==-1){
            alten.push(i);
        }else{
            contra.push(i);
        }
    }
    if(alten.length===1){
        console.log("hochzeit");
        return true;
    }
    for (let i = 0; i < PlayerArray.length; i++) {
        var trumpfe  =0;
        for (let j = 0; j < PlayerArray[i].cards.length; j++) {
            if(isTrumpf(PlayerArray[i].cards[j])){
                trumpfe +=1;
            }
        }
        if(trumpfe<=3){
            return true;
        }
    }
    return false;
}
function isAlt(id){
    for (let i = 0; i < alten.length; i++) {
        if(alten[i]===id){
            return true;
        }
    }
    return false;
}
function shuffel(cards){
    var arr=[];
    arr = arr.concat(cards);
    for(var i =arr.length-1 ; i>0 ;i--){
        var j = Math.floor( Math.random() * (i + 1) ); //random index
        [arr[i],arr[j]]=[arr[j],arr[i]]; // swap
    }
    return arr;
}
function playCard(data){
    console.log(data.id + " tried to play " + data.card[0] + data.card[1]);
    if(currentPlayer === data.id){
        if(checkBedienen(data)) {
            currentPlayedCards.push([data.card[0], data.card[1], data.id]);
            removeCard(data);


            emitToAllSockets('playedCard', {
                currentlyPlayedCards: currentPlayedCards,
                player: data.id,
                anzahlCards:getAnzahlCards()
            });
            if (currentPlayedCards.length === PlayerArray.length) {
                calcWinner();
            } else {
                currentPlayer = (currentPlayer + 1) % PlayerArray.length;
            }
            emitToAllSockets("updateCurrentPLayer", {
                newCurrentPlayer: currentPlayer
            });
            console.log("It is now " + currentPlayer + "s turn")

        }else{
            console.log("but they didn´t serve");
            PlayerArray[data.id].socket.emit('addToChat', "Du musst bedienen.")
        }
    }else {
        console.log("but it wasn´t their turn");
        PlayerArray[data.id].socket.emit('myError', "Du bist nicht am Zug.");
    }

}
function checkBedienen(param){
    if(currentPlayedCards.length===0){
        return true;
    }
    var cards = PlayerArray[param.id].cards;
    if(isTrumpf(currentPlayedCards[0])){
        if(isTrumpf(param.card)) {
            return true;
        }else{
            for(var i=0; i<cards.length; i++){
                if(isTrumpf(cards[i])){
                    return false;
                }
            }
            return true
        }
    }else{
        if(currentPlayedCards[0][0]===param.card[0] && !isTrumpf(param.card)){
            return true
        }
        else {
                for(var j=0; j<cards.length; j++){
                    if(!isTrumpf(cards[j])&&cards[j][0]===currentPlayedCards[0][0]){
                        return false;
                    }
                }
                return true;
            }
        }

}
function calcWinner(){
    var highestCard = currentPlayedCards[0];
    var suit = currentPlayedCards[0][0];
    for(var i=1; i<currentPlayedCards.length; i++){
        if(isHigher(highestCard, currentPlayedCards[i], suit)){
            highestCard = currentPlayedCards[i];
        }
    }
    currentPlayer = highestCard[2];
    var points = addValues();
    if(isAlt(currentPlayer)){
        valuePoints[0] += points;
    }else{
        valuePoints[1] += points;
    }
    checkSpecialPoints(currentPlayer, points, PlayerArray[0].cards.length)
    currentPlayedCards = [];
    emitToAllSockets("newRound", {winner:currentPlayer});
    if(PlayerArray[0].cards.length===0){
        endGame();
    }
}
function addValues(){
    var total=0;
    for(var i=0; i<currentPlayedCards.length; i++){
        total += pointsofCard(currentPlayedCards[i][1]);
    }
    return total;
}
function checkSpecialPoints(winner, points, runde){
    var isWinnerAlt = isAlt(winner);
    //Fuchs gefangen
    var fuchse = findIndexInArray(currentPlayedCards, ["Diamond", "Ass"]);
    if(fuchse[0]!==-1){
        for (let i = 0; i < fuchse.length; i++) {
            if(isAlt(currentPlayedCards[fuchse[i]][2]) !== isWinnerAlt){
                if(isWinnerAlt){
                    finalPoints[0] +=1;
                }else{
                    finalPoints[1] += 1;
                }
            }
        }
    }
    //Doppelkopf
    if(points>=40){
        if(isWinnerAlt) {
            finalPoints[0] += 1;
        }else {
            finalPoints[1] += 1;
        }
        emitToAllSockets("addToChat", "Doppelkopf!")
    }
    //Karlchen
    var karlchen = findIndexInArray(currentPlayedCards, ["Club", "Jack"])
    if(runde === 0 && karlchen[0]!== -1){
        for (let i = 0; i < karlchen.length; i++) {
            if(currentPlayedCards[karlchen[i]][2]===winner){
                if(isWinnerAlt) {
                    finalPoints[0] += 1;
                }else {
                    finalPoints[1] += 1;
                }
            }
            else if(isAlt(currentPlayedCards[karlchen[i]][2])!==isWinnerAlt){
                if(isWinnerAlt) {
                    finalPoints[0] += 1;
                }else {
                    finalPoints[1] += 1;
                }
            }
        }
    }
}
function endGame(){
    emitToAllSockets("addToChat", valuePoints[0] + " - " + valuePoints[1]);
    if(valuePoints[0]>valuePoints[1]){
        finalPoints[0]+=Math.floor((valuePoints[0]-120)/30) + 1 - finalPoints[1];
    }else{
        finalPoints[1]+=Math.floor((valuePoints[1]-120)/30) + 1 + 1 - finalPoints[0];
    }
    var winnerPoints = finalPoints[0] - finalPoints[1];
    if(winnerPoints>0){
        for (let i = 0; i < alten.length; i++) {
            PlayerArray[alten[i]].score += winnerPoints;
        }
        emitToAllSockets("addToChat", PlayerArray[alten[0]].name  + " und " + PlayerArray[alten[1]].name +" haben gewonnen(+" + winnerPoints + ").");
    }else if(winnerPoints <0){
        for (let i = 0; i <contra.length; i++) {
            PlayerArray[contra[i]].score -= winnerPoints;
        }
        emitToAllSockets("addToChat", PlayerArray[contra[0]].name  + " und " + PlayerArray[contra[1]].name +" haben gewonnen(+" + (-winnerPoints) + ").");
    }else{
        emitToAllSockets("addToChat", "Nullspiel");
    }
    emitScores();
    alten = new Array(2);
    contra = new Array(2);
    valuePoints = [0,0]; //[Punkte alte, Punkte Contra]
    finalPoints = [0,0]; //[Punkte alte, Punkte Contra]
    startPlayer = (startPlayer + 1)%PlayerArray.length;
    currentPlayer = startPlayer;
    currentPlayedCards=[];
    checkStartGame();
}
function emitScores(){
    var scores = [];
    for (let i = 0; i < PlayerArray.length; i++) {
        scores.push(PlayerArray[i].score);
    }
    emitToAllSockets('updateScores', scores);
    console.log("Scores emitted");
}
function pointsofCard(value){
    switch (value){
        case "10":
            return 10;
        case "Ass":
            return 11;
        case "King":
            return 4;
        case "Queen":
            return 3;
        case "Jack":
            return 2;
        default:
            return 0;
    }
}
function isHigher(card1, card2, suit){
    if(isTrumpf(card1) && isTrumpf(card2)){
        return findIndexInArray(TrumpfCards, card1)[0]< findIndexInArray(TrumpfCards, card2)[0];
    }else if(!isTrumpf(card1) && !isTrumpf(card2)){
        return findIndexInArray(NontrumpfCards[suit], card1)[0]< findIndexInArray(NontrumpfCards[suit], card2)[0];
    }
    else{
        return isTrumpf(card2);
    }
}
function findIndexInArray(arr, card){
    var result = [];
    for(var i=0; i<arr.length; i++){
        if(arr[i][0]===card[0] && arr[i][1]===card[1]){
            result.push(i);
        }
    }
    if(result.length === 0){
        result.push(-1);
    }
    return result;
}
function removeCard(param){
    var newCards = [];
    var cards = PlayerArray[param.id].cards;
    for(var i=0; i<cards.length; i++){
        if(cards[i][0]===param.card[0] && cards[i][1] === param.card[1]){
            newCards = newCards.concat(cards.slice(i+1));
            PlayerArray[param.id].cards = newCards;
            updateCards(param.id);
            return 1;
        }else{
            newCards.push(cards[i]);
        }
    }
    console.log("Error, Spieler besitzt diese Karte nicht");
    return 0;
}
function sortCards(cards){
    var len = cards.length;
    var isSwapped = false;
    for(var i =0; i < len; i++){
        isSwapped = false;
        for(var j = 0; j < len-1; j++){
            if(findIndexInArray(AllCards, cards[j])[0] > findIndexInArray(AllCards, cards[j+1])[0]){
                var temp = cards[j];
                cards[j] = cards[j+1];
                cards[j+1] = temp;
                isSwapped = true;
            }
        }
        if(!isSwapped){
            break;
        }
    }
    return cards;
}
function updateCards(id){
    PlayerArray[id].socket.emit('updateCards', {cards:PlayerArray[id].cards});
}
function emitToAllSockets(name, data){
    for(var i=0; i<PlayerArray.length; i++){
        if(PlayerArray[i].socket!== null) {
            PlayerArray[i].socket.emit(name, data);
        }
    }
}
function isTrumpf(card) {
    return (card[1] ==="Jack" ||card[1]=== "Queen") || card[0] === "Diamond" || (card[1] === "10" && card[0] === "Heart");
}
function checkRestart(){
    for(var i=0; i<PlayerArray.length;i++){
        if(PlayerArray[i].socket != null){
            return 0;
        }
    }
    PlayerArray = new Array(4);
    for(let i=0; i<PlayerArray.length; i++){
        PlayerArray[i]= new Player({
            id:i,
            socket:null
        });
    }
    currentPlayer = 0;
    currentPlayedCards=[];
}
function getNames(){
    var names = [];
    for (let i = 0; i <PlayerArray.length; i++) {
        names.push(PlayerArray[i].name);
    }
    return names;
}
function getAnzahlCards(){
    var anzahlCards = [];
    for (let i = 0; i <PlayerArray.length; i++) {
        anzahlCards.push(PlayerArray[i].cards.length);
    }
    return anzahlCards;
}
