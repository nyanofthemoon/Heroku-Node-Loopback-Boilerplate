var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

// Auto-Migrate Models (update mode)
var models      = app.models();
var datasources = require("./datasources");
var sources     = {};
models.forEach(function(Model) {
  if (typeof Model.getSourceId == "function") {
    Model.getSourceId(function(err, id) {
      if (!err) {
        var modelName  = Model.modelName;
        var sourceName = id.split('-')[0];
        if (!sources[sourceName]) { sources[sourceName] = []; }
        sources[sourceName].push(modelName);
      }
    });
  }
});

for(sourceName in sources){
  var dataSource       = app.dataSources[sourceName];
  var dataSourceModels = sources[sourceName];
  dataSource.isActual(dataSourceModels, function(err, actual) {
    if (!actual) {
      dataSource.autoupdate(dataSourceModels, function(err, result) {
        if (err) {
          console.log('[ERROR  ] Migration Auto-Update' + err);
        }
      });
    }
  });
}