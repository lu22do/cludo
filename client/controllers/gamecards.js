Template.gamecards.helpers({
  game: function() {
    return Games.findOne(this.gameId);
  },
  categories: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      return [
        {name: 'Suspect cards', cards: SuspectCards[game.rules]},
        {name: 'Room cards', cards: SuspectCards[game.rules]},
        {name: 'Time cards', cards: SuspectCards[game.rules]},
        {name: 'Weapon cards', cards: SuspectCards[game.rules]}
      ];
    }
  }
});
