require("dotenv").config()

const Express = require("express")
const Mongoose = require("mongoose")
const Domains = require("./modules/domains.js")

/**
 * Startup
 */
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
    if (request.ips.length > 0 && !request.secure){
        return resolve.sendStatus(505)
    } else {
        next()
    }
})

Domains.forEach(domain => {
    app.get(`/${domain.name}`, (request, resolve) => {
        domain.method(request, resolve)
    })
})


/**
 * Listeners
 */
app.listen(process.env.PORT)