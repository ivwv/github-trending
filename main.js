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
  console.log(`Scraped ${title} repositories`);
}

/**
 * Due to the large amount of data, you will request tens of thousands of shields pictures and cancel the use of shields pictures
 */
// const handlerHtmlToMd = ($, items, trendingMarkdown, filename) => {
//   const repos = items
//     .map((_, element) => {
//       const title = $(element)
//         .find(".lh-condensed a")
//         .text()
//         .trim()
//         .replaceAll("\n", "")
//         .replaceAll(" ", "");
//       const description = $(element).find("p.col-9").text().trim().replaceAll("\n", "");
//       const url = "https://github.com" + $(element).find(".lh-condensed a").attr("href");
//       const language = $(element).find("span[itemprop='programmingLanguage']").text().trim();
//       const star = $(element).find(".octicon-star").parent().text().trim().replace(/\s+/g, " ");
//       const [starCount, todayCount, todayLabel] = star.split(" ");

//       const starShields = `![GitHub Repo stars](https://img.shields.io/github/stars/${title})`;
//       const formattedResult = `${starShields} ; ${todayLabel} stars today`;
//       const languageShields = `![${language}](https://img.shields.io/badge/${language}-white?logo=${language}&logoColor=blue)`;
//       const forkShields = `![GitHub forks](https://img.shields.io/github/forks/${title})        `;
//       const repoMarkdown = `> [${title}](${url}) ${languageShields} : ( ${formattedResult} ; ${forkShields} ) \n > ${description}\n\n`;
//       return repoMarkdown;
//     })
//     .get();

//   writeToFile(filename, trendingMarkdown);
//   repos.forEach((repo) => writeToFile(filename, repo));
// };

const handlerHtmlToMd = ($, items, trendingMarkdown, filename) => {
  const repos = items
      .map((index, element) => {
        const title = $(element)
          .find(".lh-condensed a")
          .text()
          .trim()
          .replaceAll("\n", "")
          .replaceAll(" ", "");
        const description = $(element).find("p.col-9").text().trim().replaceAll("\n", "");
        const url = "https://github.com" + $(element).find(".lh-condensed a").attr("href");
        const star = $(element).find(".octicon-star").parent().text().trim().replace(/\s+/g, " ");
        const [starCount, todayCount, todayLabel] = star.split(" ");
        const formattedResult = `${starCount}: ${todayCount} ; ${todayLabel} stars today`;
        const fork = $(element)
          .find(".octicon-repo-forked")
          .parent()
          .text()
          .trim()
          .replaceAll("\n", "");
        const repoMarkdown = `> [${title}](${url}):( ${formattedResult} ; Fork:${fork} ) \n > ${description}\n\n`;
        return repoMarkdown;
      })
      .get();

    writeToFile(filename, languageMarkdown);
    repos.forEach((repo) => writeToFile(filename, repo));
  });
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
  await scrapeTrending(`${host}/trending?since=monthly`, "monthly", filename);

  // Languages
  const languages = [
    "javascript",
    "typescript",
    "vue",
    "react",
    "css",
    "html",
    "angular",
    "java",
    "go",
    "shell",
    "python",
    "php",
    "ruby",
    "rust",
    "c#",
    "swift",
    "kotlin",
    "c++",
    "dart",
    "objective-c",
    "assembly",
  ];
  // Then, scrape repositories for specified languages
  for (let i = 0; i < languages.length; i++) {
    const language = languages[i];
    await scrapeTrending(`${host}/trending/${language}`, language, filename);
  }
})();
