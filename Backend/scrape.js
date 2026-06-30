import puppeteer from "puppeteer";
import fsPromises from "fs/promises";

async function scrapeLeetcodeProblems() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    protocolTimeout: 0, // No timeout for large scraping jobs
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.5735.199 Safari/537.36",
  );

  await page.goto("https://leetcode.com/problemset/", {
    waitUntil: "domcontentloaded",
  });

  const problemSelector =
    "a.group.flex.flex-col.rounded-\\[8px\\].duration-300";

  let allproblems = [];
  let prevCount = 0;
  const TARGET_PROBLEM_COUNT = 2000;

  // Continuously scroll and load more problems until we reach the target count
  while (allproblems.length < TARGET_PROBLEM_COUNT) {
    await page.evaluate((sel) => {
      const currProblemsOnPage = document.querySelectorAll(sel);

      // Scroll to the last problem to trigger loading more problems
      if (currProblemsOnPage.length) {
        currProblemsOnPage[currProblemsOnPage.length - 1].scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, problemSelector);

    await page.waitForFunction(
      (sel, prev) => document.querySelectorAll(sel).length > prev,
      { timeout: 0 }, // No timeout - wait as long as needed
      problemSelector,
      prevCount,
    );

    // Extract all problem titles and URLs
    allproblems = await page.evaluate((sel) => {
      const nodes = Array.from(document.querySelectorAll(sel));

      return nodes.map((el) => ({
        title: el
          .querySelector(".ellipsis.line-clamp-1")
          ?.textContent.trim()
          .split(". ")[1],
        url: el.href,
      }));
    }, problemSelector);

    // Print progress for debugging
    console.log(`Problems found: ${allproblems.length}`);

    // Update the previous count
    prevCount = allproblems.length;
  }

  // console.log(allproblems);

  const problemsWithDescriptions = [];

  for (let i = 0; i < allproblems.length; i++) {
    const { title, url } = allproblems[i];

    const problemPage = await browser.newPage();

    try {
      await problemPage.goto(url, { timeout: 0 });

      let description = await problemPage.evaluate(() => {
        const descriptionDiv = document.querySelector(
          'div.elfjS[data-track-load="description_content"]',
        );

        const paragraphs = descriptionDiv.querySelectorAll("p");

        let collectedDescription = [];
        for (const p of paragraphs) {
          if (p.innerHTML.trim() === "&nbsp;") break;

          collectedDescription.push(p.innerHTML.trim());
        }

        return collectedDescription.filter((text) => text !== "").join(" ");
      });

      problemsWithDescriptions.push({ title, url, description });
    } catch (err) {
      console.error(`Error fetching description for ${title} (${url}): `, err);
    } finally {
      await problemPage.close();
    }
  }

  await fsPromises.mkdir("./problems", { recursive: true });

  await fsPromises.writeFile(
    "./problems/leetcode_problems.json",
    JSON.stringify(problemsWithDescriptions, null, 2),
  );

  await browser.close();
}



async function scrapeCodeforcesProblems() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.5735.199 Safari/537.36",
  );

  const problems = [];
  const TARGET = 30;

  for (let i = 1; i <= TARGET; i++) {
    const url = `https://codeforces.com/problemset/page/${i}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const problemSelector =
      "table.problems tr td:nth-of-type(2) > div:first-of-type > a";

    const links = await page.evaluate((sel) => {
      const anchors = document.querySelectorAll(sel);

      return Array.from(anchors).map((a) => a.href);
    }, problemSelector);

    for (let i = 0; i < 100; i++) {
      const link = links[i];

      try {
        await page.goto(link, { waitUntil: "domcontentloaded" });

        const { title, description } = await page.evaluate(() => {
          const title = document
            .querySelector(".problem-statement .title")
            .textContent.split(". ")[1];

          const description = document.querySelector(
            ".problem-statement > div:nth-of-type(2)",
          ).textContent;

          return { title, description };
        });

        problems.push({
          title,
          url: link,
          description,
        });
      } catch (err) {
        console.warn(`Failed to scrape ${link}: ${err.message}`);
      }
    }
  }

  await fsPromises.mkdir("./problems", { recursive: true });

  await fsPromises.writeFile(
    "./problems/codeforces_problems.json",
    JSON.stringify(problems, null, 2),
  );

  await browser.close();
}



async function scrapeCSESProblems() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.goto("https://cses.fi/problemset/", {
    waitUntil: "domcontentloaded",
  });

  const problemLinks = await page.evaluate(() => {
    const anchors = document.querySelectorAll("ul.task-list a");

    return Array.from(anchors).map((a) => ({
      title: a.textContent.trim(),
      url: "https://cses.fi" + a.getAttribute("href"),
    }));
  });

  console.log(`Found ${problemLinks.length} problems`);

  const problems = [];

  const TARGET = 400;

  for (let i = 0; i < Math.min(TARGET, problemLinks.length); i++) {
    const { title, url } = problemLinks[i];

    const problemPage = await browser.newPage();

    try {
      await problemPage.goto(url, { waitUntil: "domcontentloaded" });

      const description = await problemPage.evaluate(() => {
        const content = document.querySelector(".content");

        if (!content) return "";

        return content.innerText.trim();
      });

      problems.push({
        title,
        url,
        description,
      });

      console.log(`Scraped: ${title}`);
    } catch (err) {
      console.error(`Failed: ${title}`, err.message);
    } finally {
      await problemPage.close();
    }
  }

  await fsPromises.mkdir("./problems", { recursive: true });

  await fsPromises.writeFile(
    "./problems/cses_problems.json",
    JSON.stringify(problems, null, 2),
  );

  await browser.close();
}



async function scrapeCodeChefProblems() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    protocolTimeout: 0, // No timeout for large scraping jobs
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.5735.199 Safari/537.36",
  );

  const problems = [];
  const TARGET_PROBLEMS_PER_STAR = 80; // 80 problems per star level = 400 total

  // Star-wise difficulty URLs (1-star to 5-star)
  const starUrls = [
    "https://www.codechef.com/practice/1-star-difficulty-problems",
    "https://www.codechef.com/practice/2-star-difficulty-problems",
    "https://www.codechef.com/practice/3-star-difficulty-problems",
    "https://www.codechef.com/practice/4-star-difficulty-problems",
    "https://www.codechef.com/practice/5-star-and-above-problems",
  ];

  try {
    for (const starUrl of starUrls) {
      console.log(`\nScraping from: ${starUrl}`);

      try {
        await page.goto(starUrl, {
          waitUntil: "networkidle2",
          timeout: 0,
        });

        // Wait for the practice problems container to load
        await page.waitForSelector("[class*='_practiceProblemsContainer']", {
          timeout: 30000,
        });

        // Additional wait for JavaScript to render
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Extract problem titles and links from all practice module cards
        const problemData = await page.evaluate(() => {
          const problems = [];

          // Get all practice module cards (there are usually 2 per star page)
          const moduleCards = document.querySelectorAll(
            "[class*='_practiceModuleCard']",
          );

          moduleCards.forEach((card) => {
            // Within each card, find all problem rows
            const problemRows = card.querySelectorAll(
              "[class*='_practiceProblemRow']",
            );

            problemRows.forEach((row) => {
              const nameElement = row.querySelector(
                "[class*='_practiceProblemName']",
              );
              if (nameElement) {
                const link = nameElement.querySelector("a");
                if (link && link.href) {
                  problems.push({
                    title: link.textContent.trim(),
                    url: link.href,
                  });
                }
              }
            });
          });

          return problems;
        });

        console.log(`Found ${problemData.length} problems in this difficulty`);

        // Scrape descriptions for each problem (limit per star level)
        const limit = Math.min(TARGET_PROBLEMS_PER_STAR, problemData.length);

        for (let i = 0; i < limit; i++) {
          const { title, url: problemUrl } = problemData[i];

          try {
            await page.goto(problemUrl, {
              waitUntil: "networkidle2",
              timeout: 0,
            });

            // Wait for problem statement container
            await page.waitForSelector(
              "[class*='_problem-statement__container']",
              { timeout: 10000 },
            );

            // Additional wait for content to fully render
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const description = await page.evaluate(() => {
              // Get description from problem statement container
              const problemContainer = document.querySelector(
                "[class*='_problem-statement__container']",
              );

              if (problemContainer) {
                // Get text content, removing script and style elements
                const clone = problemContainer.cloneNode(true);
                const scripts = clone.querySelectorAll("script, style");
                scripts.forEach((s) => s.remove());
                return clone.textContent.trim();
              }
              return "";
            });

            if (title && description) {
              problems.push({
                title: title,
                url: problemUrl,
                description: description.substring(0, 1000),
              });
              console.log(`Scraped: ${title}`);
            } else {
              console.warn(`⚠️ Incomplete data for ${problemUrl}`);
            }

            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (err) {
            console.warn(`Failed to scrape ${problemUrl}: ${err.message}`);
          }
        }
      } catch (err) {
        console.error(`Error scraping ${starUrl}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`Error during CodeChef scraping: ${err.message}`);
  }

  await fsPromises.mkdir("./problems", { recursive: true });

  await fsPromises.writeFile(
    "./problems/codechef_problems.json",
    JSON.stringify(problems, null, 2),
  );

  console.log(`\n Saved ${problems.length} CodeChef problems`);

  await browser.close();
}


