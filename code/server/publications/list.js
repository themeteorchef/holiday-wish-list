Meteor.publish( 'list', function( listId ) {
  check( listId, String );

  return [
    Lists.find( { _id: listId } ),
    ListItems.find( { listId: listId } )
  ];
});
