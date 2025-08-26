import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";
import { dates } from "./utils/dates.js"; // make sure this exists

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/generate-report", async (req, res) => {
  const { tickers } = req.body;
  console.log("Tickers received:", tickers);

  try {
    // 1️⃣ Fetch stock data from Polygon for each ticker
    const stockData = await Promise.all(
      tickers.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${process.env.POLYGON_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Polygon API error for ${ticker}: ${response.status}`
          );
        }

        const data = await response.json();
        return { ticker, data };
      })
    );

    const messages = [
      {
        role: "system",
        content:
          "You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stock performance and recommending whether to buy, hold, or sell.",
      },
      {
        role: "user",
        content: JSON.stringify(stockData, null, 2),
      },
    ];

    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
    });

    const report = response.choices[0].message.content;

    // 4️⃣ Send the report back to the frontend
    res.json({ report });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({
      report: "⚠️ There was an error generating the report. Check server logs.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
