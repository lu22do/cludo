// called everytime someone subscribes (or unsubscribes (logout))
Meteor.publish("games", function () {
  //console.log('publishing games');
  return Games.find();
});

Meteor.publish("game-details", function () {
  var user = Meteor.users.findOne(this.userId);

  if (user && user.username === 'admin') {
    //console.log('publishing game details to admin')
    return GameDetails.find();
  }
});

Games.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    return (userId && doc.owner === userId);
  },
  update: function (userId, doc, fields, modifier) {
    // UNSECURE temporarily
    return true;

    // can only change your own documents except adding/removing one self
    if (modifier && modifier.$push && modifier.$push.players == userId ||
        modifier && modifier.$pull && modifier.$pull.players == userId) {
      return true;
    }
    else {
      return doc.owner === userId;
    }
  },
  remove: function (userId, doc) {
    var currentUser = Meteor.user();

    // can only remove your own documents
    return doc.owner === userId ||
           (currentUser && currentUser.username === 'admin');
  },
  fetch: ['owner']
});

Games.deny({
  update: function (userId, doc, fields, modifier) {
    // can't change owners
    return _.contains(fields, 'owner');
  }
});

// user data
Meteor.publish("userData", function () {
  return Meteor.users.find({},
                           {fields: {'username': 1}});
});

Meteor.users.allow({
  insert: function (userId, doc) {
    return true;
  },
  update: function (userId, doc, fields, modifier) {
    // can only change your own documents
    return doc.owner === userId;
  },
  remove: function (userId, doc) {
    var currentUser = Meteor.user();

    // only admin can delete users
		return currentUser && currentUser.username === 'admin';
  }
});
