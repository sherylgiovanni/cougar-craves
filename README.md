# Cougar Craves
Cougar Craves is a simple Node.js program targeted at BYU students that will generate either a place to eat or a random meal recipe, based on their preference of eating out or in. The program can also store the student's dining preferences, along with the time stamps, that they can retrieve again later or even delete.

# APIs
This program utilizes three APIs:
- PersonsAPI (requires an access token)
- MobileDiningServices API (requires an access token)
- TheMealDB API (does not require an access token)

# User Guide
## Running the Program
### 1. Subscribe to the needed APIs
Before you start, you will need to subscribe to these two APIs in the WSO2 store and get a valid access token.
![image](https://user-images.githubusercontent.com/63915889/164083207-0992c92b-f89c-46c7-8685-f6f9693ddc62.png)
![image](https://user-images.githubusercontent.com/63915889/164083259-af99c1df-21b8-4bdf-a57f-55a865302405.png)

### 2. Connect to the AWS TRN, Oracle DB, and turn on VPN
This program requires connection to the AWS TRN, Oracle DB as well as VPN. Make sure that you are in AWS us-west-2 (Oregon) then copy and paste the PowerShell code to your terminal. Also, turn on the GlobalProtect VPN in order to be able to perform database functions within this program.

### 3. Clone this repository
On your terminal, run these lines of code separately. It will clone this repository, switch your current directory to the program's, and install NPM packages.
```
git clone https://github.com/byu-oit/tania-technical-challenge.git 
cd tania-technical-challenge
npm install
```
### 4. Run the program
Still on your terminal, type `node index`.

Congratulations, you have successfully run the program! Now, let's see how to navigate around and what functionalities it has.

## Navigating Around the Program
When you first run `node index`, you will be prompted to type in an API token. Copy and paste it directly from the WSO2 API Manager. After that, you will be asked to type in your BYU ID. 

![image](https://user-images.githubusercontent.com/63915889/164090040-6963afce-a8ff-4d47-b5ae-f96bc7578ee0.png)

Once the program validates both your API token, VPN connection, and BYU ID, it will greet you and display the main menu.

![image](https://user-images.githubusercontent.com/63915889/164090502-36b16d68-81f8-4883-932b-cc314bf6dfbb.png)

Now, you can either choose whether to log a dining idea, view your old records, or exit the program.

### Get dining ideas
If you choose get dining ideas, you will be asked if you want to eat in or eat out today. 

![image](https://user-images.githubusercontent.com/63915889/164090996-7d096a93-f018-4ada-b2c9-3311fce8e43a.png)

If you choose to eat in, you will be given a random recipe from TheMealDB API.

![image](https://user-images.githubusercontent.com/63915889/164091085-58dc0c3f-856f-4b11-9589-2b87566c089b.png)

If you choose to eat out, you will be given a random place to eat around campus from Mobile Dining Services API.

![image](https://user-images.githubusercontent.com/63915889/164091212-119284f1-413b-409e-a98d-d3983f2b7de7.png)

You can also save these ideas to the database for future references. But if you do not wish to save them, you can just say No and you will be asked either to go back to main menu or exit the program.

### Viewing previous records

If you choose to view your old records, the program will display a table with all the records we have of you in the database. On the other hand, if you have never saved any records before, it will simply tell you that we can't find any records in the database.

![image](https://user-images.githubusercontent.com/63915889/164092757-4f1dd8a1-f3b2-4111-a777-a82c7c4fd4b7.png)

You can view/delete a specific record, delete all records, or go back to main menu. If you choose to view/delete a specific record, the program will give you a list of choice IDs to choose from.

![image](https://user-images.githubusercontent.com/63915889/164093253-51c2d9fa-bf2f-4656-8989-d84b08f951de.png)

If you choose to delete all records, you will be given a warning.

![image](https://user-images.githubusercontent.com/63915889/164093917-57944075-6a64-4130-bb9a-234b0f647042.png)

### Exiting the program

Once you are satisfied with playing around the program, you can go back to main menu and exit.



