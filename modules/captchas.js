const Mongoose = require("mongoose")

const CaptchaSchema = new Mongoose.Schema({
    Question: {
        type: String,
        required: [true, "Must have a question"]
    },
    Id: {
        type: String,
        required: [true, "Must have an id"]
    },
    Answer: {
        type: Number,
        required: [true, "Must have an answer"]
    },
    Completed: {
        type: Boolean,
        default: false
    }
})
const CaptchaModel = Mongoose.model("captchas", CaptchaSchema)

class Captchas {
    /**
     * Gets the captcha associated with the given id
     * @param {string} userId 
     * @returns {Mongoose.DocumentQuery<Mongoose.Document>}
     */
    static getCaptcha(id) {
        return CaptchaModel.findOne({
            Id: id
        })
    } 

    /**
     * Complete a captcha
     * @param {string} answer 
     */
    static completeCaptcha(id) {
        CaptchaModel.findOneAndUpdate({
            Id: id
        },
        {
            Completed: true
        })
    }

    /**
     * Generate a captcha
     * @param {string} id
     */
    static async generateCaptcha() {
        let id = Math.floor(Math.random() * 16777215).toString(16)

        const operators = ["+", "-", "*", "/"]
        let operator = operators[Math.floor(Math.random() * 4)]
        let number1 = Math.floor(Math.random() * 10)
        let number2 = Math.floor(Math.random() * 10)
        let answers = {
            "+": number1 + number2,
            "-": number1 - number2,
            "*": number1 * number2,
            "/": Math.round(number1 / number2 * 100) / 100
        }
        let answer = answers[operator]
        let question = `What is ${number1} ${operator} ${number2}?`
        if (answer % 1 != 0) question += " To 2 decimal places"

        let options = {
            Id: id,
            Question: question,
            Answer: answer
        }
        let data = new CaptchaModel(options)
        data.save()

        return options
    }

    /**
     * Delete all captchas
     */
    static clearCaptchas() {
        CaptchaModel.collection.deleteMany()
    }
}

module.exports = Captchas;