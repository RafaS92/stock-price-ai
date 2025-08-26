import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
import { dates } from "./utils/dates.js"; // your dates module

dotenv.config();

const app = express();
app.use(express.json()); // parse JSON bodies

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

app.post("/report", async (req, res) => {
  const { tickers } = req.body; // expect an array of tickers
  if (!tickers || tickers.length === 0) {
    return res.status(400).json({ error: "No tickers provided." });
  }

  try {
    // Fetch stock data for all tickers
    const stockDataArr = await Promise.all(
      tickers.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${process.env.POLYGON_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${ticker}`);
        const data = await response.json();
        return { ticker, data };
      })
    );

    // Optional: Send stock data to OpenAI for report
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are a financial analyst. Analyze stock data and give advice on whether to buy or sell each stock.",
        },
        {
          role: "user",
          content: `Analyze this stock data and provide a short buy/sell recommendation:\n${JSON.stringify(
            stockDataArr,
            null,
            2
          )}`,
        },
      ],
    });

    const report = aiResponse.choices[0].message.content;

    res.json({ report, stockData: stockDataArr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
