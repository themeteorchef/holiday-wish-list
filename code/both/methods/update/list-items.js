Meteor.methods({
  updateListItemOrder( item ) {
    check( item, { _id: String, order: Number } );

    try {
      ListItems.update( item._id, { $set: { 'order': item.order } } );
    } catch( exception ) {
      return exception;
    }
  }
});
