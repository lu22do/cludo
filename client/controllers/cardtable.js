Template.cardtable.helpers({
  cardsByCategory: function() {
    let game = Games.findOne(this.gameId);
    if (game) {
      return [
        {name: 'Suspects', cards: SuspectCards[game.rules]},
        {name: 'Rooms', cards: RoomCards[game.rules]},
        {name: 'Times', cards: TimeCards[game.rules]},
        {name: 'Weapons', cards: WeaponCards[game.rules]}
      ];
    }
  }
});
