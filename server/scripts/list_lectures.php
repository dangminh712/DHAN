<?php
$m = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
$res = $m->query('SELECT id, title, subject_id, teacher_id FROM lectures');
while ($row = $res->fetch_assoc()) {
    echo "ID: {$row['id']} | Subject: {$row['subject_id']} | Teacher: {$row['teacher_id']} | Title: {$row['title']}\n";
}
