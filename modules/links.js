const Mongoose = require("mongoose")
const Settings = require("../settings.json")

const LinkSchema = new Mongoose.Schema({
    DiscordId: {
        type: String,
        required: [true, "Must have a discordId"]
    },
    UserId: {
        type: String,
        required: [true, "Must have a userId"]
    }
})
const LinkModel = Mongoose.model("links", LinkSchema)

const LinkCodeSchema = new Mongoose.Schema({
    Code: {
        type: String,
        required: [true, "Must have a code"]
    },
    Id: {
        type: String,
        required: [true, "A code must have an associated user"]
    },
    CreatedAt: {
        type: Date,
        default: Date.now()
    }
})
const LinkCodeModel = Mongoose.model("linkcodes", LinkCodeSchema)

class Links {
    /**
     * Gets the link associated with the given id
     * @param {string} userId 
     * @returns {Mongoose.DocumentQuery<Mongoose.Document>}
     */
    static getLink(id) {
        return LinkModel.findOne().or([
            {UserId: id},
            {DiscordId: id}
        ])
    }
    
    /**
     * Gets the link associated with a userId
     * @param {string} userId 
     * @returns {Mongoose.DocumentQuery<Mongoose.Document>}
     */
    static getDiscordLink(userId) {
        return LinkModel.findOne({
            UserId: userId
        })
    }

    /**
     * Gets the link associated with a discordId
     * @param {string} discordId 
     * @returns {Mongoose.DocumentQuery<Mongoose.Document>}
     */
    static getRobloxLink(discordId) {
        return LinkModel.findOne({
            DiscordId: discordId
        })
    }

    /**
     * Link accounts
     * @param {string} userId 
     * @param {string} discordId 
     * @returns {Promise<Array>}
     */
    static async linkAccounts(userId, discordId) {
        if (await this.getLink(userId)) {
            return [false, "Provided UserId already has a linked account"]
        }

        if (await this.getLink(discordId)) {
            return [false, "Provided DiscordId already has a linked account"]
        }

        let link = new LinkModel({
            DiscordId: discordId,
            UserId: userId
        })
        link.save()

        return [true, ""]
    }

    /**
     * Unlink accounts
     * @param {string} id 
     * @returns {Promise<Array>}
     */
    static async unlinkAccounts(id) {
        if (await this.getDiscordLink(id)) {
            let link = await LinkModel.findOneAndDelete({
                UserId: id
            })

            if (link) {
                return [true, ""]
            }
            return [false, "Failed to find and delete account link"]
        }

        if (await this.getRobloxLink(id)) {
            let link = await LinkModel.findOneAndDelete({
                DiscordId: id
            })

            if (link) {
                return [true, ""]
            }
            return [false, "Failed to find and delete account link"]
        }

        return [false, "There is no link containing that id"]
    }

    /**
     * Check for a linkcode associated with the id
     * @param {string} code 
     */
    static async getIdByCode(code) {
        let data = await LinkCodeModel.findOne({
            Code: code
        })

        if (!data) return;
        if (data.CreatedAt + Settings.Linkcodes.Timeout*1000 < Date.now()) return;
        return data.Id
    }

    /**
     * Check for a linkcode associated with the id
     * @param {string} id 
     */
    static async getCode(id) {
        let data = await LinkCodeModel.findOne({
            Id: id
        })

        if (!data) return;
        if (data.CreatedAt + Settings.Linkcodes.Timeout*1000 < Date.now()) return;
        return data.Code
    }

    /**
     * Use a code
     * @param {string} code 
     */
    static async useCode(code) {
        let data = await LinkCodeModel.findOneAndDelete({
            Code: code
        })
        return !!data
    }

    /**
     * Generate a code
     * @param {string} id
     */
    static async generateCode(id) {
        let code = await this.getCode(id)
        if (code) return code;
        code = Math.floor(Math.random() * Settings.Linkcodes.Max).toString(Settings.Linkcodes.Base)

        let data = new LinkCodeModel({
            Code: code,
            Id: id
        })
        data.save()

        return code
    }

    /**
     * Delete all codes
     */
    static clearCodes() {
        LinkCodeModel.collection.deleteMany()
    }
}

module.exports = Links;