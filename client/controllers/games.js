Template.games.helpers({
  games: function() {
    return Games.find({}).map(function(game) {
      var owner = Meteor.users.findOne(game.owner);

      var isMygame = false;
      if (Meteor.userId() === game.owner || (Meteor.user() && Meteor.user().username === 'admin')) {
        isMygame = true;
      }

      var players = '';
      var alreadyJoined = false;
      game.players.forEach((playerId) => {
        if (players != '') {
          players += ', ';
        }
        if (playerId === Meteor.userId()) {
          alreadyJoined = true;
        }
        players += Meteor.users.findOne(playerId).username;
      });

      return {name: game.name,
              rules: Rules[game.rules],
              id: game._id,
              players: players,
              state: game.finished? 'Finished (winner: ' + Meteor.users.findOne(game.winner).username + ')':
                     game.started? 'On-going (turn: ' + game.turn + ')': 'Not started',
              ownername: owner ? owner.username : 'unknown',
              canJoin: !game.started && !alreadyJoined,
              started: game.started && !game.finished,
              notStarted: !game.started,
              startable: !game.started && (game.players.length >= 2),
              isMygame: isMygame};
    });
  },
  gameCount: function() {
    return Games.find({}).count();
  }
});

Template.games.events({
  'click #delete-game': function(e) {
    //alert('delete ' + e.target.getAttribute('data-id'));
    var id = e.target.getAttribute('data-id');
    Games.remove(id, function(err) {
      if (err) {
        alert('Could not delete ' + err);
      }
    });
  },
  'click #join-game': function(e) {
    var id = e.target.getAttribute('data-id');
    Games.update(id, { $push : { players: Meteor.userId() } }, function(err) {
      if (err) {
        alert('Could not join ' + err);
      }
      else {
        //alert('You joined successfully');
      }
    });
  },
  'click #start-game': function(e) {
    var id = e.target.getAttribute('data-id');
    Meteor.call('game.start', id, function(err) {
      if (err) {
        alert('Could not start game ' + err);
      }
      else {
        //alert('Game started successfully');
        Router.go('/activegame/' + id);
      }
    });

/*
    var id = e.target.getAttribute('data-id');
    Games.update(id, { '$set': { 'started': new Date(),
                                 'gameState.curPlayer': 0 }
                     }, function(err) {
      if (err) {
        alert('Could not start game ' + err);
      }
      else {
        alert('Game started successfully');
        Router.go('/activegame/' + id);
      }
    });
    */
  }
});

Template.newgame.helpers({
  possibleRules: function() {
    let possibleRules = [];
    Rules.forEach(function (rules, index) {
      possibleRules.push(Rules[index] + ' (' + SuspectCards[index].length + ' Suspect Cards, '
                                            + RoomCards[index].length + ' Room Cards, '
                                            + TimeCards[index].length + ' Time Cards, '
                                            + WeaponCards[index].length + ' Weapon Cards'
                                            + ')');
    });
    return possibleRules;
  }
});


Template.newgame.events({
  'submit #new-game-form': function(e, t) {
    e.preventDefault();
    var name = t.find('#name').value;
    if (name === '') {
      $('#name').parent().addClass('has-error');
      return false;
    }
    var rulesIndex = parseInt(t.find('#rules-selector option:selected').getAttribute('data-id'));

    if (!Games.find({name: name}).count()) {
      Games.insert({name: name,
                    rules: rulesIndex,
                    owner: Meteor.userId(),
                    players: []}, function(err, _id) {
        if (err) {
          alert('Unexpected error creating this game! ' + err)
          Router.go('/');
        }
        else {
          Router.go('/games');
        }
      });
    }
    else {
      alert('This game already exists! Could not create it.')
      t.find('#newgame-form').reset();
    }
    return false;
  }
});

Template.editgame.helpers({
  game: function() {
    return Games.findOne(this.gameId);
  },
});

Template.editgame.events({
  'submit #edit-game-form': function(e, t) {
    e.preventDefault();
    var id = e.target.getAttribute('data-id');
    var name = t.find('#name').value;
    var attribute = t.find('#attribute').value;
    Games.update(id,
                  {$set: {name: name,
                   attribute: attribute}}, function(err, _id) {
      if (err) {
        alert('Unexpected error updating this game!')
        t.find('#newgame-form').reset();
      }
      else {
        Router.go('/games');
      }
    });
    return false;
  }
});
