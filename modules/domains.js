const Mongoose = require("mongoose")

const UserSchema = new Mongoose.Schema({
    FirstName: {
        type: String
    },
    LastName: {
        type: String
    },
    Username: {
        type: String
    },
    Password: {
        type: String
    }
})
const UserModel = Mongoose.model("users", UserSchema)

module.exports = [
    {
        path: "captcha-project-validate-login",
        type: "POST",
        requirements: ["id"],
        method: async (request, resolve) => {
            let userValidation = request.header("X-User-Validation")
            if (!userValidation) return resolve.status(400).send("Expects user validation");
        
            if (!request.header("X-Access-Token")) return resolve.status(499).send("An access token is required for this request")
            if (request.header("X-Access-Token") != process.env.ACCESSTOKEN) return resolve.status(498).send("An invalid access token was provided");

            userValidation = JSON.parse(userValidation)
            if (!(userValidation instanceof Object)) return resolve.status(400).send("User validation must be JSON object");
            if (!userValidation.username || !userValidation.password) return resolve.status(400).send("User validation must contain username and password");

            let data = UserModel.findOne({
                Username: userValidation.username,
                Password: userValidation.password
            })

            console.log(data)

            if (data) {
                resolve
                resolve.send(JSON.stringify({
                    exists: true
                }))
            } else {
                resolve.send(JSON.stringify({
                    exists: false
                }))
            }
        }
    },
]