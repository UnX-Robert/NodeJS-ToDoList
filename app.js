const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// tell app to use ejs as view engine
app.set('view engine', 'ejs');

// tell app to use bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

// tell app where to find the static files
app.use(express.static("public"));

// Connect to database
mongoose.connect("mongodb+srv://username:password@cluster0.ixg4u.mongodb.net/todolistDB?retryWrites=true&w=majority");

// Create items schema
const itemsSchema = {
  name: String,
};

// Create model
const Item = mongoose.model("Item", itemsSchema);

// Create mongoose documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get('/', function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      // Insert the default items
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully saved!");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", {
        listTitle: "Today",
        newListItem: foundItems,
      });
    }
  });
});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  // Default list
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  }
  // Custom list
  else {
    List.findOne({name: listName}, function(err, foundList) {
      // Add the new item to array
      foundList.items.push(newItem);
      // Save the list
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post('/delete', function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Deleted successfully");
      }
    });

    res.redirect("/");
  }
  else {
    List.findOneAndUpdate(
      {name: listName},
      // The $pull operator removes from an existing array all instances
      // of a value or values that match a specified condition.
      {$pull: {items: {_id: checkedItemId }}}, function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get('/:listName', function(req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: listName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + listName);
      }
      else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
      }
    }
  });
});

app.listen(process.env.PORT, function() {
  console.log("Server listening on port 3000");
});
