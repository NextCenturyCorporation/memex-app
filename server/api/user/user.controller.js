'use strict';

var models = require('../../models');
var sequelize = models.sequelize;

exports.index = function (req, res) {
    models.User.findAll(
    //{
    //     include: [ models.Query ]
    // }
    ).then(function(users) {
        res.json(200, users);
    });
};

exports.show = function (req, res) {
    setUserName(req);
    models.User.find({
        where: {username: req.params.username}
    }).then(function(user){
        res.json(200, user);
    });
}

exports.create = function (req, res) {
    models.User.create(req.body)
    .then(function(newuser) {
        res.json(201, newuser);
    }).catch(function(error) {
        res.json(404, error);
    });
}

exports.update = function (req, res) {
    setUserName(req);
    models.User.update(
        req.body,
        {where: {username: req.params.username}}
    ).then(function(user) {
        res.status(204).end();
    }).catch(function(error) {
        res.json(404, error);
    });
}

exports.delete = function (req, res) {
    setUserName(req);
    models.User.destroy({
        where: {username: req.params.username}
    })
    .then(function(user) {
        if (user) {
            res.status(204).end();
        }
        else {
            res.status(404).end();
        }
    })
    .catch(function(error) {
        res.json(404, error);
    });
}

// return active (hasrun=false) notifications for specified user
exports.notificationCount = function (req, res) {
    setUserName(req);
    sequelize.query(
        "select count(*) as notrun from users inner join queries on " +
        "users.username = queries.userusername where " +
        "queries.notificationhasrun=(0) and users.username = :username",
        { replacements: { username: req.params.username }, 
        type: sequelize.QueryTypes.SELECT })
    .then(function(results) {
        var count = results[0].notrun;
        res.json(200, {notRunCount: count});
    }).catch(function(error) {
        res.json(400, error);
    });    
}

var setUserName = function (req) {
    if (req.params.username === 'reqHeader') {
        req.params.username = req.headers.user;
    }    
}