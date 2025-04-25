import express from "express";
import axios from "axios";
import { JSDOM } from "jsdom";
import cors from "cors";

const app = express();
const PORT = 3000;

// Habilita CORS para permitir requisições do frontend
app.use(cors());

app.get("/api/scrape", async (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ error: "A palavra-chave é obrigatória." });
  }

  const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;

  try {
    // Configura os cabeçalhos para a requisição
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Connection": "keep-alive",
      },
    });

    const dom = new JSDOM(data);
    const document = dom.window.document;

    const products = [];

    const items = document.querySelectorAll('[data-component-type="s-search-result"]');

    items.forEach(item => {
      const title = item.querySelector("h2 span")?.textContent?.trim() || "Sem título";
      const rating = item.querySelector('[aria-label$="out of 5 stars"]')?.getAttribute("aria-label") || "Sem avaliação";
      const reviews = item.querySelector('[aria-label$=" ratings"]')?.textContent?.trim() || "0";
      const img = item.querySelector("img")?.getAttribute("src") || "";

      if (title && img) {
        products.push({ title, rating, reviews, img });
      }
    });

    res.json({ keyword, results: products });
  } catch (error) {
    console.error(error);
    const errorMessage = error.response ? error.response.data : error.message;
    const errorStatus = error.response ? error.response.status : 500;

    res.status(errorStatus).json({
      error: "Falha ao realizar o scraping",
      details: {
        message: errorMessage,
        code: error.code,
        status: errorStatus,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
