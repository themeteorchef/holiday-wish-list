Meteor.methods({
  deleteListItem( itemId ) {
    check( itemId, String );

    try {
      ListItems.remove( itemId);
    } catch( exception ) {
      return exception;
    }
  }
});
