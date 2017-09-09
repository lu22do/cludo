Template.topbar.helpers({
  gamesactive: function() {
    return Router.current().route.getName() === 'games' ? 'active' : '';
  },
  newgameactive: function() {
    return Router.current().route.getName() === 'newgame' ? 'active' : '';
  },
  usersactive: function() {
    return Router.current().route.getName() === 'users' ? 'active' : '';
  },
  isAdmin: function() {
    return Meteor.user() && Meteor.user().username === 'admin';
  }
});

Template.topbar.events({
  'click #logout': function() {
    Meteor.logout(function() {
      Router.go('/');
    })
  }
});
