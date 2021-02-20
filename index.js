require("dotenv").config()

const Express = require("express")
const Mongoose = require("mongoose")
const Domains = require("./modules/domains.js")
const Captchas = require("./modules/captchas.js")

/**
 * Startup
 */
Captchas.clearCaptchas()

const app = Express()
console.log("App created")

Mongoose.connect(`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBCLUSTER}.${process.env.DBDOMAIN}.mongodb.net/computer-science-data`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
console.log("App connected to DB")


/**
 * Initalization
 */
app.enable("trust proxy")

app.use(Express.json())
app.use((request, resolve, next) => {
    resolve.append('Access-Control-Allow-Origin', ['*'])
    resolve.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    resolve.append('Access-Control-Allow-Headers', '*')

    if (request.ips.length > 0 && !request.secure){
        return resolve.sendStatus(505)
    } else {
        next()
    }
})

Domains.forEach(domain => {
    if (domain.type == "POST") app.post(`/${domain.path}`, domain.method);
    else app.get(`/${domain.path}`, domain.method);
})


/**
 * Listeners
 */
app.listen(process.env.PORT)