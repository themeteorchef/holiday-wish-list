Template.addListItem.onRendered( () => {
  Modules.client.addItem({
    template: Template.instance(),
    form: '#add-item'
  });
});

Template.addListItem.events({
  'submit form' ( event, template ) { event.preventDefault(); }
});
