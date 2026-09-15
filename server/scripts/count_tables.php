<?php
$m = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
$res = $m->query('SHOW TABLES');
echo "=== TOAN BO CAC BANG VA SO LUONG DU LIEU TRONG CSDL MYSQL (PORT 3307) ===\n";
while ($row = $res->fetch_row()) {
    $t = $row[0];
    $c = $m->query("SELECT COUNT(*) FROM `$t`")->fetch_row()[0];
    printf("%-30s : %d ban ghi\n", $t, $c);
}
