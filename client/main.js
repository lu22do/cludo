Meteor.subscribe('games');
Meteor.subscribe('userData');

Router.map(function(){
  this.onBeforeAction(function () {
      if (!Meteor.userId()) {
        this.render('Login');
      } else {
        this.next();
      }
    },
    {
      except: ['register']
    }
  );

  this.route('/', function() {
    this.render('main');
  });

  this.route('/games');
  this.route('/newgame');
  this.route('/editgame/:_id', function() {
    this.render('editgame', {
      data: {
        gameId: this.params._id
      }
    });
  });

  this.route('/users');
  this.route('/register');

  this.route('/activegame/:_id', function () {
    this.render('activegame', {
      data: {
        gameId: this.params._id
      }
    });
  });

  this.route('/gamecards/:_id', function () {
    this.render('gamecards', {
      data: {
        gameId: this.params._id
      }
    });
  });

});
