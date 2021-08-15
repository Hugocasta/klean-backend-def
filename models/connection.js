var mongoose = require('mongoose');

const options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology : true
}

const connectionString = process.env.BDD_KEY ;

mongoose.connect(
    connectionString,
    options,        
    function(err) {
      if (!err) {
        console.log('Connection à la Base de données réussie !');
      } else {
        console.log(err);
      }
      
    } 
);

module.exports = mongoose