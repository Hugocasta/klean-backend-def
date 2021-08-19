var express = require("express");
var router = express.Router();

let userModel = require("../models/users");
var bcrypt = require("bcrypt");
const uid2 = require("uid2");
const cleanwalkModel = require("../models/cleanwalks");
const cityModel = require("../models/cities");

var cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}


/* SIGN-UP */
router.post("/sign-up", async function (req, res, next) {

  let error = [];
  let result = false;
  let saveUser = null;
  let token = null;
  let idCleanwalk = req.body.cleanwalkIdFromFront;
  let newParticipant = null;

  let data = await userModel.findOne({
    email: req.body.emailFromFront,
  });

  if (data != null) {
    error.push("Vous vous êtes déjà enregistré. Vous pouvez vous connecter.");
  }

  if (req.body.token != process.env.TOKEN_INVITED) {
    error.push("Utilisateur non identifié.");
  }

  if (
    req.body.firsNameFromFront == "" ||
    req.body.lastNameFromFront == "" ||
    req.body.emailFromFront == "" ||
    req.body.cityFromFront == "" ||
    req.body.passwordFromFront == ""
  ) {
    error.push("Veuillez remplir tous les champs.");
  }

  if (!validateEmail(req.body.emailFromFront)) {
    error.push("Format d'email incorrect");
  }

  /* Inscription à l'application sans participation à une cleanwalk */
  if (error.length == 0 && idCleanwalk === undefined) {

    let cityInfo = JSON.parse(req.body.cityInfo);
    let code = cityInfo.properties.citycode;
    let coordinates = cityInfo.geometry.coordinates;
    let population = cityInfo.properties.population;
    let found = await cityModel.findOne({ cityCode: code });

    /* Si la ville entrée par l'utilisateur existe déjà en base de données */
    if (found) {
      let hash = bcrypt.hashSync(req.body.passwordFromFront, 10);
      /* Création de l'utilisateur en base de données */
      let newUser = new userModel({
        firstName: req.body.firstNameFromFront,
        lastName: req.body.lastNameFromFront,
        email: req.body.emailFromFront.toLowerCase(),
        city: found._id,
        avatarUrl:
          "https://res.cloudinary.com/dcjawpw4p/image/upload/v1627998899/Klean/userblank_k9xp57.png",
        password: hash,
        token: uid2(32),
      });

      saveUser = await newUser.save();

      if (saveUser) {
        result = true;
        token = saveUser.token;
      }

    /* Si la ville entrée par l'utilisateur n'existe pas en base de données */
    } else if (found == null) {
      /* Création de la ville en base de données */
      let newCity = new cityModel({
        cityName: req.body.cityFromFront,
        cityCoordinates: {
          longitude: coordinates[0],
          latitude: coordinates[1],
        },
        population: population,
        cityCode: code,
      });
      let citySaved = await newCity.save();

      /* Création de l'utilisateur en base de données */
      let hash = bcrypt.hashSync(req.body.passwordFromFront, 10);
      let newUser = new userModel({
        firstName: req.body.firstNameFromFront,
        lastName: req.body.lastNameFromFront,
        email: req.body.emailFromFront.toLowerCase(),
        city: citySaved._id,
        avatarUrl:
          "https://res.cloudinary.com/dcjawpw4p/image/upload/v1627998899/Klean/userblank_k9xp57.png",
        password: hash,
        token: uid2(32),
      });

      saveUser = await newUser.save();

      if (saveUser) {
        result = true;
        token = saveUser.token;
      }
    }

    res.json({
      error,
      result,
      token,
    });
  }

  /* Inscription à l'application avec participation à une cleanwalk */
  else if (error.length == 0 && idCleanwalk !== undefined) {

    let cityInfo = JSON.parse(req.body.cityInfo);
    let code = cityInfo.properties.citycode;
    let coordinates = cityInfo.geometry.coordinates;
    let population = cityInfo.properties.population;

    let found = await cityModel.findOne({ cityCode: code });

    /* Si la ville entrée par l'utilisateur existe en base de données */
    if (found) {
      let hash = bcrypt.hashSync(req.body.passwordFromFront, 10);
      /* création de l'utilisateur en base de données */
      let newUser = new userModel({
        firstName: req.body.firstNameFromFront,
        lastName: req.body.lastNameFromFront,
        email: req.body.emailFromFront.toLowerCase(),
        city: found._id,
        avatarUrl:
          "https://res.cloudinary.com/dcjawpw4p/image/upload/v1627998899/Klean/userblank_k9xp57.png",
        password: hash,
        token: uid2(32),
      });

      let saveUser = await newUser.save();

      if (saveUser) {

        /* Ajout de l'utilisateur dans la liste des participants de la cleanwalk */
        newParticipant = await cleanwalkModel.updateOne(
          { _id: idCleanwalk },
          { $push: { participantsList: saveUser._id } }
        );

        result = true;
        token = saveUser.token;
      }

    /* Si la ville entrée par l'utilisateur n'existe pas en base de données */
    } else if (found == null) {

      /* Création de la ville en base de données */
      let newCity = new cityModel({
        cityName: req.body.cityFromFront,
        cityCoordinates: {
          longitude: coordinates[0],
          latitude: coordinates[1],
        },
        population: population,
        cityCode: code,
      });
      let citySaved = await newCity.save();

      /* Création de l'utilisateur en base de données */
      let hash = bcrypt.hashSync(req.body.passwordFromFront, 10);
      let newUser = new userModel({
        firstName: req.body.firstNameFromFront,
        lastName: req.body.lastNameFromFront,
        email: req.body.emailFromFront.toLowerCase(),
        city: citySaved._id,
        avatarUrl:
          "https://res.cloudinary.com/dcjawpw4p/image/upload/v1627998899/Klean/userblank_k9xp57.png",
        password: hash,
        token: uid2(32),
      });

      let saveUser = await newUser.save();

      if (saveUser) {

        /* Ajout de l'utilisateur dans la liste des participants de la cleanwalk */
        newParticipant = await cleanwalkModel.updateOne(
          { _id: idCleanwalk },
          { $push: { participantsList: saveUser._id } }
        );

        result = true;
        token = saveUser.token;
      }
    }
    res.json({
      error,
      result,
      token,
      newParticipant,
    });
  }
  else{
    res.json({ error, result });
  }
});



