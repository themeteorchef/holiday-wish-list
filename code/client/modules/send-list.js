let template;

let send = ( options ) => {
  template = options.template;
  _validate( options.form );
};

let _validate = ( form ) => {
  $( form ).validate( validation() );
};

let validation = () => {
  return {
    rules: {
      emailAddress: {
        required: true,
        email: true
      }
    },
    messages: {
      emailAddress: {
        required: 'Need an email address here, please!',
        email: 'Is this a real email address? Double check!'
      }
    },
    submitHandler() { _handleSend(); }
  };
};

let _handleSend = () => {
  let list = {
    recipient: template.find( '[name="emailAddress"]' ).value,
    listId: FlowRouter.current().params._id
  };

  Meteor.call( 'sendListToSanta', list, ( error ) => {
    if ( error ) {
      Bert.alert( error.reason, 'warning' );
    } else {
      Bert.alert( 'List sent! Happy holidays and good luck :)', 'success' );
    }
  });
};

Modules.client.sendList = send;
