Meteor.publish( 'list', function( listId ) {
  check( listId, String );

  let list = Lists.find( { _id: listId } );

  return [
    list,
    ListItems.find( { listId: listId } )
  ];
});
