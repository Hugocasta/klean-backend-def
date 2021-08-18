var express = require('express');
var router = express.Router();
var newsModel = require('../models/news')
var userModel = require('../models/users')
var cleanwalkModel = require('../models/cleanwalks')
var cityModel = require('../models/cities')
const uid2 = require("uid2");
var bcrypt = require("bcrypt");

/* 
  /dev/gen-fake-data
  /dev/del-fake-data
*/


function rand(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
};

let lastnameArray = ["Doe", "Dupont", "Leblanc", "Germain", "Martin", "Marchand", "Saint-Hilaire", "Herreman", "Diot", "Dubois", "Moreau", "Lambert", "Charpentier", "Roger"];
let firstnameArray = ["Mika", "Malo", "John", "Remy", "Sebastien", "Thomas", "Gregoire", "Julien", "Mireille", "Elizabeth", "Anne", "Sam", "Emma", "Jade", "Liam", "William", "Noah"];
let avatar = [
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628158137/Klean/jamie-brown-wm4DuvIpLj8-unsplash_yhm2b3.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628158111/Klean/ayo-ogunseinde-sibVwORYqs0-unsplash_jo7adm.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157949/Klean/repent-of-your-sins-seek-lord-jesus-y0I85D5QKvs-unsplash_psrdx8.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157919/Klean/maria-lupan-fE5IaNta2KM-unsplash_wki4np.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157886/Klean/edward-cisneros-_H6wpor9mjs-unsplash_vpkigh.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157864/Klean/usman-yousaf-fVUi-P4HQY8-unsplash_hswqik.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157836/Klean/troy-wade-ncfTHzTjtCw-unsplash_aiskqu.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157810/Klean/tyler-nix-PQeoQdkU9jQ-unsplash_u6t0mj.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157788/Klean/ransford-quaye-DzAFv1iVMGg-unsplash_m0lsmj.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157764/Klean/reza-biazar-eSjmZW97cH8-unsplash_jcl3ae.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157698/Klean/sincerely-media-1WCu0oyl9Zk-unsplash_maoqns.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157673/Klean/roman-shilin-_6whfYYGUWE-unsplash_tloras.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157598/Klean/shaheen-abdulrahiman-Nd3fGA4vb3Q-unsplash_mfkljb.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157578/Klean/radu-florin-JyVcAIUAcPM-unsplash_bcct0n.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157552/Klean/joseph-gonzalez-iFgRcqHznqg-unsplash_cd4abx.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157531/Klean/nishanth-avva-SdCaK9YKdwk-unsplash_ig4ria.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157505/Klean/joshua-aragon-ldffJrBbZ9U-unsplash_lbpn6z.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157480/Klean/luis-villasmil-hh3ViD0r0Rc-unsplash_sqmafl.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157455/Klean/panitan-punpuang-YUa-41O4ja0-unsplash_gay9js.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157420/Klean/jeremy-brady-B7X7R_Q0c-c-unsplash_a041as.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157396/Klean/james-resly-_H5Tnj7e1hc-unsplash_sxiofq.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157344/Klean/hazel-aksoy-UcTI5ge05so-unsplash_bimiha.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157318/Klean/gabriel-silverio-u3WmDyKGsrY-unsplash_xfstpi.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628157277/Klean/allef-vinicius-C_1jjFJioWg-unsplash_yw2e1m.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628156760/Klean/luis-villasmil-hh3ViD0r0Rc-unsplash_czhqbj.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628156683/Klean/vicky-hladynets-C8Ta0gwPbQg-unsplash_dqonab.jpg",
  "https://res.cloudinary.com/dcjawpw4p/image/upload/v1627998899/Klean/userblank_k9xp57.png"
]

