let send = ( options ) => {
  let list  = _getList( options.listId ),
      items = _getItems( options.listId );

  if ( list && items ) {
    _prepareAndSendList( options.recipient, list, items );
    _markListAsSent( options.listId );
  } else {
    throw new Meteor.Error( 'not-found', 'Sorry, we couldn\'t find that list! Try again?' );
  }
};

let _getList = ( listId ) => {
  let list = Lists.findOne( { _id: listId } );
  if ( list ) {
    return list;
  }
};

let _getItems = ( listId ) => {
  let items = ListItems.find( { listId: listId }, { sort: { order: 1 } } ).fetch();
  if ( items ) {
    return items;
  }
};

let _prepareAndSendList = ( recipient, list, items ) => {
  let html = _buildHtmlEmail( list, items );

  Email.send({
    to: recipient,
    from: 'Dear Santa <dearsantalist@themeteorchef.com>',
    subject: `[Dear Santa] ${list.name} sent you a wish list!`,
    html: html
  });
};

let _buildHtmlEmail = ( list, items ) => {
  SSR.compileTemplate( 'santaEmail', Assets.getText( 'email/templates/send-to-santa.html' ) );
  return SSR.render( 'santaEmail', { wisher: list.name, items: items } );
};

let _markListAsSent = ( listId ) => {
  return Lists.update( { _id: listId }, { $set: { sent: true } } );
};

Modules.server.sendList = send;
