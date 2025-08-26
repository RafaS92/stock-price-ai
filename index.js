import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
import { dates } from "./utils/dates.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

// Example tickers
const tickersArr = ["AAPL", "TSLA"];

async function fetchStockData(tickers) {
  try {
    const stockData = await Promise.all(
      tickers.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${process.env.POLYGON_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error fetching ${ticker}`);
        return { ticker, data: await response.json() };
      })
    );
    return stockData;
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

async function generateReport(stockData) {
  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "You are a financial analyst." },
        {
          role: "user",
          content: `Analyze this stock data and give buy/sell recommendations:\n${JSON.stringify(
            stockData,
            null,
            2
          )}`,
        },
      ],
    });

    return aiResponse.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI error:", err);
  }
}

async function main() {
  const stockData = await fetchStockData(tickersArr);
  if (stockData) {
    const report = await generateReport(stockData);
    console.log("Stock Report:\n", report);
  }
}

main();