let cwTitle = ['Nettoyons la rue', 'Kleaning du passage', 'Jogging - ramassage de déchet', 'Atelier découverte tri avec vos enfants', 'Nettoyage devant le batiment', 'Save the planet - ramasse les déchet', 'Chasse au trésor/déchet géante']
let cwDescription = ["Bonjour, je vous propose de nous retrouver devant le batiment pour nettoyer la rue. Merci à tous et à très vite !", "Voici un évènement pour concrétiser ce dont nous avons parlé en réunion de voisin. N'hésitez pas à en parler à vos amis ! Let's go kleaning notre ville !", "Retroussez vos manches, la journée risque d'être sportive :) Hâte de vous retrouver tous !!"]
let message = ["Salut", "Bonjour tout le monde, comment allez-vous ?", "Hello Hello !", "CleanWalk forever <3"];
let dateSet = [{ start: new Date(2021, 10, 6, 8, 0, 0), end: new Date(2021, 10, 7, 16, 0, 0) }, { start: new Date(2021, 9, 6, 8, 0, 0), end: new Date(2021, 9, 7, 16, 0, 0) }, { start: new Date(2021, 9, 15, 9, 0, 0), end: new Date(2021, 9, 16, 14, 30, 0) }, { start: new Date(2021, 11, 4, 9, 0, 0), end: new Date(2021, 11, 6, 10, 30, 0) }];
let toolbadges = [["Gants", "Sacs poubelle", "Bonne humeur", "Lampe torche", "Apéro"], ["Gants", "Sacs poubelle"], ["Sacs poubelle", "pelle", "talkie-walkie"], ["poubelle", "pioche", "attrape-déchet"]]

let cities = [
  {
    cityName: "Paris",
    cityCoordinates: { longitude: 2.347, latitude: 48.859 },
    population: 2190327,
    cityCode: "75056"
  },
  {
    cityName: "Marseille",
    cityCoordinates: { longitude: 5.405, latitude: 43.282 },
    population: 862211,
    cityCode: "13055"
  },
  {
    cityName: "Leuville-sur-Orge",
    cityCoordinates: { longitude: 2.265712, latitude: 48.614514 },
    population: 4384,
    cityCode: "91333"
  },
  {
    cityName: "Dax",
    cityCoordinates: { longitude: -1.06016, latitude: 43.700719 },
    population: 20891,
    cityCode: "40088"
  },
  {
    cityName: "Lyon",
    cityCoordinates: { longitude: 4.835, latitude: 45.758 },
    population: 515695,
    cityCode: "69123"
  },
  {
    cityName: "Masléon",
    cityCoordinates: { longitude: 1.563892, latitude: 45.769315 },
    population: 285,
    cityCode: "87093"
  },
  {
    cityName: "Massy",
    cityCoordinates: { longitude: 2.269655, latitude: 48.728133 },
    population: 49924,
    cityCode: "91377"
  },
  {
    cityName: "Sainte-Cécile-les-Vignes",
    cityCoordinates: { longitude: 4.875912, latitude: 44.247736 },
    population: 2460,
    cityCode: "84106"
  },
  {
    cityName: "Les Baux-de-Provence",
    cityCoordinates: { longitude: 4.794795, latitude: 43.743426 },
    population: 361,
    cityCode: "13011"
  },
]

