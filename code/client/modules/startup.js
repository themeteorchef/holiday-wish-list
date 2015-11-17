let startup = () => {
  _handleExistingList();
};

let _handleExistingList = () => {
  let list = localStorage.getItem( 'themeteorchef_dear_santa_list_id' );
  if ( list ) {
    FlowRouter.go( `/lists/${list}` );
  }
};

Modules.client.startup = startup;
