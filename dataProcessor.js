const fs = require("fs");
const csv = require("csv-parser");

// Function to process the CSV and extract data
const processCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const trainingData = [];
        const target7Day = [];
        const coarseAggregateMap = {
            Crushed: 0,
            Natural: 1,
        };

        const fineAggregateMap = {
            Crushed: 0,
            Natural: 1,
        };

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                const typeCoarseAgg = coarseAggregateMap[row["Type_of_course_Aggregate"]] ?? NaN;
                const typeFineAgg = fineAggregateMap[row["Type_of_fine_Aggregate_"]] ?? NaN;
                const cementOpc = parseFloat(row["Cement_O.P.C_(Kg/m3)"]);
                const sizeCoarseAgg = parseFloat(row["Max._Size_of_Coarse_Aggregate_(mm)"]);
                const waterContent = parseFloat(row["Water_Content_(Kg/m3)"]);
                const wcRatio = parseFloat(row["W/C_Ratio"]);

                const strength7Day = parseFloat(row["7_day_str"]);


                // Add valid rows to the training and target datasets
                if (
                    !isNaN(typeCoarseAgg) &&
                    !isNaN(typeFineAgg) &&
                    !isNaN(cementOpc) &&
                    !isNaN(sizeCoarseAgg) &&
                    !isNaN(waterContent) &&
                    !isNaN(wcRatio)
                ) {
                    trainingData.push([
                        typeCoarseAgg,
                        typeFineAgg,
                        cementOpc,
                        sizeCoarseAgg,
                        waterContent,
                        wcRatio,
                    ]);

                    if (!isNaN(strength7Day)) target7Day.push(strength7Day);
                }
            })
            .on("end", () => {
                resolve({ trainingData, target7Day });
            })
            .on("error", (error) => {
                reject(error);
            });
    });

};

module.exports = { processCSV };
