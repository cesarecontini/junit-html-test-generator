# junit-html-test-generator

junit-html-test-generator is a CLI utility, code generator tool to create JUNIT tests for the JAVA SPRING BOOT to assert HTML given a chunk of HTML is manually provided or accessed via puppeteer.

## GET STARTED

First of all install the package globally:

```
npm install -g junit-html-test-generator
```

Once the package is installed if you run the command with the -h option you should get the following help information and this means the package is installed correctly:

```
junit-html-test-generator -h

  Usage: junit-html-test-generator -i junit-html-test-generator


  Options:

    -V, --version   output the version number
    -i --init       Initialize settings file
    -p --puppeteer  Retrieve html from a remote page using puppeteer!
    -m --manual     Provide your own html manually!
    -a, --about     About junit-html-test-generator cli
    -h, --help      output usage information

```

At this stage CD to a folder of your choice and initialize the settings file by running:

```
junit-html-test-generator -i
```

This will create the `junit-html-test-generator-settings.js` settings file. The `testElements` node defines some properties and a call back function.

The file looks pretty much as this:

```
module.exports = {
    testElements: {
        pageTestedPath: '/some-path',
        rootNodeSelector: 'body',
        childElementsSelector: '[id]',
        tagsToExclude: ['input', 'form', 'select', 'table'],
        manuallyProvidedHtml : `
            <html>
                <head></head>
                <body id="main">
                    <div>
                        <p id="par-1">This is paragraph 1</p>
                        <p id="par-2">This is paragraph 2</p>
                        <p>
                            <a id="a-link" href="/some-link-path">A link label</a>
                        </p>
                    </div>
                </body>
            </html>
        `,
        getHtmlViaPuppeteer: async (puppeteer) => {

            const prefixUrl = 'https://duckduckgo.com';
            const initialPage = `${prefixUrl}`;
            const screenshot = 'screenshot.png';
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({
                width: 1280,
                height: 800
            })

            console.log(`About to go into ${initialPage}`);
            console.log(`Loading ${initialPage}`);
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
            // await page.goto(`${initialPage}`, {
            //     timeout: 0,
            //     waitUntil: 'networkidle2',
            // });

            await page.screenshot({
                path: screenshot,
            });
            const html = await page.content();
            await browser.close();
            return html;
        }
    }
};
```

### pageTestedPath
This is the url path to hit by the JUNIT test and ideally it would match with one of your controller's endpoints to resolve web page.

### rootNodeSelector
The `rootNodeSelector` property is a jQuery-style css selector to identify the top node in your page to produce xpath assertions. Is is set by default to `body` tag. You may well set it to target to a specific element by `id` i.e. `#some-id`

### childElementsSelector
The `childElementsSelector` property is a jQuery-style css selector to target all the elements to be asserted beneath the `rootNodeSelector` element. The default value is `[id]` which means all elements with an `id` property set will be targeted.

### tagsToExclude
This is an array to set all the tags which we don't want to assert as for their inner text. Default value is `['input', 'form', 'select', 'table']`

### manuallyProvidedHtml
This is a string which takes a chunk of html to be tested, you will have to provide this manually. By default an example chunk of html is provided.

### getHtmlViaPuppeteer
This is a javascript callback function which uses the [puppetter API](https://www.npmjs.com/package/puppeteer) and returns the target image html to the CLI tool. It also generates a screenshot of the resource hit. An example is provided in the `junit-html-test-generator-settings.js` file to hit the [https://duckduckgo.com](https://duckduckgo.com) homepage and returns assertions of its html elements.

## YOUR JAVA TEST CLASS

Suppose you want to test the `SomeController` class and its `/some-path` GET endpoint. Your initial class should look something similar to this:

```
package some.package;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@RunWith(SpringRunner.class)
@WebMvcTest(SomeController.class)
public class SomeControllerTest
{

	@Autowired
	MockMvc mockMvc;

}
```

You are now ready to generate a test for your html.

## RUN IT WITH MANUAL HTML

In The folder where you initialized the `junit-html-test-generator-settings.js` file run the following command (with the default values as in the settings file)

```
junit-html-test-generator -m
```

This will produce the following java test method to copy and paste in your  `SomeControllerTest` class:

```
    ========================================> COPY AND PASTE

    @Test
    public void testPageElements() throws Exception
        {
        mockMvc.perform(MockMvcRequestBuilders.get("/some-path"))

.andExpect(MockMvcResultMatchers.xpath("//p[@id='par-1']").exists())
.andExpect(MockMvcResultMatchers.xpath("//p[@id='par-1']")
                        .string(Matchers.equalToIgnoringWhiteSpace("This is paragraph 1")))

.andExpect(MockMvcResultMatchers.xpath("//p[@id='par-2']").exists())
.andExpect(MockMvcResultMatchers.xpath("//p[@id='par-2']")
                        .string(Matchers.equalToIgnoringWhiteSpace("This is paragraph 2")))

.andExpect(MockMvcResultMatchers.xpath("//a[@id='a-link']").exists())
.andExpect(MockMvcResultMatchers.xpath("//a[@id='a-link']")
                        .string(Matchers.equalToIgnoringWhiteSpace("A link label")))

.andExpect(MockMvcResultMatchers.xpath("//a[@id='a-link']/@href")
                    .string(Matchers.equalToIgnoringWhiteSpace("/some-link-path")))

;
    }

    COPY AND PASTE <========================================
```

Copy and paste the above code into your test class and import the necessary dependencies as needed.

## RUN IT WITH PUPPETEER-GENERATED HTML

Run it with the -p option (with the default callback provided in `junit-html-test-generator-settings.js`):

```
junit-html-test-generator -p
```