let cleanwalks = [
  {
    cleanwalkCity: "Lyon",
    cleanwalkCoordinates: { longitude: 4.871021629087682, latitude: 45.74292660812584 },
  },
  {
    cleanwalkCity: "Lyon",
    cleanwalkCoordinates: { longitude: 4.825216771505523, latitude: 45.72074611608844 },
  },
  {
    cleanwalkCity: "Lyon",
    cleanwalkCoordinates: { longitude: 4.827666462662006, latitude: 45.80249398771038 },
  },
  {
    cleanwalkCity: "Paris",
    cleanwalkCoordinates: { longitude: 2.404392397933515, latitude: 48.85928949610485 },
  },
  {
    cleanwalkCity: "Paris",
    cleanwalkCoordinates: { longitude: 2.279079593455615, latitude: 48.83940849259527 },
  },
  {
    cleanwalkCity: "Paris",
    cleanwalkCoordinates: { longitude: 2.3288613924947805, latitude: 48.89699651595512 },
  },
  {
    cleanwalkCity: "Paris",
    cleanwalkCoordinates: { longitude: 2.307331, latitude: 48.887416 },
  },
  {
    cleanwalkCity: "Marseille",
    cleanwalkCoordinates: { longitude: 5.382717545054295, latitude: 43.282679497382254 },
  },
  {
    cleanwalkCity: "Marseille",
    cleanwalkCoordinates: { longitude: 5.502022201372294, latitude: 43.2573060993367 },
  },
  {
    cleanwalkCity: "Marseille",
    cleanwalkCoordinates: { longitude: 5.436790878493387, latitude: 43.380199695019364 },
  },
  {
    cleanwalkCity: "Leuville-sur-Orge",
    cleanwalkCoordinates: { longitude: 2.2680072769053408, latitude: 48.621970364550066 },
  },
  {
    cleanwalkCity: "Leuville-sur-Orge",
    cleanwalkCoordinates: { longitude: 2.263200758377421, latitude: 48.60596823165116 },
  },
  {
    cleanwalkCity: "Leuville-sur-Orge",
    cleanwalkCoordinates: { longitude: 2.280881880105125, latitude: 48.6182823794501 },
  },
  {
    cleanwalkCity: "Dax",
    cleanwalkCoordinates: { longitude: -1.0951337868784665, latitude: 43.687525142459094 },
  },
  {
    cleanwalkCity: "Dax",
    cleanwalkCoordinates: { longitude: -1.0336790142714967, latitude: 43.686283816090985 },
  },
  {
    cleanwalkCity: "Dax",
    cleanwalkCoordinates: { longitude: -1.030245786751554, latitude: 43.728846639704194 },
  },
  {
    cleanwalkCity: "Massy",
    cleanwalkCoordinates: { longitude: 2.2562103428350997, latitude: 48.73585631311925 },
  },
  {
    cleanwalkCity: "Massy",
    cleanwalkCoordinates: { longitude: 2.270392674529905, latitude: 48.73242888891628 },
  },
  {
    cleanwalkCity: "Massy",
    cleanwalkCoordinates: { longitude: 2.2983198817227435, latitude: 48.736423586744806 },
  },
  {
    cleanwalkCity: "Massy",
    cleanwalkCoordinates: { longitude: 2.27219263434438, latitude: 48.717760549375505 },
  },
  {
    cleanwalkCity: "Massy",
    cleanwalkCoordinates: { longitude: 2.24628191136204, latitude: 48.735376354815585 },
  },
  {
    cleanwalkCity: "Masléon",
    cleanwalkCoordinates: { longitude: 1.5568274933831283, latitude: 45.78283003099224 },
  },
  {
    cleanwalkCity: "Masléon",
    cleanwalkCoordinates: { longitude: 1.5995711749092238, latitude: 45.765109663077894 },
  },
  {
    cleanwalkCity: "Masléon",
    cleanwalkCoordinates: { longitude: 1.558629937784831, latitude: 45.75576828452096 },
  },
  {
    cleanwalkCity: "Sainte-Cécile-les-Vignes",
    cleanwalkCoordinates: { longitude: 4.891608384590235, latitude: 44.26180337604246 },
  },
  {
    cleanwalkCity: "Sainte-Cécile-les-Vignes",
    cleanwalkCoordinates: { longitude: 4.896414902994775, latitude: 44.2080554940226 },
  },
  {
    cleanwalkCity: "Les Baux-de-Provence",
    cleanwalkCoordinates: { longitude: 4.791462247729968, latitude: 43.76612126120239 },
  },
  {
    cleanwalkCity: "Les Baux-de-Provence",
    cleanwalkCoordinates: { longitude: 4.804165189227683, latitude: 43.73202018593508 },
  },
  {
    cleanwalkCity: "Les Baux-de-Provence",
    cleanwalkCoordinates: { longitude: 4.82888442673675, latitude: 43.744050783096036 },
  }
]