/* SIGN-IN */
router.post("/sign-in", async function (req, res, next) {
  let error = [];
  let result = false;
  let user = null;
  let token = null;

  let idCleanwalk = req.body.cleanwalkIdFromFront;
  let newParticipant = null;

  if (req.body.token != process.env.TOKEN_INVITED) {
    error.push("Utilisateur non identifié.");
  }
  
  if (req.body.emailFromFront == "" || req.body.passwordFromFront == "") {
    error.push("Veuillez remplir les deux champs.");
  }

  /* Si l'utilisateur se connecte et n'est pas dans un processus de participation à une cleanwalk */
  if (error.length == 0 && idCleanwalk === undefined) {
    user = await userModel.findOne({
      email: req.body.emailFromFront.toLowerCase(),
    });

    if (user) {
      if (bcrypt.compareSync(req.body.passwordFromFront, user.password)) {
        result = true;
        token = user.token;
      } else {
        error.push("Mot de passe incorrect.");
      }
    } else if (user == null) {
      error.push("Vous ne vous êtes pas encore enregistré.");
    }

    res.json({ error, result, token });
  }

  /* Si l'utilisateur se connecte et se trouve dans un processus de participation à une cleanwalk */
  else if (error.length == 0 && idCleanwalk !== undefined) {

    user = await userModel.findOne({
    email: req.body.emailFromFront.toLowerCase(),
    });

    if (user) {
      if (bcrypt.compareSync(req.body.passwordFromFront, user.password)) {
        result = true;
        token = user.token;

        /* L'utilisateur est ajouté à la liste des participants de la cleanwalk s'il est trouvé en base de données */
        newParticipant = await cleanwalkModel.updateOne(
          { _id: idCleanwalk },
          { $push: { participantsList: user._id } }
        );
      } else {
        error.push("Mot de passe incorrect.");
      }
    } else if (user == null){
      error.push("Vous ne vous êtes pas encore enregistré.");
    }
    res.json({ error, result, token, newParticipant });
  }
  else {
    res.json({ error, result });
  }
});


/* UPDATE-PASSWORD */
router.put("/update-password", async function (req, res, next) {
  let result = false;
  let newPassword = null;
  let error = [];
  let password = req.body.old;
  let user = await userModel.findOne({ token: req.body.token });

  /* Compare le mot de passe actuelle avec celui en BDD via la fonction compareSync et vérifie également que le nouveau
  mot de passe a bien été entrée de la même façon dans le champ principal et le champ de vérification */
  if (bcrypt.compareSync(password, user.password) && req.body.new === req.body.confirmNewPass) {
    let hash = bcrypt.hashSync(req.body.confirmNewPass, 10);
    newPassword = await userModel.updateOne(
      { token: user.token },
      { password: hash }
    );
    if (newPassword != null) {
      result = true;
    }
    res.json({ result });

  } else if (req.body.new !== req.body.confirmNewPass) {
    error.push("Les champs du nouveau mot de passe ne sont pas identiques.");
    res.json({ result, error });
  }
  else {
    res.json({ result, error });
  }
});

module.exports = router;