async function scrapeAtCoderProblems() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    protocolTimeout: 0,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.5735.199 Safari/537.36",
  );

  const problems = [];
  const START_CONTEST = 100;
  const END_CONTEST = 439; // Final range for all ABC contests

  for (
    let contestNum = START_CONTEST;
    contestNum <= END_CONTEST;
    contestNum++
  ) {
    const contestId = `abc${contestNum.toString().padStart(3, "0")}`;
    const tasksUrl = `https://atcoder.jp/contests/${contestId}/tasks`;
    try {
      await page.goto(tasksUrl, { waitUntil: "domcontentloaded", timeout: 0 });
      await page.waitForSelector(".table-responsive");
    } catch (err) {
      console.warn(`Contest page not found for ${contestId}, skipping...`);
      continue;
    }

    const contestProblems = await page.evaluate(() => {
      const problems = [];
      document.querySelectorAll(".table-responsive tbody tr").forEach((row) => {
        const link = row.querySelector("td a");
        if (link) {
          problems.push({
            title: link.textContent.trim(),
            url: link.href,
          });
        }
      });
      return problems;
    });

    for (const { title, url } of contestProblems) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

      await page.waitForSelector("#task-statement span.lang-en", {
        timeout: 0,
      });

      const description = await page.evaluate(() => {
        const en = document.querySelector("#task-statement span.lang-en");
        return en ? en.textContent.trim() : "[No description]";
      });

      problems.push({
        title,
        url,
        description: description.substring(0, 1000),
      });

      console.log(`Scraped: ${title}`);
    }
  }

  await fsPromises.mkdir("./problems", { recursive: true });
  await fsPromises.writeFile(
    "./problems/atcoder_problems.json",
    JSON.stringify(problems, null, 2),
  );

  await browser.close();
}


// scrapeLeetcodeProblems();

// scrapeCodeforcesProblems();

// scrapeCSESProblems();

// scrapeCodeChefProblems();

// scrapeAtCoderProblems();
