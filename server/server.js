// create admin account if it does not exists
if (!Meteor.users.findOne({username: 'admin'})) {
  var password = 'admin';
  if (Meteor.settings.adminPassword) {
    password = Meteor.settings.adminPassword;
  }
  if (!Accounts.createUser({username: 'admin',
                 					  password: password})) {
    console.log('Admin account creation error');
  }
}

Games.find().observe({
  removed: function(game) {
    //console.log('game removed ' + game.gameDetails);
    if (game.gameDetails) {
      GameDetails.remove(game.gameDetails, function(err) {
        if (err) {
          alert('Could not delete ' + err);
        }
      });
    }
  }
});

// house keeping: deleting orphan GameDetails
let gameDetails = GameDetails.find();
let games = Games.find().fetch();
gameDetails.forEach((gameDetail) => {
  let found = false;
  for (let i = 0; i < games.length; i++) {
    if (games[i].gameDetails === gameDetail._id) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('Deleting orphan gameDetail id = ' + gameDetail._id);
    GameDetails.remove(gameDetail._id);
  }
});
