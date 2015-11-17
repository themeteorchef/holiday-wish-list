Meteor.methods({
  addItemToList( listItem ) {
    check( listItem, {
      listId: String,
      name: String,
      url: Match.Optional( String )
    });

    let existingItems = ListItems.find( { listId: listItem.listId } ).count();

    listItem.order = existingItems + 1;

    try {
      var itemId = ListItems.insert( listItem );
      return itemId;
    } catch( exception ) {
      return exception;
    }
  }
});
