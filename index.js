const inquirer = require('inquirer')
const mysql = require('mysql2/promise');
const cTable = require('console.table');

async function employeeTracker() {
    const connection = await mysql.createConnection(
        {
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'employee_tracker_db'
        },
    )

    async function startQuestions() {
        const data = await inquirer
            .prompt({
                type: 'list',
                choices: ['view all departments', 'view all roles', 'view all employees', 'add a department', 'add a role', 'add an employee', 'update an employee role'],
                message: 'What whould you like to select?',
                name: 'startPage'
            })
        if (data.startPage === 'view all departments') {
            const [data] = await connection.execute('SELECT * FROM department')
            console.table(data)
            startQuestions()
        } else if (data.startPage === 'view all roles') {
            const [data] = await connection.execute(`SELECT roles.id,roles.title,department.department,roles.salary 
            FROM roles 
            INNER JOIN department ON roles.department_id = department.id;`)
            console.table(data)
            startQuestions()
        } else if (data.startPage === 'view all employees') {
            const [data] = await connection.execute(`SELECT employee.id,employee.first_name,employee.last_name,roles.title,department.department,roles.salary,employee.manager_id
            FROM employee 
            INNER JOIN roles ON employee.role_id = roles.id 
            INNER JOIN department ON roles.department_id = department.id`)
            console.table(data)
            startQuestions()
        } else if (data.startPage === 'add a department') {
            addDepartment()
        } else if (data.startPage === 'add a role') {
            addRole()
        } else if (data.startPage === 'add an employee') {
            addEmployee()
        } else if (data.startPage === 'update an employee role') {
            updateEmployee()
        }
    }

    async function addDepartment() {
        const data = await inquirer
            .prompt({
                type: 'input',
                message: 'What is the name of the Department?',
                name: 'addDepartment'
            })
        await connection.execute(`INSERT INTO department (department) 
        VALUES ('${data.addDepartment}')`)
        startQuestions()
    }

    async function addRole() {
        const [roles] = await connection.execute("SELECT department FROM department")

        const data = await inquirer
            .prompt([
                {
                    type: 'input',
                    message: 'What is the tile of the role?',
                    name: 'roleTitle'
                },
                {
                    type: 'number',
                    message: 'What is the salary of the role?',
                    name: 'roleSalary'
                },
                {
                    type: 'list',
                    choices: roles.map(role => role.department),
                    message: 'What is the department of the role?',
                    name: 'roleDepartment'
                }
            ])
        const [depId] = await connection.execute(`SELECT id FROM department WHERE department = '${data.roleDepartment}'`)

        connection.execute(`INSERT INTO roles(title, salary, department_id)
        VALUES('${data.roleTitle}', ${data.roleSalary}, ${depId.map(id => id.id)})`)
        startQuestions()
    }

    async function addEmployee() {
        const [roles] = await connection.execute("SELECT title FROM roles")
        const [manager] = await connection.execute('SELECT first_name FROM employee')

        const data = await inquirer
            .prompt([
                {
                    type: 'input',
                    message: "What is the employee's first name?",
                    name: 'firstName'
                },
                {
                    type: 'input',
                    message: "What is the employee's last name?",
                    name: 'lastName'
                },
                {
                    type: 'list',
                    choices: roles.map(role => role.title),
                    message: 'What is the role of the employee?',
                    name: 'roleId'
                },
                {
                    type: 'list',
                    choices: manager.map(data => data.first_name),
                    message: 'What is the manager of the employee?',
                    name: 'managerId'
                }
            ])
        const [roleId] = await connection.execute(`SELECT id FROM roles WHERE title='${data.roleId}'`)
        const [manId] = await connection.execute(`SELECT id FROM employee WHERE first_name='${data.managerId}'`)

        connection.query(`INSERT INTO employee(first_name, last_name, role_id, manager_id)
        VALUES('${data.firstName}', '${data.lastName}', ${roleId.map(id => id.id)}, ${manId.map(id => id.id)})`)
        startQuestions()
    }

    async function updateEmployee() {
        const [name] = await connection.execute('SELECT first_name, last_name FROM employee')
        const [roles] = await connection.execute("SELECT title FROM roles")

        const data = await inquirer
            .prompt([
                {
                    type: 'list',
                    choices: name.map(n => n.first_name),
                    message: 'What is the name of the employee?',
                    name: 'nameSelect'
                },
                {
                    type: 'list',
                    choices: roles.map(data => data.title),
                    message: 'What is the new role id of this employee?',
                    name: 'roleUpdate'
                }
            ])
        const [update] = await connection.execute(`SELECT id FROM roles WHERE title='${data.roleUpdate}'`)
        const [updateObj] = update.map(ud => ud.id)
        console.log(updateObj)

        connection.query(`UPDATE employee SET role_id='${updateObj}' WHERE first_name='${data.nameSelect}'`)
        startQuestions()
    }

    startQuestions()
}

employeeTracker()