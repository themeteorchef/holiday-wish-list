Lists = new Meteor.Collection( 'lists' );

Lists.allow({
  insert: () => false,
  update: () => false,
  remove: () => false
});

Lists.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

let ListsSchema = new SimpleSchema({
  "name": {
    type: String,
    label: "Name of the wisher this list belongs to."
  },
  "sent": {
    type: Boolean,
    label: "Has this list been sent to Santa Clause yet?"
  }
});

Lists.attachSchema( ListsSchema );
