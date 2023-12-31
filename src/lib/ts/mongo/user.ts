import mongoose from 'mongoose';
import db from '$lib/ts/mongo/db';

import { encoderChan } from '../baseEncoder/EncoderChan';

db();

const reqString = {
    type: String,
    required: true,
}

const userSchema = new mongoose.Schema({
    _id:  reqString,
    username: reqString,
    password: reqString,
    apiKey: reqString,
    bins: Array,
    images: Array,
});

export type UserSchema = {
    _id: string;
    username: string;
    password: string;
    apiKey: string;
    bins: Array<string>;
    images: Array<string>;
}

class User {
    model: any;
    upsert: { upsert: boolean; };
    constructor() {
        this.model = mongoose.model('users', userSchema);
        this.upsert = { upsert: true };
    }
    makeId(length: number) {
        var result = [];
        var characters = 'abcdefghijklmnopqrstuvwxyz012345678901234567890123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
        }
        return result.join('');
    }
    async create(username: string, password: string): Promise<UserSchema> {
        let Id = this.makeId(10);
        let apiKey = this.makeId(32);
        await this.model.findByIdAndUpdate(
            { _id: Id },
            { _id: Id, username, password: encoderChan.hash(password), apiKey: encoderChan.encode(apiKey), bins: [] },
            this.upsert,
        );
        return await this.model.findById(Id);;
    }

    async get(Id: string) {
        if(!Id) return await this.model.find();
        return await this.model.findById(Id);
    }

    async getByUsername(username: string) {
        return await this.model.findOne({ username: username });
    }

    async getByApiKey(apiKey: string | null) {
        return await this.model.findOne({ apiKey: encoderChan.encode(apiKey) });
    }

    async update(Id: string, username: string) {
        let apiKey = this.makeId(32);
        return await this.model.findByIdAndUpdate(
            { _id: Id },
            { _id: Id, username, apiKey },
            this.upsert,
        );
    }

    async addBin(Id: string, binId: string) {
        return await this.model.findByIdAndUpdate(
            { _id: Id },
            { $push: { bins: binId } },
            this.upsert,
        );
    }

    async removeBin(Id: string, binId: string) {
        return await this.model.findByIdAndUpdate(
            { _id: Id },
            { $pull: { bins: binId } },
            this.upsert,
        );
    }

    async searchForImage(imageId: string): Promise<any> {
        const users = await this.model.find();
        for(let i = 0; i < users.length; i++) {
            if(users[i].images.includes(imageId)) return users[i];
        }
    }

    async addImage(Id: string, imageId: string) {
        const user = await this.get(Id);
        if(!user) return;
        if(user.images.includes(imageId)) return;
        return await this.model.findByIdAndUpdate(
            { _id: Id },
            { $push: { images: imageId } },
            this.upsert,
        );
    }

    async removeImage(Id: string, imageId: string) {
        return await this.model.findByIdAndUpdate(
            { _id: Id },
            { $pull: { images: imageId } },
            this.upsert,
        );
    }

    async delete(Id: string) {
        return await this.model.findByIdAndDelete(Id);
    }
}

export default new User();