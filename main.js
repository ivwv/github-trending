const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
// const { HttpProxyAgent } = require("http-proxy-agent");
// const httpsAgent = new HttpProxyAgent("http://127.0.0.1:7899");
const writeToFile = (fileName, message) => {
  fs.appendFileSync(fileName, `${message}`);
};

function createMarkdown(date, filename) {
  fs.writeFileSync(filename, `# ${date}\n`);
}

async function scrape(languages, filename) {
  const promises = languages.map(async (language) => {
    const url = `https://github.com/trending/${language}`;
    const response = await axios.get(url, { httpsAgent, proxy: true }).catch((err) => {
      console.log(err);
    });
    const $ = cheerio.load(response.data);
    const items = $("div.Box article.Box-row");
    const languageMarkdown = `## ${language}\n`;

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
        const repoMarkdown = `> [${title}](${url}):( ${formattedResult} ; Fork:${fork} )\n> ${description}\n\n`;
        return repoMarkdown;
      })
      .get();

    writeToFile(filename, languageMarkdown);
    repos.forEach((repo) => writeToFile(filename, repo));
  });

  await Promise.allSettled(promises);
}

(async () => {
  const date = new Date().toISOString().slice(0, 10);
  const year = date.slice(0, 4);
  if (!fs.existsSync(year)) {
    fs.mkdirSync(year);
  }
  const filename = path.join(__dirname, `${year}/${date}.md`);
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
  createMarkdown(date, filename);
  await scrape(languages, filename);
})();
