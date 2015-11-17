Template.welcome.onRendered( () => {
  Modules.client.createList({
    template: Template.instance(),
    form: '#create-list'
  });
});

Template.welcome.events({
  'submit form' ( event, template ) {
    event.preventDefault();
  }
});
