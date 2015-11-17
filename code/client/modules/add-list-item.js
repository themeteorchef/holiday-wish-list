let template,
    form;

let add = ( options ) => {
  template = options.template;
  form     = options.form;

  _validate( form );
};

let _validate = ( form ) => {
  $( form ).validate( validation() );
};

let validation = () => {
  return {
    rules: {
      itemName: {
        required: true
      },
      itemUrl: {
        url: true
      }
    },
    messages: {
      itemName: {
        required: "Whoops! Need a name for this item."
      },
      itemUrl: {
        url: "Is this correct? Don't forget the http:// part!"
      }
    },
    submitHandler() { _handleAdd(); }
  };
};

let _handleAdd = () => {
  let item = {
    listId: FlowRouter.current().params._id,
    name: template.find( '[name="itemName"]' ).value,
    url: template.find( '[name="itemUrl"]' ).value
  };

  Meteor.call( 'addItemToList', item, ( error ) => {
    if ( error ) {
      Bert.alert( error.reason, 'warning' );
    } else {
      Bert.alert( 'Item added! Cross your fingers :)', 'success' );
      $( form ).get(0).reset();
      
      Modules.client.dragDrop.init({
        sortableElement: '.sortable',
        sortableItems: '.sortable li'
      });
    }
  });
};

Modules.client.addItem = add;
