var app = require('express')();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var async = require('async');

app.use(bodyParser.json());

module.exports = app;

var inventoryDB = new  Datastore({ filename: './server/databases/inventory.db', autoload: true});

app.get('/products', function(req, res) {
    inventoryDB.find({}, function(err, docs){
        console.log('sending inventory products');
        res.send(docs);
    });
});

app.post('/products', function(req, res) {
    var newProduct = req.body;

    inventoryDB.insert(newProduct, function(err, product) {
        if (err) res.status(500).send(err);
        else res.send(product);
    });
});
;
app.delete('/product/:productid', function(req, res) {
    inventoryDB.remove({_id: req.params.productId}, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    })
});

app.put('/product', function(req,res) {
    var productId = req.body._id;

    inventoryDB.update({_id: productId}, req.body, {}, function(err, numReplaced, product) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

app.decrementInventory = function(products) {
    async.eachSeries(products, function(transcationProduct, callback) {
        inventoryDB.findOne({_id: transcationProduct._id}, function(err, product) {
            if (!product || !product.quantity_on_hand) {
                callback();
            } else {
                var updatedQuantity = parseInt(product.quantity_on_hand) - parseInt(transcationProduct.quantity);
                inventoryDB.update({_id: product._id}, {$set: {quantity_on_hand: updatedQuantity}}, {}, callback);
            }
        });
    });
};