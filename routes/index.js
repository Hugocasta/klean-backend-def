var express = require("express");
var router = express.Router();
var uniqid = require('uniqid');
var fs = require('fs');
var request = require("sync-request");

const cityModel = require("../models/cities");
let cleanwalkModel = require("../models/cleanwalks");
let userModel = require("../models/users");

var cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

/* Fonction qui permet de vérifier qu'un token est envoyé par le frontend pour activer une route */
async function tokenIsValidated(token) {

  let userRequest = await userModel.find()
  let userTokenArr = userRequest.map(obj => obj.token)

  //Ajout du token invité (utilisateur non connecté)
  userTokenArr.push(process.env.TOKEN_INVITED)

  if (userTokenArr.every(str => str !== token)) {
    return false
  } else {
    return true
  }
}


/*AUTOCOMPLETE-SEARCH*/
/* Renvoie une liste d'adresses à partir d'une chaîne de caractère */
router.post("/autocomplete-search", async function (req, res, next) {

  if (await tokenIsValidated(req.body.token)) {
    let requete = request(
      "GET",
      `https://api-adresse.data.gouv.fr/search/?q=${req.body.adress}`
    );
    let response = JSON.parse(requete.body);

    res.json({ result: true, response: response.features });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*AUTOCOMPLETE-SEARCH-CITY-ONLY*/
/* Renvoie une liste de commune (hors arrondissement) à partir d'une chaîne de caractère */
router.post("/autocomplete-search-city-only", async function (req, res, next) {

  if (await tokenIsValidated(req.body.token)) {
    let cityRegex = /arrondissement/i;
    let requete = request(
      "GET",
      `https://api-adresse.data.gouv.fr/search/?q=${req.body.city}&type=municipality`
    );
    let response = JSON.parse(requete.body);
    /* Supprime les adresses qui contiennent le mot arrondissement */
    let newResponse = response.features.filter(
      (obj) => !cityRegex.test(obj.properties.label)
    );

    /* Permet d'adapter l'objet de réponse au composant autocomplete en ajoutant un champ label */
    newResponse = newResponse.map((obj) => {
      let copy = { ...obj };
      copy.properties.label = copy.properties.city;
      return copy;
    });

    res.json({ result: true, newResponse });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*LOAD-CLEANWALK*/
/* Permet de télécharger les informations qui concernent une cleanwalk */
router.get("/load-cleanwalk/:idCW/:token", async function (req, res, next) {
  if (await tokenIsValidated(req.params.token)) {
    var cleanwalk = await cleanwalkModel
      .findById(req.params.idCW)
      .populate("cleanwalkCity")
      .populate("participantsList", "firstName lastName avatarUrl")
      .populate("admin", "firstName lastName avatarUrl")
      .exec();

    res.json({ result: true, cleanwalk });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*LOAD-PIN-ON-CHANGE-REGION*/
/* Permet de télécharger les cleanwalks dans un certain périmètre (latitude delta et longitude delta) et en fonction
d'une date de début */
router.post("/load-pin-on-change-region", async function (req, res, next) {

  if (await tokenIsValidated(req.body.token)) {

    const coordinateJsonParse = JSON.parse(req.body.coordinate);
    const dateSearch = req.body.date;

    //On définit la fonction pour calculer les intervalles de latitude et longitude nécessaires à la requête
    const definePerimeter = (regionLat, regionLong, latD, longD) => {
      let interval = {
        lat: { min: regionLat - 0.5 * latD, max: regionLat + 0.5 * latD },
        long: { min: regionLong - 0.5 * longD, max: regionLong + 0.5 * longD },
      };
      return interval;
    };

    //On reçoit via le body les éléments de la region (vue active sur la carte) qu'on place en arguments de la fonction
    let customInterval = definePerimeter(
      coordinateJsonParse.latitude,
      coordinateJsonParse.longitude,
      coordinateJsonParse.latitudeDelta,
      coordinateJsonParse.longitudeDelta
    );

    //Recherche des cleanwalks à partir des différents critères dans la base de données MongoDB
    let cleanWalkRequest = await cleanwalkModel
      .find()
      .where("cleanwalkCoordinates.latitude")
      .gte(customInterval.lat.min)
      .lte(customInterval.lat.max)
      .where("cleanwalkCoordinates.longitude")
      .gte(customInterval.long.min)
      .lte(customInterval.long.max)
      .where("startingDate")
      .gte(dateSearch)
      .populate("admin", "firstName lastName avatarUrl")
      .exec();

    res.json({ result: true, cleanWalkArray: cleanWalkRequest });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*LOAD-CITIES-RANKING*/
/* Permet de télécharger l'ensemble des villes avec leur nombre de points */
router.get("/load-cities-ranking", async function (req, res, next) {

  /* Chaque cleanwalk rapporte 5 points à sa ville */
  let pointsPerCw = 5;

  /* Aggrégation qui permet d'extraire les villes et leur nombre de point par ordre décroissant 
  (villes avec au moins 5 points) */
  let cwpercity = await cleanwalkModel.aggregate([
    { $group: { _id: "$cleanwalkCity", count: { $sum: pointsPerCw } } },
    { $sort: { count: -1 } },
    {
      $lookup: {
        from: "cities",
        localField: "_id",
        foreignField: "_id",
        as: "city_info",
      },
    },
  ]);


  /* On ajoute à l'aggrégation les villes sans cleanwalks (0 points) */
  let cityArr = await cityModel.find()

  for (let i = 0; i < cityArr.length; i++) {
    if (cwpercity.some(obj => obj["_id"].toString() === cityArr[i]["_id"].toString())) {
    } else {
      cwpercity.push({ _id: cityArr[i]["_id"], count: 0, city_info: [cityArr[i]] })
    }

  }

  let token = req.query.token;
  let user = await userModel.find({ token: token });

  if (user.length > 0) {
    /* Mapping du résultat de la recherche pour la faire correspondre à l'objet attendu par le frontend. Ajout
    d'une propriété isMyCity pour modifier l'affichage de la ville de l'utilisateur */
    cwpercity = cwpercity.map((obj, i) => {
      let copy = {};
      if (obj["_id"].toString() === user[0].city.toString()) {
        copy.isMyCity = true;
      } else {
        copy.isMyCity = false;
      }
      copy.city = obj["city_info"][0].cityName;
      copy.points = obj.count;
      copy.ranking = i + 1;
      return copy;
    });

    res.json({ result: true, ranking: cwpercity });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});

/*LOAD-PROFIL*/
/* Permet de récupérer l'ensemble des informations nécessaires à l'affichage de la page profil */
router.get("/load-profil/:token", async function (req, res, next) {

  const token = req.params.token;
  const date = new Date();
  const user = await userModel.findOne({ token: token });

  if (user) {
    const userId = user._id;

    /* Agrégation qui permet de créer un objet cleanwalk par participant et de filtrer uniquement celles auxquelles participe
    l'utilisateur et dont la date de début est supérieure à celle envoyée par le frontend */
    const cleanwalksParticipate = await cleanwalkModel.aggregate([
      { $unwind: "$participantsList" },
      { $match: { participantsList: userId } },
      { $match: { startingDate: { $gte: date } } },
    ]);

    /* Création du tableau d'objets des cleanwalks auquelles l'utilisateur participe avec uniquement 
    les informations nécessaires */
    const infosCWparticipate = cleanwalksParticipate.map((cleanwalk) => {
      return {
        id: cleanwalk._id,
        title: cleanwalk.cleanwalkTitle,
        date: cleanwalk.startingDate,
      };
    });

    /* Requête permettant de récupérer les cleanwalks que l'utilisateur organise */
    const cleanwalksOrganize = await cleanwalkModel.find({
      admin: userId,
      startingDate: { $gte: date },
    });

    /* Création du tableau d'objets des cleanwalks que l'utilisateur organise avec uniquement 
    les informations nécessaires */
    const infosCWorganize = cleanwalksOrganize.map((cleanwalk) => {
      return {
        id: cleanwalk._id,
        title: cleanwalk.cleanwalkTitle,
        date: cleanwalk.startingDate,
      };
    });

    /* Filtre des informations concernant l'utilisateur renvoyées au frontend */
    const infosUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    //Statistiques personnelles
    let ArrStatPerso = infosCWorganize.concat(infosCWparticipate);

    //Statistiques de la ville de l'utilisateur (lorsque le nombre de points est supérieur ou égal à 5)
    let pointsPerCw = 5;

    let cwpercity = await cleanwalkModel.aggregate([
      { $group: { _id: "$cleanwalkCity", points: { $sum: pointsPerCw } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "cities",
          localField: "_id",
          foreignField: "_id",
          as: "city_info",
        },
      },
      { $match: { _id: user.city } },
    ]);

    //Statistique de la ville de l'utilisateur (lorsque le nombre de point est 0)
    if (cwpercity.length === 0) {
      userCity = await cityModel.findById(user.city)
      cwpercity = [{
        _id: user.city,
        points: 0,
        city_info: [userCity]
      }]
    }

    res.json({
      result: true,
      infosCWparticipate,
      infosCWorganize,
      infosUser,
      statPerso: ArrStatPerso.length,
      statCity: cwpercity[0],
    });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});

/* UNSUBSCRIBE-CW */
/* Permet de se désinscrire d'une cleanwalk en base de données */
router.post("/unsubscribe-cw", async function (req, res, next) {

  const token = req.body.token;
  const idCW = req.body.idCW;
  const user = await userModel.findOne({ token: token });

  if (user) {

    await cleanwalkModel.updateOne(
      { _id: idCW },
      { $pull: { participantsList: user._id } }
    );

    res.json({ result: true });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});

/* DELETE-CW */
/* Permet de supprimer une cleanwalk en base de données */
router.delete("/delete-cw/:token/:idCW", async function (req, res, next) {

  const token = req.params.token;
  const idCW = req.params.idCW;

  const user = await userModel.findOne({ token: token });

  if (user) {

    await cleanwalkModel.deleteOne(
      { _id: idCW }
    );

    res.json({ result: true });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});

/*LOAD MESSAGE*/
/* Permet de charger les messages du chat d'une cleanwalk enregistrés en base de données */
router.get("/load-messages/:token/:cwid", async function (req, res, next) {

  if (await tokenIsValidated(req.params.token)) {

    let cleanwalk = await cleanwalkModel.find({ _id: req.params.cwid });
    let messages = cleanwalk[0].messages;

    res.json({ result: true, messages });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*SAVE-MESSAGE*/
/* Permet d'enregistrer un message du chat en base de données  */
router.post("/save-message", async function (req, res, next) {

  if (await tokenIsValidated(req.body.token)) {

    let token = req.body.token;
    let cwid = req.body.cwid;
    let message = JSON.parse(req.body.message);
    let date = JSON.parse(req.body.date);

    let cleanwalk = await cleanwalkModel.find({ _id: cwid });
    let user = await userModel.find({ token: token });
    let sender = user[0].firstName;

    cleanwalk[0].messages.push({
      user: sender,
      message: message,
      date: date,
    });

    let cleanwalkSaved = await cleanwalk[0].save();

    if (cleanwalkSaved) {
      res.json({ result: true, messages: cleanwalkSaved.messages });
    } else {
      res.json({ result: true, error: "Couldn't save the message" });
    }
  } else {
    res.json({ result: false, error: "user not found" });
  }
});

/*CREATE-CW*/
/* Route qui permet de créer une cleanwalk en base de données */
router.post("/create-cw", async function (req, res, next) {

  let error = [];
  var result = false;
  let resultSaveCleanwalk = false;
  let resultSaveCity = false;


  let cityInfo = JSON.parse(req.body.city);

  let code = cityInfo.cityCode;
  let userToken = req.body.token;
  if (
    req.body.title == "" ||
    req.body.description == "" ||
    req.body.startingDate == "" ||
    req.body.endingDate == "" ||
    req.body.tool == ""
  ) {
    error.push("Tous les champs sont obligatoires. Veuillez les remplir.");
  }

  let user = await userModel.findOne({ token: userToken });
  let found = await cityModel.findOne({ cityCode: code });

  /* Si la ville est trouvée en base de données */
  if (error.length == 0 && found) {
    let splitedTool = req.body.tool.split(",");
    splitedTool = splitedTool.map(str => str.replace(/ /g, "").replace(/\n/g, ""));

    /* On ajoute la cleanwalk en base de données */
    var addCW = new cleanwalkModel({
      cleanwalkTitle: req.body.title,
      cleanwalkDescription: req.body.description,
      cleanwalkCity: found._id,
      cleanwalkCoordinates: {
        longitude: cityInfo.cleanwalkCoordinates.lon,
        latitude: cityInfo.cleanwalkCoordinates.lat,
      },
      startingDate: req.body.startingDate,
      endingDate: req.body.endingDate,
      toolBadge: splitedTool,
      admin: user._id,
    });

    var cleanwalkSave = await addCW.save();

    resultSaveCleanwalk = true;
    result = true;

    res.json({ result, error, resultSaveCleanwalk, cleanwalkSave });
  }

  /* Si la ville n'est pas trouvée en base de données */
  else if (error.length == 0 && found == null) {

    /* La ville est créée en base de données */
    let newCity = cityModel({
      cityName: cityInfo.cityName,
      cityCoordinates: {
        longitude: cityInfo.cityCoordinates[0],
        longitude: cityInfo.cityCoordinates[1],
      },
      population: cityInfo.cityPopulation,
      cityCode: cityInfo.cityCode,
    });

    let citySaved = await newCity.save();


    if (citySaved) {

      let splitedTool = req.body.tool.split(",");
      splitedTool = splitedTool.map(str => str.replace(/ /g, "").replace(/\n/g, ""));

      /* Si la ville a bien été créée, alors la cleanwalk est également créée */
      var addCW = new cleanwalkModel({
        cleanwalkTitle: req.body.title,
        cleanwalkDescription: req.body.description,
        cleanwalkCity: citySaved._id,
        cleanwalkCoordinates: {
          longitude: cityInfo.cityCoordinates[0],
          latitude: cityInfo.cityCoordinates[1],
        },
        startingDate: req.body.startingDate,
        endingDate: req.body.endingDate,
        toolBadge: splitedTool,
        admin: user._id,
      });

      var cleanwalkSave = await addCW.save();

      if (cleanwalkSave) {
        resultSaveCleanwalk = true;
        result = true;
      } else {
        error.push("La cleanwalk n'a pas pu être créée");
      }

      resultSaveCity = true;
    } else {
      error.push("La ville n'a pas pu être créée");
    }

    res.json({
      result,
      error,
      resultSaveCleanwalk,
      resultSaveCity,
      cleanwalkSave
    });
  }
});


/* SUBSCRIBE-CW */
/* Permet à l'utilisateur de participer à une cleanwalk */
router.post("/subscribe-cw", async function (req, res, next) {

  let error = [];
  let user = await userModel.findOne({ token: req.body.token });

  newParticipant = await cleanwalkModel.updateOne(
    { _id: req.body.cleanwalkID },
    { $push: { participantsList: user._id } }
  );

  if (newParticipant.n == 1) {
    res.json({ result: true });
  } else {
    error.push("Erreur, veuillez réessayer.")
    res.json({ result: false, error });
  }
});

/* GET-CITY-FROM-COORDINATES */
/* Permet de récupérer le nom de la commune à partir de coordonnées GPS */
router.post("/get-city-from-coordinates", async function (req, res, next) {

  if (await tokenIsValidated(req.body.token)) {

    let requete = request(
      "GET",
      `https://api-adresse.data.gouv.fr/reverse/?lon=${req.body.lonFromFront}&lat=${req.body.latFromFront}`
    );
    let response = JSON.parse(requete.body);

    res.json({ result: true, response: response });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*SEARCH-CITY-ONLY*/
/* Renvoie une liste de commune (hors arrondissement) à partir d'une chaîne de caractère */
router.post("/search-city-only", async function (req, res, next) {

  if (await tokenIsValidated(req.body.token)) {

    let cityRegex = /arrondissement/i;
    let requete = request(
      "GET",
      `https://api-adresse.data.gouv.fr/search/?q=${req.body.city}&type=municipality`
    );
    let response = JSON.parse(requete.body);
     /* Supprime les adresses qui contiennent le mot arrondissement */
    let newResponse = response.features.filter(
      (obj) => !cityRegex.test(obj.properties.label)
    );

    /* Permet d'adapter l'objet de réponse au composant autocomplete en ajoutant un champ label */
    newResponse = newResponse.map((obj) => {
      let copy = { ...obj };
      copy.properties.label = copy.properties.city;
      return copy;
    });

    res.json({ result: true, newResponse });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});


/*LOAD-CW-FORSTORE*/
router.get("/load-cw-forstore/:token", async function (req, res, next) {
  const token = req.params.token;

  const date = new Date();
  const user = await userModel.findOne({ token: token });

  if (user) {
    const userId = user._id;

    /* Agrégation qui permet de créer un objet cleanwalk par participant et de filtrer uniquement celles auxquelles participe
    l'utilisateur et dont la date de début est supérieure à celle envoyée par le frontend */
    const cleanwalksParticipate = await cleanwalkModel.aggregate([
      { $unwind: "$participantsList" },
      { $match: { participantsList: userId } },
      { $match: { startingDate: { $gte: date } } },
    ]);

    // Création du tableau de cleanwalk auxquelles l'utilisateur participe avec uniquement les IDs de ces dernières
    const infosCWparticipate = cleanwalksParticipate.map((cleanwalk) => {
      return cleanwalk._id;
    });

    // Requête qui permet de récupérer la liste des cleanwalks organisées par l'utilisateur
    const cleanwalksOrganize = await cleanwalkModel.find({
      admin: userId,
      startingDate: { $gte: date },
    });

    // Création du tableau de cleanwalks que l'utilisateur organise avec uniquement les IDs de ces dernières
    const infosCWorganize = cleanwalksOrganize.map((cleanwalk) => {
      return cleanwalk._id;
    });

    res.json({ result: true, infosCWparticipate, infosCWorganize });
  } else {
    res.json({ result: false, error: "user not found" });
  }
});

/* UPLOAD-PHOTO */
/* Permet de modifier la photo de profil de l'utilisateur */
router.post("/upload-photo/:token", async function (req, res, next) {

  if (await tokenIsValidated(req.params.token)) {
    let result = true;
    let error = [];
    let resultCloudinary;
    let pictureName = './tmp/' + uniqid() + '.jpg';
    /* Déplace l'image reçue dans un dossier de fichiers temporaires sur le backend */
    let resultCopy = await req.files.avatar.mv(pictureName);

    if (!resultCopy) {
      /* Télécharge la photo sur cloudinary dans le dossier Klean */
      resultCloudinary = await cloudinary.uploader.upload(pictureName,
        { public_id: "Klean/" + uniqid() },
        function (error, result) { console.log(result, error); });

      if (resultCloudinary) {
        /* Enregistrement de l'url de la photo en base de données */
        let user = await userModel.findOne({ token: req.params.token })
        user.avatarUrl = resultCloudinary.secure_url
        userSaved = await user.save()
        if (!userSaved) {
          result = false
          error.push('Failed to save user in DB')
        }
      } else {
        result = false
        error.push('failed to save picture in cloud')
      }

    } else {
      result = false
      error.push('failed to upload file in backend')
    }

    res.json({ result, resultCloudinary, resultCopy, error });
    /* Suppresion de la photo du dossier de fichiers temporaires */
    fs.unlinkSync(pictureName);

  } else {
    res.json({ result: false, error: "user not found" });
  }
});

module.exports = router;
