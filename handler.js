const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const ADS_TABLE = process.env.ADS_TABLE;

const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/users/:userId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

app.get("/users", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  let scanResults = [];
  let items;
  try {
    do {
      items = await dynamoDbClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    res.json({ users: items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not list users" });
  }
});

app.post("/users", async function (req, res) {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ userId, name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/ads", async function (req, res) {
  const { adsId, titulo } = req.body;
  if (typeof adsId !== "string") {
    res.status(400).json({ error: '"adsId" must be a string' });
  } else if (typeof titulo !== "string") {
    res.status(400).json({ error: '"Titulo" must be a string' });
  }

  const params = {
    TableName: ADS_TABLE,
    Item: {
      adsId: adsId,
      titulo: titulo,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ adsId, titulo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create ADS" });
  }
});

app.get("/ads", async function (req, res) {
  const params = {
    TableName: ADS_TABLE,
  };

  let scanResults = [];
  let items;
  try {
    do {
      items = await dynamoDbClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    res.json({ ads: items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not list ads" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Não Encontrado",
  });
});

module.exports.handler = serverless(app);
