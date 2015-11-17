let template;

let create = ( options ) => {
  template = options.template;
  _validate( options.form );
};

let _validate = ( form ) => {
  $( form ).validate( validation() );
};

let validation = () => {
  return {
    rules: {
      listName: {
        required: true
      }
    },
    messages: {
      listName: {
        required: "Whoops! Need your name here, please."
      }
    },
    submitHandler() { _handleCreate(); }
  };
};

let _handleCreate = () => {
  let listName = template.find( '[name="listName"]' ).value;

  Meteor.call( 'createWishList', listName, ( error, listId ) => {
    if ( error ) {
      Bert.alert( error.reason, 'warning' );
    } else {
      localStorage.setItem( 'themeteorchef_dear_santa_list_id', listId );
      FlowRouter.go( `/lists/${listId}` );
      Bert.alert( 'Awesome! Your list is all ready for some wishes.', 'success' );
    }
  });
};

Modules.client.createList = create;
