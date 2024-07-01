const puppeteer = require('puppeteer');

async function extractContentFromUrl(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const content = await page.evaluate(() => {
      const title = document.querySelector('title')?.innerText || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
      const bodyText = document.body.innerText;
      
      return {
        title,
        metaDescription,
        bodyText: bodyText.slice(0, 5000) // Limit to first 5000 characters
      };
    });
    
    await browser.close();
    return content;
  } catch (error) {
    console.error('Error extracting content:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { extractContentFromUrl };