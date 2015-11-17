Meteor.methods({
  sendListToSanta( list ) {
    check( list, {
      recipient: String,
      listId: String
    });

    try {
      return Modules.server.sendList( list );
    } catch ( exception ) {
      return exception;
    }
  }
});
