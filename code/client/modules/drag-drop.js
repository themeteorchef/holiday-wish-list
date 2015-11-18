let dragDrop = ( options ) => {
  _initDragDrop( options.sortableElement, options.sortableItems );
};

let _initDragDrop = ( element, items ) => {
  if ( _getItems() ) {
    setTimeout( () => {
      _setDragDrop( element );
      _setChangeEvent( element, items );
    }, 300 );
  }
};

let _getItems = () => {
  let items = ListItems.find().fetch();
  if ( items ) {
    return items;
  }
};

let _setDragDrop = ( element ) => {
  $( element ).sortable( 'destroy' );
  $( element ).sortable( { forcePlaceholderSize: true } );
};

let _setChangeEvent = ( element, items ) => {
  $( element ).sortable().off( 'sortupdate' );

  $( element ).sortable().on( 'sortupdate', function() {
    updateListItemOrder( items );
  });
};

let updateListItemOrder = ( items ) => {
  $( items ).each( ( index, element ) => {
    let item = { _id: $( element ).data( 'id' ), order: index + 1 };

    Meteor.call( 'updateListItemOrder', item, ( error ) => {
      if ( error ) {
        Bert.alert( error.reason, 'warning' );
      }
    });
  });
};

Modules.client.dragDrop = {
  init: dragDrop,
  setIndexes: updateListItemOrder
};
