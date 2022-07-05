const oracle = require('oracledb');
const inquirer = require('inquirer');
const {Table} = require('console-table-printer');
const AWS = require('aws-sdk');

/**
 * This file handles the database connection.
 * @author Sheryl Tania
 */

// Oracle DB Parameters
const params = {
    connectString: 'ora7gdev.byu.edu:1521/cescpy1.byu.edu'
}

oracle.outFormat = oracle.OBJECT
oracle.autoCommit = true

// AWS Parameters
let parameters = {
    Names: ['/tania-technical-challenge/dev/USERNAME', '/tania-technical-challenge/dev/PASSWORD'],
    WithDecryption: true
}

// AWS Configuration
AWS.config.update({ region: 'us-west-2'})
const ssm = new AWS.SSM()

/**
 * Set oracle creds so user can access DB
 * @param username AWS username
 * @param password AWS password
 * @returns void
 */
const setOracleCredentials = async (username, password) => {
    params.user = username
    params.password = password
}

/**
 * Check if user is connected to AWS
 * @returns void
 */
const getOracleCredentials = async function () {
    console.log('Testing AWS CLI connection...')
    try {
        const firstParams = await ssm.getParameters(parameters).promise()
        await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
    } catch (e) {
        console.log('You are not connected to the AWS CLI.')
        process.exit()
    }
}

/**
 * A function to test connection to the Oracle DB
 * @returns {Promise<void>}
 */
async function testOracleConnectivity() {
    try {
        console.log('Testing connection to on-prem OracleDB');
        const conn = await oracle.getConnection(params);
        const result = await conn.execute('SELECT * FROM DUAL');
        await conn.close();
        console.log('Successfully connected to on-prem OracleDB');
    } catch (e) {
        console.log('Unable to create a connection to on-prem OracleDB');
        process.exit();
    }
}

/**
 * This is a function to show a mini prompt whether they want to save their preference to the database or not, after a recipe/location has been generated for them.
 * @returns {Promise<*>}
 */
async function promptSaveAnswer() {
    const input = await inquirer
        .prompt([
            {
                type: 'list',
                name: 'answer',
                message: 'Would you like to save your preference (along with our suggestion) to the database?',
                choices: [
                    'Yes, please!',
                    'No, thank you.'
                ]
            }
        ])
    return input.answer;
}

/**
 * A function to save eat_in preference to the database.
 * @param byu_id The ID of the student
 * @param first_name The first name of the student
 * @param choice The choice, it will be eat_in
 * @param dish_name The name of the dish generated by The Meal DB
 * @param ingredients The ingredients of the dish generated by The Meal DB
 * @param instructions The instructions of the dish generated by The Meal DB
 * @returns {Promise<void>}
 */
async function addRecipeToTable(byu_id, first_name, choice, dish_name, ingredients, instructions) {
    try {
        console.log('Saving answer...');
        const conn = await oracle.getConnection(params);
        const current = new Date();
        const trimInstructions = instructions.substring(0, 3999)
        await conn.execute('INSERT INTO OIT#SG738.DINING_PREFERENCES(BYU_ID, FIRST_NAME, CHOICE, TIME_STAMP, DISH_NAME, INGREDIENTS, INSTRUCTIONS)'
            + 'VALUES (:byu_id, :first_name, :choice, :time_stamp, :dish_name, :ingredients, :instructions)',
            [byu_id, first_name, choice, current, dish_name, ingredients, trimInstructions]);
        await conn.close();
        console.log('We have recorded your preference. Thank you for using Cougar Craves!');
        await goToMainMenu().then(async answer => {
            if (answer === 'Go back to main menu') {
                console.clear();
                return true;
            } else {
                process.exit();
            }
        })
    } catch (e) {
        console.log('Unable to save record to the database. Please check your credentials and make sure your VPN is turned on.')
        process.exit();
    }
}

/**
 * A function to save eat_out preference from a student as well as the generated location.
 * @param byu_id The ID of the student
 * @param first_name The first name of the student
 * @param choice The choice, it will be eat_out
 * @param location_name The name of the location generated by Mobile Dining Services API
 * @returns {Promise<void>}
 */
async function addLocationToTable(byu_id, first_name, choice, location_name) {
    try {
        console.log('Saving answer...');
        const conn = await oracle.getConnection(params);
        const current = new Date();
        await conn.execute('INSERT INTO OIT#SG738.DINING_PREFERENCES(BYU_ID, FIRST_NAME, CHOICE, TIME_STAMP, LOCATION_NAME)'
            + 'VALUES (:byu_id, :first_name, :choice, :time_stamp, :location_name)',
            [byu_id, first_name, choice, current, location_name]);
        await conn.close();
        console.log('We have recorded your preference. Thank you for using Cougar Craves!');
        await goToMainMenu().then(async answer => {
            if (answer === 'Go back to main menu') {
                console.clear();
                return true;
            } else {
                process.exit();
            }
        })
    } catch (e) {
        console.log('Unable to create new item on on-prem OracleDB');
        process.exit();
    }
}

