const axios = require('axios');
const inquirer = require('inquirer');

/**
 * This file handles all the API calls.
 * @author Sheryl Tania
 */

// This is a regular expression to check the validity of the BYU ID, making sure it's all digit from 0-9
let idRegex = /^[0-9]*$/gm;

/**
 * Get API token from user input and store it in the token global variable
 * @returns the API token
 */
async function getAPIToken() {
    let max_api_token_length = 25;
    const answer = await inquirer
        .prompt([
            {
                message: 'Please enter your API Token from WSO2: ',
                name: 'key',
                validate: async (input) => {
                    if (!(input.length > max_api_token_length)) {
                        return 'Please put in the correct access token from your WSO2.'
                    }
                    return true
                }
            }
        ])
    return answer.key;
}

/**
 * Get BYU ID from user input and store it in the byuId global variable
 * @returns the BYU ID
 */
async function getByuId() {
    let max_byu_id_length = 9;
    const answer = await inquirer
        .prompt([
            {
                message: 'Please enter your BYU ID Number: ',
                name: 'byuId',
                type: 'input',
                validate: async (input) => {
                    if(input.length !== max_byu_id_length || !input.match(idRegex)) {
                        return 'Please type in your 9-digit BYU ID, numbers only.'
                    }
                    return true;
                }
            }
        ])
    return answer.byuId;
}


/**
 * Calls the PersonsAPI from WSO2 API Manager to retrieve first name of the student.
 * @property {String} first_name
 * @property {int} byu_id
 * @return an object containing the BYU ID and first name of the student
 */
async function getFirstName(byuId, token) {
    // Credentials and URL endpoint
    const options = {
        url: 'https://api.byu.edu:443/byuapi/persons/v3/' + byuId,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }

    // Declare empty variables to store values
    let byu_id, first_name;
    await axios(options)
        .then((body) => {
            const person = body.data.basic;
            byu_id = person.byu_id.value;
            first_name = person.first_name.value;
        }).catch(error => {
            if (error.response) {
                // The error code 401 means unauthorized, because the client lacks valid authentication credentials
                if (error.response.status === 401) {
                    console.log('There was an error connecting to WSO2. Please make sure you use the correct, valid token that hasn\'t expired.')
                    process.exit()
                    return false;
                }
                // The error code 403 means user tries to access something that they don't have access to
                if (error.response.status === 403) {
                    console.log('There was an error connecting to WSO2. Please make sure you are subscribed to the Persons-v3 and MobileDiningServices API.')
                    process.exit()
                    return false;
                }
            }
        })
    return {
        byu_id: byu_id,
        first_name: first_name
    }
}

/**
 * A function to generate a number from a predefined min and max value
 * @param min
 * @param max
 * @returns a random number between the predefined range
 */
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Calls the Mobile Dining Services API from WSO2 API Manager and uses the randomIntFromInterval function to select a location randomly from the array response
 * @returns a string of location_name
 */

async function testMobileDiningServicesAPI(token) {
    // Credentials and URL endpoint
    const options = {
        url: 'https://api.byu.edu:443/domains/mobile/dining-services/v1/locations',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }
    await axios(options)
        .then((body) => {
            const data = body.data;
        }).catch(error => {
            if (error.response) {
                // The error code 401 means unauthorized, because the client lacks valid authentication credentials
                if (error.response.status === 401) {
                    throw error;
                    console.log('Please make sure you are subscribed to the Mobile Dining Services API and use a valid token that hasn\'t expired.')
                    process.exit()
                }
            }
        })
}

async function getRandomLocation(token) {
    console.log('Finding a place for you...');
    // Credentials and URL endpoint
    const options = {
        url: 'https://api.byu.edu:443/domains/mobile/dining-services/v1/locations',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }

    let max_dish_from_api = 22;
    const rndInt = randomIntFromInterval(0, max_dish_from_api);

    // Declare empty variables to store values
    let location_name;
    await axios(options)
        .then((body) => {
            const location = body.data;
            location_name = location[rndInt].name;
            latitude = location[rndInt].latitude;
            longitude = location[rndInt].longitude;
        }).catch(error => {
            if (error.response) {
                // The error code 401 means unauthorized, because the client lacks valid authentication credentials
                if (error.response.status === 401) {
                    console.log('There was an error connecting to WSO2. Please make sure you use the correct, valid token that hasn\'t expired.')
                    process.exit()
                }
                // The error code 403 means user tries to access something that they don't have access to
                if (error.response.status === 403) {
                    console.log('There was an error connecting to WSO2. Please make sure you are subscribed to the Mobile Dining Services API.')
                    process.exit()
                }
            }
        })
    return {
        location: location_name,
        longitude: longitude,
        latitude: latitude
    };
}

/**
 * Calls TheMealDB to get a random recipe
 * @returns {Promise<void>}
 */
async function getRandomRecipe() {
    console.log('Thinking of a recipe for you...');
    // Credentials and URL endpoint
    const options = {
        url: 'https://www.themealdb.com/api/json/v1/1/random.php',
        method: 'GET'
    }

    let dish_name;
    let instructions;
    let ingredients = [];
    await axios(options)
        .then((body) => {
            const dish = body.data.meals[0];
            dish_name = dish.strMeal;
            instructions = dish.strInstructions;
            // Get all ingredients from the object. Up to 20
            for(let i=1; i<=20; i++) {
                if(dish[`strIngredient${i}`]) {
                    ingredients.push(`${dish[`strMeasure${i}`]} ${dish[`strIngredient${i}`]}`)
                } else {
                    // Stop if no more ingredients
                    break;
                }
            }
        }).catch(error => {
            console.log("We can't come up with a recipe for you right now. Sorry.");
            process.exit();
    })

    return {
        dish_name: dish_name,
        ingredients: ingredients,
        instructions: instructions
    }
}

module.exports = {getAPIToken, getByuId, getFirstName, getRandomLocation, getRandomRecipe, testMobileDiningServicesAPI}
