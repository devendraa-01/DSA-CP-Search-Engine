import fsPromises from "fs/promises";
import path from "path";

async function mergeProblemData(){
    const codeforcesPath = path.resolve("./problems/codeforces_problems.json");
    const leetcodePath = path.resolve("./problems/leetcode_problems.json");
    const csesPath = path.resolve("./problems/cses_problems.json");
    const codechefPath = path.resolve("./problems/codechef_problems.json");
    const atcoderPath = path.resolve("./problems/atcoder_problems.json");

    const codeforcesData = JSON.parse(
        await fsPromises.readFile(codeforcesPath, "utf-8")
    );

    const leetcodeData = JSON.parse(
        await fsPromises.readFile(leetcodePath, "utf-8")
    );

    const csesData = JSON.parse(
        await fsPromises.readFile(csesPath, "utf-8")
    );

    const codechefData = JSON.parse(
        await fsPromises.readFile(codechefPath, "utf-8")
    );

    const atcoderData = JSON.parse(
        await fsPromises.readFile(atcoderPath, "utf-8")
    );

    const combined = [...codeforcesData , ...leetcodeData , ...csesData , ...codechefData , ...atcoderData];

    await fsPromises.mkdir("./corpus", { recursive: true });

    await fsPromises.writeFile(
        "./corpus/all_problems.json",
        JSON.stringify(combined, null, 2)
    );

    console.log(`Merged ${combined.length} total problems:`);
    console.log(`   - Codeforces: ${codeforcesData.length}`);
    console.log(`   - LeetCode: ${leetcodeData.length}`);
    console.log(`   - Cses: ${csesData.length}`);
    console.log(`   - CodeChef: ${codechefData.length}`);
    console.log(`   - AtCoder: ${atcoderData.length}`);
}

mergeProblemData();