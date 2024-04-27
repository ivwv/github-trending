const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const host = `https://github.com/`;

const writeToFile = (fileName, message) => {
  fs.appendFileSync(fileName, `${message}`);
};
function createMarkdown(date, filename) {
  fs.writeFileSync(filename, `# ${date}\n`);
}

async function scrapeTrending(url, title, filename) {
  const response = await axios.get(url).catch((err) => {
    console.log(err);
  });
  const $ = cheerio.load(response.data);
  const items = $("div.Box article.Box-row");

  const trendingMarkdown = `## Trending-${title}\n`;

  handlerHtmlToMd($, items, trendingMarkdown, filename);
}

async function scrapeLanguages(languages, filename) {
  const promises = languages.map(async (language) => {
    const url = `${host}/trending/${language}`;
    const response = await axios.get(url).catch((err) => {
      console.log(err);
    });
    const $ = cheerio.load(response.data);
    const items = $("div.Box article.Box-row");
    const languageMarkdown = `## ${language}\n`;

    handlerHtmlToMd($, items, languageMarkdown, filename);
  });

  await Promise.allSettled(promises);
}

const handlerHtmlToMd = ($, items, trendingMarkdown, filename) => {
  const repos = items
    .map((_, element) => {
      const title = $(element)
        .find(".lh-condensed a")
        .text()
        .trim()
        .replaceAll("\n", "")
        .replaceAll(" ", "");
      const description = $(element).find("p.col-9").text().trim().replaceAll("\n", "");
      const url = "https://github.com" + $(element).find(".lh-condensed a").attr("href");
      const language = $(element).find("span[itemprop='programmingLanguage']").text().trim();
      const star = $(element).find(".octicon-star").parent().text().trim().replace(/\s+/g, " ");
      const [starCount, todayCount, todayLabel] = star.split(" ");

      const starShields = `![GitHub Repo stars](https://img.shields.io/github/stars/${title})`;
      const formattedResult = `${starShields} ; ${todayLabel} stars today`;
      const languageShields = `![${language}](https://img.shields.io/badge/${language}-white?logo=${language}&logoColor=blue)`;
      const forkShields = `![GitHub forks](https://img.shields.io/github/forks/${title})        `;
      const repoMarkdown = `> [${title}](${url}) ${languageShields} : ( ${formattedResult} ; ${forkShields} ) \n > ${description}\n\n`;
      return repoMarkdown;
    })
    .get();

  writeToFile(filename, trendingMarkdown);
  repos.forEach((repo) => writeToFile(filename, repo));
};

(async () => {
  const date = new Date().toISOString().slice(0, 10);
  const year = date.slice(0, 4);
  if (!fs.existsSync(year)) {
    fs.mkdirSync(year);
  }
  const filename = path.join(__dirname, `${year}/${date}.md`);

  // First, scrape the trending repositories
  createMarkdown(date, filename);
  await scrapeTrending(`${host}/trending?since=dail`, "daily", filename);
  await scrapeTrending(`${host}/trending?since=weekl`, "weekly", filename);
  await scrapeTrending(`${host}/trending?since=monthl`, "monthly", filename);

  const languages = [
    "javascript",
    "python",
    "java",
    "typescript",
    "php",
    "ruby",
    "go",
    "c#",
    "swift",
    "kotlin",
    "rust",
    "c++",
    "shell",
    "html",
    "css",
    "dart",
    "objective-c",
    "vue",
    "react",
    "angular",
    "assembly",
  ];

  // Then, scrape repositories for specified languages
  await scrapeLanguages(languages, filename);
})();
