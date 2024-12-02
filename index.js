const puppeteer = require("puppeteer");
const xlsx = require("xlsx");

(async () => {
  const URL =
    "https://store.awwa.org/search?keywords=A100";
 // const proxyURL = 'gw.dataimpulse.com:823'
  const username = ''
  const password = ''

  const browser = await puppeteer.launch({
    headless: false,
    // args: [
    //   `--proxy-server=${proxyURL}`
    // ]
  });

  const page = await browser.newPage();

  await page.authenticate({
    username,
    password,
  })

  await page.goto(URL, { waitUntil: "networkidle2" });

  const title = await page.title();
  console.log(`Titulo de la pagina: ${title}`);

  let products = [];
  let nextPage = true;

  while (nextPage) {
    const newProducts = await page.evaluate(() => {
      const products = Array.from(
        document.querySelectorAll(".facets-items-collection-view-cell-span3")
      );
    
      return products.map((product) => {
        // Extract the title
        const title = product.querySelector(".facets-item-cell-grid-title span")?.innerText;
    
        // Extract "Your price"
        const yourPriceElement = product.querySelector(".product-views-price-lead");
        const yourPrice = yourPriceElement ? yourPriceElement.innerText.trim() : "N/A";
    
        // Extract "Member price"
        const memberPriceElement = product.querySelector(".product-views-price-for-member");
        const memberPrice = memberPriceElement ? memberPriceElement.innerText.trim() : "N/A";
    
        // Return the extracted data
        return {
          title,
          yourPrice,
          memberPrice,
        };
      });
    });

    products = [...products, ...newProducts];

     nextPage = await page.evaluate(() => {
      // Selecciona el elemento de la clase "global-views-pagination-next"
      const nextButton = document.querySelector(".global-views-pagination-next");
    
      if (nextButton) {
        const nextLink = nextButton.querySelector("a"); // Busca el enlace dentro del botón
    
        if (nextLink && nextLink.getAttribute("href")) {
          nextLink.click(); // Realiza clic en el enlace
          return true; // Devuelve true indicando que se hizo clic
        }
      }
    
      return false; // Devuelve false si no hay botón siguiente o no es clicable
    });
   

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(products)

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(products);
  const path = "products.xlsx";

  xlsx.utils.book_append_sheet(wb, ws, "Products");
  xlsx.writeFile(wb, path);

  // await browser.close();

})();
