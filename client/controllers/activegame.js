Template.activegame.onCreated(function() {
  this.autorun(() => {
    let gameId = Blaze.getData().gameId;
    let game = Games.findOne(Blaze.getData().gameId);
    if (game) {
      if (game.state == STATE_WAITING_ANSWER ||
          game.state == STATE_ANSWER_RECEIVED) {
        $('#notification-modal').modal('show');
      }
      else {
        $('#notification-modal').modal('hide');
      }

      if (game.state == STATE_SOLUTION_GUESSED) {
        $('#solution-guessed-modal').on('hidden.bs.modal', function (event) {
          let game = Games.findOne(gameId);
          if (game && game.finished) {
            Router.go('/');
          }
        }).modal('show');
      }
      else {
        $('#solution-guessed-modal').modal('hide');
      }

      Meteor.call('game.getLastLog', {id: Blaze.getData().gameId}, function(err, result) {
        Session.set('lastLog', result);
      });
    }
  });

  Meteor.call('game.getCards', Blaze.getData().gameId, function(err, result) {
    Session.set('myCards', result);
  });
});

Template.activegame.onRendered(() => {
  // console.log(Blaze.getData());
});

function hasCard(type, index) {
  let cards = Session.get('myCards');
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].type == type && cards[i].index == index) {
      return true;
    }
  }
  return false;
}

function getUserName(playerId) {
  if (playerId === Meteor.userId()) {
    return "you";
  }
  else {
    let player = Meteor.users.findOne(playerId);
    return player? player.username: 'unknown';
  }
}

function displayLog(game, log) {
  let askedCardSet = '{' +
                 SuspectCards[game.rules][log.askedCardSet.suspectIndex] + ', ' +
                 RoomCards[game.rules][log.askedCardSet.roomIndex] + ', ' +
                 TimeCards[game.rules][log.askedCardSet.timeIndex] + ', ' +
                 WeaponCards[game.rules][log.askedCardSet.weaponIndex] + '}';
  let card = log.answer.type === CARD_TYPE_NONE ? 'no card' :
    AllCards[game.rules][log.answer.type][log.answer.index];

  return getUserName(log.playerId) + ' asked ' +
         getUserName(log.askedPlayerId) + ' for ' +
         askedCardSet + ' and got ' +
         card + ' as answer.';
}

Template.activegame.helpers({
  game: function() {
    return Games.findOne(this.gameId);
  },
  players: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let players = [];
      game.players.forEach(function(playerId, index) {
        players.push({name: getUserName(playerId)});
        if (index === game.curPlayer) {
          players[players.length-1].style = 'currentPlayer';
        }
        if (game.retiredPlayers[index]) {
          players[players.length-1].style = 'retiredPlayer';
        }
      });

      return players;
    }
  },
  myTurn: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let playerId = game.players[game.curPlayer];
      if (playerId === Meteor.userId()) {
        return true;
      }
    }
    return false;
  },
  curPlayerName: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      return getUserName(game.players[game.curPlayer]);
    }
  },
  askedPlayerName: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.curAskedPlayer) {
      return getUserName(game.curAskedPlayer);
    }
  },
  askedPlayerIsYou: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.curAskedPlayer) {
      if (game.curAskedPlayer === Meteor.userId()) {
        return true;
      }
      else {
        return false;
      }
    }
  },
  playerCards: function() {
    return Session.get('myCards');
  },
  askedCardSet: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.curAskedCardSet) {
      return [SuspectCards[game.rules][game.curAskedCardSet.suspectIndex],
              RoomCards[game.rules][game.curAskedCardSet.roomIndex],
              TimeCards[game.rules][game.curAskedCardSet.timeIndex],
              WeaponCards[game.rules][game.curAskedCardSet.weaponIndex]
             ];
    }
  },
  waitingForAnswer: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.state === STATE_WAITING_ANSWER) {
      return true;
    }
    else {
      return false;
    }
  },
  answerReceived: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.state === STATE_ANSWER_RECEIVED) {
      ReactiveMethod.invalidateCall("game.getAnswer", {id: this.gameId});
      return true;
    }
  },
  answer: function() {
    return ReactiveMethod.call('game.getAnswer', {id: this.gameId});
  },
  possibleCardsToAnswer: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.curAskedCardSet) {
      let cards = [];
      let cardsToDisplay = [];

      if (hasCard(CARD_TYPE_SUSPECT, game.curAskedCardSet.suspectIndex)) {
        cards.push({type: CARD_TYPE_SUSPECT, index: game.curAskedCardSet.suspectIndex});
        cardsToDisplay.push(SuspectCards[game.rules][game.curAskedCardSet.suspectIndex]);
      }
      if (hasCard(CARD_TYPE_ROOM, game.curAskedCardSet.roomIndex)) {
        cards.push({type: CARD_TYPE_ROOM, index: game.curAskedCardSet.roomIndex});
        cardsToDisplay.push(RoomCards[game.rules][game.curAskedCardSet.roomIndex]);
      }
      if (hasCard(CARD_TYPE_TIME, game.curAskedCardSet.timeIndex)) {
        cards.push({type: CARD_TYPE_TIME, index: game.curAskedCardSet.timeIndex});
        cardsToDisplay.push(TimeCards[game.rules][game.curAskedCardSet.timeIndex]);
      }
      if (hasCard(CARD_TYPE_WEAPON, game.curAskedCardSet.weaponIndex)) {
        cards.push({type: CARD_TYPE_WEAPON, index: game.curAskedCardSet.weaponIndex});
        cardsToDisplay.push(WeaponCards[game.rules][game.curAskedCardSet.weaponIndex]);
      }

      Session.set('possibleAnswerCards', cards);

      return cardsToDisplay;
    }
  },
  otherplayers: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let players = [];
      game.players.forEach((playerId) => {
        if (playerId !== Meteor.userId()) {
          let player = Meteor.users.findOne(playerId)
          players.push({id: playerId,
                        name: player? player.username: 'unknown'});
        }
      });
      return players;
    }
  },
  remainingCards: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let cards = [];
      game.remainingCards.forEach((card) => {
        cards.push({category: CardCategories[card.type], name: AllCards[game.rules][card.type][card.index]});
      });
      return cards;
    }
  },
  cards: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      return {
        suspects: SuspectCards[game.rules],
        rooms: RoomCards[game.rules],
        times: TimeCards[game.rules],
        weapons: WeaponCards[game.rules]
      }
    }
  },
  curPlayerWon: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.finished && game.winner === game.players[game.curPlayer]) {
      return true;
    }
  },
  guessedCardSet: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let cardsToDisplay = [];
      cardsToDisplay.push(SuspectCards[game.rules][game.guessedCardSet.suspectIndex]);
      cardsToDisplay.push(RoomCards[game.rules][game.guessedCardSet.roomIndex]);
      cardsToDisplay.push(TimeCards[game.rules][game.guessedCardSet.timeIndex]);
      cardsToDisplay.push(WeaponCards[game.rules][game.guessedCardSet.weaponIndex]);
      return cardsToDisplay;
    }
  },
  winner: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.winner) {
      return Meteor.users.findOne(game.winner).username;
    }
  },
  youAreTheWinner: function() {
    let game = Games.findOne(this.gameId);
    if (game && game.winner && game.winner === Meteor.userId()) {
      return true;
    }
  },
  admin: function() {
    let user = Meteor.user();
    if (user && user.username === 'admin') {
      return true;
    }
  },
  logs: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let gameDetails = GameDetails.findOne(game.gameDetails);
      if (gameDetails) {
        let displayableLogs = [];
        gameDetails.logs.forEach(function(log, index) {
          displayableLogs.unshift({ index: '[' + index + '] ',
                                    text: displayLog(game, log) });
        });
        return displayableLogs;
      }
    }
  },
  lastLog: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      let lastLog = Session.get('lastLog');
      if (lastLog) {
        return displayLog(game, lastLog);
      }
    }
  },
});

