const api = require('./api');
const inquirer = require('inquirer');
const db = require('./db');
let loop;

/**
 * COUGAR CRAVES
 * An app to generate a random place around campus to eat in or a random recipe based on their dining preference.
 * @author Sheryl Tania
 * @version 1.0
 */

/**
 * The main function to call the program
 */
async function main() {
    console.clear()
    const api_token = await api.getAPIToken();
    const byu_id = await api.getByuId();
    await db.getOracleCredentials();
    await db.testOracleConnectivity();
    await api.getFirstName(byu_id, api_token);
    await api.testMobileDiningServicesAPI(api_token);

    loop = true;
    while(loop) {
        await welcome(byu_id, api_token);
    }
}

/**
 * The function to display main menu
 * @param byu_id
 * @param api_token
 * @returns {Promise<void>}
 */
async function welcome(byu_id, api_token) {
    console.clear();
    const first_name = (await api.getFirstName(byu_id, api_token)).first_name;
    // Make sure the byu_id actually exists
    if (!(byu_id === undefined) && !(first_name === undefined)) {
        console.log()
        console.log('   _____                                _____                          ');
        console.log('  / ____|                              / ____|                         ');
        console.log(' | |     ___  _   _  __ _  __ _ _ __  | |     _ __ __ ___   _____  ___ ');
        console.log(' | |    / _ \\| | | |/ _` |/ _` | \'__| | |    | \'__/ _` \\ \\ / / _ \\/ __|');
        console.log(' | |___| (_) | |_| | (_| | (_| | |    | |____| | | (_| |\\ V /  __/\\__ \\');
        console.log(' \\_____\\___/ \\__,_|\\__, |\\__,_|_|     \\_____|_|  \\__,_| \\_/ \\___||___/');
        console.log('                     __/ |                                             ');
        console.log('                    |___/                                              ');
        console.log(`Hi, ${first_name}! Welcome to Cougar Craves. Here, we will help you come up with an idea to satisfy your cravings.`);
        await inquirer.prompt([
            {
                type: 'list',
                name: 'main_menu',
                message: 'First of all, what would you like to do?',
                choices: [
                    'Get dining ideas',
                    'View my previous records',
                    'Exit this program'
                ]
            }
        ]).then(async answer => {
            switch (answer.main_menu) {
                case 'Get dining ideas':
                    try {
                        await logPreference(byu_id, first_name, api_token);
                        break;
                    } catch(e) {
                        console.log('Sorry, system is busy now. Maybe try again later?');
                        process.exit();
                    }
                case 'View my previous records':
                    try {
                        await db.displayRecords(byu_id);
                        break;
                    } catch(e) {
                        console.log('Sorry, the database is busy now. Maybe try again later?')
                        process.exit();
                    }
                case 'Exit this program':
                    console.log('Alright, see you next time!')
                    process.exit()
                    break
            }
        })
    } else {
        console.log('There is no student associated with that ID.');
        loop = false;
    }
}

/**
 * The function that will be called if the user chooses "get dining ideas"
 * @param byu_id
 * @param first_name
 * @param api_token
 * @returns {Promise<void>}
 */
async function logPreference(byu_id, first_name, api_token) {
    await inquirer.prompt([
        {
            type: 'list',
            name: 'preference',
            message: 'Alright. Where do you feel like eating today?',
            choices: [
                'Eating in',
                'Eating out',
                'Actually, never mind. I\'m going to fast today. Bye!'
            ]
        }
    ]).then(async answer => {
        switch (answer.preference) {
            case 'Eating in':
                console.clear();
                const dish = await api.getRandomRecipe();
                // Convert the returned ingredients array into a string that is split with a line break
                const ingredients = (dish.ingredients).toString().split(',').join('\n');
                console.log(`The universe has spoken! Here is what you will be eating today.`);
                console.log('=========================================================================');
                console.log(`${dish.dish_name}`);
                console.log('=========================================================================');
                console.log(`\nINGREDIENTS: \n${ingredients}\n`);
                console.log(`INSTRUCTIONS: \n${dish.instructions}`)
                console.log('=========================================================================');
                // Prompt the user to save the answer to the database or not
                const save_recipe = await db.promptSaveAnswer();
                if(save_recipe === 'Yes, please!') {
                    await db.addRecipeToTable(byu_id, first_name, 'eat_in', dish.dish_name, ingredients, dish.instructions);
                    break;
                } else {
                    await db.goToMainMenu().then(async answer => {
                        if (answer === 'Yes') {
                            console.clear();
                            return true;
                        } else {
                            process.exit();
                        }
                    })
                }
                break
            case 'Eating out':
                console.clear();
                const data = await api.getRandomLocation(api_token);
                console.log(`=====================================================`);
                console.log(`Guess what? Today you will be eating at:`);
                console.log(`Location name: ${data.location}`);
                console.log(`Location coordinate: ${data.latitude}, ${data.longitude}`);
                console.log(`=====================================================`);
                // Prompt the user to save the answer to the database or not
                const save_location = await db.promptSaveAnswer();
                if(save_location === 'Yes, please!') {
                    await db.addLocationToTable(byu_id, first_name, 'eat_out', data.location);
                    break;
                } else {
                    await db.goToMainMenu().then(async answer => {
                        if (answer === 'Go back to main menu') {
                            console.clear();
                            return true;
                        } else {
                            process.exit();
                        }
                    })
                }
                break
            case 'Actually, nevermind. I\'m going to fast today. Bye!':
                console.log('Well, see you next time then!')
                process.exit()
                break
        }
    }).catch((error) => {
        console.log(error)
    })
}

main();