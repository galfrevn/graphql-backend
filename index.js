import { gql, ApolloServer, UserInputError } from "apollo-server-express";
import { GraphQLUpload, graphqlUploadExpress } from "graphql-upload";
import "./db.js";
import Food from "./models/food.js";
import express from "express";

import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import { randomBytes } from "crypto";
const __filename = fileURLToPath(import.meta.url);

const typeDefs = gql`
  scalar Upload

  enum YesNo {
    YES
    NO
  }

  #TODO Array of types
  type Food {
    name: String!
    type: String
    price: Int!
    description: String
    slug: String!
    stimatedTime: Int
    image: String
    stars: Float
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
    url: String
  }

  type Query {
    foodsCount: Int!
    foods(hasDescription: YesNo): [Food]
    findFood(slug: String!): Food
    findFoodByType(type: String): [Food]
    foodsBySlug(slug: [String]): [Food]
    getTypes: [String]
    searchFoods(search: String): [Food]
  }

  type Mutation {
    addFood(
      name: String!
      type: String
      price: Int!
      description: String!
      stimatedTime: Int
      image: String
      stars: Float
    ): Food
    editPrice(name: String!, price: Int!): Food
    deleteFood(slug: String!): Food
    uploadFile(file: Upload!): File!
  }
`;

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    foodsCount: () => Food.collection.countDocuments(),
    foods: async (root, args) => {
      if (!args.hasDescription) {
        return Food.find({});
      } else {
        return Food.find({
          description: { $exists: args.hasDescription === "YES" },
        });
      }
    },
    findFood: async (root, args) => {
      const { slug } = args;
      return Food.findOne({ slug });
    },
    findFoodByType: async (root, args) => {
      const { type } = args;
      return Food.find({ type });
    },
    foodsBySlug: async (root, args) => {
      const { slug } = args;
      return Food.find({ slug });
    },
    getTypes: async (root, args) => {
      const foods = await Food.find({});
      const types = foods.map((food) => food.type);
      return [...new Set(types)];
    },
    searchFoods: async (root, args) => {
      const { search } = args;
      const foods = await Food.find({});
      const filteredFoods = foods.filter((food) =>
        food.name.toLowerCase().includes(search.toLowerCase())
      );
      return filteredFoods;
    },
  },

  Mutation: {
    addFood: async (root, args) => {
      const food = new Food({
        ...args,
        slug: args.name.replace(/ /g, "-").toLowerCase(),
      });
      try {
        await food.save();
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args });
      }
      return food;
    },
    editPrice: async (root, args) => {
      const { name, price } = args;

      const food = await Food.findOne({ name });
      if (!food) return;

      food.price = price;
      try {
        await food.save();
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args });
      }
      return food;
    },
    deleteFood: async (root, args) => {
      const food = await Food.findOne({ slug: args.slug });
      return food.remove();
    },
    uploadFile: async (root, { file }) => {
      const { createReadStream, filename, encoding, mimetype } = await file;
      const stream = createReadStream();

      const __dirname = path.dirname(__filename);
      fs.mkdirSync(path.join(__dirname, "/public/images"), { recursive: true });

      const output = fs.createWriteStream(
        path.join(
          __dirname,
          "/public/images",
          `${filename}`
        )
      );

      stream.pipe(output);

      await new Promise(function (resolve, reject) {
        output.on("close", () => {
          console.log("File uploaded");
          resolve();
        });

        output.on("error", (err) => {
          console.log(err);
          reject(err);
        });
      });

      const url = `http://localhost:4000/images/${filename}`;

      return { filename, mimetype, encoding, url };
    },
  },
};

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    uploads: {
      maxFileSize: 10000000,
      maxFiles: 10,
    },
  });
  await server.start();

  const app = express();
  
  const __dirname = path.dirname(__filename);
  app.use("/images", express.static(path.join(__dirname, "/public/images")));
  
  app.use(graphqlUploadExpress());
  server.applyMiddleware({ app });

  await new Promise((r) => app.listen({ port: 4000 }, r));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
