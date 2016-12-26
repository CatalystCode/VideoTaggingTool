var child_process = require('child_process');
var path = require('path');

// Checking configuration contains sql connection configuration
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_SERVER, !process.env.DB_EMAIL) {
  
  console.warn('Could not find one of the database definition params DB_NAME, DB_USER, DB_SERVER, DB_EMAIL ');
  
} else {
  
  // Running an sql command to change the existnace of pipeline tables in the database
  var cmd = 'sqlcmd -U %DB_USER% -S %DB_SERVER% -P %DB_PASSWORD% -d %DB_NAME% -Q ' +
            '"SELECT * from INFORMATION_SCHEMA.TABLES WHERE table_name in(\'Frames\', \'Jobs\', \'JobStatus\', \'Labels\', \'Roles\', \'Users\', \'VideoLabels\', \'Videos\')" -h -1 ';
  console.info('Searching for content in DB %s with user %s in server %s', process.env.DB_NAME, process.env.DB_USER, process.env.DB_SERVER);

  child_process.exec(cmd, null, function (error, stdout, stderr) {
    
    if (error) return console.error('Error querying for DBs', error);
    
    stdout = stdout || '';
    
    // If the output does not match the expected format, this might be a result 
    // of a problem with the execution
    if (stdout.indexOf('rows affected)') < 0) return console.error('there was a problem running the query');
    
    // If all tables exist in the database, the schema exists and updated
    if (stdout.indexOf('(0 rows affected)') < 0) return console.info('db already deployed');
    
    console.info('schema not found, creating a new schema...');
    
    // Construct the database according to the updated schema.sql
    var createdb_command = 'sqlcmd -U %DB_USER% -S %DB_SERVER% -P %DB_PASSWORD% -d %DB_NAME% -i ' + 
      path.join('storage', 'sql', 'schema.sql') + ' > createdb.log';
    child_process.exec(createdb_command, null, function (error, stdout, stderr) {
      
      if (error) return console.error('Error creating new DB schema', error);


      //insert admin user
      var insertAdmin =  'sqlcmd -U %DB_USER% -S %DB_SERVER% -P %DB_PASSWORD% -d %DB_NAME% -Q ' + '"INSERT INTO [dbo].[Users] ([Name] ,[Email] ,[RoleId]) VALUES (\'Admin\' ,\'%DB_EMAIL%\' ,2)"';
      child_process.exec(insertAdmin, null, function (error, stdout, stderr) {
      
        if (error) return console.error('Error inserting admin', error);
        return console.info('DB schema deployed successfully');
      });

    });
  });
}