/**
 * This function displays all the stores dining preference records from the logged in student.
 * @returns {Promise<void>}
 */
async function displayRecords(byu_id) {
    console.clear();
    let continueLooping = true;
    while (continueLooping) {
        try {
            console.log('Please wait...')
            const result = await checkUser(byu_id);
            if (result.rows[0] === null || result.rows[0] === undefined) {
                console.log("You have never logged a dining preference in Cougar Craves.")
                await goToMainMenu().then(async answer => {
                    if (answer === 'Go back to main menu') {
                        console.clear();
                        continueLooping = false;
                    } else {
                        process.exit();
                    }
                })
            } else {
                const table = new Table({
                    title: `${result.rows[0].FIRST_NAME}'s Dining Preferences`,
                    columns: [
                        {name: "choice_id", alignment: "center"},
                        {name: "choice", alignment: "center"},
                        {name: "time_stamp", alignment: "center"},
                        {name: "dish_name", alignment: "center"},
                        {name: "location_name", alignment: "center"},
                    ]
                })
                result.rows.forEach(row => {
                    let location_name, dish_name;

                    // Change 'null' value to just an empty string for both location_name and dish_name
                    if (row.LOCATION_NAME) {
                        location_name = row.LOCATION_NAME;
                    } else {
                        location_name = '';
                    }
                    if (row.DISH_NAME) {
                        dish_name = row.DISH_NAME;
                    } else {
                        dish_name = '';
                    }

                    // Add values to table
                    table.addRow(
                        {
                            choice_id: `${row.CHOICE_ID}`,
                            choice: `${row.CHOICE}`,
                            time_stamp: `${row.TIME_STAMP}`,
                            dish_name: `${dish_name}`,
                            location_name: `${location_name}`
                        }
                    );
                })
                table.printTable()

                await nextSteps()
                    .then(async next => {
                        switch (next) {
                            case 'View the details of a specific record':
                                await showDetails(result);
                                break
                            case 'Delete a specific record':
                                await deleteRecord(result);
                                break
                            case 'Delete all my records':
                                await deleteAllRecords(result);
                                break
                            // add go back to main menu
                            case 'Go back to main menu':
                                continueLooping = false;
                        }
                    })
            }
        } catch (e) {
            if (e.errorNum  = 12170){
                console.log("It appears you are not connected to your VPN. Please connect and try again.")
                process.exit()
            }
            else if (e.errorNum  = 942) {
                console.log("There is an error retrieving the table. Seems like the table does not exist.")
                process.exit();
            }
            else {
                throw e
                process.exit();
            }
        }
    }
}

/**
 * This function shows detailed information about a record chosen by the user
 * @param result is the result of the query of the user
 * @returns {Promise<void>}
 */
async function showDetails(result) {
    let details;
    await showChoices(result, 'view')
        .then(async answer => {
            try {
                // store data in variables
                const choice_id = answer.choice_id;
                const byu_id = result.rows[0].BYU_ID.toString();
                const conn = await oracle.getConnection(params);
                details = await conn.execute('SELECT * FROM OIT#SG738.DINING_PREFERENCES WHERE ' +
                    'choice_id = :choice_id AND byu_id = :byu_id', [choice_id, byu_id]);

                // If the choice was eat out, display location details
                if (details.rows[0].CHOICE === 'eat_out') {
                    console.log(`=====================================================`);
                    console.log(`Guess what? Today you will be eating at:`);
                    console.log(`Location name: ${details.rows[0].LOCATION_NAME}`);
                    console.log(`=====================================================`);
                    console.log(`This location was suggested for you on ${details.rows[0].TIME_STAMP}`)
                    await goToRecords().then(async answer => {
                        if (answer === 'Go back to main menu') {
                            console.clear();
                            return true;
                        } else {
                            process.exit();
                        }
                    })
                }
                // If the choice was eat in, display recipe details
                else if (details.rows[0].CHOICE === 'eat_in') {
                    console.log(`The universe has spoken! Here is what you will be eating today.`);
                    console.log('=========================================================================');
                    console.log(`${details.rows[0].DISH_NAME}`);
                    console.log('=========================================================================');
                    console.log(`\nINGREDIENTS: \n${details.rows[0].INGREDIENTS}\n`);
                    console.log(`INSTRUCTIONS: \n${details.rows[0].INSTRUCTIONS}`)
                    console.log('=========================================================================');
                    console.log(`This recipe was suggested for you on ${details.rows[0].TIME_STAMP}`)
                    await goToRecords().then(async answer => {
                        if (answer === 'Go back to main menu') {
                            console.clear();
                            return true;
                        } else {
                            process.exit();
                        }
                    })
                } else {
                    console.log('Sorry, there does not seem to be a record with that ID.');
                }

                await conn.close();
            } catch (e) {
                console.log('Unable to retrieve record on the database. Please check your credentials and make sure your VPN is turned on.')
                process.exit();
            }
        })
}