Template.activegame.events({
  'submit #ask-player-modal-form': function(e, t) {
    e.preventDefault();
    $('#ask-player-modal').modal('hide')

    var id = e.target.getAttribute('data-id');
    var playerId = t.find('#player-selector option:selected').getAttribute('data-id');
    var suspectIndex = t.find('#ask-player-modal #suspect-selector option:selected').getAttribute('data-id');
    var roomIndex = t.find('#ask-player-modal #room-selector option:selected').getAttribute('data-id');
    var timeIndex = t.find('#ask-player-modal #time-selector option:selected').getAttribute('data-id');
    var weaponIndex = t.find('#ask-player-modal #weapon-selector option:selected').getAttribute('data-id');

    Meteor.call('game.askPlayer', {id, playerId, cardSet: {suspectIndex: parseInt(suspectIndex),
                                                           roomIndex: parseInt(roomIndex),
                                                           timeIndex: parseInt(timeIndex),
                                                           weaponIndex: parseInt(weaponIndex)}},
                function(err) {
      if (err) {
        alert('Could not ask player ' + err);
      }
      else {
        // alert('Player asked successfully');
      }
    });

    return false;
  },
  'submit #guess-solution-modal-form': function(e, t) {
    e.preventDefault();
    $('#guess-solution-modal').modal('hide')

    var id = e.target.getAttribute('data-id');
    var suspectIndex = t.find('#guess-solution-modal #suspect-selector option:selected').getAttribute('data-id');
    var roomIndex = t.find('#guess-solution-modal #room-selector option:selected').getAttribute('data-id');
    var timeIndex = t.find('#guess-solution-modal #time-selector option:selected').getAttribute('data-id');
    var weaponIndex = t.find('#guess-solution-modal #weapon-selector option:selected').getAttribute('data-id');

    Meteor.call('game.guessSolution', {id, cardSet: {suspectIndex: parseInt(suspectIndex),
                                                     roomIndex: parseInt(roomIndex),
                                                     timeIndex: parseInt(timeIndex),
                                                     weaponIndex: parseInt(weaponIndex)}},
                function(err, result) {
      if (err) {
        alert('Could not guess solution ' + err);
      }
      else {
        // if (result) {
        //   alert('You guess correctly! Party is finished.');
        // }
        // else {
        //   alert('You did not guess correctly!');
        // }
      }
    });

    return false;
  },
  'submit #notification-modal': function(e, t) {
    e.preventDefault();

    let id = e.target.getAttribute('data-id');
    let possibleAnswerCards = Session.get('possibleAnswerCards');
    var cardIndex = t.find('#answer-selector option:selected').getAttribute('data-id');

    let card = possibleAnswerCards[cardIndex];
    Session.set('possibleAnswerCards', undefined);

    Meteor.call('game.answer', {id, card},
                function(err) {
      if (err) {
        alert('Could not answer ' + err);
      }
      else {
        // alert('Player asked successfully');
      }
    });

    return false;
  },
  'click .next-turn': function(e) {
    e.preventDefault();
    $('#notification-modal').modal('hide')
    let id = e.target.getAttribute('data-id');
    Meteor.call('game.nextTurn', {id});
    return false;
  },
  'click #close': function(e) {
    e.preventDefault();
    $('#solution-guessed-modal').modal('hide');
    return false;
  }
});
