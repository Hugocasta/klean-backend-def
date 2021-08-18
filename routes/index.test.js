var app = require("../app")
var request = require("supertest")

test("Load-pin-on-change-region : No user token found", async () => {
  const { body } = await request(app).post("/load-pin-on-change-region").send({
    coordinate: {
      latitude: 48.866667,
      longitude: 2.333333,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    date: new Date(),
    token: "WRONGTOKEN"
  });
  expect(body).toStrictEqual({ result: false, error: "user not found" });
});


test("Autcomplete : sends a result back to frontend", async () => {
  const { body } = await request(app).post("/autocomplete-search").send({
    token: process.env.TOKEN_INVITED,
  });
  expect(body).toHaveProperty('result', true);
  expect(body).toHaveProperty('response', expect.any(Array));
});


test("load-profil : sends all the information with the right format", async () => {
  const { body } = await request(app).get(`/load-profil/${process.env.TOKEN_ADMIN}`)
  expect(body).toHaveProperty('result', true);
  expect(body).toHaveProperty('infosCWparticipate', expect.any(Array));
  expect(body).toHaveProperty('infosCWorganize', expect.any(Array));
  expect(body).toHaveProperty('infosUser', expect.any(Object));
  expect(body).toHaveProperty('statPerso', expect.any(Number));
  expect(body).toHaveProperty('statCity', expect.any(Object));
});