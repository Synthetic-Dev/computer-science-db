const Mongoose = require("mongoose")
const Captchas = require("./captchas.js")

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
    usernames.forEach(async user => {
        let data = await UserModel.findOne({
            Username: user.Username
        })
        if (data) return;

        data = new UserModel(user)
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
        path: "captcha-project-captcha",
        type: "GET",
        method: async (request, resolve) => {
            let captchaData = request.header("X-Captcha-Data")
            if (!captchaData) return resolve.status(400).send("Expects captcha data");
        
            if (!request.header("X-Access-Token")) return resolve.status(499).send("An access token is required for this request")
            if (request.header("X-Access-Token") != process.env.ACCESSTOKEN) return resolve.status(498).send("An invalid access token was provided");

            captchaData = JSON.parse(captchaData)
            if (!(captchaData instanceof Object)) return resolve.status(400).send("Captcha data must be JSON object");
            if (!captchaData.get && !captchaData.try) return resolve.status(400).send("Captcha data must contain get or try");

            if (captchaData.get) {
                let captcha = await Captchas.generateCaptcha()
                resolve.send(JSON.stringify({
                    id: captcha.Id,
                    question: captcha.Question
                }))
            } else if (captchaData.try) {
                if (!captchaData.id || !captchaData.answer) return resolve.status(400).send("Captcha data must contain id and answer for try");

                let captcha = await Captchas.getCaptcha(captchaData.id)
                if (captcha) {
                    if (captchaData.answer == captcha.Answer) {
                        await Captchas.completeCaptcha(captchaData.id)
                        resolve.send(JSON.stringify({
                            completed: true
                        }))
                    } else {
                        resolve.send(JSON.stringify({
                            completed: false
                        }))
                    }
                } else {
                    resolve.status(400).send("Provided captcha id is invalid");
                }
            }
        }
    },
    {
        path: "captcha-project-validate-password",
        type: "GET",
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
            if (!userValidation.username || !userValidation.password || !userValidation.captchaid) return resolve.status(400).send("User validation must contain username, password and captcha id");

            let data = await UserModel.findOne({
                Username: userValidation.username,
                Password: userValidation.password
            })

            if (userValidation.captchaid == -1) {
                if (data) { 
                    resolve.send(JSON.stringify({
                        loggedin: false,
                        exists: true
                    }))
                } else {
                    resolve.send(JSON.stringify({
                        loggedin: false,
                        exists: false
                    }))
                }
            } else {
                let captcha = await Captchas.getCaptcha(userValidation.captchaid)

                if (captcha && data) {
                    if (captcha.Completed) {
                        resolve.send(JSON.stringify({
                            loggedin: true,
                            exists: true
                        }))
                    } else {
                        resolve.send(JSON.stringify({
                            loggedin: false,
                            exists: true
                        }))
                    }
                } else {
                    resolve.send(JSON.stringify({
                        loggedin: false,
                        exists: false
                    }))
                }
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
    {
        path: "captcha-project-user",
        type: "GET",
        method: async (request, resolve) => {
            let userValidation = request.header("X-User-Validation")
            if (!userValidation) return resolve.status(400).send("Expects user validation");
        
            if (!request.header("X-Access-Token")) return resolve.status(499).send("An access token is required for this request")
            if (request.header("X-Access-Token") != process.env.ACCESSTOKEN) return resolve.status(498).send("An invalid access token was provided");

            userValidation = JSON.parse(userValidation)
            if (!(userValidation instanceof Object)) return resolve.status(400).send("User validation must be JSON object");
            if (!userValidation.username || !userValidation.password || !userValidation.captchaid) return resolve.status(400).send("User validation must contain username, password and captcha id");

            let data = await UserModel.findOne({
                Username: userValidation.username,
                Password: userValidation.password
            })

            let captcha = await Captchas.getCaptcha(userValidation.captchaid)

            if (captcha && data) {
                if (captcha.Completed) {
                    resolve.send(JSON.stringify({
                        user: {
                            firstname: data.FirstName,
                            lastname: data.LastName,
                            username: data.Username
                        },
                        exists: true
                    }))
                } else {
                    resolve.send(JSON.stringify({
                        exists: true
                    }))
                }
            } else {
                resolve.send(JSON.stringify({
                    exists: false
                }))
            }
        }
    },
]