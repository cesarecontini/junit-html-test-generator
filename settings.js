module.exports = {
    testElements: {
        pageTestedPath: '/some-path',
        rootNodeSelector: '#main',
        childElementsSelector: '[id]',
        tagsToExclude: [],
        manuallyProvidedHtml : `
            <html>
                <head></head>
                <body id="main">
                    <div>
                        <p id="par-1">This is paragraph 1</p>
                        <p id="par-2">This is paragraph 2</p>
                        <p>
                            <a id="a-link" href="/some-link-path"></a>
                        </p>
                    </div>
                </body>
            </html>
        `,
        getHtmlViaPuppeteer: async (puppeteer) => {

            const prefixUrl = 'http://localhost:8080';
            const initialPage = `${prefixUrl}/some-path`;

            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            console.log(`About to go into ${initialPage}`);
            await page.goto(`${initialPage}`, {
                timeout: 0,
                waitUntil: 'networkidle2',
            });

            console.log('Got into page');

            // UNCOMMENT THIS IF YOU NEED TO LOGIN
            // console.log('Entering username & password');
            // await page.type('#login_field', 'some username');
            // await page.type('#password', 'some password');
            // await page.click('[id="signin"]'); // selector for login button
            // await page.waitForNavigation();
            console.log(`Loading ${initialPage}`);
            await page.goto(`${initialPage}`, {
                timeout: 0,
                waitUntil: 'networkidle2',
            });

            await page.screenshot({
                path: screenshot,
            });
            const html = await page.content();
            await browser.close();
            return html;
        }
    }
};