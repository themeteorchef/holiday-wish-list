Template.sendList.onRendered( () => {
  Modules.client.sendList({
    template: Template.instance(),
    form: '#send-list'
  });
});

Template.sendList.events({
  'submit form' ( event ) { event.preventDefault(); }
});
