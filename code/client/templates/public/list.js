Template.list.onCreated( () => {
  let template = Template.instance();
  template.subscribe( 'list', FlowRouter.current().params._id );
  template.sending = new ReactiveVar( false );
});

Template.list.onRendered( () => {
  Modules.client.dragDrop.init({
    sortableElement: '.sortable',
    sortableItems: '.sortable li'
  });
});

Template.list.helpers({
  hasBeenSent() {
    let list = Lists.findOne();
    if ( list ) {
      return list.sent;
    }
  },
  sending() {
    return Template.instance().sending.get();
  },
  hasItems() {
    return ListItems.find( {} ).count() > 0;
  },
  items() {
    let items = ListItems.find( {}, { sort: { order: 1 } } );
    if ( items ) {
      return items;
    }
  }
});

Template.list.events({
  'click .send-to-santa' ( event, template ) {
    template.sending.set( true );
  },
  'click .cancel-send' ( event, template ) {
    template.sending.set( false );
  },
  'click .fa-remove' ( event, template ) {
    if ( confirm( 'Are you sure you want to delte this? It will go poof!' ) ) {
      Meteor.call( 'deleteListItem', this._id, ( error ) => {
        if ( error ) {
          Bert.alert( error.reason, 'warning' );
        } else {
          Bert.alert( 'Poof! Item removed.', 'success' );
          Modules.client.dragDrop.setIndexes( '.sortable li' );
        }
      });
    }
  }
});
