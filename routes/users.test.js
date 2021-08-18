var app = require("../app")
var request = require("supertest")

test("all inputs empty", async () => {
    const { body } = await request(app).post("/users/sign-up").send({
      firstNameFromFront: "",
      lastNameFromFront: "",
      emailFromFront: "",
      cityFromFront: "",
      passwordFromFront: "",
    });
    expect(body).toStrictEqual({
      error: ["Veuillez remplir tous les champs.", "Format d'email incorrect"],
      result: false,
    });
  });