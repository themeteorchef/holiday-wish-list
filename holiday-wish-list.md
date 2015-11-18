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

This will make it possible to only subscribe to the list—and list items—matching that `_id`. This is both a perfomrnace and security technique. Performance, because it will prevent us from sending every list in the database down the wire, and security, because it will prevent us from wisher's seeing other wisher's lists. Real quick, let's take a peek at the publication so we know what we're getting.

<p class="block-header">/server/</p>

```javascript
Meteor.publish( 'list', function( listId ) {
  check( listId, String );

  return [
    Lists.find( { _id: listId } ),
    ListItems.find( { listId: listId } )
  ];
});
```

#### Adding a publication to our template

### Adding items to lists
### Sorting lists with drag and drop
### Removing items from lists
### Emailing lists