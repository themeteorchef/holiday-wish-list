const publicRoutes = FlowRouter.group( { name: 'public' } );

publicRoutes.route( '/', {
  name: 'welcome',
  action() {
    BlazeLayout.render( 'default', { yield: 'welcome' } );
  }
});

publicRoutes.route( '/lists/:_id', {
  name: 'list',
  action() {
    BlazeLayout.render( 'default', { yield: 'list' } );
  }
});