/*GENERATE FAKE DATA*/
router.get('/gen-fake-data', async function (req, res, next) {

  //cities
  for (let i = 0; i < cities.length; i++) {

    var newCity = new cityModel({
      cityName: cities[i].cityName,
      cityCoordinates: { longitude: cities[i].cityCoordinates.longitude, latitude: cities[i].cityCoordinates.latitude },
      population: cities[i].population,
      cityCode: cities[i].cityCode,
    });

    var citySaved = await newCity.save();
  };

  //users

  let requeteCity = await cityModel.find();
  let randfn;
  let randln;

  for (let i = 0; i < 20; i++) {

    randfn = firstnameArray[rand(0, firstnameArray.length - 1)];
    randln = lastnameArray[rand(0, lastnameArray.length - 1)];

    var newUser = new userModel({
      firstName: randfn,
      lastName: randln,
      email: (randfn + randln + rand(0, 5000) + "@gmail.com").toLowerCase(),
      password: bcrypt.hashSync("klean", 10),
      city: requeteCity[rand(0, requeteCity.length - 1)]["_id"],
      avatarUrl: avatar[rand(0, avatar.length - 1)],
      token: uid2(32),
    });

    var userSaved = await newUser.save();
  }

  //Profil Hugo

  var hugo = new userModel({
    firstName: "Hugo",
    lastName: "Castarède",
    email: ("hugo.castarede@gmail.com").toLowerCase(),
    password: bcrypt.hashSync("klean", 10),
    city: requeteCity[requeteCity.findIndex(e => e.cityName === "Massy")]["_id"],
    avatarUrl: "https://res.cloudinary.com/dcjawpw4p/image/upload/v1628171531/Klean/LA_CAPSULE_15-06-2021-290HD_1_i9gj66.jpg",
    token: process.env.TOKEN_ADMIN,
  });

  var hugoSaved = await hugo.save();


  //CleanWalk
  let randAdmin;
  let AdminOut;
  let randParArr;
  let randPar;
  let requeteUser;
  let cityId;
  let currentDateSet;

  for (let i = 0; i < cleanwalks.length; i++) {

    requeteUser = await userModel.find();
    randAdmin = requeteUser[rand(0, requeteUser.length - 1)]["_id"]
    AdminOut = requeteUser.splice(requeteUser.findIndex(e => e["_id"].toString() === randAdmin.toString()), 1)
    console.log(AdminOut)

    randPar = () => {
      let arr = [hugoSaved._id];
      let p;

      for (let i = 0; i < 6; i++) {
        p = requeteUser[rand(0, requeteUser.length - 1)]["_id"]
        if (arr.indexOf(p) === -1) {
          arr.push(p)
        } else {

        }
      }
      return arr
    },

      randParArr = randPar()
    cityId = await cityModel.findOne({ cityName: cleanwalks[i].cleanwalkCity });
    currentDateSet = dateSet[rand(0, dateSet.length - 1)]
    console.log({ cityId });

    var newCleanwalk = new cleanwalkModel({
      cleanwalkTitle: cwTitle[rand(0, cwTitle.length - 1)],
      cleanwalkDescription: cwDescription[rand(0, cwDescription.length - 1)],
      cleanwalkCity: cityId["_id"],
      cleanwalkCoordinates: cleanwalks[i].cleanwalkCoordinates,
      startingDate: currentDateSet.start,
      endingDate: currentDateSet.end,
      toolBadge: toolbadges[rand(0, toolbadges.length - 1)],
      admin: randAdmin,
      participantsList: randParArr,
      messages: [
        {
          user: firstnameArray[rand(0, firstnameArray.length - 1)],
          message: message[rand(0, message.length - 1)],
          date: new Date(2021, 7, 22),
        },
        {
          user: firstnameArray[rand(0, firstnameArray.length - 1)],
          message: message[rand(0, message.length - 1)],
          date: new Date(2021, 7, 23),
        },
        {
          user: firstnameArray[rand(0, firstnameArray.length - 1)],
          message: message[rand(0, message.length - 1)],
          date: new Date(2021, 7, 23),
        },
      ],
    });

    var cleanwalkSaved = await newCleanwalk.save();
  }

  res.json({ result: true });
});



/*DELETE FAKE DATA*/

router.get('/del-fake-data', async function (req, res, next) {

  await userModel.deleteMany();
  await cityModel.deleteMany();
  await cleanwalkModel.deleteMany();

  res.json({ result: true });
});


module.exports = router;
