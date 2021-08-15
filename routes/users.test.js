var app = require ("../app")
var request = require ("supertest")

test ("enregistrement", async (done) => {
    await request(app).post("/sign-up")
    .send ({
        "req.body.firsNameFromFront": "",
        "req.body.lastNameFromFront": "",
        "req.body.emailFromFront": "",
        "req.body.cityFromFront": "",
        "req.body.passwordFromFront": ""
    })
    .expect(200)
    .expect(error.length == 1)
} )