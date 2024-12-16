const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors package
const { processCSV } = require("./dataProcessor");
const KNN = require("ml-knn");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

let knn7Day, knn28Day;

// Load the CSV data and train the models on server start
processCSV("2500 Concrete design mixes.csv")
    .then(({ trainingData, target7Day, target28Day }) => {
        console.log("Training Data:", trainingData);
        console.log("Target 7-Day Strength:", target7Day);
        console.log("Target 28-Day Strength:", target28Day);

        // Ensure the arrays are not empty
        if (trainingData.length === 0 || target7Day.length === 0 || target28Day.length === 0) {
            throw new Error("Training data or target arrays are empty. Check your CSV file or parsing logic.");
        }

        // Train the KNN models
        knn7Day = new KNN(trainingData, target7Day, { k: 3 });
        knn28Day = new KNN(trainingData, target28Day, { k: 3 });
        console.log("KNN models trained successfully!");
    })
    .catch((error) => {
        console.error("Error processing CSV:", error.message);
    });

// Endpoint to predict 7-day and 28-day strength
app.post("/predict-strength", (req, res) => {
    const { typeCoarseAgg, typeFineAgg, cementOpc, sizeCoarseAgg } = req.body;

    if (
        typeCoarseAgg === undefined ||
        typeFineAgg === undefined ||
        cementOpc === undefined ||
        sizeCoarseAgg === undefined
    ) {
        return res.status(400).json({ error: "Missing required input fields." });
    }

    const inputData = [typeCoarseAgg, typeFineAgg, cementOpc, sizeCoarseAgg];

    try {
        const predicted7Day = knn7Day.predict([inputData])[0];
        const predicted28Day = knn28Day.predict([inputData])[0];
        res.json({ predicted7Day, predicted28Day });
    } catch (error) {
        res.status(500).json({ error: "Error making predictions." });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
