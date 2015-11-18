Meteor.methods({
  createWishList( listName ) {
    check( listName, String );

    try {
      let listId = Lists.insert( { name: listName, sent: false } );
      return listId;
    } catch( exception ) {
      return exception;
    }
  }
});
