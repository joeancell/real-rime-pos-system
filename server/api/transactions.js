var app = require('express')();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var Inventory = require('./inventory');

app.use(bodyParser.json());

module.exports = app;

var Transaction = new Datastore({filename: './server/databases/transaction.db', autoload: true});

app.get('/', function(req, res) {
    res.send('Transaction API');
});

app.get('/all', function(req, res) {
    Transaction.find({}, function(err, docs) {
        res.send(docs);
    });
});

app.get('/limit', function(req, res) {
    var limit = parseInt(req.query.limit, 10);
    if (!limit) limit = 5;

    Transaction.find({}).limit(limit).sort({data: -1}).exec(function (err, docs) {
        res.send(docs);
    })
});

app.get('/day-total', function (req, res) {
    if (req.query.date) {
        startDate = new Date(req.query.date);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(req.query, date);
        endDate.setHours(23, 59, 59, 999);
    } else {
        var startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        var endDate = new Date();
        endDate.setHours(23, 59, 59, 999);        
    }

    Transaction.find({date: {$gte: startDate.toJSON(), $lte: endDate.toJSON()}}, function(err, docs) {
        var result = {
            date: startDate
        };

        if (docs) {
            var total = docs.reduce(function (p, c) {
                return p + c.total;
            }, 0.00);
            result.total = parseFloat(parseFloat(total).toFixed(2));
            res.send(result);
        }
        else {
            result.total = 0;
            res.send(result);
        }
    });
});

app.get('/by-date', function(req, res) {
    var startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    var endDate = new Date(2015, 2, 21);
    endDate.setHours(23, 59, 59, 9999);

    Transaction.find({date: {$gte: endDate.toJSON(), $lte: startDate.toJSON()}}, function (err, docs) {
        if (docs) res.send(docs);
    });
});

app.post('/new', function(req, res) {
    var newTransaction = req.body;
    Transaction.insert(newTransaction, function(err, transaction) {
        if (err)
            res.status(500).send(error);
        else {
            res.sendStatus(200);
            Inventory.decrementInventory(transaction.products);
        }
    });
});

app.get('/:transactionId', function(req, res) {
    Transaction.find({ _id: req.params.transactionId}, function(err, doc) {
        if (doc) res.send(doc[0]);
    });
});