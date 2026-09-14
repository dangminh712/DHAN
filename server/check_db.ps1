$cred = Import-Clixml -Path 'C:\Users\DangMinh\.cache\dhan-dbms-root.credential.xml'
$p = $cred.GetNetworkCredential().Password
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -u root --password=$p -P 3307 -h 127.0.0.1 training_management -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='training_management' ORDER BY table_name;"
