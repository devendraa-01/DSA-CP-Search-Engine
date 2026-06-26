# 🚀 DSA Problem Search Engine

A full-stack search engine that aggregates and indexes Data Structures & Algorithms (DSA) problems from multiple competitive programming platforms using web scraping and information retrieval techniques.

---

## 🔍 Overview

This project solves a common problem faced by competitive programmers: **discovering relevant problems efficiently across platforms**.

I built a scalable pipeline that:

* Scrapes problems from multiple platforms
* Processes and indexes them using **TF-IDF**
* Provides a fast and intuitive search interface

---

## ✨ Key Features

* 🌐 **Multi-Platform Aggregation**
  Collects problems from:

  * LeetCode
  * Codeforces
  * CodeChef
  * AtCoder
  * CSES

* ⚡ **Efficient Search (TF-IDF Matrix)**

  * Implements **term frequency–inverse document frequency (TF-IDF)**
  * Ranks problems based on relevance to user queries
  * Supports natural keyword-based search

* 🕷️ **Automated Web Scraping**

  * Built using **Puppeteer**
  * Extracts problem titles, links, and descriptions
  * Handles dynamic content loading

* 🧠 **Custom Search Engine Logic**

  * Preprocessing pipeline (tokenization, normalization)
  * Vector space model for similarity scoring

* 🎨 **Modern UI**

  * Dark-themed responsive interface
  * Fast and user-friendly search experience

---

## 🏗️ Tech Stack

**Frontend**

* HTML, CSS (Dark UI)
* JavaScript (Fetch API)

**Backend**

* Node.js
* Express.js

**Search / NLP**

* TF-IDF (Natural.js)

**Scraping**

* Puppeteer (Headless Chrome)

---

## 📂 Project Structure

```
logos/              # Platform logos
problems/           # Scraped dataset (JSON files)
corpus/             # Reserved for advanced NLP features
utils/              # Helper modules (preprocessing, etc.)

index.html          # Frontend UI
styles.css          # Styling (dark theme)
script.js           # Frontend logic

index.js            # Express backend + search API
scrape.js           # Web scraping pipeline

package.json        # Dependencies
README.md           # Documentation
```

---

## ⚙️ How It Works

1. **Scraping Phase**

   * Puppeteer crawls each platform
   * Extracts problem metadata
   * Stores structured JSON data

2. **Preprocessing**

   * Cleans and tokenizes text
   * Builds TF-IDF vectors

3. **Search Phase**

   * User enters a query
   * Query is vectorized
   * Cosine similarity used to rank problems

---

## 🚀 Getting Started

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Run Scraper

```bash
node scrape.js
```

### 3️⃣ Start Backend

```bash
node index.js
```

### 4️⃣ Open Frontend

Open `index.html` in your browser.

---

## 📊 Example Use Cases

* Find problems related to **"Graphs"**
* Discover similar problems across platforms
* Practice topic-wise DSA questions efficiently

---

## 🔧 Customization

* Modify scraping limits in `scrape.js`
* Extend preprocessing in `utils/`
  
---

## 👨‍💻 Author

**Devendra Pratap Singh**

* Passionate about DSA, systems, and backend engineering
* Built this project to combine **CP + system design + IR concepts**

---

## 📜 License

MIT License
