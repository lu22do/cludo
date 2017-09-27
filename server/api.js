import { Meteor } from 'meteor/meteor';

function findPlayer(game, playerId) {
  for (let i = 0; i < game.players.length; i++) {
    if (game.players[i] === playerId) {
      return i;
    }
  }
  throw new Meteor.Error('no-player-found');
}

function playerHasAtLeastOneCard(game, gameDetails, playerIndex, cardSet) {
  for (let i = 0; i < gameDetails.cardsPerPlayer[playerIndex].cards.length; i++) {
    let card = gameDetails.cardsPerPlayer[playerIndex].cards[i];
    switch (card.type) {
      case CARD_TYPE_SUSPECT:
        if (card.index == cardSet.suspectIndex) {
          return true;
        }
        break;
      case CARD_TYPE_ROOM:
        if (card.index == cardSet.roomIndex) {
          return true;
        }
        break;
      case CARD_TYPE_TIME:
        if (card.index == cardSet.timeIndex) {
          return true;
        }
        break;
      case CARD_TYPE_WEAPON:
        if (card.index == cardSet.weaponIndex) {
          return true;
        }
        break;
    }
  }
  return false;
}

Meteor.methods({
  'game.start'(id) {
    console.log('game start request (by ' + Meteor.users.findOne(this.userId).username + ')');

    let game = Games.findOne(id);

    if (this.userId != game.owner) {
      throw new Meteor.Error('wrong-owner',
                             'Only the game owner can start that game');
    }

    let cards = [];

    // Create the card deck
    SuspectCards[game.rules].forEach((card, index) => {
      cards.push({type: CARD_TYPE_SUSPECT, index: index});
    });
    RoomCards[game.rules].forEach((card, index) => {
      cards.push({type: CARD_TYPE_ROOM, index: index});
    });
    TimeCards[game.rules].forEach((card, index) => {
      cards.push({type: CARD_TYPE_TIME, index: index});
    });
    WeaponCards[game.rules].forEach((card, index) => {
      cards.push({type: CARD_TYPE_WEAPON, index: index});
    });

    // Select the solution
    let solutionCards = {};
    let weaponRandom = Math.floor(Math.random() * WeaponCards[game.rules].length);
    let _card = cards.splice(SuspectCards[game.rules].length + RoomCards[game.rules].length +
                             TimeCards[game.rules].length + weaponRandom, 1)[0];
    solutionCards.weaponIndex = _card.index;

    let timeRandom = Math.floor(Math.random() * TimeCards[game.rules].length);
    _card = cards.splice(SuspectCards[game.rules].length + RoomCards[game.rules].length +
                         timeRandom, 1)[0];
    solutionCards.timeIndex = _card.index;

    let roomRandom = Math.floor(Math.random() * RoomCards[game.rules].length);
    _card = cards.splice(SuspectCards[game.rules].length + roomRandom, 1)[0];
    solutionCards.roomIndex = _card.index;

    let suspectRandom = Math.floor(Math.random() * SuspectCards[game.rules].length);
    _card = cards.splice(suspectRandom, 1)[0];
    solutionCards.suspectIndex = _card.index;

    // Distribute to players
    let cardsPerPlayer = [];
    while (cards.length >= game.players.length) {
      game.players.forEach((playerId, index) => {
        if (!cardsPerPlayer[index]) {
          cardsPerPlayer[index] = {cards: []};
        }

        let random = Math.floor(Math.random() * cards.length);
        cardsPerPlayer[index].cards.push(cards.splice(random, 1)[0]);
      });
    }

    console.log('Solution:')
    console.log('* ' + SuspectCards[game.rules][solutionCards.suspectIndex]);
    console.log('* ' + RoomCards[game.rules][solutionCards.roomIndex]);
    console.log('* ' + TimeCards[game.rules][solutionCards.timeIndex]);
    console.log('* ' + WeaponCards[game.rules][solutionCards.weaponIndex]);

    console.log('Cards per player:')
    game.players.forEach((playerId, index) => {
      console.log('* ' + Meteor.users.findOne(playerId).username + ' (' +
                  cardsPerPlayer[index].cards.length + ' cards):');
      cardsPerPlayer[index].cards.forEach((card) => {
        console.log('** ' + AllCards[game.rules][card.type][card.index]);
      });
    });

    console.log('Remaining cards:')
    cards.forEach((card) => {
      console.log('* ' + AllCards[game.rules][card.type][card.index]);
    });

    let retiredPlayers = [];
    game.players.forEach((playerId, index) => {
      retiredPlayers[index] = false;
    });

    GameDetails.insert({ cardsPerPlayer: cardsPerPlayer,
                         solutionCards: solutionCards
                       }, function(err, gameDetailsId) {
      if (err) {
        throw err;
      }

      Games.update(id, { '$set': { 'started': new Date(),
                                   'turn': 1,
                                   'curPlayer': 0,
                                   'retiredPlayers': retiredPlayers,
                                   'state': STATE_DECIDING_ACTION,
                                   'remainingCards': cards,
                                   'gameDetails': gameDetailsId
                                 }
                       }, function(err) {
        if (err) {
          throw err;
        }
        else {
          console.log('Game started successfully');
          return;
        }
      });
    });
  },
  'game.getCards'(id) {
    console.log('game.getCards gameId=' + id + ' user=' + Meteor.users.findOne(this.userId).username);
    let game = Games.findOne(id);
    if (game) {
      let gameDetails = GameDetails.findOne(game.gameDetails);

      let playerIndex = findPlayer(game, this.userId);

      let cardsForDisplay = [];
      gameDetails.cardsPerPlayer[playerIndex].cards.forEach((card) => {
        cardsForDisplay.push({ type: card.type,
                               index: card.index,
                               category: CardCategories[card.type],
                               name: AllCards[game.rules][card.type][card.index] });
      });
      cardsForDisplay.sort(function(a, b) {return a.type - b.type});
      return cardsForDisplay;
    }
  },
  'game.askPlayer'(args) {
    console.log('game.askPlayer gameId=' + args.id + ' user=' + Meteor.users.findOne(this.userId).username);

    let game = Games.findOne(args.id);
    if (this.userId !== game.players[game.curPlayer]) {
      throw new Meteor.Error('only-active-player-can-ask',
                             'Only active player can ask question');
    }

    if (game.state != STATE_DECIDING_ACTION) {
      throw new Meteor.Error('wrong-state',
                             'Wrong state to ask - ' + game.state);
    }

    let gameDetails = GameDetails.findOne(game.gameDetails);

    let nextState = STATE_WAITING_ANSWER;
    if (!playerHasAtLeastOneCard(game, gameDetails, findPlayer(game, args.playerId), args.cardSet)) {
      nextState = STATE_ANSWER_RECEIVED;
    }

    Games.update(args.id, { '$set': { 'curAskedPlayer': args.playerId,
                                      'curAskedCardSet': args.cardSet,
                                      'state': nextState } });
  },
  'game.answer'(args) {
    console.log('game.answer gameId=' + args.id + ' user=' + Meteor.users.findOne(this.userId).username);

    let game = Games.findOne(args.id);

    if (game.state != STATE_WAITING_ANSWER) {
      throw new Meteor.Error('wrong-state',
                             'Wrong state to answer - ' + game.state);
    }

    let logEntry = {
      playerId: game.players[game.curPlayer],
      action: ACTION_ASKED_PLAYER,
      askedPlayerId: game.curAskedPlayer,
      askedCardSet: game.curAskedCardSet,
      answer: args.card
    };

    GameDetails.update(game.gameDetails,
                       { '$set': { 'lastAnswer': args.card },
                         '$push': { 'logs': logEntry },
                       },
                       function(err) {
      if (err) {
        throw err;
      }

      Games.update(args.id, { '$set': { 'state': STATE_ANSWER_RECEIVED } });
    });
  },
  'game.getAnswer'(args) {
    console.log('game.getAnswer gameId=' + args.id + ' user=' + Meteor.users.findOne(this.userId).username);

    let game = Games.findOne(args.id);

    if (game.state != STATE_ANSWER_RECEIVED) {
      throw new Meteor.Error('wrong-state',
                             'Wrong state to get answer - ' + game.state);
    }

    let gameDetails = GameDetails.findOne(game.gameDetails);

    if (gameDetails.lastAnswer) {
      if (this.userId === game.players[game.curPlayer] ||
          this.userId === game.curAskedPlayer) {
        let lastAnswer = gameDetails.lastAnswer;
        return AllCards[game.rules][lastAnswer.type][lastAnswer.index];
      }
      else {
        return '1';
      }
    }
    else {
      return '0';
    }
  },
  'game.nextTurn'(args) {
    console.log('game.nextTurn');

    let game = Games.findOne(args.id);

    if (game.state != STATE_ANSWER_RECEIVED &&
        game.state != STATE_SOLUTION_GUESSED) {
      throw new Meteor.Error('wrong-state',
                             'Next turn can only be done after getting answer');
    }

    let turn = game.turn;
    if (game.curPlayer === game.players.length - 1) {
      turn++;
    }

    // go to next player but skip the retired ones
    let curPlayer = game.curPlayer;
    do {
      curPlayer = (curPlayer + 1) % game.players.length;
    } while (game.retiredPlayers[curPlayer]);

    if (curPlayer === game.curPlayer) {
      throw new Meteor.Error('something-wrong',
                             'Single player left!');
    }

    GameDetails.update(game.gameDetails,
                       { '$unset': { 'lastAnswer': '' } },
                       function(err) {
                         Games.update(args.id, { '$set': { 'curPlayer': curPlayer,
                                                           'turn': turn,
                                                           'state': STATE_DECIDING_ACTION
                                                         },
                                                         '$unset': { 'curAskedPlayer': '',
                                                                     'curAskedCardSet': '' },
                                                                   }
                                     );
                       });
  },
  'game.getLastLog'(args) {
    console.log('game.getLastLog');

    let game = Games.findOne(args.id);
    let gameDetails = GameDetails.findOne(game.gameDetails);

    return gameDetails.logs[gameDetails.logs.length - 1];
  },
  'game.guessSolution'(args) {
    console.log('game.guessSolution gameId=' + args.id + ' user=' + Meteor.users.findOne(this.userId).username);

    let game = Games.findOne(args.id);
    if (this.userId !== game.players[game.curPlayer]) {
      throw new Meteor.Error('only-active-player-can-ask',
                             'Only active player can guess solution');
    }

    if (game.state != STATE_DECIDING_ACTION) {
      throw new Meteor.Error('wrong-state',
                             'Wrong state to guess solution - ' + game.state);
    }

    let gameDetails = GameDetails.findOne(game.gameDetails);

    let winner;
    let guessedCardSet;
    if (args.cardSet.suspectIndex == gameDetails.solutionCards.suspectIndex &&
        args.cardSet.roomIndex == gameDetails.solutionCards.roomIndex &&
        args.cardSet.timeIndex == gameDetails.solutionCards.timeIndex &&
        args.cardSet.weaponIndex == gameDetails.solutionCards.weaponIndex) {
      winner = game.players[game.curPlayer];
      guessedCardSet = args.cardSet;
    }
    else {
      game.retiredPlayers[game.curPlayer] = true;

      let activePlayerNb = 0;
      let lastActivePlayerIndex;
      game.retiredPlayers.forEach((value, index) => {
        if (value === false) {
          activePlayerNb++;
          lastActivePlayerIndex = index;
        }
      });

      if (activePlayerNb == 0) {
        throw new Meteor.Error('wrong-player-nb','');
      }
      else if (activePlayerNb == 1) {
        winner = game.players[lastActivePlayerIndex];
      }
    }

    if (winner) {
      Games.update(args.id, { '$set': { 'finished': new Date(),
                                        'winner': winner,
                                        'guessedCardSet': guessedCardSet,
                                        'state': STATE_SOLUTION_GUESSED } });
      return true;
    } else {
      Games.update(args.id, { '$set': { retiredPlayers : game.retiredPlayers,
                                        'state': STATE_SOLUTION_GUESSED } });
      return false;
    }
  }
});