/**
 * This function deletes a single record
 * @param result the record that wants to be deleted
 * @returns {Promise<void>}
 */
async function deleteRecord(result) {
    await showChoices(result, 'delete')
        .then(async answer => {
            try {
                // store data in variables
                const choice_id = answer.choice_id;
                const byu_id = result.rows[0].BYU_ID.toString();
                const conn = await oracle.getConnection(params);
                await conn.execute('DELETE FROM OIT#SG738.DINING_PREFERENCES WHERE choice_id = ' +
                    ':choice_id AND byu_id = :byu_id', [choice_id, byu_id]);
                console.log(`You have successfully deleted record with choice ID = ${choice_id}.`);
                await conn.close();
                await goToRecords().then(async answer => {
                    if (answer === 'Go back to main menu') {
                        console.clear();
                        return true;
                    } else {
                        process.exit();
                    }
                })
            } catch (e) {
                console.log('Unable to delete record on the database. Please check ' +
                    'your credentials and make sure your VPN is turned on.')
                process.exit();
            }
        })
}

/**
 * This function will delete all records of a user from the database, but before that it will ask for confirmation to proceed.
 * @param result is the result of the query of the user
 * @returns {Promise<void>}
 */
async function deleteAllRecords(result) {
    await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Are you sure you want to delete all records? This action can\'t be undone.',
            choices: [
                'Yes',
                'No'
            ]
        }
    ]).then(async answer => {
        try {
            if (answer.choice === 'Yes') {
                const byu_id = result.rows[0].BYU_ID.toString();
                const conn = await oracle.getConnection(params);
                await conn.execute('DELETE FROM OIT#SG738.DINING_PREFERENCES WHERE byu_id = :byu_id', [byu_id]);
                console.log(`You have successfully deleted all your records.`);
                await conn.close();
                await goToRecords().then(async answer => {
                    if (answer === 'Go back to main menu') {
                        console.clear();
                        return true;
                    } else {
                        process.exit();
                    }
                })
            } else {
                console.log(`We won't delete your records then.`);
                await goToRecords().then(async answer => {
                    if (answer === 'Go back to main menu') {
                        console.clear();
                        return true;
                    } else {
                        process.exit();
                    }
                })
            }
        } catch (e) {
            console.log('Unable to delete records on the database. Please check your ' +
                'credentials and make sure your VPN is turned on.')
            process.exit();
        }
    })
}

/**
 * This function populates the options that students can choose from when trying to retrieve or delete a record
 * @param result the list of all the records coming from database
 * @param action the action that wants to be performed with the specific record
 * @returns {Promise<*>}
 */
async function showChoices(result, action) {
    const tableIndex = []
    for (let i = 0; i < result.rows.length; i++) {
        tableIndex.push(result.rows[i].CHOICE_ID);
    }
    let chosen = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice_id',
            message: `Please choose the ID of the choice that you want to ${action}: `,
            choices: tableIndex
        }
    ]);

    return chosen;
}

/**
 * This function works to retrieve records about a particular student, taking the BYU_ID as parameter and passing it to the SQL query
 * @param byu_id the ID of the student whose records want to be retrieved
 * @returns {Promise<*>}
 */
async function checkUser(byu_id) {
    let last_record;
    try {
        console.log('Connecting to the database...')
        const conn = await oracle.getConnection(params);
        last_record = await conn.execute('SELECT * FROM OIT#SG738.DINING_PREFERENCES WHERE byu_id ' +
            '= :byu_id ORDER BY time_stamp DESC', [byu_id]);
        await conn.close();
    } catch (e) {
        console.log(e);
        console.log('There was a problem connecting to Oracle DB. Please make sure that your VPN is turned on.')
        process.exit();
    }
    return last_record;
}


/**
 * This function will display another menu at the bottom of the table of records
 * @return string of name of submenu selected
 */
async function nextSteps() {
    const input = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Next, what would you like to do?',
            choices: [
                'View the details of a specific record',
                'Delete a specific record',
                'Delete all my records',
                'Go back to main menu'
            ]
        }
    ])
    return input.choice
}

/**
 * Enable user to go back view the table of records after they are done performing a function to one record
 * @returns {Promise<string>}
 */
async function goToRecords() {
    const input = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Where would you like to go now?',
            choices: [
                'Go back to main menu',
                'Exit the program'
            ]
        }
    ])
    return input.choice
}

/**
 * Enable user to go back to the main menu page
 * @returns {Promise<string>}
 */
async function goToMainMenu() {
    const input = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Where would you like to go now?',
            choices: [
                'Go back to main menu',
                'Exit the program'
            ]
        }
    ])
    return input.choice
}

module.exports = {addLocationToTable, addRecipeToTable, promptSaveAnswer, displayRecords, goToMainMenu, getOracleCredentials, testOracleConnectivity};

