Games = new Mongo.Collection('games'); // game sessions
GameDetails = new Mongo.Collection('game-details'); // game state
// GameRules = ...

STATE_DECIDING_ACTION = 0;
STATE_WAITING_ANSWER = 1;
STATE_ANSWER_RECEIVED = 2;
STATE_SOLUTION_GUESSED = 3;

CARD_TYPE_NONE = -1;
CARD_TYPE_SUSPECT = 0;
CARD_TYPE_ROOM = 1;
CARD_TYPE_TIME = 2;
CARD_TYPE_WEAPON = 3;

ACTION_ASKED_PLAYER = 0;
ACTION_GUESSED_SOLUTION = 1;

CardCategories = ["Suspect", "Room", "Time", "Weapon"];

// Rules
FRENCH_CLASSIC = 0;
ENGLISH_CLASSIC = 1;
ENGLISH_SIMPLE = 2;
FRENCH_CRAZY = 3;
ENGLISH_SUPERGIRL = 4;
Rules = ['French classic', 'English classic', 'English simple', 'French crazy', 'English Super girl'];
SuspectCards = [];
RoomCards = [];
TimeCards = [];
WeaponCards = [];
AllCards = [];

FourCardSet = new SimpleSchema({
  'suspectIndex': {
    type: Number
  },
  'roomIndex': {
    type: Number
  },
  'timeIndex': {
    type: Number
  },
  'weaponIndex': {
    type: Number
  }
});

CardSchema = new SimpleSchema({
  'type': {
    type: Number,
    label: 'Card type'
  },
  'index': {
    type: Number,
    label: 'Card index for given type'
  }
});

CardSetSchema = new SimpleSchema({
  'cards': {
    type: [CardSchema],
    label: 'Set of cards'
  }
});

LogEntry = new SimpleSchema({
  'playerId': {
    type: String
  },
  'action': {
    type: Number
  },
  'askedPlayerId': {
    type: String,
    optional: true
  },
  'askedCardSet': {
    type: FourCardSet,
    label: 'Asked card set'
  },
  'answer': {
    type: CardSchema,
    label: 'Card answer',
    optional: true
  }
});

GameDetailsSchema = new SimpleSchema({
  'cardsPerPlayer': {
    type: [CardSetSchema],
    label: 'Array of cards per players'
  },
  'solutionCards': {
    type: FourCardSet,
    label: 'Solution cards'
  },
  'lastAnswer': {
    type: CardSchema,
    label: 'Last card answer',
    optional: true
  },
  'logs': {
    type: [LogEntry],
    label: 'Log of activities',
    optional: true
  }
});

GameSchema = new SimpleSchema({
  'name': {
    type: String,
    label: 'Name'
  },
  'owner': {
    type: String,
    label: 'Owner UserId'
  },
  'created': {
    type: Date,
    label: 'Creation date',
    denyUpdate: true,
    autoValue: function() {
      if ( this.isInsert ) {
        return new Date();
      }
    }
  },
  'started': {
    type: Date,
    label: 'Start date',
    optional: true
  },
  'finished': {
    type: Date,
    label: 'Finish date',
    optional: true
  },
  'rules': {
    type: Number,
    label: 'Rules for this game'
  },
  'players': {
    type: [String],
    label: 'Player UserIds'
  },
  'retiredPlayers': {
    type: [Boolean],
    label: 'Indicate which player has guessed wrongly the solution',
    optional: true
  },
  'winner': {
    type: String,
    label: 'UserId of winner',
    optional: true
  },
  'turn': {
    type: Number,
    label: 'Current turn (starting at 1)',
    optional: true
  },
  'curPlayer': {
    type: Number,
    label: 'Currently active player index (in players array)',
    optional: true
  },
  'state': {
    type: Number,
    label: 'State',
    optional: true
  },
  'curAskedPlayer': {
    type: String,
    label: 'PlayerId who is requested to do show a card, undefined otherwise',
    optional: true
  },
  'curAskedCardSet': {
    type: FourCardSet,
    label: 'Card set who is asked to a player, undefined otherwise',
    optional: true
  },
  'guessedCardSet': {
    type: FourCardSet,
    label: 'Guessed card set (when someone won)',
    optional: true
  },
  'remainingCards': {
    type: [CardSchema],
    label: 'Remaing visible cards',
    optional: true
  },
  'gameDetails': {
    type: String,
    label: 'GameDetails id',
    optional: true
  }
});

Games.attachSchema(GameSchema);
GameDetails.attachSchema(GameDetailsSchema);
