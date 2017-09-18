// not working
describe('init', function () {
  it('creates a game', function () {
    Games.insert({ name: 'game1',
                   rules: 0,
                   owner: Meteor.userId(),
                   players: [] },
                 function(err, _id) {
      if (err) {
        alert('Unexpected error creating this game! ' + err)
      }
      else {
        done();
      }
    });

  })
})
