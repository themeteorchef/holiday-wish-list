<div class="note info">
  <h3>Pre-Written Code <i class="fa fa-info"></i></h3>
  <p><strong>Heads up</strong>: this recipe relies on some code that has been pre-written for you, <a href="https://github.com/themeteorchef/holiday-wish-list">available in the recipe's repository on GitHub</a>. During this recipe, our focus will only be on implementing the wish list's functionality. If you find yourself asking "we didn't cover that, did we?", make sure to check the source on GitHub.</p>
</div>

<div class="note">
  <h3>Additional Packages <i class="fa fa-warning"></i></h3>
  <p>This recipe relies on several other packages that come as part of <a href="http://themeteorchef.com/base">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed below are merely recipe-specific additions to the packages that are included by default in the kit. Make sure to reference the <a href="http://themeteorchef.com/base/packages-included">Packages Included list</a> for Base to ensure you have fulfilled all of the dependencies.</p>
</div>

### Prep
- **Time**: 2 hours
- **Difficulty**: Intermediate
- **Additional knowledge required**: writing routes with [Flow Router](https://themeteorchef.com/snippets/client-side-routing-with-flow-router/), working with [Blaze templates](http://docs.meteor.com/#/full/templates_api), using [Meteor methods](http://docs.meteor.com/#/full/meteor_methods), and using [the module pattern](https://themeteorchef.com/snippets/using-the-module-pattern-with-meteor/).

### What are we building?
After getting in touch with us to build him [a tracking system](https://themeteorchef.com/recipes/santa-spotter/) last year, Santa is back with a big new idea: digital wish lists. He receives _tons_ of wish lists every year and wants to get a hold on things. "I don't have time for paper," was a phrase he kept mentioning when asking us to work on this project. To help him out, we've suggested making use of Meteor again to get a quick, simple app out the door. He's sold.

Santa is pretty picky. He's asked that we build an application that's totally anonymous to protect wishers. He's also requested that wishers don't send him email directly—can you imagine?!—so we'll need a way to forward each list to an email address a wisher provides (e.g. a parent or guardian). One other nitpick item from Santa: wishers should only be able to send him one list. If he gets more than one copy of a list he swears he'll "put this kid on the naughty list!" Yikes.

Here's a quick demo of what we're after when all is said and done:

<figure>
  <img src="https://tmc-post-content.s3.amazonaws.com/dear-santa-demo.gif" alt="The final product we're after.">
  <figcaption>The final product we're after.</figcaption>
</figure>

Good news: we've received all of the CSS we need for this application from one of Santa's designers, so all we need to do is wire up our templates and calls to the database. In this recipe, we're going to look at how to do just that.

### Ingredients
Before we start building, make sure that you've installed the following packages and libraries in your application. We'll use these at different points in the recipe, so it's best to install these now so we have access to them later.

#### Meteor packages

<p class="block-header">Terminal</p>

```bash
meteor add email
```
We'll rely on Meteor's `email` package to help us send wish lists to the email address each wisher specifies.

#### Standalone libraries

<p class="block-header">Terminal</p>

```text
https://github.com/voidberg/html5sortable
```
To make our lists a little more flexible, we'll be relying on the [HTML5 Sortable](https://github.com/voidberg/html5sortable) library. Because this library doesn't exist as a Meteor package, we'll want to add it manually. Grab the [minified source](https://github.com/voidberg/html5sortable/blob/master/dist/html.sortable.min.js) and add it directly to your `client/lib/vendor` directory as `html5-sortable-jquery.min.js`. This will make sure that Meteor loads up the library before anything else on the client.

### Storing list data
Before we start to set up any wish lists, we'll need a way to store them. To get started, we're going to set up two collections: `Lists` and `ListItems`. `Lists` will be the "placeholder" for our wisher's list, while `ListItems` will store each of the items _on_ their list. This data structure will gives us plenty of room for expansion, ensuring that massive lists don't aren't difficult to render (e.g. like they would be if we just nested an array of items in a single list object).

#### Defining the `Lists` collection
First up, our `Lists` collection. We're going to create a new file within `/collections` in the root of our project called `lists.js`. Let's build out the whole file below and then step through it. This pattern will be pretty similar for our `ListItems` collection, so pay attention to make sure you understand how things are wired up.

<p class="block-header">/collections/lists.js</p>

```javascript
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
```

A few things happening here. First, we define our collection using a call to `Meteor.Collection()` and assigning the result to a global variable (making our collection accessible on both the client and the server as `Lists`). Next, we lock down our `allow` and `deny` rules to prevent any client-side database operations. This will ensure that any inserts, updates, or removes will need to happen on the server. We do this partially for security, but also because we want to prevent our wisher's from updating their lists after they've sent them (remember, Santa wants one and _only_ one list or it's Coal Town for lil' Johnny).

Next, the important part, we define a schema for our collection [using the aldeed:collection2 package](https://themeteorchef.com/snippets/using-the-collection2-package). Here, we set rules for what data being inserted into the database must look like. We've set up two rules: `name` and `sent`. Pay close attention to what they specify. First, just by virtue of their existence, they tell our `Lists` collection that any document being inserted must include the `name` and `sent` fields. If they're not included, the insert will be rejected.

In addition to the definitions themselves, notice that we set a `type` value for each: `String` for `name` and `Boolean` for `sent`. Going even further, this allows us to specify the type of data set on each field. Similar to the existence of these rules, setting the type guarantees that if these fields _do_ exist in an object being inserted, their data will match these types. If not? Rejected! 

<div class="note info">
  <h3>Why do schemas matter? <i class="fa fa-info"></i></h3>
  <p>While they're by no means mandatory, using a schema ensures that the data being added to our database remains consistent. This is important for security—so users don't modify our code and insert junk data—but also for security purposes. Using schemas, we take full control of the shape of our data, preventing any junk from hitting our database.</p>
</div>

#### Defining the `ListItems` collection
We'll apply the same pattern to our `ListItems` collection next. Again, inside of our `/collections` directory, let's add a file called `list-items.js`. Here's the code we'll need:

<p class="block-header">/collections/list-items.js</p>

```javascript
ListItems = new Meteor.Collection( 'list-items' );

ListItems.allow({
  insert: () => false,
  update: () => false,
  remove: () => false
});

ListItems.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

let ListItemsSchema = new SimpleSchema({
  "listId": {
    type: String,
    label: "The ID of the wish list this item belongs to."
  },
  "order": {
    type: String,
    label: "The order this item belongs in the list."
  },
  "name": {
    type: String,
    label: "The name of this item."
  },
  "url": {
    type: String,
    label: "The optional URL of this item.",
    optional: true
  }
});

ListItems.attachSchema( ListItemsSchema );
```

Same thing! The only difference here is that we've changed the collection name around and added some different fields to our schema. The idea here is exactly the same, so just make sure to review the rules in our schema. Keep in mind: schemas are applied on a _per-collection_ basis. This means that each collection will have different rules with different requirements. Make sure to pay attention!

Okay, with our collections in place, we can start to set up our lists.

### Creating new lists
Because Santa wants to keep things fairly anonymous on the wisher side of things, we don't need to include an accounts system. Instead, what we're going to do is leverage `localStorage`, keeping a record of the current user's list _in the browser_. We'll still insert a list in the databse for the user, but access to that list will be handled automatically when they load up the application. 

If a wisher visits `http://localhost:3000` and they already have a list, we want to redirect them to that list. This is a two birds with one stone solution: we're preventing double sends by preventing the creation of multiple lists and removing the need for user accounts by automatically detecting the wisher's list. Sweet! Let's get started by updating our `/client/modules/startup.js` file to check if a list already exists (don't worry, we'll see how to set this in a bit).

<p class="block-header">/client/modules/startup.js</p>

```javascript
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
```

Here, we see the definition of a new [module](https://themeteorchef.com/snippets/using-the-module-pattern-with-meteor). We won't cover it directly, but this is being called from within our `/client/startup.js` file inside of a `Meteor.startup()` call. This means that when the client side of our application "starts up," this code will be fired (this happens after all of our application files have loaded). Here, we make a call to a single method being defined in this file `_handleExistingList()`. 

The functionality is pretty simple. When Meteor starts up, we want to check if an item exists in our wisher's local browser storage at `themeteorchef_dear_santa_list_id`. If it _does_ exist, we want to take the value of that item—this will be the `_id` value of a list that we insert next—and embed it in a redirect to `http://localhost:3000/lists/:_id`. If we find a list for the user, they'll be immediately redirected to that list when they visit the app. Awesome! As we'll see soon, this will prevent them from creating a new list after one already exists. The best part? We don't need a user account to accomplish this!

With this in place, now, we can insert our lists, also creating `themeteorchef_dear_santa_list_id` in the local browser storage. To begin, let's get a template in place for creating a list and then get it wired up.

#### Creating a template for creating lists

<p class="block-header">/client/templates/public/welcome.html</p>

```markup
<template name="welcome">
  <div class="santa-pod santa-welcome">
    <div class="sp-content">
      <div class="santa"></div>
      <h3>Dear Santa...</h3>
      <p>Send a holiday wish list to Santa Claus! To get started, enter your name in the box below and click "Start My List!"</p>
      <form id="create-list">
        <label hidden for="listName">Your Name</label>
        <input type="text" class="form-control text-center" name="listName" placeholder="Type Your Name Here">
        <input type="submit" class="btn btn-success btn-block" value="Start My List!">
        <p class="alert alert-info text-left"><strong>For parents/guardians:</strong> this application does not collect any sensitive or personal information from your wisher. They have the option to enter your email address to send their list along to Santa, but <strong>we <em>do not</em> record your email address</strong>. Items added to lists are stored anonymously.</p>
      </form>
      <div class="stocking"></div>
      <div class="tree"></div>
      <div class="presented-by">
        <span>A gift from</span>
        <a href="https://themeteorchef.com"><img src="/images/tmc-logo.png" alt="The Meteor Chef"></a>
      </div>
    </div>
  </div>
</template>
```
Woah! Don't worry. Remember that Santa's designers already sent over some CSS for us, so we need to make sure our markup matches their style definitions. The bulk of what we see here is just ornament. The part we _really_ want to pay attention to is the `<form id="create-list">` element. This is what we're going to use to perform the insert of a new list. Just one field is all we need `listName`. Here, we're prompting our soon-to-be wisher for their name (e.g. "Jane Smith"). Per Santa's requirements, we want to keep this anonymous, so we don't want to track any other information.

<p class="block-header">/client/templates/public/welcome.js</p>

```javascript
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
```

To wire up our form, we're going to be relying on a module called `createList`. Before we look at it, though, it's important to point out how we're calling it. From within our `welcome.js` file, we add a call to `Modules.client.createList()` from within our `welcome` template's `onRendered` callback. We do this here because as we'll see, our module will include a call to validate our `listName` field and we want to make sure that validation is attached as soon as our template is loaded up. Let's hop over to the module now and talk through it.

#### Defining the `createList` module

<p class="block-header">/client/modules/create-list.js</p>

```javascript
let template;

let create = ( options ) => {
  template = options.template;
  _validate( options.form );
};

let _validate = ( form ) => {
  $( form ).validate( validation() );
};

let validation = () => {
  return {
    rules: {
      listName: {
        required: true
      }
    },
    messages: {
      listName: {
        required: "Whoops! Need your name here, please."
      }
    },
    submitHandler() { _handleCreate(); }
  };
};

let _handleCreate = () => {
  let listName = template.find( '[name="listName"]' ).value;

  Meteor.call( 'createWishList', listName, ( error, listId ) => {
    if ( error ) {
      Bert.alert( error.reason, 'warning' );
    } else {
      localStorage.setItem( 'themeteorchef_dear_santa_list_id', listId );
      FlowRouter.go( `/lists/${listId}` );
      Bert.alert( 'Awesome! Your list is all ready for some wishes.', 'success' );
    }
  });
};

Modules.client.createList = create;
```

A lot going on here, so let's reason through it. First, using the module pattern, notice that we're returning the `create` method at the top of our file. This means that when we call `Modules.client.createList` we're technically calling this `create` method. Why the crazy name, then? Good question! This allows us to store our function behind a unique namespace. We can't be certain that another method like `create` (a fairly generic name) will never exist, so this guards against any accidental overwriting later. Making sense?

At the top of our file, notice that we're creating a "placeholder" variable called `template`. The goal of this is to "hoist" the `template` variable to the top of this module's scope so that all of the other method's can get access to it. This allows us to skip passing `options.template` into each method as an argument. To set it, notice that within our `create` method we're saying `template = options.template`. 

Remember, back in our `welcome` template's `onRedered` method, we invoked this passing `Template.instance()`, or, the current instance (copy) of our `welcome` template. Think about that for a second. This means that we can access our `welcome` template from within our module without resorting to the usage of something like jQuery. Every little bit counts!

After this is set, we get to work. First, we validate our form by making a call to `_validate()` which is just a wrapper around a call to the [jquery-validation]() library. This may seem pointless, but it's not. What we're accomplishing with this is the creation of single-purpose functions. That means that—to the best of our abilities—we want to ensure that each function in our module is responsible for one thing and one thing only. In this case, the `_validate()` method is only responsible for attaching a call to jQuery validation.

Inside of this call, notice that we're making a call to `validation()`, another method which returns our validation rules. Uhh, this is a bit strange. It is! The point here is to separate out all of the rules and properties for our validation into their own space. You _do not_ have to do this; it's strictly done for clarity here. If we had a bunch of different validations, this would really come in handy. Here, it's up to you.

Notice that here, we have a method called `submitHandle()` calling _another_ method `_handleCreate()`. This like passing the boton in a 100 meter dash. Here, we're simply saying "when the form is valid, call the `_handleCreate()` method." Making sense? Down in that `_handleCreate()` method, we want to pay close attention to what's taking place. First, we rely on our hoisted `template` variable from earlier to grab the value of our `listName` field. Next, we make a call to a method we'll define in the next step called `createWishList`, passing the value of `listName` as the argument.

The important part in all of this is the success callback of this call to `createWishList`. Notice that we have the line `localStorage.setItem( 'themeteorchef_dear_santa_list_id', listId );`. Can you guess what this is doing? Expecting that the new list's `_id` will be returned as the `listId` argument to our method call, we take this value and _set_ it on our `localStorage` using the `localStorage.setItem()` method. Notice that we're using the exact same name for this item as we did in our startup module a little bit ago. Here, once a list exists, we set it on the wisher's browser, preventing them from creating another one later, but also automating their access to the list they jut created.

Using a similar technique to our starutp method, we also make a call to `FlowRouter.go( '/lists/${listId}' );`, redirecting the user to their list once it's created. Sweet! With this in place, we can hop up to the server to define that `createWishList` method. It's a simple one, so this will go quick.

#### Inserting lists into the database
<p class="block-header">/both/methods/insert/lists.js</p>

```javascript
Meteor.methods({
  createWishList( listName ) {
    check( listName, String );

    try {
      let listId = Lists.insert( { name: listName, sent: false } );
      return listId;
    } catch( exception ) {
      return exception;
    }
  }
});
```
Told you so! Very straightforward. First, we take in our `listName` argument passed over from the client and [using the check package](), validate that it's a `String`. If it is, inside of a `try/catch` we attempt to perform an insert into our `Lists` collection. Notice that we're defining an object with two properties being set `name` (equal to the `listName` value from the client) and `sent` equal to `false`. That second property, `sent`, is being set manually here to comply with the schema rules we set up earlier. Having this here, we ensure that our insert doesn't get blocked.

Notice that when we perform the insert, we do it without a callback and assign the insert to a variable `listId`. Huh? This is a fun trick. Without a callback, Meteor will just return either the error or `_id` of the new list, so we just return it from our method directly. Of course, we're taking a leap of faith here and assuming that the insert will function without error. To foolproof this, we'd want to update our success callback for this method on the client to check `listId` for an `error` property. We're not too concerned, now, though, so we'll leave it off.

With this in place, we're creating lists! Because we're redirecting to our list already, we can head over that way now. This is where we'll display our wisher's list along with a form for adding new items _to_ that list.

### Setting up our list template
The bulk of our work will take place around our `list` template that we'll set up now. The template itself is made up of a number of child templates. To keep things simple, we'll be adding each child template as we move forward. Let's take a peek at the basic version and then work up from there.

<p class="block-header">/client/templates/public/list.html</p>

```markup
<template name="list">
  <div class="santa-pod santa-list">
    <div class="sp-content">
      <div class="santa"></div>
      
      <h3>Dear Santa,</h3>
      <p>For the holidays, I would really like it if you could send me...</p>

      {{#if Template.subscriptionsReady}}
        {{#if hasItems}}
          <ul class="list-group sortable">
            {{#each items}}
              {{> listItem}}
            {{/each}}
          </ul>
          <p class="text-muted hint"><i class="fa fa-lightbulb-o"></i> <strong>Wish tip</strong>: drag and drop items in your list to make sure Santa Claus knows which items are most important!</p>
        {{else}}
          <p class="alert alert-warning">No items yet! Add some using the boxes below so Santa Claus knows what you want :)</p>
        {{/if}}
      {{else}}
        <p>Loading your list...</p>
      {{/if}}

      <div class="presented-by">
        <span>A gift from</span>
        <a href="https://themeteorchef.com"><img src="/images/tmc-logo.png" alt="The Meteor Chef"></a>
      </div>
    </div>
  </div>
</template>
```

Don't panic! This may seem like a lot but the bulk of it is just logic that will help us to offer up a better user experience. The part we want to pay attention to right now is the block wrapped by `{{#if Template.subscriptionsReady}}`. What we want to do is get our list _output_ squared away first. With this in place, then, we'll immediately be able to see list items getting added to the app. Cool?

Okay. So this `Template.subscriptionsReady` business. What's that? This is a helper that we get from Meteor which returns `true` if all of the subscriptions for our template have fired their `ready()` callbacks. This means that all of our subscriptions have successfully connected to our publications on the server. To make this work, though, we need to actually have subscriptions to be _ready_. We only need one, so let's wire it up quick.

<p class="block-header">/client/templates/public/list.js</p>

```javascript
Template.list.onCreated( () => {
  let template = Template.instance();
  template.subscribe( 'list', FlowRouter.current().params._id );
});
```

Easy peasy! Inside of our `list` template's `onCreated` method, we simply create a call to `template.subscribe` (short-handing this by storing `Template.instance()` in a variable), passing `list` as the name of the publication we'll subscribe to. The interesting part here is what we're passing in the second argument `FlowRouter.current().params._id`. Rember that when we create a new list, we're redirecting our user to `/lists/:_id`. Here, we're grabbing whatever value is currently set in the `:_id` part. Why are we passing this to our subscription? 

This will make it possible to only subscribe to the list—and list items—matching that `_id`. This is both a performance and security technique. Performance, because it will prevent us from sending every list in the database down the wire, and security, because it will prevent us from wisher's seeing other wisher's lists. Real quick, let's take a peek at the publication so we know what we're getting.

<p class="block-header">/server/publications/lists.js</p>

```javascript
Meteor.publish( 'list', function( listId ) {
  check( listId, String );

  return [
    Lists.find( { _id: listId } ),
    ListItems.find( { listId: listId } )
  ];
});
```

It's almost a little _too_ simple, eh? Here, we take in our `listId` argument from the client—remember, we're pulling this from the router—and using `check()` to verify that it's a string. Next, we rely on Meteor's ability to return an array of cursors from a publication, grabbing two things: all of the `Lists` with an `_id` value matching the passed `listId`, and all of the `ListItems` with a `listId` value matching the passed `listId`. Together, these two lines ensure that we'll only ever get back data for the current user's list and no one else. Great!

With this in place, we should hop back to our `list` template and wire everything up for displaying items. Again, we want to make sure that everything is in place so that when we add our template for adding new items, they just show up. Let's wire up the two helpers inside of our `Template.subscriptionsReady` block next: `hasItems` and `items`.

<p class="block-header">/client/templates/public/list.js</p>

```javascript
[...]

Template.list.helpers({
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
```
Simple, but important. Our first helper, `hasItems`, is the one wrapping our `{{#each items}}` block and controls the display of our items. If this returns `false`, we want to display a message to our user instructing them to add some new items. Here, we keep it super simple. Inside, we make a call to `ListItems.find( {} ).count()` which let's us know how many items are in the _client-side_ (minimongo) `ListItems` collection. We test to see if this number is greater than zero `> 0`. By returning this directly, we get either a  `true` or `false` response, toggling our template accordingly.

The big stuff is down below in the `items` helper. Albeit simple, this helper is responsible for actually _displaying_ the items in our list. Here, we make a call to `ListItems.find( {} )` (again, this is the client-side data store we're looking at so no need to pass the `listId`), sorting the list by the `order` field on each item. This is pretty insignificant now, but later, we'll enable drag-and-drop support to our list which will allow our wisher to reorder the items in their list. We'll be tracking that order using the `order` field, so it's good to account for that now with this sort.

From here, if we have items: we display them. Back in our template we're just spitting this data out using an `{{#each items}}` block. Inside of that block, we make a call to `{{> listItem}}`. That template is pretty much what you'd expect, but let's take a peek so it's clear.

<p class="block-header">/client/templates/public/list-item.html</p>

```markup
<template name="listItem">
  <li data-id="{{_id}}" class="list-group-item {{#if url}}has-link{{/if}}">
    {{#if url}}
      <p>
        <a href="{{url}}" target="_blank">{{order}}. {{name}}</a>
      </p>
    {{else}}
      <p>{{order}}. {{name}}</p>
    {{/if}}
    <i class="fa fa-remove"></i>
  </li>
</template>
```

See! Easy. A few things to point out. First, notice that we're setting a `data-id` attribute on each of the list item's we're outputting. Why? Well, when we dig into the drag-and-drop stuff later, this will make it easy to handle reset the order of items in the list. Just note it's existence for now, we'll review how it works later. Another thing to note is that we technically have two styles of list items: with and without a link. 

Because adding a link is optional (a wisher can add a plain item), we account for this here. If an item has a link, we wrap it's name in an `<a></a>` tag pointing to the passed URL. If not, we just return the `{{name}}` value. Notice that both styles have `{{order}}.` included. This will display the current order of the item in the list as it's stored in the database. 

At this point, we have everything we need to see items in our list. Next, let's wire up the ability to add a new list item to complete the circle.

### Adding items to lists
Phew! We're at about the halfway point, but we've already covered a lot. Aside from creating lists, we haven't really done much in respect to interaction. This is okay! What we _have_ accomplished is making it so that when we _do_ wire up the interaction—this is our task in this section—we don't have to worry about data output. It's already done!

To get things cracking, let's update our `list` template real quick to include our `addList` template and then see how the latter is built out.

<p class="block-header">/client/templates/public/list.html</p>

```markup
<template name="list">
  <div class="santa-pod santa-list">
    <div class="sp-content">
      [...]

      {{#if Template.subscriptionsReady}}
        [...]
      {{else}}
        <p>Loading your list...</p>
      {{/if}}

      {{> addListItem}}
      
      [...]
    </div>
  </div>
</template>
```

See it? Just beneath our `Template.subscriptionsReady` block. Now that it's in place, let's see what it looks like.

<p class="block-header">/client/templates/public/add-list-item.html</p>

```markup
<template name="addListItem">
  <form id="add-item" class="add-list-item">
    <h4>Add an item</h4>
    <div class="form-group">
      <label for="itemName">Item Name (required)</label>
      <input type="text" class="form-control" name="itemName" placeholder="Minecraft Lego Set">
    </div>
    <label for="itemUrl">Item URL</label>
    <input type="text" class="form-control" name="itemUrl" placeholder="https://amazon.com...">
    <p class="text-muted input-helper-text">Santa likes to shop online, too, you know!</p>
    <input type="submit" class="btn btn-success btn-block" value="Add This to My List!">
  </form>
</template>
```

Phew! Nothing too wild. Just two inputs and a button. Because this is mostly for kids—wishers are pretty young—we want to keep this plum simple, so we only ask two questions with the latter being optional: "what's an item that you'd like on your list?" and "what's a url for that item?" That's it. This keeps it simple for the kids, Santa, and ultimately ourselves. To prove that point, let's look at the logic backing this template.

<p class="block-header">/client/templates/public/add-list-item.js</p>

```javascript
Template.addListItem.onRendered( () => {
  Modules.client.addItem({
    template: Template.instance(),
    form: '#add-item'
  });
});

Template.addListItem.events({
  'submit form' ( event, template ) { event.preventDefault(); }
});
```
Clever! Yet again, we rely on our dear friend the module to simplify this down. As you can see, we're going to create a new module `addItem` which will work fairly similar to our `addList` module we defined earlier. Let's hop over there now and take a look.

<p class="block-header">/client/modules/add-list-item.js</p>

```javascript
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
    }
  });
};

Modules.client.addItem = add;
```

Looking familiar? Everything here—up to the `_handleAdd()` method—is identical to our `addList` module. We're applying the exact same validation pattern here, calling a final method when our form's validation is given the greenlight. To keep us moving along, let's narrow our focus down to that `_handleAdd()` method as that's where the real action happens. If this module thing is making your head spin, don't be afraid to take a break and [read this snippet on it](https://themeteorchef.com/snippets/using-the-module-pattern-with-meteor/) to get a better understanding.

Inside of our `_handleAdd()` method we see a lot of familiar things going on. First, we setup a new object `item` to pass over to the server. Inside, we grab the current `listId` from the router again, along with the value of the fields from our `addListItem` template: `itemName` and `itemUrl`. With these in tow, we make a call to `addItemToList`, passing our `item` object up to the server. Before we go there, make note of our success callback. If our item is successfully added, we clear out the form and display an alert message to our wisher. This doubly confirms that their item was added. Triple if you accont for the item popping up in the list above. Sweet!

As you might have guessed, adding items on the server is very similar to what we did for adding lists. Let's take a peek now.

<p class="block-header">/both/methods/insert/list-items.js</p>

```javascript
Meteor.methods({
  addItemToList( listItem ) {
    check( listItem, {
      listId: String,
      name: String,
      url: Match.Optional( String )
    });

    let existingItems = ListItems.find( { listId: listItem.listId } ).count();

    listItem.order = existingItems + 1;

    try {
      var itemId = ListItems.insert( listItem );
      return itemId;
    } catch( exception ) {
      return exception;
    }
  }
});
```
Yep! Pretty much the same, save for a few things. First, we get our `check()` work out of the way, confirming that the object we're receiving has the fields and types we expect. Notice that here, we're using the `Match.Optional()` method to suggest that the `url` field may or may not be set. If it is, we want to validate it as a `String` type.

Next up is something to pay attention to. Here, we quickly grab the count of the existing list items on the current list. Once we have it, we promptly make use of it on the next line, setting a new field on our `listItem` object passed from the client: `order`. Notice that we set the value of this equal to `existingItems` (the count of items on this list already) plus one. Huh?

Because we'll be using drag-and-drop in a bit, we want to prevent messing up any existing ordering. To do that, we simply say that all new items should be appended to the bottom of the list. This means that item will need to receive an order value placing it in the last spot. In this case, that means the current length of the list _plus one more item_. Pretty freaking clever, eh? We are _so_ badass.

Once we have this set, we just toss our `listItem` object straight into our call to `ListItems.insert()`. If all goes as planned, our list item will be inserted into the database! [Gnarly](https://youtu.be/hJdF8DJ70Dc?t=5s). Okay, so, we have items on our list, so it's time to dig into the trickiest part—though not too difficult—part of the recipe: sorting items with drag-and-drop.

### Sorting lists with drag-and-drop
To kick off our drag-and-drop journey, the first thing we'll want to do is set up our starting point. Because our draggble list will existing within our `list` template, let's update that template's logic now. We'll be using a module for this, so all we need to do is add a call to that module in the `list` template's `onRendered` callback.

<p class="block-header">/client/templates/public/list.js</p>

```javascript
[...]

Template.list.onRendered( () => {
  Modules.client.dragDrop.init({
    sortableElement: '.sortable',
    sortableItems: '.sortable li'
  });
});

[...]
```

Making sense? Pay close attention. Instead of calling our `dragDrop` module directly, here, we're actually making a call to a method that we'll expose called `init`. Don't worry about the details now, but the gist of this idea is that we'll have another method we'll need to expose later, so we account for this now. For arguments, we pass to things `sortableElement`, referring to the class name of the sortable _list_ element, and `sortableItems`, referring to the items in our list that can be sorted. Again, patience, this will all make sense soon. Let's hop over to our module definition and see how it's coming together.

<p class="block-header">/client/modules/drag-drop.js</p>

```javascript
let dragDrop = ( options ) => {
  _initDragDrop( options.sortableElement, options.sortableItems );
};

let _initDragDrop = ( element, items ) => {
  if ( _getItems() ) {
    setTimeout( () => {
      _setDragDrop( element );
      _setChangeEvent( element, items );
    }, 300 );
  }
};

let _getItems = () => {
  let items = ListItems.find().fetch();
  if ( items ) {
    return items;
  }
};

let _setDragDrop = ( element ) => {
  $( element ).sortable( 'destroy' );
  $( element ).sortable( { forcePlaceholderSize: true } );
};

let _setChangeEvent = ( element, items ) => {
  $( element ).sortable().off( 'sortupdate' );

  $( element ).sortable().on( 'sortupdate', function() {
    updateListItemOrder( items );
  });
};

let updateListItemOrder = ( items ) => {
  $( items ).each( ( index, element ) => {
    let item = { _id: $( element ).data( 'id' ), order: index + 1 };

    Meteor.call( 'updateListItemOrder', item, ( error ) => {
      if ( error ) {
        Bert.alert( error.reason, 'warning' );
      }
    });
  });
};

Modules.client.dragDrop = {
  init: dragDrop,
  setIndexes: updateListItemOrder
};
```

What in the _blue blazes_? Deep breaths. This looks like a lot, but it's pretty straightforward. The first thing to call out is at the very bottom. Notice that instead of turning a single method here, we're setting our module namespace equal to an _object_. What this achieves is what we just saw back in our `list` template's logic. By returning an object, we can expose multiple methods within this file. As we can see here, we're trying to expose our `dragDrop` method and our `updateListItemOrder` method separately.

It may seem a bit foreign, but if we call `Modules.client.dragDrop.setIndexes()`, we're technically calling `Modules.client.dragDrop.updateListItemOrder()`. The name changes here are just to keep our methods a bit shorter. Pay attention to the mapping here and how our arguments are passing through. See it? This is _really_, really useful when a module contains more than one method that you can benefit from using publicly.

Inside of our module we have a few things going on. We're trying to solve three problems in here:

1. Initializing drag and drop on our list _after_ our data has loaded on the client.
2. Initializing an _event handler_ on our list to identify when a wisher has updated the order of their list (i.e. they've dragged and dropped an item elsewhere).
3. Updating the index of the items in the list within the database (i.e. setting the `order` property of each item in our list). 

To solve the first problem, take a peek at our `_initDragDrop()` method. Inside, it looks a bit funky. First, we call an `if` statement that's evaulating based on the result of a call to `_getItems()`. The goal here is to  determine whether or not the current list has any items. Remember, our publication is ensuring that we only have access to the current user's list's items, so we can just call `ListItems.find()` directly. If we _do_ have items, we return them as an array.

Back in our `_initDragDrop()` method, if we have items, we create a `setTimeout()` block set to `300ms`, firing two methods inside: `_setDragDrop()` taking the `sortableElement` property we passed in earlier as an argument, and `setChangeEvent()`, taking in both the `sortableElement` and `sortableItems` arguments we passed in earlier.

Looking at the `_setDragDrop()` method, we see two things happening. First, we destroy any existing instance of `sortable()` on the passed element (our sortable list) and then we re-init sortable on that element. Why? This prevents us from accidentally binding sortable to our list an infinite number of times. Remember, this is technically being called within our template's `onRender` method so we want to prevent any re-rendering from over-binding sortable instances. An edge case, but a potential performance hole. This protects us.

Inside of `_setChangeEvent()` we do just that! Here, we take the same approach as the `_setDragDrop()` method, unbinding any existing `sortupdate` events from our list and then reapply it. This may be a bit confusing. What we're doing here is registering an event to watch for _later_. More specifically, the `sortupdate` event will fire whenever our user makes a change to the order of their list. When they do, we want to update the order of the items in that list in the database (read: updating each item's `order` property in the database).

To do _that_, we have one last method being defined: `updateListItemOrder`. This is the coolest method here. What we're doing inside is take the `items` argument—remember, this is equal to our `.sortable li` selector—and iterating over each of the matching items using jQuery's [each](http://api.jquery.com/jquery.each/) method. For each item found, we create an object called `item` containing two properties: `_id` and `order`. Remember earlier when we set `data-id` on each of our `<li></li>` elements in the `{{> listItem}}` template? This is where we make use of it.

Using this, we can grab the `_id` of the element we need to update. In the `order` field, we simply take the `index` value from the `.each()` loop and add one to it. Why one? Because technically the index starts at `0`. To avoid confusion, adding `1` means that items in our list will always start at `1` and increment from there. Cool! Notice that once our object is built, we make a call to a new method `updateListItemOrder`, passing our `item` object.

I bet you can guess what's happening in that method, but let's take a look real quick to close this loop.

<p class="block-header">/both/methods/update/list-items.js</p>

```javascript
Meteor.methods({
  updateListItemOrder( item ) {
    check( item, { _id: String, order: Number } );

    try {
      ListItems.update( item._id, { $set: { 'order': item.order } } );
    } catch( exception ) {
      return exception;
    }
  }
});
```

Yes! Exactly what we thought. We simply take the `item` object we're passing from the client, `check()` it, and update the corresponding list item in the database (using the `item._id` property to select the correct item in the database). Do you see what's happening here? Whenever we drag an item to a new location in our list, once it's dropped, we immediately grab the position of each element in the list and set _that_ as the `order` value on the item in the database. _So freaking cool_. This ensures that no matter where we drag out items, we'll correctly preserve their order state. If we drag an item somewhere in our list now and then refresh the page, that order will stick!

<img style="width: 100%; max-width: 350px;" src="https://tmc-post-content.s3.amazonaws.com/shiamagic.gif">

At this point we're turning some elf heads! Santa just saw the demo and let out a "ho, ho, ho!" We're almost done, just two more tasks: making it possible to remove items from our list and emailing our list to a parent or gaurdian.

### Removing items from lists
Remember that back in our `{{> listItem}}` template, we've added a remove icon to each of our list items `<i class="fa fa-remove"></i>`. What we want to do now is handle a click event on that item, removing that item from the database. Technically we could do this from a logic file specific to the `listItem` template, but for now, we're just going to add an event handler to our `list` template's logic to keep everything consolidated.

<p class="block-header">/client/templates/public/list.js</p>

```javascript
Template.list.events({
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
```

No modules here as this is pretty much a "one and done" situation. When our `.fa-remove` icon is clicked, we display a confirmation dialog, letting the wisher know that this will make their list item go poof. If they answer in the positive, we make a call to `deleteListItem` on the server, passing the value of `this._id`. What is `this`? Inside of an event handler in Meteor, when we reference `this`, we're referring to the data context of the _current template_. 

Because we're inside of an `{{#each}}` loop, `this` is referring to the list item parenting the `.fa-remove` item we've clicked. This means that we can get access to that item's properties simply by calling this. Because we want to remove this specific item from the database, we grab its ID and pass it to the server. Neat!

One thing to call out before we take a peek at the server. Down in the `else` statement in our method call's callback...spot it? Ahh! Our second `dragDrop` method we exposed: `setIndexes`. Do you see why we're calling this here? In addition to when we change list order via dragging, when we _remove_ an item from the list, we're technically changing the order as well. By calling the `dragDrop.setIndexes()` method here, we're saying "after this item has been removed, reset all of the indexes to account for the missing item." 

Don't put on your party pants just yet. Let's hop up to the server to see the removal real quick.

<p class="block-header">/path</p>

```javascript
Meteor.methods({
  deleteListItem( itemId ) {
    check( itemId, String );

    try {
      ListItems.remove( itemId);
    } catch( exception ) {
      return exception;
    }
  }
});
```
_Sad trombone_. No, not really, but this is pretty underwhelming (a good thing). All we do here is take the ID of the list item we passed over from the client and `check()` it's type. From there, it's down the chute when we call the `ListItems.remove()` method. Poof! How easy was that? 

### Emailing lists
Okay, this is it! The grand finale. We have _one last step_ to complete and we can consider this ready for all of Santa's wishers. To get this working, we're going to need to make some edits to our `list` template. Instead of sending wishers to another view when they want to send an email, we're going to do everything inline. Why? This will make it easy for us to further enforce the "no double send" rule Santa requires. Using a bit of template logic, we'll "lock" the interface so that once a user sends their list, there's no turning back (it's not a as evil as it sounds).

To get things underway, we need to start by updating our list template to toggle the visibility of the list and add item form when we click a "Send to North Pole" button. We don't have that button yet, so let's update our template now. We're going to add three things: the button, a wrapper around our content to show/hide our content, and a new template for sending the list.

<p class="block-header">/client/templates/public/list.html</p>

```markup
<template name="list">
  <div class="santa-pod santa-list">
    <div class="sp-content">
      <div class="santa"></div>
      
      {{#unless sending}}
        {{#if hasItems}}
          <div class="send-bar">
            <a href="#" class="btn btn-success btn-small send-to-santa"><i class="fa fa-envelope"></i> Send to North Pole</a>
          </div>
        {{/if}}
        
        <h3>Dear Santa,</h3>
        <p>For the holidays, I would really like it if you could send me...</p>

        {{#if Template.subscriptionsReady}}
          {{#if hasItems}}
            <ul class="list-group sortable">
              {{#each items}}
                {{> listItem}}
              {{/each}}
            </ul>
            <p class="text-muted hint"><i class="fa fa-lightbulb-o"></i> <strong>Wish tip</strong>: drag and drop items in your list to make sure Santa Claus knows which items are most important!</p>
          {{else}}
            <p class="alert alert-warning">No items yet! Add some using the boxes below so Santa Claus knows what you want :)</p>
          {{/if}}
        {{else}}
          <p>Loading your list...</p>
        {{/if}}
        {{> addListItem}}
      {{else}}
        {{> sendList}}
      {{/unless}}

      <div class="presented-by">
        <span>A gift from</span>
        <a href="https://themeteorchef.com"><img src="/images/tmc-logo.png" alt="The Meteor Chef"></a>
      </div>
    </div>
  </div>
</template>
```

See what's changing here? First, all of our existing content has been nested within a new block `{{#unless sending}}`. What does this do? This is saying "unless the `sending` helper is returning `true`, show our list and add list item form." If the `sending` helper _is_ returning `true`, however, we want to  show our new `{{> sendList}}` template. To get access to that view, though, we need a way to toggle the state of that `sending` helper. How do we do it?

Notice that we've also added something just inside the `{{#unless sending}}` block. See that `{{#if hasItems}}` block? This is wrapping a button that will display when the list has one or more items. This is the button we'll use to toggle between our list and add list item form and our soon-to-be `{{> sendList}}` template. Before we set up that template, let's add some logic to our `list` template to help us handle the toggling between states.

<p class="block-header">/client/templates/public/list.js</p>

```javascript
Template.list.onCreated( () => {
  let template = Template.instance();
  template.subscribe( 'list', FlowRouter.current().params._id );
  template.sending = new ReactiveVar( false );
});

[...]

Template.list.helpers({
  sending() {
    return Template.instance().sending.get();
  },
  hasItems() {
    return ListItems.find( {} ).count() > 0;
  },
  [...]
});

Template.list.events({
  'click .send-to-santa' ( event, template ) {
    template.sending.set( true );
  },
  [...]
});
```

Just a few changes here. First, our toggling functionality will be relying on a reactive variable via the [reactive-var](https://atmospherejs.com/meteor/reactive-var) package.