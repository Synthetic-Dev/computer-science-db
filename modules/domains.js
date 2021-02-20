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

{
    let usernames = require("./usernames.json")
    usernames.forEach(user => {
        let data = new UserModel(user)
        data.save()
    })
}

function validatePassword(password) {
    if (password.length < 8) {
        return {
            valid: false,
            reason: "Password must be at least 8 characters long"
        }
    } else if (password.toUpperCase() == password || password.toLowerCase() == password) {
        return {
            valid: false,
            reason: "Password must include uppercase and lowercase characters"
        }
    } else if (!/\d/g.test(password) || !/[a-zA-Z]/g.test(password)) {
        return {
            valid: false,
            reason: "Password must contain letters and numbers"
        }
    }

    return {
        valid: true
    }
}

module.exports = [
    {
        path: "captcha-project-validate-password",
        type: "POST",
        method: async (request, resolve) => {
            let userValidation = request.header("X-User-Validation")
            if (!userValidation) return resolve.status(400).send("Expects user validation");
        
            if (!request.header("X-Access-Token")) return resolve.status(499).send("An access token is required for this request")
            if (request.header("X-Access-Token") != process.env.ACCESSTOKEN) return resolve.status(498).send("An invalid access token was provided");

            userValidation = JSON.parse(userValidation)
            if (!(userValidation instanceof Object)) return resolve.status(400).send("User validation must be JSON object");
            if (!userValidation.password) return resolve.status(400).send("User validation must the password");

            resolve.send(JSON.stringify(validatePassword(userValidation.password)))
        }
    },
    {
        path: "captcha-project-validate-login",
        type: "POST",
        method: async (request, resolve) => {
            let userValidation = request.header("X-User-Validation")
            if (!userValidation) return resolve.status(400).send("Expects user validation");
        
            if (!request.header("X-Access-Token")) return resolve.status(499).send("An access token is required for this request")
            if (request.header("X-Access-Token") != process.env.ACCESSTOKEN) return resolve.status(498).send("An invalid access token was provided");

            userValidation = JSON.parse(userValidation)
            if (!(userValidation instanceof Object)) return resolve.status(400).send("User validation must be JSON object");
            if (!userValidation.username || !userValidation.password) return resolve.status(400).send("User validation must contain username and password");

            let data = await UserModel.findOne({
                Username: userValidation.username,
                Password: userValidation.password
            })

            if (data) { 
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
    {
        path: "captcha-project-signup",
        type: "POST",
        method: async (request, resolve) => {
            let userContent = request.header("X-User-Content")
            if (!userContent) return resolve.status(400).send("Expects user content");
        
            if (!request.header("X-Access-Token")) return resolve.status(499).send("An access token is required for this request")
            if (request.header("X-Access-Token") != process.env.ACCESSTOKEN) return resolve.status(498).send("An invalid access token was provided");

            userContent = JSON.parse(userContent)
            if (!(userContent instanceof Object)) return resolve.status(400).send("User content must be JSON object");
            if (!userContent.firstname || !userContent.lastname || !userContent.password) return resolve.status(400).send("User content must contain firstname, lastname and password");

            let result = validatePassword(userContent.password)
            if (!result.valid) {
                result.created = false
                return resolve.send(JSON.stringify(result))
            }

            let username = userContent.firstname.substr(0, 1).toLowerCase() + userContent.lastname.toLowerCase()

            let data = await UserModel.findOne({
                Username: username,
            })

            if (data) {
                let index = 2
                while (true) {
                    let tempUsername = username + index

                    let data = await UserModel.findOne({
                        Username: tempUsername,
                    })

                    if (!data) {
                        username = tempUsername
                        break
                    }

                    index++
                }
            }

            data = new UserModel({
                FirstName: userContent.firstname,
                LastName: userContent.lastname,
                Username: username,
                Password: userContent.password
            })
            data.save()

            resolve.send(JSON.stringify({
                created: true,
                username: username
            }))
        }
    },
]