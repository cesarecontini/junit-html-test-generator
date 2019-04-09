#!/usr/bin/env node

const fs = require('fs-extra');
const program = require('commander');
const chalkPipe = require('chalk-pipe');
const figlet = require('figlet');
const moment = require('moment');
const jsdom = require('jsdom');
const puppeteer = require('puppeteer');

const pathToModule = require('global-modules-path').getPath(
    'junit-html-test-generator'
);

const appName = 'junit-html-test-generator';
const settingFileName = 'junit-html-test-generator-settings.js';
let year = moment().format('YYYY');

const getSettings = () => {
    const path = `${process.cwd()}/${settingFileName}`;
    return fs.exists(path)
        .then(exists => {
            if(!exists) {
                throw new Error(`Settings file cannot be found, please generate it by running '${appName} - i'`);
            }
            return exists;
        })
        .then(() => {
            return require(`${path}`)
        })
        .catch(e => {
            console.log(chalkPipe('red.underline')(e.message));
            process.exit(0);
        });
}

const isTagToExclude = (tagName, tagsToExclude) => {
    return tagsToExclude.indexOf(tagName.toLowerCase()) !== -1;
};

const printTestMethodInConsole = opts => {

    const testElements = opts.testElements;
    const html = testElements.manuallyProvidedHtml;
    const path = testElements.pageTestedPath;
    const tagsToExclude = testElements.tagsToExclude;

    const {JSDOM} = jsdom;
    const dom = new JSDOM(html);
    const testElementsSettings = testElements;
    const $ = require('jquery')(dom.window);

    console.log(`
    ========================================> COPY AND PASTE

    @Test
    public void testPageElements() throws Exception
	{
        mockMvc.perform(MockMvcRequestBuilders.get("${path}"))
        `);

    $(testElementsSettings.rootNodeSelector)
        .find(testElementsSettings.childElementsSelector)
        .each(function () {
            const tagName = $(this).prop('tagName');
            const id = this.id;
            const text = $(this).text();
            const isIdSet = id && id !== '';

            if (isIdSet) {
                console.log(`.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']").exists())`);
            }

            if (isIdSet && !isTagToExclude(tagName, tagsToExclude)) {
                console.log(
                    `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']")
                        .string(Matchers.equalToIgnoringWhiteSpace("${text
                        .replace(/^\s+|\s+$/g, '')
                        .replace(/\n/g, ' ')}")))
                        `
                );
            }

            if (tagName && tagName.toLowerCase() === 'a') {
                const href = $(this).attr('href');
                console.log(
                    `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/@href")
                    .string(Matchers.equalToIgnoringWhiteSpace("${href}")))
                    `
                );
            }

            if (tagName && tagName.toLowerCase() === 'form') {
                const action = $(this).attr('action');
                const method = $(this).attr('method');
                console.log(
                    `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/@action")
                    .string(Matchers.equalToIgnoringWhiteSpace("${action}")))
                    `
                );
                console.log(
                    `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/@method")
                    .string(Matchers.equalToIgnoringWhiteSpace("${method}")))
                    `
                );
            }

            if (tagName && tagName.toLowerCase() === 'input') {
                const type = $(this).attr('type');
                console.log(
                    `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/@type").string("${type}"))`
                );

                if (type === 'radio' || type === 'checkbox')
                {
                    const checked = $(this).attr('checked');
                    if(checked) {
                         console.log(
                             `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/@checked").string("${checked}"))`
                         );
                    }
                }
            }
            
            if (tagName && tagName.toLowerCase() === 'select') {
                const options = $(this).find('option');
                console.log(
                    `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/option").nodeCount(${options.length}))`
                );
                options.each(function (i) {
                    
                    console.log(
                        `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/option[${i+1}]").exists())`
                    );

                    const optionText = $(this).text();
                    const optionValue = $(this).attr('value');
                    if (optionText) {
                        console.log(
                            `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/option[${i+1}]")
                            .string(Matchers.equalToIgnoringWhiteSpace("${optionText}")))`
                        );
                        console.log(
                            `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/option[${i + 1}]/@value")
                            .string(Matchers.equalToIgnoringWhiteSpace("${optionValue}")))`
                        );
                    }

                    const selected = $(this).attr('selected');
                    if(selected) {
                        console.log(
                            `.andExpect(MockMvcResultMatchers.xpath("//${tagName.toLowerCase()}[@id='${id}']/option[${i + 1}]/@selected")
                            .string(Matchers.equalToIgnoringWhiteSpace("${selected}")))
                            `
                        );
                    }
                });

            }
        });
    console.log(`;
    }
    
    COPY AND PASTE <========================================
    `);
};

const getHtmlViaPuppeteer = settings => {
    console.log(chalkPipe('orange.bold')(`${appName} is starting....`));

    const screenshot = 'screenshot.png';
    try {
        (async () => {
            console.log('....')
            const html = await settings.testElements.getHtmlViaPuppeteer(puppeteer);
            settings.testElements.manuallyProvidedHtml = html;
            printTestMethodInConsole(settings);
        
        })();
    } catch (err) {
        console.log(err);
    }
};

const init = () => {
    fs.exists(`./${settingFileName}`)
        .then(exists => {
            if (exists) {
                throw new Error(`${settingFileName} has already been generated!`);
            }
            return fs.copy(`${pathToModule}/settings.js`, `./${settingFileName}`)
        }).then(() => console.log(chalkPipe('orange.bold')(`${settingFileName} created!`)))
        .catch(e => console.log(chalkPipe('blue.underline')(e.message)));
};

program
    .version('0.1.0')
    .name(`${appName}`)
    .usage(`-i ${appName}`)
    .option('-i --init', 'Initialize settings file')
    .option('-p --puppeteer', 'Retrieve html from a remote page using puppeteer!')
    .option('-m --manual', 'Provide your own html manually!')
    .option('-a, --about', `About ${appName} cli`)
    .parse(process.argv);

if (program.about) {
   

    figlet(`${appName}`, (err, data) => {
        if (err) {
            console.log('Something went wrong');
            console.dir(err);
            return;
        }
        console.log(chalkPipe('orange.bold')(''));
        console.log(
            chalkPipe('orange.bold')(`Generate a JUnit test in your console to copy & paste in your java project and assert HTML pages element given a chunk of html is provided manually or automatically via a set of puppeteer commands defined in a call back function in ${settingFileName}.`)
        );
        console.log(chalkPipe('orange.bold')(data));
        console.log(chalkPipe('orange.bold')(''));
        console.log(chalkPipe('orange.bold')(`Start by running '${appName} -i' to generate ${settingFileName} settings file`));
        console.log(chalkPipe('orange.bold')('\n'));
        console.log(
            chalkPipe('orange.bold')(`(c) ${year} <Cesare Giani Contini>`)
        );
        console.log(
            chalkPipe('orange.bold')(`MIT LICENSE`)
        );
        console.log(chalkPipe('orange.bold')('\n'));
    });
}

if (!program.about && program.init) {
    init();
}


if (!program.about && program.puppeteer) {
    getSettings().then(settings => getHtmlViaPuppeteer(settings));
}

if (!program.about && !program.init && program.manual) {
    getSettings().then(settings => printTestMethodInConsole(settings));
}